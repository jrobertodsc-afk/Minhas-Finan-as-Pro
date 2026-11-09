# 📘 Contexto Geral do Projeto - Finanças Pro

> **Data de Atualização:** Novembro de 2026  
> **Versão da Aplicação:** 2.1.0  
> **Repositório / Diretório Local:** `c:\Users\Roberto\Desktop\financas pessoais`

---

## 1. Visão Geral do Sistema

O **Finanças Pro** é um aplicativo financeiro completo, moderno, responsivo (Desktop e Mobile) e progressivo (PWA), desenhado para proporcionar gestão de fluxo de caixa pessoal, reserva de emergência, metas de quitação de dívidas e acompanhamento de carteira de investimentos e proventos.

O sistema opera com arquitetura híbrida:
1. **Offline-First (Local):** Operação instantânea no navegador gravando em `LocalStorage` com cache gerenciado por Service Worker.
2. **Cloud Database (Google Sheets):** Banco de dados em nuvem estruturado em planilha do Google via Web App do Google Apps Script (`Codigo.gs`), permitindo sincronização em tempo real e relatórios nativos com gráficos na própria planilha.

---

## 2. Tecnologias Utilizadas

| Camada | Tecnologia | Função |
| :--- | :--- | :--- |
| **Frontend** | HTML5 Semântico, Vanilla JavaScript (ES6+) | Lógica de aplicação reativa e modular sem dependências pesadas |
| **Estilização** | Tailwind CSS (via CDN) | Interface escura (*Dark Mode*), moderna, inspirada em apps bancários |
| **Ícones** | Lucide Icons | Conjunto de ícones consistentes e vetoriais |
| **Gráficos (App)** | Chart.js | Visualização de rosca (categorias), barras (fluxo mensal) e alocação |
| **Backend Nuvem** | Google Apps Script (JavaScript V8) | API REST (`doGet` e `doPost`) integrada ao Google Sheets |
| **Servidor Local** | Node.js nativo (`server.cjs`) | Servidor HTTP na porta `8085` com proxy reverso `/api/proxy` (bypass de CORS) |
| **Inicializador** | Windows Batch Script (`iniciar-app.bat`) | Inicialização em 1 clique com fallback para Python |
| **Offline / PWA** | Service Worker v6 (`sw.js`) + `manifest.json` | Suporte offline e instalação como aplicativo móvel/desktop |

---

## 3. Módulos e Funcionalidades

### 3.1. Painel Geral (Dashboard)
* **Alternador de Período (Mês Selecionado vs Total Geral Acumulado):**
  * Botões `[ 📅 Mês Selecionado ]` e `[ 🌐 Total Geral Acumulado ]` no topo do Dashboard.
  * No modo **Total Geral Acumulado**: Exibe o saldo líquido acumulado de todo o histórico cadastrado, receitas totais históricas, despesas totais históricas, total de proventos recebidos acumulados e gráfico de rosca de categorias com base em todo o histórico.
  * No modo **Mês Selecionado**: Foca no fluxo específico do mês ativo, mas com sub-indicador informando sempre o Acumulado Geral.
* **Indicadores Principais:** Saldo Líquido (Realizado em conta vs Previsto), Reserva de Emergência Acumulada, Total Investido em Ativos e Patrimônio Líquido Total (Reserva + Carteira + Saldo Geral em conta).
* **Consolidação de Receitas x Despesas x Poupança:** Três cartões informativos com Receitas Totais, Despesas Totais e Taxa de Sobra/Poupança do período.
* **Gráficos Visuais:** Distribuição de despesas por categoria (Rosca dinâmica por período) e histórico semestral de receitas x despesas (Colunas).
* **Painéis Rápidos de Metas:** Acompanhamento do progresso de Metas de Investimento e Quitação de Dívidas.
* **Últimas Transações:** Lista das movimentações mais recentes em tempo real.

