/**
 * =========================================================================
 * APP DE FINANÇAS PESSOAIS - BACKEND GOOGLE SHEETS COM DASHBOARD VISUAL
 * Versão: 2.1.0
 * 
 * Cria automaticamente as abas de dados e um DASHBOARD VISUAL COMPLETO
 * com cartões de KPI (saldo, reserva, investimentos, proventos) e
 * GRÁFICOS NATIVOS diretamente na sua planilha do Google!
 * =========================================================================
 */

// Configuração dos nomes das abas
const SHEETS = {
  DASHBOARD: "📊 Dashboard",
  TRANSACTIONS: "Transacoes",
  EMERGENCY: "ReservaEmergencia",
  INVESTMENTS: "Investimentos",
  DIVIDENDS: "Proventos",
  DEBTS: "MetasQuitacao",
  CONFIG: "Configuracoes"
};

/**
 * Função executada automaticamente para inicializar as abas, cabeçalhos e o Dashboard
 */
function inicializarPlanilha() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Aba Transações
  let sheetTrans = ss.getSheetByName(SHEETS.TRANSACTIONS);
  if (!sheetTrans) {
    sheetTrans = ss.insertSheet(SHEETS.TRANSACTIONS);
    sheetTrans.appendRow(["ID", "Data", "Tipo", "Categoria", "Descrição", "Valor", "Método", "Status", "CriadoEm"]);
    formatarCabecalho(sheetTrans, "#10b981");
    sheetTrans.setTabColor("#10b981");
  }

  // 2. Aba Reserva de Emergência
  let sheetEmerg = ss.getSheetByName(SHEETS.EMERGENCY);
  if (!sheetEmerg) {
    sheetEmerg = ss.insertSheet(SHEETS.EMERGENCY);
    sheetEmerg.appendRow(["ID", "Data", "Tipo", "Valor", "Instituição", "Observação", "CriadoEm"]);
    formatarCabecalho(sheetEmerg, "#3b82f6");
    sheetEmerg.setTabColor("#3b82f6");
  }

  // 3. Aba Investimentos
  let sheetInvest = ss.getSheetByName(SHEETS.INVESTMENTS);
  if (!sheetInvest) {
    sheetInvest = ss.insertSheet(SHEETS.INVESTMENTS);
    sheetInvest.appendRow(["ID", "Ticker", "Nome", "Classe", "Quantidade", "Preço Médio", "Preço Atual", "Instituição", "AtualizadoEm"]);
    formatarCabecalho(sheetInvest, "#8b5cf6");
    sheetInvest.setTabColor("#8b5cf6");
  }

  // 4. Aba Proventos / Dividendos
  let sheetDiv = ss.getSheetByName(SHEETS.DIVIDENDS);
  if (!sheetDiv) {
    sheetDiv = ss.insertSheet(SHEETS.DIVIDENDS);
    sheetDiv.appendRow(["ID", "Data", "Ativo", "Tipo", "Valor", "CriadoEm"]);
    formatarCabecalho(sheetDiv, "#f59e0b");
    sheetDiv.setTabColor("#f59e0b");
  }

  // 5. Aba Metas de Quitação (Dívidas / Financiamentos)
  let sheetDebts = ss.getSheetByName(SHEETS.DEBTS);
  if (!sheetDebts) {
    sheetDebts = ss.insertSheet(SHEETS.DEBTS);
    sheetDebts.appendRow(["ID", "Nome", "Instituição", "Valor Total", "Valor Pago", "Valor Parcela", "Data Limite", "Observação", "AtualizadoEm"]);
    formatarCabecalho(sheetDebts, "#ef4444");
    sheetDebts.setTabColor("#ef4444");
  }

  // 6. Aba Configurações
  let sheetConf = ss.getSheetByName(SHEETS.CONFIG);
  if (!sheetConf) {
    sheetConf = ss.insertSheet(SHEETS.CONFIG);
    sheetConf.appendRow(["Chave", "Valor"]);
    formatarCabecalho(sheetConf, "#475569");
    sheetConf.appendRow(["MetaReservaEmergencia", "24000"]);
    sheetConf.appendRow(["MesesCustoFixoReserva", "6"]);
    sheetConf.appendRow(["MetaInvestimento", "100000"]);
    sheetConf.appendRow(["MetaAporteMensal", "1500"]);
    sheetConf.appendRow(["MetaRendaPassiva", "500"]);
    sheetConf.setTabColor("#64748b");
  }

  // 6. CRIAÇÃO DO DASHBOARD VISUAL EXECUTIVO
  criarDashboardVisual(ss);

  // Remove a aba padrão "Página1" se houver outras abas
  const defaultSheet = ss.getSheetByName("Página1") || ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch(e) {}
  }

  return { success: true, message: "Planilha e Dashboard visual criados com sucesso!" };
}

