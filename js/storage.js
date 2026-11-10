/**
 * Storage Service - Gerencia o armazenamento local (LocalStorage)
 * e os dados de exemplo (Demo Data)
 */

const STORAGE_KEYS = {
  TRANSACTIONS: 'financas_transacoes_v1',
  EMERGENCY: 'financas_reserva_v1',
  INVESTMENTS: 'financas_investimentos_v1',
  DIVIDENDS: 'financas_proventos_v1',
  DEBTS: 'financas_quitacao_v1',
  AUTH: 'financas_auth_v1',
  CONFIG: 'financas_config_v1',
  SYNC_STATUS: 'financas_sync_status_v1',
  PENDING_SYNC: 'financas_pending_sync_v1'
};

const DEFAULT_CONFIG = {
  sheetsUrl: 'https://script.google.com/macros/s/AKfycbzXZsoDoWuRXz5FwrefxTrZadXjwsen4cBL3YenOhwYMm4sn6YSqIbQGwaB6HKAV5xOcA/exec',
  metaReserva: 0,
  custoFixoMensal: 0,
  mesesReserva: 6,
  metaInvestimento: 0,
  metaAporteMensal: 0,
  metaRendaPassiva: 0,
  moeda: 'BRL',
  tema: 'dark',
  orcamentos: {
    'Alimentação': 1200,
    'Moradia': 2000,
    'Transporte': 500,
    'Lazer': 400,
    'Saúde': 300,
    'Educação': 400,
    'Serviços': 300,
    'Vestuário': 200,
    'Outros': 300
  }
};