### 3.2. Despesas & Receitas (Fluxo de Caixa)
* **Navegação de Meses Rápida:** Botões `[ ◀ ]` (Mês Anterior) e `[ ▶ ]` (Próximo Mês) no topo e seletor com clique direto (`showPicker`).
* **Filtro de Período Amplo:** Alternância entre `📅 Mês Selecionado` e `🌐 Todos os Meses (Ver Tudo)`.
* **Filtros Avançados:** Busca textual por descrição, tipo (Receitas/Despesas), status (Todos, Pagos/Recebidos, Pendentes), categorias e métodos de pagamento.
* **Gestão de Situação de Pagamento & Histórico:**
  * **Opção de Pagamento no Cadastro:** Escolha visual entre `✓ Já Pago` / `✓ Já Recebido` e `⏳ A Pagar` / `⏳ A Receber`.
  * **Ação Direta de Quitação:** Botão direto **"Pagar"** (para despesas pendentes) ou **"Receber"** (para receitas pendentes) na própria lista, atualizando na hora e registrando data de efetivação.
  * **Cards de Indicadores (Acumulado vs Parcial):**
    * **Receitas:** Total Geral Previsto (Acumulado), Realizado (Recebido) e Parcial a Receber.
    * **Despesas:** Total Geral Previsto (Acumulado), Realizado (Pago) e Parcial a Pagar.
    * **Saldo:** Saldo Final Acumulado, Saldo Realizado Atual em conta e Diferença a Liquidar.
* **Recorrência & Parcelamento Inteligente:**
  * **Lançamento Único:** Transação padrão com status de pago ou pendente.
  * **🔁 Recorrente / Fixa:** Opção inteligente de marcar o mês atual como Pago e os próximos como Pendentes.
  * **💳 Compra Parcelada:** Opção inteligente de marcar a 1ª parcela como Paga agora e as demais parcelas futuras como Pendentes.
* **Metas de Quitação de Dívidas:**
  * Gestão de empréstimos, financiamentos e saldo devedor de cartões.
  * Indicadores de Total Inicial, Já Quitado, Saldo Devedor Restante e % Quitado com barras de progresso.
  * **Botão "Amortizar":** Abate valores com opção de debitar automaticamente como despesa do mês no fluxo de caixa.

### 3.3. Reserva de Emergência
* **Cálculo de Segurança:** Meta financeira total e cálculo automático de meses de custo de vida cobertos.
* **Tipos de Lançamento:** Aportes, Rendimentos (CDI/Juros) e Resgates.
* **Simulador:** Projeção de quantos meses faltam para completar a reserva com base no aporte mensal planejado.

### 3.4. Investimentos & Proventos
* **Controle de Carteira:** Tickers, classes (Ações, FIIs, Renda Fixa, Cripto, Internacional), quantidade, preço médio e cotação atual.
* **Indicadores de Lucro:** Lucro nominal (R$) e percentual (%).
* **Gráfico de Alocação:** Composição percentual por classe de ativos.
* **Proventos & Dividendos:** Registro de dividendos, JCP, rendimentos e amortizações.
* **Metas de Investimento & Liberdade Financeira:**
  * **Meta de Patrimônio Investido:** Progresso até o patrimônio alvo (ex: R$ 100.000,00).
  * **Meta de Aporte Mensal:** Acompanhamento do valor investido no mês vs. meta planejada.
  * **Meta de Renda Passiva / Proventos:** Proventos recebidos no mês vs. meta mensal desejada.
  * Modal para calibração rápida de metas.

### 3.5. Configurações, Nuvem e Segurança
* **Configuração do Google Sheets:** Inserção da URL da Web App, teste de conexão e botão para envio forçado de dados locais para a nuvem.
* **Backup & Restauração:** Exportação completa de todos os dados em arquivo `.json` e restauração com 1 clique.
* **Exportação CSV:** Exportação de extrato completo para abertura no Excel.
* **Alternador de Tema:** Suporte a Dark Mode e Light Mode.

---

## 4. Estrutura de Arquivos do Projeto

```text
financas pessoais/
│
├── index.html                   # Interface principal (SPA) com todas as abas e modais
├── server.cjs                   # Servidor Node.js (Porta 8085) com proxy reverso (/api/proxy)
├── Dockerfile                   # Configuração de container para deploy na nuvem (Render, Railway)
├── .dockerignore                # Arquivos ignorados no build do container
├── iniciar-app.bat              # Script inicializador Windows em 1 clique
├── package.json                 # Manifesto do Node.js com scripts e metadados
├── manifest.json                # Manifesto PWA para instalação no celular e desktop
├── sw.js                        # Service Worker (Cache v6 e estratégias de rede)
├── README.md                    # Manual de instalação e primeiros passos
├── contexto.md                  # Este documento de contexto técnico do sistema
│
├── js/
│   ├── app.js                   # Controlador da aplicação, renderizadores, eventos e regras de negócio
│   ├── storage.js               # Gerenciador de LocalStorage, chaves e dados de demonstração
│   └── sheets.js                # Cliente de integração com Google Apps Script e normalizadores
│
└── google-apps-script/
    └── Codigo.gs                # Código backend Google Apps Script v2.1.0 para colar na planilha
```