function formatarCabecalho(sheet, corFundo) {
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1);
  header.setBackground(corFundo)
        .setFontColor("#ffffff")
        .setFontWeight("bold")
        .setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
}

/**
 * Constrói o Dashboard executivo com KPIs, tabelas de apoio e gráficos nativos
 */
function criarDashboardVisual(ss) {
  let dash = ss.getSheetByName(SHEETS.DASHBOARD);
  if (dash) {
    // Remove gráficos antigos antes de recriar
    const charts = dash.getCharts();
    charts.forEach(c => dash.removeChart(c));
    dash.clear();
  } else {
    dash = ss.insertSheet(SHEETS.DASHBOARD, 0); // Fica como primeira aba
  }

  dash.setTabColor("#059669");

  // Ajusta larguras de colunas
  dash.setColumnWidth(1, 30);  // Espaço margem esquerda
  dash.setColumnWidth(2, 170); // B
  dash.setColumnWidth(3, 140); // C
  dash.setColumnWidth(4, 170); // D
  dash.setColumnWidth(5, 140); // E
  dash.setColumnWidth(6, 170); // F
  dash.setColumnWidth(7, 140); // G
  dash.setColumnWidth(8, 170); // H
  dash.setColumnWidth(9, 140); // I

  // ----------------------------------------------------
  // 1. BANNER DO TÍTULO (Linhas 2 a 3)
  // ----------------------------------------------------
  const titleRange = dash.getRange("B2:I3");
  titleRange.merge();
  titleRange.setValue("📊 FINANÇAS PRO • PAINEL EXECUTIVO & INVESTIMENTOS")
            .setBackground("#0f172a")
            .setFontColor("#ffffff")
            .setFontSize(14)
            .setFontWeight("bold")
            .setHorizontalAlignment("center")
            .setVerticalAlignment("middle");

  // ----------------------------------------------------
  // 2. CARDS DE KPI (Linhas 5 a 7)
  // ----------------------------------------------------
  // Card 1: Saldo Líquido do Mês
  dash.getRange("B5:C5").merge()
      .setValue("💳 SALDO LÍQUIDO GERAL")
      .setBackground("#10b981").setFontColor("#ffffff").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center");
  dash.getRange("B6:C7").merge()
      .setFormula('=IFERROR(SUMIF(Transacoes!C:C; "receita"; Transacoes!F:F) - SUMIF(Transacoes!C:C; "despesa"; Transacoes!F:F); 0)')
      .setBackground("#ecfdf5").setFontColor("#065f46").setFontWeight("bold").setFontSize(16)
      .setHorizontalAlignment("center").setVerticalAlignment("middle")
      .setNumberFormat("R$ #,##0.00");

  // Card 2: Reserva de Emergência Acumulada
  dash.getRange("D5:E5").merge()
      .setValue("🛡️ RESERVA DE EMERGÊNCIA")
      .setBackground("#3b82f6").setFontColor("#ffffff").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center");
  dash.getRange("D6:E7").merge()
      .setFormula('=IFERROR(SUMIF(ReservaEmergencia!C:C; "Aporte"; ReservaEmergencia!D:D) + SUMIF(ReservaEmergencia!C:C; "Rendimento"; ReservaEmergencia!D:D) - SUMIF(ReservaEmergencia!C:C; "Resgate"; ReservaEmergencia!D:D); 0)')
      .setBackground("#eff6ff").setFontColor("#1e40af").setFontWeight("bold").setFontSize(16)
      .setHorizontalAlignment("center").setVerticalAlignment("middle")
      .setNumberFormat("R$ #,##0.00");

  // Card 3: Total Investido (Carteira)
  dash.getRange("F5:G5").merge()
      .setValue("📈 TOTAL INVESTIDO")
      .setBackground("#8b5cf6").setFontColor("#ffffff").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center");
  dash.getRange("F6:G7").merge()
      .setFormula('=IFERROR(SUMPRODUCT(Investimentos!E2:E; Investimentos!G2:G); 0)')
      .setBackground("#f5f3ff").setFontColor("#5b21b6").setFontWeight("bold").setFontSize(16)
      .setHorizontalAlignment("center").setVerticalAlignment("middle")
      .setNumberFormat("R$ #,##0.00");

  // Card 4: Total de Proventos Recebidos
  dash.getRange("H5:I5").merge()
      .setValue("💰 PROVENTOS RECEBIDOS")
      .setBackground("#f59e0b").setFontColor("#ffffff").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center");
  dash.getRange("H6:I7").merge()
      .setFormula('=IFERROR(SUM(Proventos!E2:E); 0)')
      .setBackground("#fffbeb").setFontColor("#92400e").setFontWeight("bold").setFontSize(16)
      .setHorizontalAlignment("center").setVerticalAlignment("middle")
      .setNumberFormat("R$ #,##0.00");

  // Bordas suaves nos cards
  dash.getRange("B5:C7").setBorder(true, true, true, true, false, false, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
  dash.getRange("D5:E7").setBorder(true, true, true, true, false, false, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
  dash.getRange("F5:G7").setBorder(true, true, true, true, false, false, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
  dash.getRange("H5:I7").setBorder(true, true, true, true, false, false, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);

  // ----------------------------------------------------
  // 3. TABELA 1: DESPESAS POR CATEGORIA (Linhas 10 a 20)
  // ----------------------------------------------------
  dash.getRange("B9:C9").merge()
      .setValue("🏷️ Despesas por Categoria")
      .setBackground("#334155").setFontColor("#ffffff").setFontWeight("bold").setFontSize(10).setHorizontalAlignment("center");
  
  dash.getRange("B10").setValue("Categoria").setFontWeight("bold").setBackground("#f1f5f9");
  dash.getRange("C10").setValue("Total Gasto (R$)").setFontWeight("bold").setBackground("#f1f5f9").setHorizontalAlignment("right");

  const categorias = ["Alimentação", "Moradia", "Transporte", "Lazer", "Saúde", "Educação", "Serviços", "Outros"];
  for (let i = 0; i < categorias.length; i++) {
    const row = 11 + i;
    dash.getRange(row, 2).setValue(categorias[i]);
    dash.getRange(row, 3).setFormula(`=IFERROR(SUMIFS(Transacoes!F:F; Transacoes!C:C; "despesa"; Transacoes!D:D; B${row}); 0)`)
        .setNumberFormat("R$ #,##0.00");
  }

  // Total de Despesas
  dash.getRange(19, 2).setValue("Total").setFontWeight("bold").setBackground("#f8fafc");
  dash.getRange(19, 3).setFormula("=SUM(C11:C18)").setFontWeight("bold").setBackground("#f8fafc").setNumberFormat("R$ #,##0.00");
  dash.getRange("B9:C19").setBorder(true, true, true, true, true, true, "#e2e8f0", SpreadsheetApp.BorderStyle.SOLID);

  // ----------------------------------------------------
  // 4. TABELA 2: ALOCAÇÃO DE INVESTIMENTOS (Linhas 10 a 18)
  // ----------------------------------------------------
  dash.getRange("E9:G9").merge()
      .setValue("📊 Alocação de Ativos por Classe")
      .setBackground("#334155").setFontColor("#ffffff").setFontWeight("bold").setFontSize(10).setHorizontalAlignment("center");

  dash.getRange("E10").setValue("Classe").setFontWeight("bold").setBackground("#f1f5f9");
  dash.getRange("F10").setValue("Total (R$)").setFontWeight("bold").setBackground("#f1f5f9").setHorizontalAlignment("right");
  dash.getRange("G10").setValue("% Carteira").setFontWeight("bold").setBackground("#f1f5f9").setHorizontalAlignment("right");

  const classes = ["Renda Fixa", "Ações", "FIIs", "Cripto", "Internacional"];
  for (let i = 0; i < classes.length; i++) {
    const row = 11 + i;
    dash.getRange(row, 5).setValue(classes[i]);
    dash.getRange(row, 6).setFormula(`=IFERROR(SUMPRODUCT((Investimentos!D2:D=E${row}) * (Investimentos!E2:E) * (Investimentos!G2:G)); 0)`)
        .setNumberFormat("R$ #,##0.00");
    dash.getRange(row, 7).setFormula(`=IFERROR(F${row} / $F$16; 0)`).setNumberFormat("0.0%");
  }

  // Total Carteira
  dash.getRange(16, 5).setValue("Total").setFontWeight("bold").setBackground("#f8fafc");
  dash.getRange(16, 6).setFormula("=SUM(F11:F15)").setFontWeight("bold").setBackground("#f8fafc").setNumberFormat("R$ #,##0.00");
  dash.getRange(16, 7).setFormula("=SUM(G11:G15)").setFontWeight("bold").setBackground("#f8fafc").setNumberFormat("0.0%");
  dash.getRange("E9:G16").setBorder(true, true, true, true, true, true, "#e2e8f0", SpreadsheetApp.BorderStyle.SOLID);

  // ----------------------------------------------------
  // 5. TABELA 3: FLUXO MENSAL (RECEITAS X DESPESAS)
  // ----------------------------------------------------
  dash.getRange("I9").setValue("Comparativo").setFontWeight("bold").setBackground("#334155").setFontColor("#ffffff").setHorizontalAlignment("center");
  dash.getRange("I10").setValue("Valor (R$)").setFontWeight("bold").setBackground("#f1f5f9").setHorizontalAlignment("right");
  dash.getRange("I11").setFormula('=IFERROR(SUMIF(Transacoes!C:C; "receita"; Transacoes!F:F); 0)').setNumberFormat("R$ #,##0.00");
  dash.getRange("I12").setFormula('=IFERROR(SUMIF(Transacoes!C:C; "despesa"; Transacoes!F:F); 0)').setNumberFormat("R$ #,##0.00");
  dash.getRange("H11").setValue("Receitas").setFontWeight("bold").setBackground("#ecfdf5").setFontColor("#059669");
  dash.getRange("H12").setValue("Despesas").setFontWeight("bold").setBackground("#fff1f2").setFontColor("#e11d48");
  dash.getRange("H9:I12").setBorder(true, true, true, true, true, true, "#e2e8f0", SpreadsheetApp.BorderStyle.SOLID);

  // ----------------------------------------------------
  // 6. GRÁFICOS NATIVOS NATIVAMENTE EMBUTIDOS
  // ----------------------------------------------------
  try {
    // Remove gráficos antigos para evitar duplicações
    const oldCharts = dash.getCharts();
    for (let c = 0; c < oldCharts.length; c++) {
      dash.removeChart(oldCharts[c]);
    }

    // Gráfico 1: Rosca de Despesas por Categoria (PIE com pieHole)
    const chartCat = dash.newChart()
      .asPieChart()
      .addRange(dash.getRange("B10:C18"))
      .setPosition(21, 2, 0, 0)
      .setOption('title', 'Distribuição das Despesas por Categoria')
      .setOption('pieHole', 0.4)
      .setOption('width', 440)
      .setOption('height', 280)
      .build();
    dash.insertChart(chartCat);

    // Gráfico 2: Pizza de Alocação de Investimentos
    const chartAlloc = dash.newChart()
      .asPieChart()
      .addRange(dash.getRange("E10:F15"))
      .setPosition(21, 6, 0, 0)
      .setOption('title', 'Alocação da Carteira de Ativos')
      .setOption('width', 440)
      .setOption('height', 280)
      .build();
    dash.insertChart(chartAlloc);

    // Gráfico 3: Colunas de Receitas vs Despesas
    const chartFlow = dash.newChart()
      .asColumnChart()
      .addRange(dash.getRange("H10:I12"))
      .setPosition(36, 2, 0, 0)
      .setOption('title', 'Balanço: Receitas vs Despesas')
      .setOption('legend', { position: 'none' })
      .setOption('width', 440)
      .setOption('height', 260)
      .build();
    dash.insertChart(chartFlow);
  } catch (errChart) {
    console.warn("Aviso ao criar gráficos:", errChart);
  }
}

/**
 * Endpoint GET: Retorna todos os dados da planilha em formato JSON
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Se receber ação direta via GET (ex: ?action=init)
    if (e && e.parameter && e.parameter.action === "init") {
      return respostaJson(inicializarPlanilha());
    }

    // Garante que as abas existem
    if (!ss.getSheetByName(SHEETS.TRANSACTIONS)) {
      inicializarPlanilha();
    }

    const dados = {
      transacoes: lerAbaComoObjetos(ss.getSheetByName(SHEETS.TRANSACTIONS)),
      reserva: lerAbaComoObjetos(ss.getSheetByName(SHEETS.EMERGENCY)),
      investimentos: lerAbaComoObjetos(ss.getSheetByName(SHEETS.INVESTMENTS)),
      proventos: lerAbaComoObjetos(ss.getSheetByName(SHEETS.DIVIDENDS)),
      quitacao: lerAbaComoObjetos(ss.getSheetByName(SHEETS.DEBTS)),
      configuracoes: lerConfiguracoes(ss.getSheetByName(SHEETS.CONFIG)),
      status: "online",
      atualizadoEm: new Date().toISOString()
    };

    return ContentService.createTextOutput(JSON.stringify({ success: true, data: dados }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (erro) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: erro.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Endpoint POST: Recebe ações do app (adicionar, editar, excluir, sincronizar)
 */
function doPost(e) {
  try {
    let corpo = null;
    if (e && e.postData && e.postData.contents) {
      try {
        corpo = JSON.parse(e.postData.contents);
      } catch (err) {
        corpo = e.postData.contents;
      }
    } else if (e && e.parameter && e.parameter.payload) {
      try {
        corpo = JSON.parse(e.parameter.payload);
      } catch (err) {}
    }

    if (!corpo) {
      return respostaJson({ success: false, error: "Nenhum dado recebido no POST" });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const acao = corpo.action;

    switch (acao) {
      case "init":
        const initResult = inicializarPlanilha();
        return respostaJson(initResult);

      case "add_transaction":
        return adicionarTransacao(ss, corpo.payload);

      case "delete_transaction":
        return excluirLinhaPorId(ss.getSheetByName(SHEETS.TRANSACTIONS), corpo.id);

      case "add_emergency":
        return adicionarReserva(ss, corpo.payload);

      case "delete_emergency":
        return excluirLinhaPorId(ss.getSheetByName(SHEETS.EMERGENCY), corpo.id);

      case "save_investment":
        return salvarInvestimento(ss, corpo.payload);

      case "delete_investment":
        return excluirLinhaPorId(ss.getSheetByName(SHEETS.INVESTMENTS), corpo.id);

      case "save_debt":
        return salvarDivida(ss, corpo.payload);

      case "delete_debt":
        return excluirLinhaPorId(ss.getSheetByName(SHEETS.DEBTS), corpo.id);

      case "amortize_debt":
        return amortizarDivida(ss, corpo.id, corpo.valor);

      case "add_dividend":
        return adicionarProvento(ss, corpo.payload);

      case "delete_dividend":
        return excluirLinhaPorId(ss.getSheetByName(SHEETS.DIVIDENDS), corpo.id);

      case "update_config":
        return salvarConfiguracoes(ss, corpo.payload);

      case "sync_all":
        return sincronizacaoEmMassa(ss, corpo.payload);

      default:
        return respostaJson({ success: false, error: "Ação desconhecida: " + acao });
    }
  } catch (erro) {
    return respostaJson({ success: false, error: erro.toString() });
  }
}

function respostaJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// FUNÇÕES DE MANIPULAÇÃO DE DADOS
// ==========================================

function lerAbaComoObjetos(sheet) {
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  const headers = rows[0].map(h => normalizarChave(h));
  const items = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0] && !row[1] && !row[2]) continue;

    const item = {};
    headers.forEach((h, colIdx) => {
      let val = row[colIdx];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
      }
      item[h] = val;
    });
    items.push(item);
  }
  return items;
}