const DEMO_DATA = {
  transacoes: [
    { id: 'tr_1', data: new Date().toISOString().slice(0, 7) + '-05', tipo: 'receita', categoria: 'Salário', descricao: 'Salário Mensal', valor: 6500.00, metodo: 'Transferência', status: 'pago' },
    { id: 'tr_2', data: new Date().toISOString().slice(0, 7) + '-06', tipo: 'despesa', categoria: 'Moradia', descricao: 'Aluguel + Condomínio', valor: 1850.00, metodo: 'Pix', status: 'pago' },
    { id: 'tr_3', data: new Date().toISOString().slice(0, 7) + '-07', tipo: 'despesa', categoria: 'Alimentação', descricao: 'Supermercado Mensal', valor: 720.40, metodo: 'Cartão de Crédito', status: 'pago' },
    { id: 'tr_4', data: new Date().toISOString().slice(0, 7) + '-08', tipo: 'despesa', categoria: 'Transporte', descricao: 'Combustível / Uber', valor: 280.00, metodo: 'Cartão de Crédito', status: 'pago' },
    { id: 'tr_5', data: new Date().toISOString().slice(0, 7) + '-10', tipo: 'receita', categoria: 'Freelance', descricao: 'Projeto Consultoria', valor: 1200.00, metodo: 'Pix', status: 'pago' },
    { id: 'tr_6', data: new Date().toISOString().slice(0, 7) + '-11', tipo: 'despesa', categoria: 'Lazer', descricao: 'Jantar Restaurante', valor: 165.50, metodo: 'Pix', status: 'pago' },
    { id: 'tr_7', data: new Date().toISOString().slice(0, 7) + '-12', tipo: 'despesa', categoria: 'Saúde', descricao: 'Farmácia / Suplementos', valor: 95.00, metodo: 'Cartão de Débito', status: 'pago' },
    { id: 'tr_8', data: new Date().toISOString().slice(0, 7) + '-14', tipo: 'despesa', categoria: 'Serviços', descricao: 'Internet + Assinaturas', valor: 149.90, metodo: 'Cartão de Crédito', status: 'pago' }
  ],
  reserva: [
    { id: 'em_1', data: '2026-01-10', tipo: 'Aporte', valor: 5000.00, instituicao: 'Tesouro Selic', observacao: 'Início da reserva' },
    { id: 'em_2', data: '2026-02-15', tipo: 'Aporte', valor: 3000.00, instituicao: 'Nubank (100% CDI)', observacao: 'Aporte extra 13º' },
    { id: 'em_3', data: '2026-03-10', tipo: 'Aporte', valor: 2500.00, instituicao: 'Sofisa Direto', observacao: 'Aporte mensal' },
    { id: 'em_4', data: '2026-03-31', tipo: 'Rendimento', valor: 104.80, instituicao: 'Tesouro Selic', observacao: 'Rendimento líquido do mês' },
    { id: 'em_5', data: '2026-04-10', tipo: 'Aporte', valor: 2500.00, instituicao: 'Tesouro Selic', observacao: 'Aporte mensal' },
    { id: 'em_6', data: '2026-04-30', tipo: 'Rendimento', valor: 132.40, instituicao: 'Nubank (100% CDI)', observacao: 'Rendimento líquido' }
  ],
  investimentos: [
    { id: 'inv_1', ticker: 'CDB INTER', nome: 'CDB Pós-Fixado 102% CDI', classe: 'Renda Fixa', quantidade: 1, precoMedio: 10000.00, precoAtual: 10650.00, instituicao: 'Banco Inter' },
    { id: 'inv_2', ticker: 'TESOURO IPCA+', nome: 'Tesouro IPCA+ 2029', classe: 'Renda Fixa', quantidade: 2.5, precoMedio: 3200.00, precoAtual: 3350.00, instituicao: 'Tesouro Direto' },
    { id: 'inv_3', ticker: 'HGLG11', nome: 'CSHG Logística FII', classe: 'FIIs', quantidade: 40, precoMedio: 160.50, precoAtual: 168.20, instituicao: 'XP Investimentos' },
    { id: 'inv_4', ticker: 'MXRF11', nome: 'Maxi Renda FII', classe: 'FIIs', quantidade: 500, precoMedio: 10.20, precoAtual: 10.55, instituicao: 'XP Investimentos' },
    { id: 'inv_5', ticker: 'ITUB4', nome: 'Itaú Unibanco PN', classe: 'Ações', quantidade: 150, precoMedio: 31.40, precoAtual: 35.80, instituicao: 'NuInvest' },
    { id: 'inv_6', ticker: 'VALE3', nome: 'Vale S.A. ON', classe: 'Ações', quantidade: 80, precoMedio: 62.00, precoAtual: 66.50, instituicao: 'NuInvest' },
    { id: 'inv_7', ticker: 'IVVB11', nome: 'iShares S&P 500 Fundo de Índice', classe: 'Internacional', quantidade: 15, precoMedio: 290.00, precoAtual: 325.00, instituicao: 'XP Investimentos' },
    { id: 'inv_8', ticker: 'BTC', nome: 'Bitcoin', classe: 'Cripto', quantidade: 0.018, precoMedio: 320000.00, precoAtual: 395000.00, instituicao: 'Binance' }
  ],
  proventos: [
    { id: 'div_1', data: new Date().toISOString().slice(0, 7) + '-15', ativo: 'HGLG11', tipo: 'Rendimento', valor: 44.00 },
    { id: 'div_2', data: new Date().toISOString().slice(0, 7) + '-15', ativo: 'MXRF11', tipo: 'Rendimento', valor: 45.00 },
    { id: 'div_3', data: new Date().toISOString().slice(0, 7) + '-01', ativo: 'ITUB4', tipo: 'JCP', valor: 26.50 }
  ],
  quitacao: []
};

