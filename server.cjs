const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

const PORT = process.env.PORT || 8085;
const DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

/**
 * Função que faz requisições ao Google Apps Script seguindo redirecionamentos (302)
 */
function fetchWithRedirects(targetUrl, method, data, callback, redirectCount = 0) {
  if (redirectCount > 6) {
    return callback(new Error('Muitos redirecionamentos do Google'));
  }

  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch (err) {
    return callback(err);
  }

  const options = {
    hostname: parsed.hostname,
    port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
    path: parsed.pathname + parsed.search,
    method: method,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Finanças Pro'
    }
  };

  if (method === 'POST' && data) {
    options.headers['Content-Type'] = 'text/plain;charset=utf-8';
    options.headers['Content-Length'] = Buffer.byteLength(data);
  }

  const client = parsed.protocol === 'https:' ? https : http;
  const req = client.request(options, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      console.log(`[Google Redirecionamento 302] -> ${res.headers.location.slice(0, 80)}...`);
      // Google Apps Script redireciona respostas de POST para GET em script.googleusercontent.com
      const nextMethod = (res.statusCode === 302 || res.statusCode === 303) ? 'GET' : method;
      const nextData = nextMethod === 'GET' ? null : data;
      return fetchWithRedirects(res.headers.location, nextMethod, nextData, callback, redirectCount + 1);
    }

    let chunks = [];
    res.on('data', chunk => chunks.push(chunk));
    res.on('end', () => {
      const fullBuffer = Buffer.concat(chunks);
      callback(null, fullBuffer, res.headers['content-type'] || 'application/json');
    });
  });

  req.on('error', (err) => callback(err));

  if (method === 'POST' && data) {
    req.write(data);
  }
  req.end();
}

const server = http.createServer((req, res) => {
  // CORS Headers para todas as respostas locais
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let reqPath = decodeURI(req.url.split('?')[0]);

  // Favicon inline rápido para evitar 404
  if (reqPath === '/favicon.ico') {
    res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
    res.end(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='25' fill='%2310b981'/><text x='50' y='65' font-size='50' font-family='sans-serif' text-anchor='middle' fill='white'>$</text></svg>`);
    return;
  }

  // ==========================================
  // ROTA PROXY: Elimina 100% dos erros de CORS
  // ==========================================
  if (reqPath === '/api/proxy') {
    const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
    const targetUrl = parsedUrl.searchParams.get('url');

    if (!targetUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Parâmetro url ausente' }));
      return;
    }

    const handleGoogleResponse = (err, buffer, contentType) => {
      if (err) {
        console.error('[Erro Proxy]:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
        return;
      }

      const text = buffer.toString('utf8');

      // Se o Google retornou HTML (ex: tela de login ou erro interno de permissão)
      if (text.trim().startsWith('<') || text.trim().startsWith('<!doctype') || text.trim().startsWith('<!DOCTYPE')) {
        console.warn('\n[Atenção: Google retornou HTML em vez de JSON]');
        let mensagem = 'O Google retornou uma página de Login (HTML).';

        if (text.includes('ServiceLogin') || text.includes('accounts.google.com') || text.includes('Fazer login')) {
          mensagem = 'Permissão no Google Sheets: certifique-se de configurar "Quem pode acessar" como "Qualquer pessoa" (Anyone) na implantação do Apps Script.';
          console.warn('-> Causa identificada: O script está exigindo login Google porque "Quem pode acessar" não está como "Qualquer pessoa" (Anyone).');
        } else if (text.includes('ScriptError') || text.includes('Exception:')) {
          const match = text.match(/<title>(.*?)<\/title>/i);
          mensagem = 'Erro interno do script Google: ' + (match ? match[1] : 'Verifique o Apps Script.');
          console.warn('-> Causa identificada: Erro de execução dentro do Apps Script.');
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: mensagem, isHtml: true }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(buffer);
    };

    if (req.method === 'GET') {
      console.log(`[Proxy GET] Solicitando dados da planilha...`);
      fetchWithRedirects(targetUrl, 'GET', null, handleGoogleResponse);
      return;
    }

    if (req.method === 'POST') {
      let bodyData = '';
      req.on('data', chunk => { bodyData += chunk; });
      req.on('end', () => {
        console.log(`[Proxy POST] Enviando ação para planilha...`);
        fetchWithRedirects(targetUrl, 'POST', bodyData, handleGoogleResponse);
      });
      return;
    }
  }

  // ==========================================
  // SERVIR ARQUIVOS ESTÁTICOS
  // ==========================================
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  const filePath = path.join(DIR, reqPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Arquivo não encontrado');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIp();
  console.log('========================================================');
  console.log('       FINANÇAS PRO - CONTROLE E INVESTIMENTOS');
  console.log('========================================================');
  console.log('\n Servidor Node.js Ativo com Sucesso!');
  console.log(`\n [OK] Computador:  http://localhost:${PORT}`);
  console.log(` [OK] Celular:     http://${localIp}:${PORT}\n`);
  console.log(' Proxy Google Sheets ativado: sem erros de CORS!');
  console.log(' Pressione Ctrl + C para encerrar o servidor.');
  console.log('========================================================\n');

  // Abre automaticamente o navegador apenas no Windows local
  if (process.platform === 'win32' && !process.env.PORT) {
    exec(`start http://localhost:${PORT}`);
  }
});
