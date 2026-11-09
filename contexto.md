# 📘 Contexto Geral do Projeto - Finanças Pro

> **Data de Atualização:** Novembro de 2026  
> **Versão da Aplicação:** 2.2.0  
> **Repositório / Diretório Local:** `c:\Users\Roberto\Desktop\financas pessoais`  
> **Repositório Remoto (GitHub):** `https://github.com/jrobertodsc-afk/Minhas-Finan-as-Pro`

---

## 1. Visão Geral do Sistema

O **Finanças Pro** é um aplicativo financeiro pessoal inteligente, completo, moderno, responsivo (Desktop e Mobile) e progressivo (PWA), desenhado para proporcionar gestão de fluxo de caixa contábil integrado, reserva de emergência, metas de quitação de dívidas e acompanhamento de carteira de investimentos e proventos.

O sistema opera com arquitetura híbrida:
1. **Offline-First (Local):** Operação instantânea no navegador gravando em `LocalStorage` com cache gerenciado por Service Worker v8 e PWA instalável no celular e PC.
2. **Cloud Database (Google Sheets):** Banco de dados em nuvem estruturado em planilha do Google via Web App do Google Apps Script (`Codigo.gs`), permitindo sincronização em tempo real e relatórios nativos com gráficos na própria planilha.
3. **Cloud Deploy (Render / Docker):** Deploy conteinerizado via Dockerfile em servidor Node.js com proxy reverso integrado.

---

## 2. Tecnologias Utilizadas

| Camada | Tecnologia | Função |
| :--- | :--- | :--- |
| **Frontend** | HTML5 Semântico, Vanilla JavaScript (ES6+) | Lógica de aplicação reativa e modular sem dependências pesadas |
| **Estilização** | Tailwind CSS (via CDN) | Interface escura (*Dark Mode*), moderna, inspirada em apps bancários |
| **Ícones** | Lucide Icons | Conjunto de ícones consistentes e vetoriais |
| **Gráficos (App)** | Chart.js | Visualização de rosca (categorias), barras (fluxo mensal) e alocação |
| **Backend Nuvem** | Google Apps Script (JavaScript V8) | API REST (`doGet` e `doPost`) integrada ao Google Sheets |
| **Servidor Local / Nuvem** | Node.js nativo (`server.cjs`) | Servidor HTTP na porta `8085` com proxy reverso `/api/proxy` (bypass de CORS) |
| **Deploy / Container** | Dockerfile multi-stage (`node:20-alpine`) | Implantação automática no Render a partir do branch `main` do GitHub |
| **Offline / PWA** | Service Worker v8 (`sw.js`) + `manifest.json` + `icon.svg` | Suporte offline e instalação como aplicativo móvel/desktop |
| **Segurança / Auth** | PIN / Senha criptografada (SHA-256) | Tela de bloqueio com sessão persistente no navegador |

---

## 3. Módulos e Funcionalidades

### 3.1. Painel Geral (Dashboard) Inteligente & Executivo
* **Motor Contábil com Saldo Residual Anterior (Carryover Automático):**
  * Saldo vindo do mês anterior é calculado e transportado automaticamente:
    $$\text{Saldo Residual Anterior} = \sum (\text{Receitas Passadas Pagas}) - \sum (\text{Despesas Passadas Pagas})$$
  * Destaque no topo em um **Pipeline Contábil em 4 Etapas**:
    1. **1. Saldo Anterior (Residual):** Sobra líquida acumulada dos meses anteriores.
    2. **2. (+) Receitas do Mês:** Total previsto com indicação de recebido vs a receber.
    3. **3. (−) Despesas do Mês:** Total previsto com indicação de pago vs a pagar.
    4. **4. (=) Saldo Projetado Final:** Saldo previsto para o encerramento do mês.
* **Saldo Disponível em Conta Hoje:** Exibe com clareza o saldo real em conta no momento (Saldo Anterior + Recebido hoje − Pago hoje).
* **Barras de Execução Financeira:** Progressos visuais com porcentagens de recebimento e pagamento do mês ativo.
* **Cards de Indicadores de Alto Nível:**
  * **Saldo Operacional:** Resultado do mês (Receitas − Despesas).
  * **Reserva de Emergência:** Total acumulado e barra de progresso da meta.
  * **Investimentos:** Total investido na carteira e proventos acumulados.
  * **Patrimônio Consolidado:** Reserva + Carteira de Ativos + Saldo Realizado em Conta.
* **Gráficos Visuais Modernos:**
  * **Rosca de Despesas por Categoria:** Donut chart com as novas categorias essenciais do dia a dia e cores dedicadas.
  * **Fluxo Mensal (6 Meses):** Gráfico de barras comparando receitas vs despesas mês a mês.
* **Últimas Transações com Quitação Rápida:** Botão de ação rápida direto no Dashboard para marcar despesas/receitas pendentes como pagas com 1 clique!

### 3.2. Categorias Organizadas do Cotidiano
* **Despesas:**
  * `Energia Elétrica (Luz)`, `Internet / TV / Telefone`, `Fatura Cartão de Crédito`, `Água / Saneamento`, `Gás`, `Aluguel / Condomínio`, `Supermercado / Feira`, `Alimentação / Restaurante`, `Combustível`, `Transporte / Uber`, `Manutenção / Veículo`, `Farmácia / Remédios`, `Plano de Saúde / Médico`, `Streaming / Assinaturas`, `Lazer / Viagens`, `Educação / Cursos`, `Vestuário & Cuidados`, `Empréstimo / Financiamento`, `Pets`, `Outros`.
* **Receitas:**
  * `Salário / Adiantamento`, `13º Salário / Férias`, `Bônus / Comissões`, `Freelance / Serviços`, `Rendimentos / Dividendos`, `Venda de Bens`, `Reembolso`, `Outros`.
* Compatibilidade preservada com registros legados.

### 3.3. Despesas & Receitas (Fluxo de Caixa)
* **Banner de Saldo Residual Anterior:** Mostra a sobra líquida trazida dos meses passados e o total em conta consolidado hoje.
* **Navegação de Meses Rápida:** Botões `[ ◀ ]` e `[ ▶ ]` e seletor nativo.
* **Gestão de Pagamentos:** Registro imediato de `Já Pago` vs `A Pagar` e botão de quitação rápida `Pagar` / `Receber`.
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

### 3.5. Segurança, Login & Instalação (PWA)
* **Autenticação com Login e Senha:**
  * Tela de bloqueio e primeiro acesso para criação de senha com proteção por hash.
  * Desbloqueio rápido com verificação e sessão memorizada.
  * Botão de bloqueio instantâneo `[ 🔒 Bloquear ]` no cabeçalho.
  * Gestão de senha (alteração e remoção) na aba Configurações.
* **Instalação no PC e Celular (PWA Nativo):**
  * Banner automático ao abrir a página com botão `[ Instalar ]` para Android e PC (Chrome/Edge).
  * Botão de instalação permanente no cabeçalho e na aba Configurações.
  * Modal explicativo dedicado para usuários de iPhone / iPad (Safari).
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