function normalizarChave(texto) {
  return texto.toString()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

function lerConfiguracoes(sheet) {
  const configs = {};
  if (!sheet) return configs;
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0]) {
      configs[rows[i][0]] = rows[i][1];
    }
  }
  return configs;
}

function adicionarTransacao(ss, t) {
  const sheet = ss.getSheetByName(SHEETS.TRANSACTIONS);
  const id = t.id || "tr_" + Utilities.getUuid().slice(0, 8);
  const data = t.data || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  const agora = new Date().toISOString();

  // Verifica se a transação já existe pelo ID para atualizar (ex: marcar como pago)
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] == id) {
      sheet.getRange(i + 1, 1, 1, 9).setValues([[
        id,
        data,
        t.tipo || "despesa",
        t.categoria || "Outros",
        t.descricao || "",
        Number(t.valor) || 0,
        t.metodo || "Pix",
        t.status || "pago",
        rows[i][8] || agora
      ]]);
      return respostaJson({ success: true, id: id, updated: true });
    }
  }

  sheet.appendRow([
    id,
    data,
    t.tipo || "despesa",
    t.categoria || "Outros",
    t.descricao || "",
    Number(t.valor) || 0,
    t.metodo || "Pix",
    t.status || "pago",
    agora
  ]);

  return respostaJson({ success: true, id: id });
}