const StorageService = {
  // Inicialização
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
      this.loadDemoData();
    }
    if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
      this.saveConfig(DEFAULT_CONFIG);
    } else {
      const cfg = this.getConfig();
      if (!cfg.sheetsUrl) {
        this.saveConfig({ sheetsUrl: DEFAULT_CONFIG.sheetsUrl });
      }
    }
  },

  loadDemoData() {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(DEMO_DATA.transacoes));
    localStorage.setItem(STORAGE_KEYS.EMERGENCY, JSON.stringify(DEMO_DATA.reserva));
    localStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify(DEMO_DATA.investimentos));
    localStorage.setItem(STORAGE_KEYS.DIVIDENDS, JSON.stringify(DEMO_DATA.proventos));
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(DEMO_DATA.quitacao));
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
  },

  // Configurações
  getConfig() {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG;
  },

  saveConfig(config) {
    const atual = this.getConfig();
    const merged = { ...atual, ...config };
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(merged));
    return merged;
  },

  // Transações com auto-deduplicação inteligente
  getTransactions() {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) return [];
    try {
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) return [];

      // Deduplicação estrita: elimina duplicatas com mesma data, tipo, descrição e valor
      const seen = new Set();
      const deduped = [];
      let hadDuplicates = false;

      list.forEach(t => {
        const d = (t.data || '').slice(0, 10);
        const tipo = (t.tipo || '').toLowerCase();
        const desc = (t.descricao || '').trim().toLowerCase();
        const val = Number(t.valor || 0).toFixed(2);
        const key = `${d}_${tipo}_${desc}_${val}`;

        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(t);
        } else {
          hadDuplicates = true;
        }
      });

      if (hadDuplicates) {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(deduped));
      }
      return deduped;
    } catch (e) {
      return [];
    }
  },

  saveTransaction(transaction) {
    const list = this.getTransactions();
    if (!transaction.id) {
      transaction.id = 'tr_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    }
    const idx = list.findIndex(t => t.id === transaction.id);
    if (idx >= 0) {
      list[idx] = transaction;
    } else {
      list.unshift(transaction);
    }
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(list));
    return transaction;
  },

  deleteTransaction(id) {
    let list = this.getTransactions();
    list = list.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(list));
    // Registra tombstone para que sincronizações não ressuscitem a transação excluída
    try {
      const deleted = JSON.parse(localStorage.getItem('financas_deleted_ids_v1') || '[]');
      if (!deleted.includes(id)) {
        deleted.push(id);
        localStorage.setItem('financas_deleted_ids_v1', JSON.stringify(deleted.slice(-200)));
      }
    } catch(e) {}
    return list;
  },

  // Reserva de Emergência
  getEmergencyFunds() {
    const raw = localStorage.getItem(STORAGE_KEYS.EMERGENCY);
    return raw ? JSON.parse(raw) : [];
  },

  saveEmergencyLog(entry) {
    const list = this.getEmergencyFunds();
    if (!entry.id) {
      entry.id = 'em_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    }
    const idx = list.findIndex(e => e.id === entry.id);
    if (idx >= 0) {
      list[idx] = entry;
    } else {
      list.unshift(entry);
    }
    localStorage.setItem(STORAGE_KEYS.EMERGENCY, JSON.stringify(list));
    return entry;
  },

  deleteEmergencyLog(id) {
    let list = this.getEmergencyFunds();
    list = list.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EMERGENCY, JSON.stringify(list));
    return list;
  },

  // Investimentos
  getInvestments() {
    const raw = localStorage.getItem(STORAGE_KEYS.INVESTMENTS);
    return raw ? JSON.parse(raw) : [];
  },

  saveInvestment(inv) {
    const list = this.getInvestments();
    if (!inv.id) {
      inv.id = 'inv_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    }
    const idx = list.findIndex(i => i.id === inv.id || (i.ticker && inv.ticker && i.ticker.toUpperCase() === inv.ticker.toUpperCase()));
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...inv };
    } else {
      list.push(inv);
    }
    localStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify(list));
    return inv;
  },

  deleteInvestment(id) {
    let list = this.getInvestments();
    list = list.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify(list));
    return list;
  },

  // Proventos / Dividendos
  getDividends() {
    const raw = localStorage.getItem(STORAGE_KEYS.DIVIDENDS);
    return raw ? JSON.parse(raw) : [];
  },

  saveDividend(div) {
    const list = this.getDividends();
    if (!div.id) {
      div.id = 'div_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    }
    list.unshift(div);
    localStorage.setItem(STORAGE_KEYS.DIVIDENDS, JSON.stringify(list));
    return div;
  },

  deleteDividend(id) {
    let list = this.getDividends();
    list = list.filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEYS.DIVIDENDS, JSON.stringify(list));
    return list;
  },

  // Metas de Quitação (Dívidas / Empréstimos / Financiamentos)
  getDebts() {
    const raw = localStorage.getItem(STORAGE_KEYS.DEBTS);
    if (!raw) return [];
    try {
      let list = JSON.parse(raw);
      // Remove dívidas de exemplo fictícias de versões anteriores (deb_1 e deb_2)
      const filtered = list.filter(d => d.id !== 'deb_1' && d.id !== 'deb_2');
      if (filtered.length !== list.length) {
        localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(filtered));
        return filtered;
      }
      return list;
    } catch (e) {
      return [];
    }
  },

  saveDebt(debt) {
    const list = this.getDebts();
    if (!debt.id) {
      debt.id = 'deb_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    }
    const idx = list.findIndex(d => d.id === debt.id);
    if (idx >= 0) {
      list[idx] = debt;
    } else {
      list.unshift(debt);
    }
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(list));
    return debt;
  },

  deleteDebt(id) {
    let list = this.getDebts();
    list = list.filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(list));
    return list;
  },

  amortizeDebt(id, valor) {
    const list = this.getDebts();
    const debt = list.find(d => d.id === id);
    if (debt) {
      debt.valorPago = Math.min(debt.valorTotal, (Number(debt.valorPago) || 0) + Number(valor));
      debt.atualizadoEm = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(list));
    }
    return debt;
  },

  // ------------------------------------------
  // AUTENTICAÇÃO E SEGURANÇA
  // ------------------------------------------
  getAuth() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH) || 'null');
    } catch {
      return null;
    }
  },

  setAuth(password) {
    if (!password) {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      return;
    }
    const salt = 'financas_pro_2026_sec';
    const hash = btoa(encodeURIComponent(salt + password));
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify({ hash, enabled: true, setupDismissed: true }));
  },

  verifyAuth(password) {
    const auth = this.getAuth();
    if (!auth || !auth.enabled) return true;
    const salt = 'financas_pro_2026_sec';
    const hash = btoa(encodeURIComponent(salt + password));
    return auth.hash === hash;
  },

  hasPassword() {
    const auth = this.getAuth();
    return !!(auth && auth.enabled && auth.hash);
  },

  isSetupDismissed() {
    const auth = this.getAuth();
    return !!(auth && auth.setupDismissed);
  },

  dismissSetup() {
    const auth = this.getAuth() || {};
    auth.setupDismissed = true;
    auth.enabled = false;
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(auth));
  },

  removeAuth() {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
  },

  // Exportação e Importação de Dados (Backup)
  exportAllData() {
    return {
      transacoes: this.getTransactions(),
      reserva: this.getEmergencyFunds(),
      investimentos: this.getInvestments(),
      proventos: this.getDividends(),
      quitacao: this.getDebts(),
      configuracoes: this.getConfig(),
      exportadoEm: new Date().toISOString()
    };
  },

  importAllData(data) {
    if (data.transacoes) localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transacoes));
    if (data.reserva) localStorage.setItem(STORAGE_KEYS.EMERGENCY, JSON.stringify(data.reserva));
    if (data.investimentos) localStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify(data.investimentos));
    if (data.proventos) localStorage.setItem(STORAGE_KEYS.DIVIDENDS, JSON.stringify(data.proventos));
    if (data.quitacao) localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(data.quitacao));
    if (data.configuracoes) localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(data.configuracoes));
    return true;
  },

  zerarDados() {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EMERGENCY, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.DIVIDENDS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify([]));
  },

  limparTudo() {
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.EMERGENCY);
    localStorage.removeItem(STORAGE_KEYS.INVESTMENTS);
    localStorage.removeItem(STORAGE_KEYS.DIVIDENDS);
    localStorage.removeItem(STORAGE_KEYS.DEBTS);
    this.init();
  }
};

window.StorageService = StorageService;

