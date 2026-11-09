# 💰 Finanças Pro — Controle de Despesas, Reserva & Investimentos

Aplicativo moderno de finanças pessoais conectado diretamente à sua planilha do **Google Sheets**, funcionando tanto no **computador** quanto no **celular (Android / iOS)** como um PWA (Progressive Web App).

---

## 🚀 Como Iniciar o App Imediatamente

### No Computador (Desktop)
1. Dê um **duplo clique** no arquivo `iniciar-app.bat`.
2. Seu navegador abrirá automaticamente em **`http://localhost:8085`** (ou dê um duplo clique direto em `index.html`).
3. Pronto! O app já vem com dados de demonstração para você testar todas as telas.

### No Celular (PWA)
1. Enquanto o arquivo `iniciar-app.bat` estiver aberto no seu computador conectado ao mesmo Wi-Fi, abra o navegador do celular e digite o endereço exibido na tela preta (ex: `http://192.168.1.100:8085`).
2. **Para instalar como aplicativo nativo**:
   - **Android (Chrome)**: Toque nos três pontinhos ⋮ no topo e selecione **"Adicionar à tela inicial"** ou **"Instalar aplicativo"**.
   - **iPhone (Safari)**: Toque no botão de Compartilhar (ícone com quadrado e seta para cima) e selecione **"Adicionar à Tela de Início"**.
3. O ícone do **Finanças Pro** aparecerá na sua tela inicial e funcionará em tela cheia como um app nativo!

> 💡 **Quer acessar de qualquer lugar do mundo sem ligar o computador?**
> Você pode subir esta pasta gratuitamente no **Vercel**, **Netlify** ou **GitHub Pages** (basta arrastar a pasta ou conectar seu repositório). Assim você terá um link seguro (ex: `https://suas-financas.vercel.app`) acessível 24h por dia no 4G/5G do seu celular!

---

## 📊 Conectando ao seu Google Sheets (Passo a Passo)

O Google Sheets funciona como o seu banco de dados na nuvem. Você tem 100% da posse e privacidade dos seus dados.

### Passo 1: Crie sua planilha
1. Abra seu Google Drive ou acesse [sheets.new](https://sheets.new) para criar uma nova planilha em branco.
2. Dê um nome para a planilha, por exemplo: **Minhas Finanças Pro**.

### Passo 2: Cole o código do Apps Script
1. No menu superior da planilha, clique em **Extensões** > **Apps Script**.
2. Apague qualquer código existente no editor.
3. Abra o arquivo `google-apps-script/Codigo.gs` deste projeto, copie todo o seu conteúdo e cole no editor do Google Apps Script.
4. Clique no ícone de disquete (Salvar) ou pressione `Ctrl + S`.

### Passo 3: Implantar como Aplicativo da Web
1. No canto superior direito do Apps Script, clique no botão azul **Implantar** (Deploy) > **Nova implantação** (New deployment).
2. Na engrenagem ao lado de "Selecione o tipo", escolha **Aplicativo da Web** (Web app).
3. Preencha os campos:
   - **Descrição**: `API Finanças Pro`
   - **Executar como**: `Eu (seu e-mail)`
   - **Quem pode acessar**: `Qualquer pessoa` *(Isso é fundamental para que o app consiga salvar os dados na sua planilha)*.
4. Clique em **Implantar**.
5. O Google pedirá autorização na sua conta:
   - Clique em **Autorizar acesso** e selecione sua conta Google.
   - Se aparecer "O Google não verificou este app", clique em **Avançado** e depois em **Acessar [Nome do Projeto] (não seguro)**.
   - Clique em **Permitir**.
6. Copie a **URL do aplicativo da Web** gerada (algo como `https://script.google.com/macros/s/.../exec`).

### Passo 4: Conectar no App
1. Abra o aplicativo **Finanças Pro**.
2. Clique na aba **Google Sheets** (ou no ícone de engrenagem).
3. Cole a URL no campo **"URL da Web App do Google Apps Script"**.
4. Clique em **Salvar URL** e depois em **Testar Conexão**.
5. Pronto! O badge no topo mudará para verde: **"Conectado ao Sheets"**!
6. Clique em **"Enviar Dados Locais p/ Planilha"** para criar e preencher todas as abas automaticamente (`Transacoes`, `ReservaEmergencia`, `Investimentos`, `Proventos` e `Configuracoes`).

---

## 🌟 Funcionalidades Detalhadas

### 1. Despesas & Receitas (Fluxo de Caixa)
- **Lançamento Rápido**: Adicione despesas com 1 toque no botão flutuante (+) ou no topo.
- **Categorização Visual**: Categorias com cores (Alimentação, Moradia, Transporte, Lazer, Saúde, etc.).
- **Métodos de Pagamento**: Pix, Cartão de Crédito, Débito, Dinheiro, Boleto.
- **Filtro Mensal**: Navegue entre os meses do ano com cálculo automático de saldo e comprometimento.
- **Gráficos**: Gráfico em formato de rosca das despesas por categoria e fluxo de receitas vs despesas nos últimos 6 meses.

### 2. Reserva de Emergência
- **Meta Inteligente**: Configure sua meta em valor fixo (ex: R$ 24.000) e defina seu custo fixo mensal para ver quantos meses de sobrevivência estão garantidos.
- **Barra de Progresso**: Acompanhamento visual de quanto falta para atingir 100% da segurança.
- **Tipos de Lançamento**: Aportes mensais, rendimentos da aplicação (CDI/Selic) e resgates em caso de emergência.
- **Instituições**: Identifique onde o dinheiro está guardado (Tesouro Selic, Nubank 100% CDI, Sofisa, Itaú, etc.).

### 3. Carteira de Investimentos & Proventos
- **Classes de Ativos**:
  - Renda Fixa (CDB, LCI/LCA, Tesouro)
  - Ações Brasileiras
  - Fundos Imobiliários (FIIs)
  - Criptomoedas
  - Internacional / BDRs / ETFs
- **Posição Consolidada**: Preço médio, cotação atual, valor investido, patrimônio atual e rentabilidade (R$ e %).
- **Alocação de Ativos**: Gráfico interativo de pizza/rosca para você saber se precisa rebalancear sua carteira.
- **Controle de Proventos**: Registro de dividendos e JCP recebidos no mês para acompanhar sua renda passiva.

### 4. Segurança e Backup
- **Modo Offline**: Se estiver sem internet, os lançamentos ficam salvos localmente no seu dispositivo.
- **Exportação JSON**: Botão de download com backup completo de todos os seus dados a qualquer momento.

---

## 🛠️ Tecnologias Utilizadas
- **HTML5 & CSS3** com **Tailwind CSS**
- **JavaScript Moderno (ES6+)**
- **Chart.js** para gráficos financeiros interativos
- **Lucide Icons** para ícones limpos e profissionais
- **Google Apps Script** como backend serverless gratuito
- **Google Sheets API** para persistência e relatórios
- **Progressive Web App (PWA)** com Service Worker e Manifest