function adicionarReserva(ss, r) {
  const sheet = ss.getSheetByName(SHEETS.EMERGENCY);
  const id = r.id || "em_" + Utilities.getUuid().slice(0, 8);
  const data = r.data || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

  sheet.appendRow([
    id,
    data,
    r.tipo || "Aporte",
    Number(r.valor) || 0,
    r.instituicao || "Tesouro Selic",
    r.observacao || "",
    new Date().toISOString()
  ]);

  return respostaJson({ success: true, id: id });
}

function salvarInvestimento(ss, inv) {
  const sheet = ss.getSheetByName(SHEETS.INVESTMENTS);
  const rows = sheet.getDataRange().getValues();
  const id = inv.id || "inv_" + Utilities.getUuid().slice(0, 8);
  const agora = new Date().toISOString();

  let linhaExistente = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] == id || (rows[i][1] && inv.ticker && rows[i][1].toString().toUpperCase() === inv.ticker.toUpperCase())) {
      linhaExistente = i + 1;
      break;
    }
  }

  const dadosLinha = [
    id,
    (inv.ticker || "").toUpperCase(),
    inv.nome || inv.ticker || "",
    inv.classe || "Ações",
    Number(inv.quantidade) || 0,
    Number(inv.precoMedio) || 0,
    Number(inv.precoAtual || inv.precoMedio) || 0,
    inv.instituicao || "Corretora",
    agora
  ];

  if (linhaExistente > 0) {
    sheet.getRange(linhaExistente, 1, 1, dadosLinha.length).setValues([dadosLinha]);
  } else {
    sheet.appendRow(dadosLinha);
  }

  return respostaJson({ success: true, id: id });
}

