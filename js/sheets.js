/**
 * Sheets Service - Gerencia a comunicação com o Google Apps Script Web App
 * Inclui rota proxy local e tratamento seguro de respostas HTML/JSON
 */

const SheetsService = {
  // Retorna a URL configurada
  getUrl() {
    const config = window.StorageService ? window.StorageService.getConfig() : {};
    return (config.sheetsUrl || '').trim();
  },

  isConnected() {
    const url = this.getUrl();
    return url.length > 20 && url.includes('script.google.com');
  },

  /**
   * Converte qualquer formato de data (DD/MM/AAAA, Date objeto, timestamp) para YYYY-MM-DD
   */
  normalizeDate(val) {
    if (!val) return new Date().toISOString().slice(0, 10);
    val = String(val).trim();

    // Se já estiver no formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
      return val.slice(0, 10);
    }

    // Se estiver no formato brasileiro DD/MM/YYYY ou DD-MM-YYYY
    const brMatch = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (brMatch) {
      const dia = brMatch[1].padStart(2, '0');
      const mes = brMatch[2].padStart(2, '0');
      const ano = brMatch[3];
      return `${ano}-${mes}-${dia}`;
    }

    // Se for string de data internacional parseável
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) {
      const ano = parsed.getFullYear();
      const mes = String(parsed.getMonth() + 1).padStart(2, '0');
      const dia = String(parsed.getDate()).padStart(2, '0');
      return `${ano}-${mes}-${dia}`;
    }

    return val;
  },

  /**
   * Se estiver rodando através de um servidor HTTP (local ou nuvem), usa a rota proxy /api/proxy para evitar CORS
   */
  getEndpoint(targetUrl) {
    if (window.location.protocol.startsWith('http')) {
      return `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
    }
    return targetUrl;
  },

  /**
   * Converte a resposta com segurança sem quebrar quando o Google retorna HTML
   */
  async parseSafeJson(response) {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (err) {
      console.warn('RESPOSTA BRUTA RECEBIDA (HTML):', text);
      if (text.trim().startsWith('<') || text.trim().startsWith('<!doctype') || text.trim().startsWith('<!DOCTYPE')) {
        const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
        const errorMatch = text.match(/class="errorMessage">([^<]+)<\//i) || text.match(/<div[^>]*id="errorMessage"[^>]*>([^<]+)<\//i);
        const snippet = (errorMatch ? errorMatch[1] : (titleMatch ? titleMatch[1] : '')).trim();

        if (text.includes('ServiceLogin') || text.includes('accounts.google.com') || text.includes('Fazer login')) {
          return {
            success: false,
            error: 'Permissão no Google: Na implantação do Apps Script, você precisa configurar "Quem pode acessar" como "Qualquer pessoa" (Anyone).'
          };
        }

        if (snippet && snippet !== 'Error' && snippet !== 'Erro') {
          return {
            success: false,
            error: `Google retornou: "${snippet}". No Apps Script, clique em "Executar" para autorizar.`
          };
        }

        return {
          success: false,
          error: 'O Google retornou uma página HTML. No Apps Script, verifique se clicou em "Executar" para conceder acesso à planilha.'
        };
      }
      return { success: false, error: 'Resposta inválida: ' + err.message };
    }
  },

  /**
   * Testa a conexão com a planilha do Google
   */
  async testConnection() {
    const url = this.getUrl();
    if (!url) {
      return { success: false, error: 'URL do Google Apps Script não configurada.' };
    }

    try {
      const endpoint = this.getEndpoint(url);
      const response = await fetch(endpoint, {
        method: 'GET',
        redirect: 'follow'
      });

      const res = await this.parseSafeJson(response);
      if (res && res.success) {
        return { success: true, data: res.data };
      } else {
        return { success: false, error: res.error || 'Resposta inválida do Google Sheets.' };
      }
    } catch (err) {
      console.warn('Erro ao testar conexão:', err);
      return { 
        success: false, 
        error: 'Não foi possível conectar: ' + err.message 
      };
    }
  },

  /**
   * Puxa todos os dados do Google Sheets e atualiza o armazenamento local
   */
  async fetchFromSheets() {
    if (!this.isConnected()) return { success: false, error: 'Não conectado' };

    try {
      const url = this.getUrl();
      const endpoint = this.getEndpoint(url);
      const response = await fetch(endpoint, {
        method: 'GET',
        redirect: 'follow'
      });

      const res = await this.parseSafeJson(response);
      if (res && res.success && res.data) {
        const d = res.data;
        
        // Mapeia e normaliza os dados retornados
        if (d.transacoes && Array.isArray(d.transacoes)) {
          const transacoes = d.transacoes.map(t => ({
            id: t.id || 'tr_' + Math.random().toString(36).substr(2, 6),
            data: this.normalizeDate(t.data),
            tipo: (t.tipo || 'despesa').toLowerCase(),
            categoria: t.categoria || 'Outros',
            descricao: t.descricao || '',
            valor: Number(t.valor) || 0,
            metodo: t.metodo || 'Pix',
            status: t.status || 'pago'
          }));
          localStorage.setItem('financas_transacoes_v1', JSON.stringify(transacoes));
        }

        if (d.reserva && Array.isArray(d.reserva)) {
          const reserva = d.reserva.map(r => ({
            id: r.id || 'em_' + Math.random().toString(36).substr(2, 6),
            data: this.normalizeDate(r.data),
            tipo: r.tipo || 'Aporte',
            valor: Number(r.valor) || 0,
            instituicao: r.instituicao || '',
            observacao: r.observacao || ''
          }));
          localStorage.setItem('financas_reserva_v1', JSON.stringify(reserva));
        }

        if (d.investimentos && Array.isArray(d.investimentos)) {
          const investimentos = d.investimentos.map(inv => ({
            id: inv.id || 'inv_' + Math.random().toString(36).substr(2, 6),
            ticker: inv.ticker || '',
            nome: inv.nome || '',
            classe: inv.classe || 'Ações',
            quantidade: Number(inv.quantidade) || 0,
            precoMedio: Number(inv.precomedio || inv.precoMedio) || 0,
            precoAtual: Number(inv.precoatual || inv.precoAtual || inv.precomedio) || 0,
            instituicao: inv.instituicao || ''
          }));
          localStorage.setItem('financas_investimentos_v1', JSON.stringify(investimentos));
        }

        if (d.proventos && Array.isArray(d.proventos)) {
          const proventos = d.proventos.map(p => ({
            id: p.id || 'div_' + Math.random().toString(36).substr(2, 6),
            data: this.normalizeDate(p.data),
            ativo: p.ativo || '',
            tipo: p.tipo || 'Dividendo',
            valor: Number(p.valor) || 0
          }));
          localStorage.setItem('financas_proventos_v1', JSON.stringify(proventos));
        }

        if (d.quitacao && Array.isArray(d.quitacao)) {
          const quitacao = d.quitacao.map(q => ({
            id: q.id || 'deb_' + Math.random().toString(36).substr(2, 6),
            nome: q.nome || '',
            instituicao: q.instituicao || '',
            valorTotal: Number(q.valortotal || q.valorTotal) || 0,
            valorPago: Number(q.valorpago || q.valorPago) || 0,
            valorParcela: Number(q.valorparcela || q.valorParcela) || 0,
            dataLimite: q.datalimite || q.dataLimite || '',
            observacao: q.observacao || '',
            atualizadoEm: q.atualizadoem || q.atualizadoEm || ''
          }));
          localStorage.setItem('financas_quitacao_v1', JSON.stringify(quitacao));
        }

        return { success: true };
      }
      return { success: false, error: res.error || 'Estrutura de dados incorreta' };
    } catch (err) {
      console.error('Erro ao baixar do Sheets:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Envia uma ação de modificação para o Google Sheets
   */
  async sendAction(action, payload, id = null) {
    if (!this.isConnected()) {
      return { success: false, localOnly: true };
    }

    try {
      const url = this.getUrl();
      const endpoint = this.getEndpoint(url);
      const bodyData = JSON.stringify({ action, payload, id });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: bodyData,
        redirect: 'follow'
      });

      const res = await this.parseSafeJson(response);
      return res;
    } catch (err) {
      console.warn('Erro ao enviar para Google Sheets:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Envia todos os dados locais para a planilha (Sincronização em Massa)
   */
  async syncAllToSheets() {
    if (!this.isConnected()) {
      return { success: false, error: 'Google Sheets não conectado' };
    }

    const backup = window.StorageService.exportAllData();
    return await this.sendAction('sync_all', backup);
  }
};

window.SheetsService = SheetsService;