---

## 5. Estrutura da Planilha Google (Google Sheets)

O script `Codigo.gs` cria e mantém automaticamente as seguintes abas na planilha:

| Aba | Finalidade | Colunas / Estrutura |
| :--- | :--- | :--- |
| **`📊 Dashboard`** | Painel visual executivo | Cartões KPI, Tabela de Despesas, Tabela de Ativos, Balanço Mensal e 3 Gráficos Nativos |
| **`Transacoes`** | Fluxo de Caixa | `ID`, `Data`, `Tipo`, `Categoria`, `Descrição`, `Valor`, `Método`, `Status`, `CriadoEm` |
| **`ReservaEmergencia`** | Reserva de Liquidez | `ID`, `Data`, `Tipo`, `Valor`, `Instituição`, `Observação`, `CriadoEm` |
| **`Investimentos`** | Posições em Carteira | `ID`, `Ticker`, `Nome`, `Classe`, `Quantidade`, `Preço Médio`, `Preço Atual`, `Instituição`, `AtualizadoEm` |
| **`Proventos`** | Dividendos e Rendimentos | `ID`, `Data`, `Ativo`, `Tipo`, `Valor`, `CriadoEm` |
| **`MetasQuitacao`** | Dívidas e Financiamentos | `ID`, `Nome`, `Instituição`, `Valor Total`, `Valor Pago`, `Valor Parcela`, `Data Limite`, `Observação`, `AtualizadoEm` |
| **`Configuracoes`** | Parâmetros e Metas | `Chave`, `Valor` (`MetaReservaEmergencia`, `MetaInvestimento`, `MetaAporteMensal`, `MetaRendaPassiva`, etc.) |

---

## 6. Histórico de Decisões e Correções Críticas

1. **Conflito de Porta:** Mudança da porta padrão de `3000` para `8085` para evitar colisão com outros servidores em execução no sistema.
2. **Bypass de CORS no Google Apps Script:** O Google redireciona requisições `script.google.com` com HTTP 302 que os navegadores bloqueiam por CORS em fetch direto. Solucionado com o endpoint `/api/proxy` no `server.cjs` que faz a ponte sem restrições.
3. **Página HTML de Erro do Google:** Identificado que o usuário colou o código mantendo `function myFunction() {` na linha 1 do Apps Script. Solucionado instruindo a limpeza total (`Ctrl + A` e `Delete`) antes de colar o código.
4. **Localidade Brasil (`pt_BR`) nas Fórmulas:** No Brasil, o separador de argumentos de fórmulas é ponto e vírgula (`;`). As fórmulas geradas pelo script no `Dashboard` foram 100% atualizadas para `;`, eliminando os erros `#ERROR! (Formula parse error)`.
5. **Erro de Construtor de Gráficos:** Substituição de `.setChartType(Charts.ChartType.PIE)` pelos construtores diretos `.asPieChart()` e `.asColumnChart()`, que previnem exceções internas no Google Sheets.
6. **Navegação de Meses e Filtros de Data:**
   * Implementação de botões `[ ◀ ]` e `[ ▶ ]` e ativação direta via `.showPicker()`.
   * Criação da opção de filtro `🌐 Todos os Meses (Ver Tudo)` para exibição completa de transações independentemente do mês selecionado.
7. **Recorrência, Quitação e Metas de Investimento:** Implementação das 3 funcionalidades solicitadas, incluindo persistência local, modais dedicados e sincronização na planilha.

---

## 7. Como Executar a Aplicação

1. **Iniciar o Servidor:**
   * Dê um duplo clique no arquivo **`iniciar-app.bat`** (ou execute `node server.cjs` no terminal).
   * O servidor iniciará em `http://localhost:8085` e abrirá a página automaticamente no navegador padrão.
2. **Sincronização com o Google:**
   * No Apps Script da planilha, execute **`inicializarPlanilha`** uma vez para gerar todas as abas.
   * Em **Implantar > Gerenciar Implantações**, mantenha como **Aplicativo da Web**, acesso para **Qualquer pessoa**.
   * No app, cole a URL no menu de configurações e clique em **Sincronizar Tudo**.