function adicionarProvento(ss, p) {
  const sheet = ss.getSheetByName(SHEETS.DIVIDENDS);
  const id = p.id || "div_" + Utilities.getUuid().slice(0, 8);
  const data = p.data || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

  sheet.appendRow([
    id,
    data,
    (p.ativo || "").toUpperCase(),
    p.tipo || "Dividendo",
    Number(p.valor) || 0,
    new Date().toISOString()
  ]);

  return respostaJson({ success: true, id: id });
}

function excluirLinhaPorId(sheet, id) {
  if (!sheet || !id) return respostaJson({ success: false, error: "Aba ou ID inválido" });
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] == id) {
      sheet.deleteRow(i + 1);
      return respostaJson({ success: true, message: "Registro excluído com sucesso" });
    }
  }
  return respostaJson({ success: false, error: "ID não encontrado: " + id });
}

function salvarConfiguracoes(ss, configData) {
  const sheet = ss.getSheetByName(SHEETS.CONFIG);
  if (!sheet) return respostaJson({ success: false, error: "Aba não encontrada" });

  sheet.clearContents();
  sheet.appendRow(["Chave", "Valor"]);
  formatarCabecalho(sheet, "#475569");

  for (let k in configData) {
    sheet.appendRow([k, configData[k]]);
  }
  return respostaJson({ success: true });
}

function sincronizacaoEmMassa(ss, payload) {
  if (payload.transacoes && Array.isArray(payload.transacoes)) {
    const sheet = ss.getSheetByName(SHEETS.TRANSACTIONS);
    sheet.clearContents();
    sheet.appendRow(["ID", "Data", "Tipo", "Categoria", "Descrição", "Valor", "Método", "Status", "CriadoEm"]);
    formatarCabecalho(sheet, "#10b981");
    payload.transacoes.forEach(t => {
      sheet.appendRow([t.id, t.data, t.tipo, t.categoria, t.descricao, t.valor, t.metodo, t.status, t.criadoem || new Date().toISOString()]);
    });
  }

  if (payload.reserva && Array.isArray(payload.reserva)) {
    const sheet = ss.getSheetByName(SHEETS.EMERGENCY);
    sheet.clearContents();
    sheet.appendRow(["ID", "Data", "Tipo", "Valor", "Instituição", "Observação", "CriadoEm"]);
    formatarCabecalho(sheet, "#3b82f6");
    payload.reserva.forEach(r => {
      sheet.appendRow([r.id, r.data, r.tipo, r.valor, r.instituicao, r.observacao, r.criadoem || new Date().toISOString()]);
    });
  }

  if (payload.investimentos && Array.isArray(payload.investimentos)) {
    const sheet = ss.getSheetByName(SHEETS.INVESTMENTS);
    sheet.clearContents();
    sheet.appendRow(["ID", "Ticker", "Nome", "Classe", "Quantidade", "Preço Médio", "Preço Atual", "Instituição", "AtualizadoEm"]);
    formatarCabecalho(sheet, "#8b5cf6");
    payload.investimentos.forEach(inv => {
      sheet.appendRow([inv.id, inv.ticker, inv.nome, inv.classe, inv.quantidade, inv.precomedio, inv.precoatual, inv.instituicao, inv.atualizadoem || new Date().toISOString()]);
    });
  }

  if (payload.proventos && Array.isArray(payload.proventos)) {
    const sheet = ss.getSheetByName(SHEETS.DIVIDENDS);
    sheet.clearContents();
    sheet.appendRow(["ID", "Data", "Ativo", "Tipo", "Valor", "CriadoEm"]);
    formatarCabecalho(sheet, "#f59e0b");
    payload.proventos.forEach(p => {
      sheet.appendRow([p.id, p.data, p.ativo, p.tipo, p.valor, p.criadoem || new Date().toISOString()]);
    });
  }

  if (payload.quitacao && Array.isArray(payload.quitacao)) {
    const sheet = ss.getSheetByName(SHEETS.DEBTS);
    if (sheet) {
      sheet.clearContents();
      sheet.appendRow(["ID", "Nome", "Instituição", "Valor Total", "Valor Pago", "Valor Parcela", "Data Limite", "Observação", "AtualizadoEm"]);
      formatarCabecalho(sheet, "#ef4444");
      payload.quitacao.forEach(d => {
        sheet.appendRow([d.id, d.nome, d.instituicao, d.valorTotal, d.valorPago, d.valorParcela, d.dataLimite, d.observacao, d.atualizadoEm || new Date().toISOString()]);
      });
    }
  }

  // Atualiza ou reconstrói o Dashboard Visual com os novos dados
  criarDashboardVisual(ss);

  return respostaJson({ success: true, message: "Dados sincronizados e Dashboard da planilha atualizado com sucesso!" });
}

function salvarDivida(ss, item) {
  const sheet = ss.getSheetByName(SHEETS.DEBTS);
  if (!sheet || !item) return respostaJson({ success: false });

  const id = item.id || ("deb_" + Utilities.getUuid().slice(0, 8));
  const dados = sheet.getDataRange().getValues();
  for (let i = 1; i < dados.length; i++) {
    if (String(dados[i][0]) === String(id)) {
      sheet.getRange(i + 1, 2).setValue(item.nome || "");
      sheet.getRange(i + 1, 3).setValue(item.instituicao || "");
      sheet.getRange(i + 1, 4).setValue(item.valorTotal || 0);
      sheet.getRange(i + 1, 5).setValue(item.valorPago || 0);
      sheet.getRange(i + 1, 6).setValue(item.valorParcela || 0);
      sheet.getRange(i + 1, 7).setValue(item.dataLimite || "");
      sheet.getRange(i + 1, 8).setValue(item.observacao || "");
      sheet.getRange(i + 1, 9).setValue(new Date().toISOString());
      return respostaJson({ success: true, id: id, updated: true });
    }
  }

  sheet.appendRow([
    id,
    item.nome || "",
    item.instituicao || "",
    item.valorTotal || 0,
    item.valorPago || 0,
    item.valorParcela || 0,
    item.dataLimite || "",
    item.observacao || "",
    new Date().toISOString()
  ]);

  return respostaJson({ success: true, id: id });
}

function amortizarDivida(ss, id, valor) {
  const sheet = ss.getSheetByName(SHEETS.DEBTS);
  if (!sheet || !id || !valor) return respostaJson({ success: false });

  const dados = sheet.getDataRange().getValues();
  for (let i = 1; i < dados.length; i++) {
    if (String(dados[i][0]) === String(id)) {
      const total = Number(dados[i][3]) || 0;
      const atualPago = Number(dados[i][4]) || 0;
      const novoPago = Math.min(total, atualPago + Number(valor));
      sheet.getRange(i + 1, 5).setValue(novoPago);
      sheet.getRange(i + 1, 9).setValue(new Date().toISOString());
      return respostaJson({ success: true, id: id, novoPago: novoPago, updated: true });
    }
  }

  return respostaJson({ success: false, error: "Dívida não encontrada" });
}
