/**
 * App Controller - Orquestra a UI, navegação, gráficos e regras de negócio
 */

const App = {
  currentTab: 'dashboard',
  currentMonth: new Date().toISOString().slice(0, 7), // AAAA-MM
  filterAllMonths: false,
  dashboardPeriod: 'mes', // 'mes' ou 'total'
  charts: {},

  // Cores de classes de investimentos
  classColors: {
    'Renda Fixa': '#3b82f6', // azul
    'Ações': '#10b981',      // verde esmeralda
    'FIIs': '#8b5cf6',       // roxo
    'Cripto': '#f59e0b',     // âmbar
    'Internacional': '#ec4899', // rosa
    'Outros': '#64748b'      // slate
  },

  // Cores de categorias de despesas
  categoryColors: {
    'Energia Elétrica (Luz)': '#eab308',
    'Internet / TV / Telefone': '#06b6d4',
    'Fatura Cartão de Crédito': '#f43f5e',
    'Água / Saneamento': '#38bdf8',
    'Gás': '#fb923c',
    'Aluguel / Condomínio': '#8b5cf6',
    'Supermercado / Feira': '#10b981',
    'Alimentação / Restaurante': '#f97316',
    'Combustível': '#ef4444',
    'Transporte / Uber': '#6366f1',
    'Manutenção / Veículo': '#64748b',
    'Farmácia / Remédios': '#ec4899',
    'Plano de Saúde / Médico': '#14b8a6',
    'Streaming / Assinaturas': '#a855f7',
    'Lazer / Viagens': '#f59e0b',
    'Educação / Cursos': '#3b82f6',
    'Vestuário & Cuidados': '#d946ef',
    'Empréstimo / Financiamento': '#e11d48',
    'Pets': '#84cc16',
    'Outros': '#94a3b8',
    // Compatibilidade com categorias legadas
    'Alimentação': '#f97316',
    'Moradia': '#06b6d4',
    'Transporte': '#6366f1',
    'Lazer': '#ec4899',
    'Saúde': '#ef4444',
    'Educação': '#8b5cf6',
    'Serviços': '#14b8a6',
    'Vestuário': '#f43f5e'
  },

  normalizeDate(val) {
    if (window.SheetsService && typeof window.SheetsService.normalizeDate === 'function') {
      return window.SheetsService.normalizeDate(val);
    }
    if (!val) return '';
    val = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0, 10);
    const brMatch = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (brMatch) {
      return `${brMatch[3]}-${brMatch[2].padStart(2, '0')}-${brMatch[1].padStart(2, '0')}`;
    }
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) {
      const ano = parsed.getFullYear();
      const mes = String(parsed.getMonth() + 1).padStart(2, '0');
      const dia = String(parsed.getDate()).padStart(2, '0');
      return `${ano}-${mes}-${dia}`;
    }
    return val;
  },

  init() {
    window.StorageService.init();
    this.setupTheme();
    this.setupEventListeners();
    this.setupPWA();
    this.checkAuth();
    this.updateSyncBadge();
    this.render();

    // Tenta atualizar do Google Sheets se estiver conectado
    if (window.SheetsService.isConnected()) {
      this.syncFromSheets(true);
    }
  },

  setupTheme() {
    const config = window.StorageService.getConfig();
    if (config.tema === 'dark' || (!config.tema && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    window.StorageService.saveConfig({ tema: isDark ? 'dark' : 'light' });
    this.renderCharts();
  },

  setupEventListeners() {
    // Navegação Desktop e Mobile
    document.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // Filtro de Mês das Despesas
    const monthPicker = document.getElementById('month-selector');
    if (monthPicker) {
      monthPicker.value = this.currentMonth;
      const updateMonth = (e) => {
        if (e.target && e.target.value) {
          this.currentMonth = e.target.value;
          this.filterAllMonths = false;
          const pSelect = document.getElementById('trans-filter-periodo');
          if (pSelect) pSelect.value = 'mes';
          this.render();
        }
      };
      monthPicker.addEventListener('change', updateMonth);
      monthPicker.addEventListener('input', updateMonth);
    }

    // Modal de Transação - Tipo alternador
    const transTypeBtns = document.querySelectorAll('.trans-type-btn');
    transTypeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        transTypeBtns.forEach(b => b.classList.remove('bg-emerald-600', 'bg-rose-600', 'text-white'));
        transTypeBtns.forEach(b => b.classList.add('bg-slate-800', 'text-slate-400'));
        const type = e.currentTarget.getAttribute('data-type');
        e.currentTarget.classList.remove('bg-slate-800', 'text-slate-400');
        if (type === 'receita') {
          e.currentTarget.classList.add('bg-emerald-600', 'text-white');
        } else {
          e.currentTarget.classList.add('bg-rose-600', 'text-white');
        }
        document.getElementById('trans-tipo').value = type;
        this.updateCategoryOptions(type);
      });
    });

    // Atalhos Rápidos no Teclado (Desktop)
    document.addEventListener('keydown', (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        if (e.key === 'Escape') {
          document.querySelectorAll('.fixed.inset-0:not(.hidden)').forEach(modal => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
          });
        }
        return;
      }

      if (e.key === 'Escape') {
        document.querySelectorAll('.fixed.inset-0:not(.hidden)').forEach(modal => {
          modal.classList.add('hidden');
          modal.classList.remove('flex');
        });
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        this.openTransactionModal('despesa');
      } else if (e.key === '1') {
        this.switchTab('dashboard');
      } else if (e.key === '2') {
        this.switchTab('despesas');
      } else if (e.key === '3') {
        this.switchTab('reserva');
      } else if (e.key === '4') {
        this.switchTab('investimentos');
      } else if (e.key === '5') {
        this.switchTab('config');
      }
    });
  },

  switchTab(tabName) {
    this.currentTab = tabName;

    // Atualiza botões de navegação
    document.querySelectorAll('[data-tab]').forEach(btn => {
      const active = btn.getAttribute('data-tab') === tabName;
      if (active) {
        btn.classList.add('text-emerald-500', 'border-emerald-500', 'font-semibold');
        btn.classList.remove('text-slate-400', 'border-transparent');
      } else {
        btn.classList.remove('text-emerald-500', 'border-emerald-500', 'font-semibold');
        btn.classList.add('text-slate-400', 'border-transparent');
      }
    });

    // Mostra a seção correspondente
    document.querySelectorAll('.tab-content').forEach(section => {
      section.classList.add('hidden');
    });
    const activeSection = document.getElementById(`tab-${tabName}`);
    if (activeSection) {
      activeSection.classList.remove('hidden');
    }

    // Fecha menu mobile se estiver aberto
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Renderiza a aba atual
    this.render();
  },

  prevMonth() {
    const [ano, mes] = this.currentMonth.split('-').map(Number);
    const d = new Date(ano, mes - 2, 1);
    const novoMes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    this.currentMonth = novoMes;
    this.filterAllMonths = false;
    const mp = document.getElementById('month-selector');
    if (mp) mp.value = novoMes;
    const pSelect = document.getElementById('trans-filter-periodo');
    if (pSelect) pSelect.value = 'mes';
    this.render();
  },

  nextMonth() {
    const [ano, mes] = this.currentMonth.split('-').map(Number);
    const d = new Date(ano, mes, 1);
    const novoMes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    this.currentMonth = novoMes;
    this.filterAllMonths = false;
    const mp = document.getElementById('month-selector');
    if (mp) mp.value = novoMes;
    const pSelect = document.getElementById('trans-filter-periodo');
    if (pSelect) pSelect.value = 'mes';
    this.render();
  },

  handlePeriodFilter(val) {
    this.filterAllMonths = (val === 'todos');
    this.renderExpenses();
  },

  // ==========================================
  // FORMATADORES
  // ==========================================
  formatMoney(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  },

  formatPercent(val) {
    return (val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + '%';
  },

  formatMonthName(anoMes) {
    if (!anoMes || !anoMes.includes('-')) return anoMes || '';
    const [ano, mes] = anoMes.split('-');
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const idx = parseInt(mes, 10) - 1;
    return `${meses[idx] || mes} de ${ano}`;
  },

  setDashboardPeriod(period) {
    this.dashboardPeriod = period;
    const btnMes = document.getElementById('btn-dash-periodo-mes');
    const btnTotal = document.getElementById('btn-dash-periodo-total');
    if (period === 'total') {
      if (btnMes) {
        btnMes.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold bg-transparent text-slate-400 hover:text-white transition flex items-center space-x-1.5';
      }
      if (btnTotal) {
        btnTotal.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white transition flex items-center space-x-1.5 shadow-sm';
      }
    } else {
      if (btnMes) {
        btnMes.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white transition flex items-center space-x-1.5 shadow-sm';
      }
      if (btnTotal) {
        btnTotal.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold bg-transparent text-slate-400 hover:text-white transition flex items-center space-x-1.5';
      }
    }
    this.render();
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const norm = window.SheetsService ? window.SheetsService.normalizeDate(dateStr) : dateStr;
    const parts = norm.slice(0, 10).split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  },

  // ==========================================
  // RENDERIZAÇÃO PRINCIPAL
  // ==========================================
  render() {
    this.renderDashboard();
    this.renderExpenses();
    this.renderDebts();
    this.renderEmergency();
    this.renderInvestments();
    this.renderInvestmentGoals();
    this.renderSettings();
    if (window.lucide) window.lucide.createIcons();
  },

  

  // ------------------------------------------
  // DASHBOARD
  // ------------------------------------------
  renderDashboard() {
    const transactions = window.StorageService.getTransactions();
    const emergencyFunds = window.StorageService.getEmergencyFunds();
    const investments = window.StorageService.getInvestments();
    const dividends = window.StorageService.getDividends();
    const config = window.StorageService.getConfig();

    const isTotal = (this.dashboardPeriod === 'total');
    const startOfCurrentMonth = this.currentMonth + '-01';

    // 1. Separação contábil do passado (tudo antes do 1º dia do mês corrente)
    const pastTrans = transactions.filter(t => {
      const norm = this.normalizeDate(t.data);
      return (norm || '') < startOfCurrentMonth;
    });

    // 1.1 Sobra líquida de caixa dos meses anteriores (apenas efetivamente recebido e pago)
    const pastPaidReceitas = pastTrans
      .filter(t => t.tipo === 'receita' && t.status !== 'pendente')
      .reduce((acc, t) => acc + Number(t.valor), 0);

    const pastPaidDespesas = pastTrans
      .filter(t => t.tipo === 'despesa' && t.status !== 'pendente')
      .reduce((acc, t) => acc + Number(t.valor), 0);

    const sobraCaixaPassada = pastPaidReceitas - pastPaidDespesas;

    // 1.2 Pendências herdadas de meses anteriores (receitas a receber atrasadas e contas a pagar vencidas)
    const pastPendingReceitasList = pastTrans.filter(t => t.tipo === 'receita' && t.status === 'pendente');
    const pastPendingDespesasList = pastTrans.filter(t => t.tipo === 'despesa' && t.status === 'pendente');

    const pastPendingReceitas = pastPendingReceitasList.reduce((acc, t) => acc + Number(t.valor), 0);
    const pastPendingDespesas = pastPendingDespesasList.reduce((acc, t) => acc + Number(t.valor), 0);

    // 1.3 Posição Residual Anterior Total (Sobra de caixa + a receber anterior - a pagar anterior)
    const saldoResidualAnteriorTotal = isTotal ? 0 : (sobraCaixaPassada + pastPendingReceitas - pastPendingDespesas);

    // 2. Dados do Mês Selecionado
    const monthTrans = transactions.filter(t => {
      const norm = this.normalizeDate(t.data);
      return (norm || '').startsWith(this.currentMonth);
    });

    const receitasPagasMes = monthTrans.filter(t => t.tipo === 'receita' && t.status !== 'pendente').reduce((acc, t) => acc + Number(t.valor), 0);
    const receitasPendentesMes = monthTrans.filter(t => t.tipo === 'receita' && t.status === 'pendente').reduce((acc, t) => acc + Number(t.valor), 0);
    const totalReceitasMes = receitasPagasMes + receitasPendentesMes;

    const despesasPagasMes = monthTrans.filter(t => t.tipo === 'despesa' && t.status !== 'pendente').reduce((acc, t) => acc + Number(t.valor), 0);
    const despesasPendentesMes = monthTrans.filter(t => t.tipo === 'despesa' && t.status === 'pendente').reduce((acc, t) => acc + Number(t.valor), 0);
    const totalDespesasMes = despesasPagasMes + despesasPendentesMes;

    // 3. Dados Totais Acumulados Gerais (Todo o Histórico)
    const totalReceitasGeral = transactions.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + Number(t.valor), 0);
    const receitasPagasGeral = transactions.filter(t => t.tipo === 'receita' && t.status !== 'pendente').reduce((acc, t) => acc + Number(t.valor), 0);
    const receitasPendentesGeral = transactions.filter(t => t.tipo === 'receita' && t.status === 'pendente').reduce((acc, t) => acc + Number(t.valor), 0);

    const totalDespesasGeral = transactions.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + Number(t.valor), 0);
    const despesasPagasGeral = transactions.filter(t => t.tipo === 'despesa' && t.status !== 'pendente').reduce((acc, t) => acc + Number(t.valor), 0);
    const despesasPendentesGeral = transactions.filter(t => t.tipo === 'despesa' && t.status === 'pendente').reduce((acc, t) => acc + Number(t.valor), 0);

    const saldoGeral = totalReceitasGeral - totalDespesasGeral;
    const saldoRealizadoGeral = receitasPagasGeral - despesasPagasGeral;

    const totalProventosMes = dividends
      .filter(d => (this.normalizeDate(d.data) || '').startsWith(this.currentMonth))
      .reduce((acc, d) => acc + Number(d.valor), 0);

    const totalProventosGeral = dividends.reduce((acc, d) => acc + Number(d.valor), 0);

    // 4. Integração Contábil (Carryover): Saldo Disponível Hoje & Saldo Projetado Final
    // Saldo Disponível Hoje em Conta = Dinheiro em caixa passado + recebido no mês - pago no mês
    const saldoContaHoje = isTotal ? saldoRealizadoGeral : (sobraCaixaPassada + receitasPagasMes - despesasPagasMes);

    // Saldo Projetado no Fim do Mês = Saldo residual anterior + receitas previstas - despesas previstas
    const saldoProjetadoFinal = isTotal ? saldoGeral : (saldoResidualAnteriorTotal + totalReceitasMes - totalDespesasMes);

    // 5. Reserva Total e Investimentos Total
    const totalReserva = emergencyFunds.reduce((acc, r) => {
      const val = Number(r.valor) || 0;
      return ((r.tipo || '').toLowerCase() === 'resgate') ? acc - val : acc + val;
    }, 0);

    const totalInvestido = investments.reduce((acc, inv) => {
      const preco = Number(inv.precoAtual || inv.precoMedio) || 0;
      const qtd = Number(inv.quantidade) || 0;
      return acc + (preco * qtd);
    }, 0);

    // Patrimônio Consolidado = Reserva + Investimentos + Saldo Realizado em Conta
    const patrimonioTotal = totalReserva + totalInvestido + (saldoContaHoje > 0 ? saldoContaHoje : 0);

    // 6. Seleção dos valores conforme o modo ativo
    // Em modo MENSAL, os cards exibem estritamente as movimentações próprias do mês selecionado.
    // A sobra/déficit acumulado dos meses anteriores é consolidado no card "1. Saldo Anterior" (sem dobrar lançamentos).
    const receitasExibidas = isTotal ? totalReceitasGeral : totalReceitasMes;
    const receitasRealizadasExibidas = isTotal ? receitasPagasGeral : receitasPagasMes;
    const receitasPendentesExibidas = isTotal ? receitasPendentesGeral : receitasPendentesMes;

    const despesasExibidas = isTotal ? totalDespesasGeral : totalDespesasMes;
    const despesasPagasExibidas = isTotal ? despesasPagasGeral : despesasPagasMes;
    const despesasPendentesExibidas = isTotal ? despesasPendentesGeral : despesasPendentesMes;

    const proventosExibidos = isTotal ? totalProventosGeral : totalProventosMes;
    const saldoOperacionalMes = isTotal ? saldoGeral : (totalReceitasMes - totalDespesasMes);

    // Indicadores do Header do Dashboard
    const elBadge = document.getElementById('dash-periodo-badge');
    const elDesc = document.getElementById('dash-periodo-desc');
    const elNome = document.getElementById('dash-periodo-nome');
    const nomeMes = this.formatMonthName(this.currentMonth);

    if (elBadge) {
      elBadge.textContent = isTotal ? '🌐 Total Geral Acumulado' : `📅 Mês Selecionado (${nomeMes})`;
      elBadge.className = isTotal 
        ? 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20'
        : 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    }
    if (elNome) elNome.textContent = isTotal ? 'Todo o Histórico Cadastrado' : nomeMes;
    if (elDesc) elDesc.innerHTML = isTotal 
      ? 'Exibindo dados consolidados de <span class="text-slate-200 font-semibold">Todo o Histórico</span>'
      : `Exibindo dados de <span class="text-slate-200 font-semibold">${nomeMes}</span>`;

    // 7. Atualiza Banner do Fluxo de Caixa Integrado (Régua Contábil)
    const elFlowAnt = document.getElementById('dash-flow-anterior');
    const elFlowAntSub = document.getElementById('dash-flow-anterior-sub');
    const elFlowRec = document.getElementById('dash-flow-receitas');
    const elFlowDesp = document.getElementById('dash-flow-despesas');
    const elFlowSaldo = document.getElementById('dash-flow-saldo-final');
    const elFlowRecPct = document.getElementById('dash-flow-rec-pct');
    const elFlowDespPct = document.getElementById('dash-flow-desp-pct');

    const pctRec = receitasExibidas > 0 ? Math.min(100, Math.round((receitasRealizadasExibidas / receitasExibidas) * 100)) : 0;
    const pctDesp = despesasExibidas > 0 ? Math.min(100, Math.round((despesasPagasExibidas / despesasExibidas) * 100)) : 0;

    if (elFlowAnt) {
      elFlowAnt.textContent = isTotal ? 'R$ 0,00' : this.formatMoney(saldoResidualAnteriorTotal);
      elFlowAnt.className = `text-base sm:text-lg font-black ${saldoResidualAnteriorTotal >= 0 ? 'text-blue-400' : 'text-rose-400'}`;
    }
    if (elFlowAntSub) {
      if (isTotal) {
        elFlowAntSub.textContent = 'Todo o Histórico';
      } else if (pastPendingReceitas > 0 || pastPendingDespesas > 0) {
        let txt = `Caixa: ${this.formatMoney(sobraCaixaPassada)}`;
        if (pastPendingReceitas > 0) txt += ` • +${this.formatMoney(pastPendingReceitas)} a rec.`;
        if (pastPendingDespesas > 0) txt += ` • -${this.formatMoney(pastPendingDespesas)} a pag.`;
        elFlowAntSub.textContent = txt;
      } else {
        elFlowAntSub.textContent = 'Sobra meses passados';
      }
    }
    if (elFlowRec) elFlowRec.textContent = this.formatMoney(receitasExibidas);
    if (elFlowDesp) elFlowDesp.textContent = this.formatMoney(despesasExibidas);
    if (elFlowSaldo) {
      elFlowSaldo.textContent = this.formatMoney(saldoProjetadoFinal);
      elFlowSaldo.className = `text-xl sm:text-2xl font-black ${saldoProjetadoFinal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
    }
    if (elFlowRecPct) elFlowRecPct.textContent = `${pctRec}% recebido`;
    if (elFlowDespPct) elFlowDespPct.textContent = `${pctDesp}% pago`;

    // 8. Assistente Financeiro Proativo (Cockpit de Decisão Diária)
    // 8.1 Safe-to-Spend: Limite Diário Seguro
    const [anoCur, mesCur] = (this.currentMonth || new Date().toISOString().slice(0, 7)).split('-').map(Number);
    const totalDiasMes = new Date(anoCur, mesCur, 0).getDate();
    const todayDate = new Date();
    let diaRef = 1;
    if (todayDate.getFullYear() === anoCur && (todayDate.getMonth() + 1) === mesCur) {
      diaRef = todayDate.getDate();
    } else if (todayDate > new Date(anoCur, mesCur - 1, totalDiasMes)) {
      diaRef = totalDiasMes;
    } else {
      diaRef = 1;
    }
    const diasRestantes = Math.max(1, totalDiasMes - diaRef + 1);
    const safeSaldoDisponivel = isTotal ? saldoContaHoje : saldoProjetadoFinal;
    const safeDaily = safeSaldoDisponivel > 0 ? (safeSaldoDisponivel / diasRestantes) : 0;

    const elAssistDias = document.getElementById('dash-assist-dias-restantes');
    const elAssistSafe = document.getElementById('dash-assist-safe-daily');
    const elAssistSafeDesc = document.getElementById('dash-assist-safe-desc');

    if (elAssistDias) elAssistDias.textContent = isTotal ? 'Todo o Período' : `${diasRestantes} dias restantes`;
    if (elAssistSafe) {
      elAssistSafe.textContent = this.formatMoney(safeDaily);
      elAssistSafe.className = `text-2xl sm:text-3xl font-black ${safeDaily > 0 ? 'text-emerald-400' : 'text-rose-400'}`;
    }
    if (elAssistSafeDesc) {
      elAssistSafeDesc.textContent = isTotal
        ? 'Média histórica diária disponível no geral.'
        : (safeSaldoDisponivel > 0 
            ? `Você pode gastar até ${this.formatMoney(safeDaily)}/dia até o fim do mês mantendo suas contas em dia.`
            : `Atenção: previsão de fechamento negativa (${this.formatMoney(safeSaldoDisponivel)}). Segure novos gastos.`);
    }

    // 8.2 Radar de Contas da Semana (Próximos 7 Dias & Atrasadas)
    const hojeISO = this.normalizeDate(todayDate.toISOString().slice(0, 10));
    const daquiA7Dias = new Date(todayDate);
    daquiA7Dias.setDate(todayDate.getDate() + 7);
    const daquiA7DiasISO = this.normalizeDate(daquiA7Dias.toISOString().slice(0, 10));

    const contasSemana = transactions.filter(t => {
      if (t.tipo !== 'despesa' || t.status !== 'pendente') return false;
      const d = this.normalizeDate(t.data);
      return Boolean(d && d <= daquiA7DiasISO);
    });
    const totalRadar = contasSemana.reduce((a, t) => a + Number(t.valor), 0);

    const elRadarBadge = document.getElementById('dash-assist-radar-badge');
    const elRadarTotal = document.getElementById('dash-assist-radar-total');
    const elRadarDesc = document.getElementById('dash-assist-radar-desc');

    if (elRadarBadge) {
      elRadarBadge.textContent = `${contasSemana.length} ${contasSemana.length === 1 ? 'pendência' : 'pendências'}`;
      elRadarBadge.className = contasSemana.length > 0
        ? 'text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20'
        : 'text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    }
    if (elRadarTotal) elRadarTotal.textContent = this.formatMoney(totalRadar);
    if (elRadarDesc) {
      elRadarDesc.textContent = contasSemana.length > 0
        ? `${contasSemana.length} conta(s) a pagar somando ${this.formatMoney(totalRadar)} até ${this.formatDate(daquiA7DiasISO)}.`
        : 'Excelente! Nenhuma conta pendente para os próximos 7 dias.';
    }

    // 8.3 Termômetro de Saúde Financeira (Score 0 a 100)
    const taxaPoupanca = receitasExibidas > 0 ? Math.max(0, Math.round(((receitasExibidas - despesasExibidas) / receitasExibidas) * 100)) : 0;
    const debts = window.StorageService.getDebts();
    const totalDebts = debts.reduce((a, d) => a + Number(d.valorTotal || 0), 0);
    const pagoDebts = debts.reduce((a, d) => a + Number(d.valorPago || 0), 0);
    const restanteDebts = Math.max(0, totalDebts - pagoDebts);
    const pctDebts = totalDebts > 0 ? Math.min(100, Math.round((pagoDebts / totalDebts) * 100)) : 100;

    let scorePoupanca = (taxaPoupanca >= 25) ? 25 : (taxaPoupanca >= 15 ? 20 : (taxaPoupanca > 0 ? 12 : 0));
    const metaReserva = Number(config.metaReserva) || 0;
    const pctReserva = metaReserva > 0 ? Math.min(100, Math.round((totalReserva / metaReserva) * 100)) : 0;
    let scoreReserva = metaReserva > 0 ? Math.min(25, Math.round((pctReserva / 100) * 25)) : (totalReserva > 0 ? 20 : 10);
    let scoreDividas = debts.length === 0 ? 25 : Math.min(25, Math.round((pctDebts / 100) * 25));
    let scoreInvest = totalInvestido > 0 ? Math.min(25, Math.max(10, Math.round((totalInvestido / 50000) * 25))) : 5;

    const scoreSaude = Math.min(100, Math.max(15, scorePoupanca + scoreReserva + scoreDividas + scoreInvest));

    const elScoreBadge = document.getElementById('dash-assist-score-badge');
    const elScoreVal = document.getElementById('dash-assist-score-value');
    const elScoreTip = document.getElementById('dash-assist-score-tip');

    if (elScoreVal) elScoreVal.textContent = scoreSaude;
    if (elScoreBadge) {
      if (scoreSaude >= 80) {
        elScoreBadge.textContent = 'Excelente';
        elScoreBadge.className = 'text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      } else if (scoreSaude >= 65) {
        elScoreBadge.textContent = 'Saudável';
        elScoreBadge.className = 'text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20';
      } else if (scoreSaude >= 45) {
        elScoreBadge.textContent = 'Equilibrado';
        elScoreBadge.className = 'text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20';
      } else {
        elScoreBadge.textContent = 'Alerta';
        elScoreBadge.className = 'text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20';
      }
    }
    if (elScoreTip) {
      if (scoreSaude >= 80) elScoreTip.textContent = 'Gestão exemplar! Sobra consistente e finanças organizadas.';
      else if (debts.length > 0 && pctDebts < 50) elScoreTip.textContent = 'Foque na amortização de dívidas para diminuir o pagamento de juros.';
      else if (metaReserva > 0 && pctReserva < 50) elScoreTip.textContent = 'Priorize reforçar sua Reserva de Emergência para imprevistos.';
      else elScoreTip.textContent = 'Controle os gastos diários para manter o saldo livre sempre positivo.';
    }

    // 8.4 Atualiza Card 1 (Saldo Operacional e Saldo em Conta)
    const elLblSaldo = document.getElementById('dash-label-saldo');
    const elSaldo = document.getElementById('dash-saldo-mes');
    const elSaldoReal = document.getElementById('dash-saldo-realizado');
    const elDespPend = document.getElementById('dash-despesas-pendentes');
    const elSaldoComp = document.getElementById('dash-saldo-comparativo');

    const saldoExibido = isTotal ? saldoGeral : saldoOperacionalMes;

    if (elLblSaldo) elLblSaldo.textContent = isTotal ? 'Saldo Geral Acumulado' : 'Disponível Hoje para Uso:';
    if (elSaldo) {
      elSaldo.textContent = this.formatMoney(saldoExibido);
      elSaldo.className = `text-base sm:text-lg font-black ${saldoExibido >= 0 ? 'text-purple-400' : 'text-rose-400'}`;
    }
    if (elSaldoReal) {
      elSaldoReal.textContent = this.formatMoney(saldoContaHoje);
      elSaldoReal.className = `text-3xl sm:text-5xl font-black tracking-tight ${saldoContaHoje >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
    }
    if (elDespPend) elDespPend.textContent = this.formatMoney(despesasPendentesExibidas);
    if (elSaldoComp) {
      elSaldoComp.textContent = this.formatMoney(saldoContaHoje);
      elSaldoComp.className = `text-base font-bold ${saldoContaHoje >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
    }

    // 9. Atualiza Card 2 (Reserva)
    const elReserva = document.getElementById('dash-total-reserva');
    if (elReserva) elReserva.textContent = this.formatMoney(totalReserva);

    const elPctReserva = document.getElementById('dash-pct-reserva');
    const elBarReserva = document.getElementById('dash-bar-reserva');
    if (metaReserva > 0) {
      if (elPctReserva) elPctReserva.textContent = `${pctReserva}% da meta`;
      if (elBarReserva) elBarReserva.style.width = `${pctReserva}%`;
    } else {
      if (elPctReserva) elPctReserva.textContent = 'Sem meta (Opcional)';
      if (elBarReserva) elBarReserva.style.width = '0%';
    }

    // 10. Atualiza Card 3 (Investimentos & Proventos)
    const elInvest = document.getElementById('dash-total-investido');
    const elLblProv = document.getElementById('dash-lbl-proventos');
    const elProventos = document.getElementById('dash-proventos-mes');
    const elProvComp = document.getElementById('dash-proventos-comparativo');

    if (elInvest) elInvest.textContent = this.formatMoney(totalInvestido);
    if (elLblProv) elLblProv.textContent = isTotal ? 'Proventos Totais:' : 'Proventos Mês:';
    if (elProventos) elProventos.textContent = this.formatMoney(proventosExibidos);
    if (elProvComp) {
      elProvComp.textContent = isTotal
        ? `No Mês Atual: ${this.formatMoney(totalProventosMes)}`
        : `Total Acumulado: ${this.formatMoney(totalProventosGeral)}`;
    }

    // 11. Patrimônio Líquido Real (Net Worth = Ativos - Dívidas)
    const totalAtivos = totalReserva + totalInvestido + (saldoContaHoje > 0 ? saldoContaHoje : 0);
    const patrimonioLiquidoReal = totalAtivos - restanteDebts;

    const elPatrimonio = document.getElementById('dash-patrimonio-total');
    if (elPatrimonio) elPatrimonio.textContent = this.formatMoney(patrimonioLiquidoReal);

    const elBadgeAtivos = document.getElementById('dash-total-ativos-badge');
    const elBadgePassivos = document.getElementById('dash-total-passivos-badge');
    if (elBadgeAtivos) elBadgeAtivos.textContent = this.formatMoney(totalAtivos);
    if (elBadgePassivos) elBadgePassivos.textContent = this.formatMoney(restanteDebts);

    // 12. Atualiza Caixas / Barras de Execução Financeira
    const elLblBoxRec = document.getElementById('dash-lbl-box-receitas');
    const elTotBoxRec = document.getElementById('dash-box-total-receitas');
    const elRecRealBox = document.getElementById('dash-box-rec-realizada');
    const elRecPendBox = document.getElementById('dash-box-rec-pendente');
    const elRecProgBar = document.getElementById('dash-rec-progress-bar');
    const elRecProgPct = document.getElementById('dash-rec-progress-pct');

    if (elLblBoxRec) elLblBoxRec.textContent = isTotal ? 'Receitas Totais Acumuladas' : 'Receitas do Mês';
    if (elTotBoxRec) elTotBoxRec.textContent = this.formatMoney(receitasExibidas);
    if (elRecRealBox) elRecRealBox.textContent = this.formatMoney(receitasRealizadasExibidas);
    if (elRecPendBox) elRecPendBox.textContent = this.formatMoney(receitasPendentesExibidas);
    if (elRecProgBar) elRecProgBar.style.width = `${pctRec}%`;
    if (elRecProgPct) elRecProgPct.textContent = `${pctRec}% recebido`;

    const elLblBoxDesp = document.getElementById('dash-lbl-box-despesas');
    const elTotBoxDesp = document.getElementById('dash-box-total-despesas');
    const elDespPagaBox = document.getElementById('dash-box-desp-paga');
    const elDespPendBox = document.getElementById('dash-box-desp-pendente');
    const elDespProgBar = document.getElementById('dash-desp-progress-bar');
    const elDespProgPct = document.getElementById('dash-desp-progress-pct');

    if (elLblBoxDesp) elLblBoxDesp.textContent = isTotal ? 'Despesas Totais Acumuladas' : 'Despesas do Mês';
    if (elTotBoxDesp) elTotBoxDesp.textContent = this.formatMoney(despesasExibidas);
    if (elDespPagaBox) elDespPagaBox.textContent = this.formatMoney(despesasPagasExibidas);
    if (elDespPendBox) elDespPendBox.textContent = this.formatMoney(despesasPendentesExibidas);
    if (elDespProgBar) elDespProgBar.style.width = `${pctDesp}%`;
    if (elDespProgPct) elDespProgPct.textContent = `${pctDesp}% pago`;

    const sobraLiquida = receitasExibidas - despesasExibidas;
    const elTaxaPoup = document.getElementById('dash-box-taxa-poupanca');
    const elSobraLiq = document.getElementById('dash-box-sobra-liquida');

    if (elTaxaPoup) elTaxaPoup.textContent = `${taxaPoupanca}%`;
    if (elSobraLiq) {
      elSobraLiq.textContent = this.formatMoney(sobraLiquida);
      elSobraLiq.className = `font-semibold ${sobraLiquida >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
    }

    // Subtítulo do Donut de Despesas
    const elDonutSub = document.getElementById('dash-chart-donut-subtitle');
    if (elDonutSub) {
      elDonutSub.textContent = isTotal ? 'Distribuição de todo o histórico' : `Distribuição de ${nomeMes}`;
    }

    // Metas de Investimento (Dashboard)
    const metaInv = Number(config.metaInvestimento) || 0;
    const elDashGoalPatInfo = document.getElementById('dash-goal-patrimonio-info');
    const elDashGoalPatBar = document.getElementById('dash-goal-patrimonio-bar');
    if (metaInv > 0) {
      const pctInv = Math.min(100, Math.round((totalInvestido / metaInv) * 100));
      if (elDashGoalPatInfo) elDashGoalPatInfo.textContent = `${this.formatMoney(totalInvestido)} / ${this.formatMoney(metaInv)} (${pctInv}%)`;
      if (elDashGoalPatBar) elDashGoalPatBar.style.width = `${pctInv}%`;
    } else {
      if (elDashGoalPatInfo) elDashGoalPatInfo.textContent = 'Sem meta definida (Opcional)';
      if (elDashGoalPatBar) elDashGoalPatBar.style.width = '0%';
    }

    const aportesReservaMes = emergencyFunds
      .filter(r => r.tipo === 'Aporte' && (window.SheetsService.normalizeDate(r.data) || '').startsWith(this.currentMonth))
      .reduce((a, r) => a + Number(r.valor), 0);
    const metaAporte = Number(config.metaAporteMensal) || 0;
    const elDashGoalAporteInfo = document.getElementById('dash-goal-aporte-info');
    const elDashGoalAporteBar = document.getElementById('dash-goal-aporte-bar');
    if (metaAporte > 0) {
      const pctAporte = Math.min(100, Math.round((aportesReservaMes / metaAporte) * 100));
      if (elDashGoalAporteInfo) elDashGoalAporteInfo.textContent = `${this.formatMoney(aportesReservaMes)} / ${this.formatMoney(metaAporte)} (${pctAporte}%)`;
      if (elDashGoalAporteBar) elDashGoalAporteBar.style.width = `${pctAporte}%`;
    } else {
      if (elDashGoalAporteInfo) elDashGoalAporteInfo.textContent = 'Sem meta (Opcional)';
      if (elDashGoalAporteBar) elDashGoalAporteBar.style.width = '0%';
    }

    // Metas de Quitação (Dashboard)
    const elDashDebtPct = document.getElementById('dash-debt-pct-info');
    const elDashDebtBar = document.getElementById('dash-debt-bar');
    const elDashDebtRestante = document.getElementById('dash-debt-restante-info');
    if (debts.length === 0) {
      if (elDashDebtPct) elDashDebtPct.innerHTML = '<span class="text-emerald-400 font-semibold">Zero Dívidas 🎉</span>';
      if (elDashDebtBar) elDashDebtBar.style.width = '100%';
    } else {
      if (elDashDebtPct) elDashDebtPct.textContent = `${pctDebts}% Quitado`;
      if (elDashDebtBar) elDashDebtBar.style.width = `${pctDebts}%`;
    }
    if (elDashDebtRestante) elDashDebtRestante.textContent = this.formatMoney(restanteDebts);

    // 13. Orçamento Inteligente por Tetos de Categoria
    const budgetContainer = document.getElementById('dash-budget-bars');
    if (budgetContainer) {
      const defaultBudgets = {
        'Alimentação': 1200,
        'Moradia': 2000,
        'Transporte': 500,
        'Lazer': 400,
        'Saúde': 300,
        'Outros': 300
      };
      const budgets = (config.orcamentos && Object.keys(config.orcamentos).length > 0) ? config.orcamentos : defaultBudgets;

      const activeTrans = isTotal ? transactions : monthTrans;
      const spendingMap = {};
      activeTrans.filter(t => t.tipo === 'despesa').forEach(t => {
        const cat = t.categoria || 'Outros';
        spendingMap[cat] = (spendingMap[cat] || 0) + Number(t.valor);
      });

      const budgetKeys = Object.keys(budgets);
      budgetContainer.innerHTML = budgetKeys.map(cat => {
        const limit = Number(budgets[cat]) || 0;
        let spent = spendingMap[cat] || 0;
        Object.keys(spendingMap).forEach(actualCat => {
          if (actualCat !== cat && (actualCat.toLowerCase().includes(cat.toLowerCase()) || cat.toLowerCase().includes(actualCat.toLowerCase()))) {
            spent += spendingMap[actualCat];
          }
        });

        const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
        const barWidth = Math.min(100, pct);
        const isOver = pct > 100;
        const isWarning = pct >= 80 && pct <= 100;

        let barColor = 'bg-emerald-500';
        let badgeClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
        let badgeText = `${pct}%`;

        if (isOver) {
          barColor = 'bg-rose-500';
          badgeClass = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
          badgeText = `⚠️ ${pct}% Estourou`;
        } else if (isWarning) {
          barColor = 'bg-amber-500';
          badgeClass = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
          badgeText = `Atenção ${pct}%`;
        }

        return `
          <div class="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-slate-200">${this.escapeHtml(cat)}</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}">
                ${badgeText}
              </span>
            </div>
            <div class="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div class="h-full ${barColor} rounded-full transition-all duration-500" style="width: ${barWidth}%;"></div>
            </div>
            <div class="flex items-center justify-between text-[11px] text-slate-400">
              <span>Gasto: <strong class="${isOver ? 'text-rose-400' : 'text-slate-200'}">${this.formatMoney(spent)}</strong></span>
              <span>Teto: <strong>${this.formatMoney(limit)}</strong></span>
            </div>
          </div>
        `;
      }).join('');
    }

    // Movimentações no Dashboard:
    // Prioriza pendências herdadas de meses passados (urgentes para receber/pagar), depois as mais recentes
    const pendingPastItems = isTotal ? [] : [...pastPendingReceitasList, ...pastPendingDespesasList].map(t => ({
      ...t,
      isAnteriorPendente: true
    }));

    const sortedRecent = [...transactions]
      .filter(t => !pendingPastItems.some(p => p.id === t.id))
      .sort((a, b) => {
        const da = this.normalizeDate(a.data);
        const db = this.normalizeDate(b.data);
        return (db || '').localeCompare(da || '');
      });

    const itemsToShow = [...pendingPastItems, ...sortedRecent].slice(0, 6);
    this.renderRecentTransactions(itemsToShow);

    // Gráficos do Dashboard
    const dashTrans = isTotal ? transactions : monthTrans;
    this.renderDashboardCharts(dashTrans, investments);
  },

  renderRecentTransactions(items) {
    const container = document.getElementById('dash-recent-transactions');
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = `<div class="p-6 text-center text-slate-500 text-xs font-medium">Nenhuma movimentação registrada. Clique em "+ Nova Receita" ou "− Nova Despesa" para começar!</div>`;
      return;
    }

    container.innerHTML = items.map(t => {
      const isReceita = t.tipo === 'receita';
      const isPendente = (t.status === 'pendente');
      const isAnterior = t.isAnteriorPendente || false;
      return `
        <div class="flex items-center justify-between p-3.5 rounded-2xl ${isAnterior ? 'bg-amber-950/20 border border-amber-500/30' : 'bg-slate-800/40 border border-slate-700/50'} hover:bg-slate-800/70 transition">
          <div class="flex items-center space-x-3 min-w-0">
            <div class="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isReceita ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}">
              <i data-lucide="${isReceita ? 'arrow-down-left' : 'arrow-up-right'}" class="w-5 h-5"></i>
            </div>
            <div class="min-w-0">
              <div class="flex items-center space-x-2">
                <p class="text-xs sm:text-sm font-bold text-slate-100 truncate">${this.escapeHtml(t.descricao || t.categoria)}</p>
                ${isAnterior ? `
                  <span class="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 whitespace-nowrap">
                    ⏳ Mês Anterior • ${isReceita ? 'A Receber' : 'A Pagar'}
                  </span>
                ` : ''}
              </div>
              <p class="text-[11px] text-slate-400">${this.formatDate(t.data)} • <span class="text-slate-300 font-medium">${t.categoria}</span></p>
            </div>
          </div>
          <div class="flex items-center space-x-2 shrink-0">
            <div class="text-right">
              <p class="text-xs sm:text-sm font-black ${isReceita ? 'text-emerald-400' : 'text-slate-200'}">
                ${isReceita ? '+' : '-'} ${this.formatMoney(t.valor)}
              </p>
              <span class="text-[10px] px-2 py-0.5 rounded-full ${t.metodo ? 'bg-slate-700/80 text-slate-300' : ''}">${t.metodo || 'Geral'}</span>
            </div>
            ${isPendente ? `
              <button onclick="App.markAsPaid('${t.id}')" title="${isReceita ? 'Marcar como Recebido' : 'Marcar como Pago'}" class="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition flex items-center space-x-1 shadow-sm">
                <i data-lucide="check" class="w-3.5 h-3.5"></i>
                <span class="hidden sm:inline">${isReceita ? 'Receber' : 'Pagar'}</span>
              </button>
            ` : `
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ✓ ${isReceita ? 'Recebido' : 'Pago'}
              </span>
            `}
            <button onclick="App.editTransaction('${t.id}')" title="Editar Lançamento" class="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition">
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="App.deleteTransaction('${t.id}')" title="Excluir" class="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  },

  

  // ------------------------------------------
  // DESPESAS & RECEITAS (FLUXO DE CAIXA)
  // ------------------------------------------
  renderExpenses() {
    const transactions = window.StorageService.getTransactions();
    const searchInput = document.getElementById('trans-search');
    const filterType = document.getElementById('trans-filter-type');
    const filterStatus = document.getElementById('trans-filter-status');
    const filterCat = document.getElementById('trans-filter-cat');
    const filterMetodo = document.getElementById('trans-filter-metodo');

    const search = searchInput ? searchInput.value.toLowerCase() : '';
    const typeVal = filterType ? filterType.value : 'todos';
    const statusVal = filterStatus ? filterStatus.value : 'todos';
    const catVal = filterCat ? filterCat.value : 'todos';
    const metodoVal = filterMetodo ? filterMetodo.value : 'todos';

    const startOfCurrentMonth = this.currentMonth + '-01';

    // 1. Saldo Residual Vindo dos Meses Anteriores (Carryover)
    const pastTrans = transactions.filter(t => {
      const norm = this.normalizeDate(t.data);
      return (norm || '') < startOfCurrentMonth;
    });

    const pastPaidRec = pastTrans.filter(t => t.tipo === 'receita' && t.status !== 'pendente').reduce((a, t) => a + Number(t.valor), 0);
    const pastPaidDesp = pastTrans.filter(t => t.tipo === 'despesa' && t.status !== 'pendente').reduce((a, t) => a + Number(t.valor), 0);
    const sobraCaixaPassada = pastPaidRec - pastPaidDesp;

    const pastPendRecList = pastTrans.filter(t => t.tipo === 'receita' && t.status === 'pendente');
    const pastPendDespList = pastTrans.filter(t => t.tipo === 'despesa' && t.status === 'pendente');

    const pastPendRec = pastPendRecList.reduce((a, t) => a + Number(t.valor), 0);
    const pastPendDesp = pastPendDespList.reduce((a, t) => a + Number(t.valor), 0);

    const saldoResidualAnteriorTotal = this.filterAllMonths ? 0 : (sobraCaixaPassada + pastPendRec - pastPendDesp);

    // 2. Filtra pelo mês selecionado (cada mês exibe estritamente seus lançamentos, sem duplicar com o passado)
    let filtered = transactions;
    if (!this.filterAllMonths) {
      filtered = filtered.filter(t => {
        const norm = this.normalizeDate(t.data);
        return (norm || '').startsWith(this.currentMonth);
      });
    }

    // Ordenação: data mais recente primeiro
    filtered.sort((a, b) => {
      const normA = this.normalizeDate(a.data);
      const normB = this.normalizeDate(b.data);
      return (normB || '').localeCompare(normA || '');
    });

    // Filtros adicionais
    if (typeVal !== 'todos') {
      filtered = filtered.filter(t => t.tipo === typeVal);
    }
    if (statusVal !== 'todos') {
      filtered = filtered.filter(t => (t.status || 'pago') === statusVal);
    }
    if (catVal !== 'todos') {
      filtered = filtered.filter(t => t.categoria === catVal);
    }
    if (metodoVal !== 'todos') {
      filtered = filtered.filter(t => (t.metodo || 'Geral') === metodoVal);
    }
    if (search) {
      filtered = filtered.filter(t => 
        (t.descricao || '').toLowerCase().includes(search) || 
        (t.categoria || '').toLowerCase().includes(search) ||
        (t.metodo || '').toLowerCase().includes(search)
      );
    }

    // Totais do mês: Acumulado (Total Previsto) vs Parciais (Realizados / Pendentes)
    const totalReceitas = filtered.filter(t => t.tipo === 'receita').reduce((a, t) => a + Number(t.valor), 0);
    const receitasPagas = filtered.filter(t => t.tipo === 'receita' && t.status !== 'pendente').reduce((a, t) => a + Number(t.valor), 0);
    const receitasPendentes = filtered.filter(t => t.tipo === 'receita' && t.status === 'pendente').reduce((a, t) => a + Number(t.valor), 0);

    const totalDespesas = filtered.filter(t => t.tipo === 'despesa').reduce((a, t) => a + Number(t.valor), 0);
    const despesasPagas = filtered.filter(t => t.tipo === 'despesa' && t.status !== 'pendente').reduce((a, t) => a + Number(t.valor), 0);
    const despesasPendentes = filtered.filter(t => t.tipo === 'despesa' && t.status === 'pendente').reduce((a, t) => a + Number(t.valor), 0);

    // Saldo Disponível Hoje em Conta (Liquidez Real)
    const saldoContaHoje = this.filterAllMonths 
      ? (receitasPagas - despesasPagas)
      : (sobraCaixaPassada + receitasPagas - despesasPagas);

    // Saldo Previsto no Fim do Mês (Saldo Projetado Contábil)
    const saldoPrevisto = this.filterAllMonths
      ? (totalReceitas - totalDespesas)
      : (sobraCaixaPassada + totalReceitas - totalDespesas);

    const saldoRealizado = receitasPagas - despesasPagas;
    const saldoLiquidar = receitasPendentes - despesasPendentes;

    // Atualização do Banner de Saldo Residual Anterior
    const elExpSaldoAnt = document.getElementById('exp-saldo-anterior');
    const elExpContaHoje = document.getElementById('exp-total-conta-hoje');
    const elExpBannerCarryover = document.getElementById('exp-banner-carryover');

    if (elExpSaldoAnt) {
      elExpSaldoAnt.textContent = this.formatMoney(saldoResidualAnteriorTotal);
      elExpSaldoAnt.className = `text-base font-black ${saldoResidualAnteriorTotal >= 0 ? 'text-blue-400' : 'text-rose-400'}`;
    }
    if (elExpContaHoje) {
      elExpContaHoje.textContent = this.formatMoney(saldoContaHoje);
      elExpContaHoje.className = `text-xs font-black ${saldoContaHoje >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
    }
    if (elExpBannerCarryover) {
      elExpBannerCarryover.style.display = this.filterAllMonths ? 'none' : 'flex';
    }

    // Atualização dos cards de resumo
    const elTotRec = document.getElementById('exp-total-receitas');
    const elRecPagas = document.getElementById('exp-receitas-pagas');
    const elRecPend = document.getElementById('exp-receitas-pendentes');

    const elTotDesp = document.getElementById('exp-total-despesas');
    const elDespPagas = document.getElementById('exp-despesas-pagas');
    const elDespPend = document.getElementById('exp-despesas-pendentes');

    const elSaldo = document.getElementById('exp-saldo-liquido');
    const elSaldoReal = document.getElementById('exp-saldo-realizado');
    const elSaldoLiq = document.getElementById('exp-saldo-liquidar');

    if (elTotRec) elTotRec.textContent = this.formatMoney(totalReceitas);
    if (elRecPagas) elRecPagas.textContent = this.formatMoney(receitasPagas);
    if (elRecPend) elRecPend.textContent = this.formatMoney(receitasPendentes);

    if (elTotDesp) elTotDesp.textContent = this.formatMoney(totalDespesas);
    if (elDespPagas) elDespPagas.textContent = this.formatMoney(despesasPagas);
    if (elDespPend) elDespPend.textContent = this.formatMoney(despesasPendentes);

    if (elSaldo) {
      elSaldo.textContent = this.formatMoney(saldoPrevisto);
      elSaldo.className = `text-2xl font-black ${saldoPrevisto >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
    }
    if (elSaldoReal) {
      elSaldoReal.textContent = this.formatMoney(saldoRealizado);
      elSaldoReal.className = `font-semibold ${saldoRealizado >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
    }
    if (elSaldoLiq) {
      elSaldoLiq.textContent = (saldoLiquidar >= 0 ? '+' : '') + this.formatMoney(saldoLiquidar);
      elSaldoLiq.className = `font-semibold ${saldoLiquidar >= 0 ? 'text-slate-300' : 'text-rose-400'}`;
    }

    // Tabela / Lista
    const container = document.getElementById('expenses-list-container');
    if (!container) return;

    if (filtered.length === 0) {
      const temEmOutrosMeses = transactions.length > 0;
      container.innerHTML = `
        <div class="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
          <i data-lucide="receipt" class="w-12 h-12 text-slate-600 mx-auto mb-2"></i>
          <p class="text-slate-300 font-bold mb-1">Nenhuma transação encontrada para os filtros selecionados.</p>
          <p class="text-slate-500 text-xs mb-4">Você pode navegar pelos meses no topo (◀ ▶) ou ver todas as transações.</p>
          <div class="flex flex-wrap items-center justify-center gap-2">
            ${temEmOutrosMeses ? `
              <button onclick="App.handlePeriodFilter('todos')" class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-xl text-xs transition border border-slate-700">
                🌐 Ver Todas as Transações (${transactions.length})
              </button>
            ` : ''}
            <button onclick="App.openTransactionModal('despesa')" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition">
              + Adicionar Nova Despesa
            </button>
          </div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const has2027Mismatch = !this.filterAllMonths && this.currentMonth.startsWith('2026-') && transactions.some(t => {
      const norm = this.normalizeDate(t.data);
      return (norm || '').startsWith('2027-' + this.currentMonth.slice(5));
    });

    container.innerHTML = `
      <div class="space-y-2">
        ${has2027Mismatch ? `
          <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mb-3 shadow-sm">
            <div class="flex items-center space-x-2.5 text-amber-300">
              <i data-lucide="alert-triangle" class="w-4 h-4 shrink-0"></i>
              <span>Você possui lançamentos salvos com o ano <strong>2027</strong> (ex: Energia / Internet). Deseja trazê-los para <strong>${this.formatMonthName(this.currentMonth)}</strong>?</span>
            </div>
            <button onclick="App.fixFutureYearTransactions()" class="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition shrink-0 flex items-center justify-center space-x-1.5 shadow-md">
              <i data-lucide="check" class="w-3.5 h-3.5"></i>
              <span>Corrigir para 2026 com 1 Clique</span>
            </button>
          </div>
        ` : ''}
        ${filtered.map(t => {
          const isReceita = t.tipo === 'receita';
          const isPendente = t.status === 'pendente';
          const normData = this.normalizeDate(t.data);
          const isAnteriorPendente = !this.filterAllMonths && (normData || '') < startOfCurrentMonth && isPendente;
          return `
            <div class="flex items-center justify-between p-3.5 ${isAnteriorPendente ? 'bg-amber-950/20 border border-amber-500/30' : 'bg-slate-900/60 border border-slate-800/80'} hover:bg-slate-800/80 rounded-2xl transition">
              <div class="flex items-center space-x-3.5">
                <div class="w-11 h-11 rounded-2xl flex items-center justify-center ${isReceita ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}">
                  <i data-lucide="${isReceita ? 'arrow-down-left' : 'arrow-up-right'}" class="w-5 h-5"></i>
                </div>
                <div>
                  <div class="flex items-center space-x-2">
                    <h4 class="text-sm font-semibold text-slate-100">${this.escapeHtml(t.descricao || t.categoria)}</h4>
                    ${isAnteriorPendente ? `
                      <span class="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 whitespace-nowrap">
                        ⏳ Mês Anterior • ${isReceita ? 'A Receber' : 'A Pagar'}
                      </span>
                    ` : ''}
                  </div>
                  <div class="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                    <span>${this.formatDate(t.data)}</span>
                    <span>•</span>
                    <span class="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">${t.categoria}</span>
                    <span>•</span>
                    <span class="text-slate-400">${t.metodo || 'Geral'}</span>
                    ${t.recorrencia === 'fixa' ? `<span class="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20">🔁 Fixa</span>` : ''}
                    ${t.parcela ? `<span class="px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-[10px] font-bold border border-purple-500/20">💳 ${t.parcela}</span>` : ''}
                  </div>
                </div>
              </div>
              <div class="flex items-center space-x-2.5 sm:space-x-4">
                <div class="text-right">
                  <p class="text-base font-bold ${isReceita ? 'text-emerald-400' : 'text-slate-100'}">
                    ${isReceita ? '+' : '-'} ${this.formatMoney(t.valor)}
                  </p>
                  
                  <div class="flex items-center justify-end space-x-1.5 mt-1">
                    ${isPendente ? `
                      <button onclick="App.markAsPaid('${t.id}')" title="${isReceita ? 'Receber agora' : 'Pagar agora'}" class="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition flex items-center space-x-1 shadow-sm">
                        <i data-lucide="check" class="w-3 h-3"></i>
                        <span>${isReceita ? 'Receber' : 'Pagar'}</span>
                      </button>
                      <button onclick="App.toggleTransactionStatus('${t.id}')" title="Alternar status" class="text-[10px] font-bold px-2 py-0.5 rounded-full transition bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20">
                        ⏳ Pendente
                      </button>
                    ` : `
                      <button onclick="App.toggleTransactionStatus('${t.id}')" title="Clique para reabrir como Pendente" class="text-[10px] font-bold px-2 py-0.5 rounded-full transition bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20">
                        ✓ ${isReceita ? 'Recebido' : 'Pago'}
                      </button>
                    `}
                  </div>
                </div>
                <button onclick="App.editTransaction('${t.id}')" title="Editar Lançamento" class="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition">
                  <i data-lucide="edit-3" class="w-4 h-4"></i>
                </button>
                <button onclick="App.deleteTransaction('${t.id}')" title="Excluir" class="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  

  // ------------------------------------------
  // RESERVA DE EMERGÊNCIA
  // ------------------------------------------
  renderEmergency() {
    const logs = window.StorageService.getEmergencyFunds();
    const config = window.StorageService.getConfig();

    const totalReserva = logs.reduce((acc, r) => {
      const v = Number(r.valor) || 0;
      return (r.tipo === 'Resgate') ? acc - v : acc + v;
    }, 0);

    const totalAportes = logs.filter(r => r.tipo === 'Aporte').reduce((a, r) => a + Number(r.valor), 0);
    const totalRendimentos = logs.filter(r => r.tipo === 'Rendimento').reduce((a, r) => a + Number(r.valor), 0);
    const totalResgates = logs.filter(r => r.tipo === 'Resgate').reduce((a, r) => a + Number(r.valor), 0);

    const meta = Number(config.metaReserva) || 24000;
    const custoFixo = Number(config.custoFixoMensal) || 4000;
    const mesesCobertos = custoFixo > 0 ? (totalReserva / custoFixo).toFixed(1) : 0;
    const pct = Math.min(100, Math.round((totalReserva / meta) * 100));

    // Elementos da UI
    const elTotal = document.getElementById('em-total-acumulado');
    const elMeta = document.getElementById('em-meta-valor');
    const elMeses = document.getElementById('em-meses-cobertos');
    const elBar = document.getElementById('em-progress-bar');
    const elPct = document.getElementById('em-progress-pct');
    const elFalta = document.getElementById('em-quanto-falta');

    if (elTotal) elTotal.textContent = this.formatMoney(totalReserva);
    if (elMeta) elMeta.textContent = this.formatMoney(meta);
    if (elMeses) elMeses.textContent = `${mesesCobertos} meses de segurança`;
    if (elBar) elBar.style.width = `${pct}%`;
    if (elPct) elPct.textContent = `${pct}%`;
    if (elFalta) {
      const falta = Math.max(0, meta - totalReserva);
      elFalta.textContent = falta > 0 ? `Faltam ${this.formatMoney(falta)} para sua meta!` : '🎉 Meta atingida com sucesso!';
    }

    // Totais secundários
    const elAportes = document.getElementById('em-total-aportes');
    const elRend = document.getElementById('em-total-rendimentos');
    const elResg = document.getElementById('em-total-resgates');
    if (elAportes) elAportes.textContent = this.formatMoney(totalAportes);
    if (elRend) elRend.textContent = this.formatMoney(totalRendimentos);
    if (elResg) elResg.textContent = this.formatMoney(totalResgates);

    // Lista de Histórico
    const container = document.getElementById('em-history-list');
    if (!container) return;

    if (logs.length === 0) {
      container.innerHTML = `<div class="p-6 text-center text-slate-500 text-sm">Nenhum aporte registrado na reserva ainda.</div>`;
      return;
    }

    container.innerHTML = logs.map(r => {
      const isResgate = r.tipo === 'Resgate';
      const isRendimento = r.tipo === 'Rendimento';
      const corTexto = isResgate ? 'text-rose-400' : isRendimento ? 'text-amber-400' : 'text-emerald-400';
      const icon = isResgate ? 'arrow-up-right' : isRendimento ? 'trending-up' : 'plus-circle';

      return `
        <div class="flex items-center justify-between p-3.5 bg-slate-900/60 hover:bg-slate-800/80 rounded-2xl border border-slate-800/80 transition">
          <div class="flex items-center space-x-3.5">
            <div class="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-800 ${corTexto}">
              <i data-lucide="${icon}" class="w-5 h-5"></i>
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-100">${r.tipo} • <span class="text-slate-300">${r.instituicao || 'Instituição'}</span></p>
              <p class="text-xs text-slate-400">${this.formatDate(r.data)} ${r.observacao ? '• ' + this.escapeHtml(r.observacao) : ''}</p>
            </div>
          </div>
          <div class="flex items-center space-x-3">
            <span class="text-sm font-bold ${corTexto}">
              ${isResgate ? '-' : '+'} ${this.formatMoney(r.valor)}
            </span>
            <button onclick="App.deleteEmergencyLog('${r.id}')" class="p-2 text-slate-500 hover:text-rose-400 rounded-xl transition">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  },

  

  // ------------------------------------------
  // INVESTIMENTOS
  // ------------------------------------------
  renderInvestments() {
    const investments = window.StorageService.getInvestments();
    const dividends = window.StorageService.getDividends();

    let totalAtual = 0;
    let totalInvestido = 0;

    investments.forEach(inv => {
      const qtd = Number(inv.quantidade) || 0;
      const pm = Number(inv.precoMedio) || 0;
      const pa = Number(inv.precoAtual || inv.precoMedio) || 0;

      totalInvestido += (qtd * pm);
      totalAtual += (qtd * pa);
    });

    const lucroTotal = totalAtual - totalInvestido;
    const pctLucro = totalInvestido > 0 ? ((lucroTotal / totalInvestido) * 100) : 0;

    // Totais
    const elTotAtual = document.getElementById('inv-total-atual');
    const elTotInv = document.getElementById('inv-total-investido');
    const elLucro = document.getElementById('inv-lucro-total');

    if (elTotAtual) elTotAtual.textContent = this.formatMoney(totalAtual);
    if (elTotInv) elTotInv.textContent = this.formatMoney(totalInvestido);
    if (elLucro) {
      elLucro.textContent = `${lucroTotal >= 0 ? '+' : ''}${this.formatMoney(lucroTotal)} (${this.formatPercent(pctLucro)})`;
      elLucro.className = `text-sm font-bold ${lucroTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
    }

    // Tabela / Cards de Ativos
    const container = document.getElementById('investments-list-container');
    if (!container) return;

    if (investments.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
          <i data-lucide="trending-up" class="w-12 h-12 text-slate-600 mx-auto mb-2"></i>
          <p class="text-slate-400 font-medium">Nenhum ativo cadastrado na sua carteira.</p>
          <button onclick="App.openInvestmentModal()" class="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition">
            + Cadastrar Primeiro Ativo
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        ${investments.map(inv => {
          const qtd = Number(inv.quantidade) || 0;
          const pm = Number(inv.precoMedio) || 0;
          const pa = Number(inv.precoAtual || inv.precoMedio) || 0;
          const valorAporte = qtd * pm;
          const valorAtualAtivo = qtd * pa;
          const lucroAtivo = valorAtualAtivo - valorAporte;
          const pctAtivo = valorAporte > 0 ? ((lucroAtivo / valorAporte) * 100) : 0;
          const classeCor = this.classColors[inv.classe] || '#64748b';

          return `
            <div class="p-4 bg-slate-900/60 hover:bg-slate-800/80 rounded-2xl border border-slate-800/80 transition flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center space-x-2">
                    <span class="w-3 h-3 rounded-full" style="background-color: ${classeCor};"></span>
                    <h3 class="font-extrabold text-slate-100 text-base">${inv.ticker}</h3>
                    <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">${inv.classe}</span>
                  </div>
                  <button onclick="App.deleteInvestment('${inv.id}')" class="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                  </button>
                </div>
                <p class="text-xs text-slate-400 truncate mb-3">${this.escapeHtml(inv.nome || inv.ticker)} • <span class="text-slate-300">${inv.instituicao || 'Geral'}</span></p>
                
                <div class="grid grid-cols-2 gap-2 text-xs bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/40 mb-3">
                  <div>
                    <span class="text-slate-400">Quantidade:</span>
                    <p class="font-bold text-slate-200">${qtd}</p>
                  </div>
                  <div>
                    <span class="text-slate-400">Preço Médio:</span>
                    <p class="font-bold text-slate-200">${this.formatMoney(pm)}</p>
                  </div>
                  <div>
                    <span class="text-slate-400">Preço Atual:</span>
                    <p class="font-bold text-slate-200">${this.formatMoney(pa)}</p>
                  </div>
                  <div>
                    <span class="text-slate-400">Total Investido:</span>
                    <p class="font-bold text-slate-200">${this.formatMoney(valorAporte)}</p>
                  </div>
                </div>
              </div>

              <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span class="text-[11px] text-slate-400 block">Posição Atual:</span>
                  <p class="text-base font-extrabold text-slate-100">${this.formatMoney(valorAtualAtivo)}</p>
                </div>
                <div class="text-right">
                  <span class="text-[11px] text-slate-400 block">Rentabilidade:</span>
                  <p class="text-xs font-bold ${lucroAtivo >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
                    ${lucroAtivo >= 0 ? '+' : ''}${this.formatMoney(lucroAtivo)} (${this.formatPercent(pctAtivo)})
                  </p>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Renderiza Proventos
    this.renderDividends(dividends);

    // Independência Financeira (Regra dos 4%)
    const config = window.StorageService.getConfig();
    const custoMensal = Number(config.custoFixoMensal) || 4000;
    const custoAnual = custoMensal * 12;
    const metaFire = custoAnual * 25; // Regra dos 4%
    const pctFire = metaFire > 0 ? Math.min(100, Math.round((totalAtual / metaFire) * 100)) : 0;
    const rendaPassivaMensal = (totalAtual * 0.04) / 12;
    const faltaFire = Math.max(0, metaFire - totalAtual);

    const elFireMeta = document.getElementById('fire-meta-total');
    const elFirePct = document.getElementById('fire-pct');
    const elFireBar = document.getElementById('fire-progress-bar');
    const elFireRenda = document.getElementById('fire-renda-atual');
    const elFireFalta = document.getElementById('fire-falta-acumular');

    if (elFireMeta) elFireMeta.textContent = this.formatMoney(metaFire);
    if (elFirePct) elFirePct.textContent = `${pctFire}%`;
    if (elFireBar) elFireBar.style.width = `${pctFire}%`;
    if (elFireRenda) elFireRenda.textContent = `${this.formatMoney(rendaPassivaMensal)}/mês`;
    if (elFireFalta) elFireFalta.textContent = faltaFire > 0 ? `Faltam ${this.formatMoney(faltaFire)}` : '🎉 Conquistado!';

    // Gráfico de Alocação de Investimentos
    this.renderInvestmentCharts(investments);

    if (window.lucide) window.lucide.createIcons();
  },

  

  renderDividends(dividends) {
    const container = document.getElementById('inv-dividends-list');
    if (!container) return;

    if (dividends.length === 0) {
      container.innerHTML = `<div class="p-4 text-center text-slate-500 text-sm">Nenhum dividendo registrado ainda.</div>`;
      return;
    }

    container.innerHTML = dividends.map(d => `
      <div class="flex items-center justify-between p-3 rounded-xl bg-slate-850 hover:bg-slate-800/70 border border-slate-800 transition">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
            $
          </div>
          <div>
            <p class="text-sm font-semibold text-slate-100">${d.ativo} • <span class="text-xs text-slate-400 font-normal">${d.tipo || 'Dividendo'}</span></p>
            <p class="text-[11px] text-slate-400">${this.formatDate(d.data)}</p>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-sm font-bold text-emerald-400">+ ${this.formatMoney(d.valor)}</span>
          <button onclick="App.deleteDividend('${d.id}')" class="p-1 text-slate-500 hover:text-rose-400 rounded-lg transition">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `).join('');
  },

  // ------------------------------------------
  // CONFIGURAÇÕES & GOOGLE SHEETS
  // ------------------------------------------
  renderSettings() {
    const config = window.StorageService.getConfig();
    const urlInput = document.getElementById('cfg-sheets-url');
    const metaInput = document.getElementById('cfg-meta-reserva');
    const custoInput = document.getElementById('cfg-custo-fixo');
    const metaInvInput = document.getElementById('cfg-meta-investimento');
    const metaAporteInput = document.getElementById('cfg-meta-aporte');
    const metaRendaInput = document.getElementById('cfg-meta-renda');

    if (urlInput) urlInput.value = config.sheetsUrl || '';
    if (metaInput) metaInput.value = config.metaReserva || 24000;
    if (custoInput) custoInput.value = config.custoFixoMensal || 4000;
    if (metaInvInput) metaInvInput.value = config.metaInvestimento || 100000;
    if (metaAporteInput) metaAporteInput.value = config.metaAporteMensal || 1500;
    if (metaRendaInput) metaRendaInput.value = config.metaRendaPassiva || 500;

    // Atualiza status da senha nas configurações
    const hasPass = window.StorageService.hasPassword();
    const badgePass = document.getElementById('cfg-auth-status-badge');
    const lblBtnPass = document.getElementById('cfg-btn-senha-label');
    const btnRemoverPass = document.getElementById('cfg-btn-remover-senha');

    if (badgePass) {
      badgePass.textContent = hasPass ? 'Protegido por Senha' : 'Sem Senha';
      badgePass.className = hasPass
        ? 'px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        : 'px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700';
    }
    if (lblBtnPass) {
      lblBtnPass.textContent = hasPass ? 'Alterar Senha' : 'Criar Senha de Acesso';
    }
    if (btnRemoverPass) {
      if (hasPass) {
        btnRemoverPass.classList.remove('hidden');
      } else {
        btnRemoverPass.classList.add('hidden');
      }
    }
  },

  saveSettingsFromForm() {
    const urlInput = document.getElementById('cfg-sheets-url');
    const metaInput = document.getElementById('cfg-meta-reserva');
    const custoInput = document.getElementById('cfg-custo-fixo');

    const config = {
      sheetsUrl: (urlInput ? urlInput.value : '').trim(),
      metaReserva: Number(metaInput ? metaInput.value : 24000),
      custoFixoMensal: Number(custoInput ? custoInput.value : 4000)
    };

    window.StorageService.saveConfig(config);
    this.updateSyncBadge();
    this.showToast('Configurações salvas com sucesso!', 'success');
    this.render();
  },

  updateSyncBadge() {
    const isConn = window.SheetsService.isConnected();
    const badges = document.querySelectorAll('.sync-status-badge');
    badges.forEach(b => {
      if (isConn) {
        b.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span><span>Conectado ao Sheets</span>`;
        b.className = 'sync-status-badge flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      } else {
        b.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400"></span><span>Modo Local (Offline)</span>`;
        b.className = 'sync-status-badge flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20';
      }
    });
  },

  async testSheetsConnection() {
    const btn = document.getElementById('btn-test-sheets');
    if (btn) btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Testando...</span>`;
    if (window.lucide) window.lucide.createIcons();

    const res = await window.SheetsService.testConnection();

    if (btn) btn.innerHTML = `<span>Testar Conexão</span>`;
    if (res.success) {
      this.showToast('Conectado com sucesso ao Google Sheets!', 'success');
      this.updateSyncBadge();
    } else {
      this.showToast(res.error || 'Erro ao conectar. Verifique as instruções.', 'error');
    }
  },

  async syncFromSheets(silent = false) {
    if (!window.SheetsService.isConnected()) {
      if (!silent) this.showToast('Configure a URL do Google Sheets primeiro.', 'warning');
      return;
    }

    if (!silent) this.showToast('Sincronizando com o Google Sheets...', 'info');

    const res = await window.SheetsService.fetchFromSheets();
    if (res.success) {
      this.render();
      if (!silent) this.showToast('Dados sincronizados com o Google Sheets!', 'success');
    } else {
      if (!silent) this.showToast(res.error || 'Erro ao sincronizar.', 'error');
    }
  },

  async pushAllToSheets() {
    if (!window.SheetsService.isConnected()) {
      this.showToast('Configure a URL do Google Sheets primeiro.', 'warning');
      return;
    }

    if (!confirm('Deseja enviar todos os dados locais para a planilha? Isso atualizará as abas.')) return;

    this.showToast('Enviando dados para a planilha...', 'info');
    const res = await window.SheetsService.syncAllToSheets();
    if (res.success) {
      this.showToast('Planilha atualizada com sucesso!', 'success');
    } else {
      this.showToast(res.error || 'Erro ao enviar dados.', 'error');
    }
  },

  // ------------------------------------------
  // GRÁFICOS (CHART.JS)
  // ------------------------------------------
  renderDashboardCharts(monthTrans, investments) {
    // 1. Gráfico de Despesas por Categoria (Donut)
    const despesas = monthTrans.filter(t => t.tipo === 'despesa');
    const catMap = {};
    despesas.forEach(d => {
      const c = d.categoria || 'Outros';
      catMap[c] = (catMap[c] || 0) + Number(d.valor);
    });

    const catLabels = Object.keys(catMap);
    const catValues = Object.values(catMap);
    const catBackgrounds = catLabels.map(l => this.categoryColors[l] || '#64748b');

    const ctxCat = document.getElementById('chart-categories');
    if (ctxCat && window.Chart) {
      if (this.charts.cat) this.charts.cat.destroy();

      if (catValues.length === 0) {
        ctxCat.parentElement.classList.add('flex', 'items-center', 'justify-center');
      } else {
        this.charts.cat = new Chart(ctxCat, {
          type: 'doughnut',
          data: {
            labels: catLabels,
            datasets: [{
              data: catValues,
              backgroundColor: catBackgrounds,
              borderWidth: 2,
              borderColor: '#0f172a'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { color: '#94a3b8', font: { size: 11, family: 'Inter' }, padding: 12 }
              },
              tooltip: {
                callbacks: {
                  label: (ctx) => ` ${ctx.label}: ${App.formatMoney(ctx.raw)}`
                }
              }
            },
            cutout: '70%'
          }
        });
      }
    }

    // 2. Gráfico de Fluxo Mensal (Receitas x Despesas)
    const allTrans = window.StorageService.getTransactions();
    const curParts = (this.currentMonth || new Date().toISOString().slice(0, 7)).split('-');
    const curYear = parseInt(curParts[0]) || new Date().getFullYear();
    const curMonth = (parseInt(curParts[1]) || (new Date().getMonth() + 1)) - 1;
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(curYear, curMonth - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push(mStr);
    }

    const recByMonth = months.map(m => {
      return allTrans.filter(t => (this.normalizeDate(t.data) || '').startsWith(m) && t.tipo === 'receita')
                     .reduce((a, t) => a + Number(t.valor), 0);
    });

    const despByMonth = months.map(m => {
      return allTrans.filter(t => (this.normalizeDate(t.data) || '').startsWith(m) && t.tipo === 'despesa')
                      .reduce((a, t) => a + Number(t.valor), 0);
    });

    const monthLabels = months.map(m => {
      const parts = m.split('-');
      const mesNome = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][parseInt(parts[1]) - 1];
      return `${mesNome}/${parts[0].slice(2)}`;
    });

    const ctxFlow = document.getElementById('chart-monthly-flow');
    if (ctxFlow && window.Chart) {
      if (this.charts.flow) this.charts.flow.destroy();

      this.charts.flow = new Chart(ctxFlow, {
        type: 'bar',
        data: {
          labels: monthLabels,
          datasets: [
            {
              label: 'Receitas',
              data: recByMonth,
              backgroundColor: '#10b981',
              borderRadius: 6
            },
            {
              label: 'Despesas',
              data: despByMonth,
              backgroundColor: '#f43f5e',
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: { color: '#94a3b8', font: { size: 11, family: 'Inter' } }
            },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.dataset.label}: ${App.formatMoney(ctx.raw)}`
              }
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#64748b' } },
            y: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#64748b', callback: (v) => `R$${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}` }
            }
          }
        }
      });
    }
  },

  renderInvestmentCharts(investments) {
    // Alocação por Classe
    const classMap = {};
    investments.forEach(inv => {
      const classe = inv.classe || 'Outros';
      const valor = (Number(inv.quantidade) || 0) * (Number(inv.precoAtual || inv.precoMedio) || 0);
      classMap[classe] = (classMap[classe] || 0) + valor;
    });

    const labels = Object.keys(classMap);
    const values = Object.values(classMap);
    const colors = labels.map(l => this.classColors[l] || '#64748b');

    const ctx = document.getElementById('chart-investment-allocation');
    if (ctx && window.Chart) {
      if (this.charts.alloc) this.charts.alloc.destroy();

      if (values.length > 0) {
        this.charts.alloc = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: labels,
            datasets: [{
              data: values,
              backgroundColor: colors,
              borderWidth: 2,
              borderColor: '#0f172a'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: { color: '#94a3b8', font: { size: 12, family: 'Inter' }, padding: 12 }
              },
              tooltip: {
                callbacks: {
                  label: (ctx) => ` ${ctx.label}: ${App.formatMoney(ctx.raw)}`
                }
              }
            },
            cutout: '65%'
          }
        });
      }
    }
  },

  renderCharts() {
    const transactions = window.StorageService.getTransactions();
    const investments = window.StorageService.getInvestments();
    const isTotal = (this.dashboardPeriod === 'total');
    const dashTrans = isTotal
      ? transactions
      : transactions.filter(t => (window.SheetsService ? window.SheetsService.normalizeDate(t.data) : t.data || '').startsWith(this.currentMonth));
    this.renderDashboardCharts(dashTrans, investments);
    this.renderInvestmentCharts(investments);
  },

  // ------------------------------------------
  // MODAIS E CADASTROS
  // ------------------------------------------
  openTransactionModal(tipo = 'despesa') {
    const title = document.getElementById('trans-modal-title');
    if (title) title.textContent = tipo === 'receita' ? 'Nova Receita' : 'Nova Despesa';

    document.getElementById('trans-id').value = '';
    document.getElementById('trans-tipo').value = tipo;
    document.getElementById('trans-descricao').value = '';
    document.getElementById('trans-valor').value = '';

    // Data padrão inteligente alinhada ao mês visualizado
    const today = new Date();
    const diaAtual = String(today.getDate()).padStart(2, '0');
    let dataPadrao = today.toISOString().slice(0, 10);
    if (this.currentMonth && /^\d{4}-\d{2}$/.test(this.currentMonth)) {
      dataPadrao = `${this.currentMonth}-${diaAtual}`;
    }
    document.getElementById('trans-data').value = dataPadrao;
    document.getElementById('trans-metodo').value = 'Pix';
    this.setModalTransactionStatus('pago');

    // Ajusta rótulos de status com base em despesa ou receita
    const lblPago = document.getElementById('trans-lbl-status-pago');
    const lblPend = document.getElementById('trans-lbl-status-pendente');
    if (tipo === 'receita') {
      if (lblPago) lblPago.textContent = 'Já Recebido';
      if (lblPend) lblPend.textContent = 'A Receber';
    } else {
      if (lblPago) lblPago.textContent = 'Já Pago';
      if (lblPend) lblPend.textContent = 'A Pagar';
    }

    const repTipo = document.getElementById('trans-repeticao-tipo');
    if (repTipo) repTipo.value = 'unica';
    this.toggleRepeticaoOptions('unica');

    const transTypeBtns = document.querySelectorAll('.trans-type-btn');
    transTypeBtns.forEach(b => {
      b.classList.remove('bg-emerald-600', 'bg-rose-600', 'text-white');
      b.classList.add('bg-slate-800', 'text-slate-400');
      if (b.getAttribute('data-type') === tipo) {
        b.classList.remove('bg-slate-800', 'text-slate-400');
        b.classList.add(tipo === 'receita' ? 'bg-emerald-600' : 'bg-rose-600', 'text-white');
      }
    });

    this.updateCategoryOptions(tipo);
    this.openModal('modal-transaction');
  },

  editTransaction(id) {
    const list = window.StorageService.getTransactions();
    const t = list.find(item => item.id === id);
    if (!t) return;

    this.openTransactionModal(t.tipo);
    const title = document.getElementById('trans-modal-title');
    if (title) title.textContent = 'Editar Lançamento';

    document.getElementById('trans-id').value = t.id;
    document.getElementById('trans-tipo').value = t.tipo;
    document.getElementById('trans-descricao').value = t.descricao || '';
    document.getElementById('trans-valor').value = t.valor || '';
    document.getElementById('trans-data').value = this.normalizeDate(t.data);
    document.getElementById('trans-metodo').value = t.metodo || 'Pix';
    document.getElementById('trans-categoria').value = t.categoria;
    this.setModalTransactionStatus(t.status || 'pago');

    const repTipo = document.getElementById('trans-repeticao-tipo');
    if (repTipo) {
      repTipo.value = 'unica';
      this.toggleRepeticaoOptions('unica');
    }
  },

  fixFutureYearTransactions() {
    const transactions = window.StorageService.getTransactions();
    let count = 0;
    const updated = transactions.map(t => {
      const norm = this.normalizeDate(t.data);
      if (norm && norm.startsWith('2027-')) {
        count++;
        const corrected = norm.replace(/^2027-/, '2026-');
        return {
          ...t,
          data: corrected,
          dataPagamento: t.dataPagamento ? t.dataPagamento.replace(/^2027-/, '2026-') : undefined
        };
      }
      return t;
    });

    if (count > 0) {
      localStorage.setItem('financas_pro_transactions', JSON.stringify(updated));
      this.currentMonth = '2026-11';
      const mSelect = document.getElementById('month-selector');
      if (mSelect) mSelect.value = '2026-11';
      this.render();
      this.showToast(`✓ ${count} lançamento(s) atualizados com sucesso para Novembro de 2026!`, 'success');
      if (window.SheetsService && window.SheetsService.isConnected()) {
        window.SheetsService.syncAllToSheets();
      }
    } else {
      this.showToast('Nenhum lançamento de 2027 encontrado.', 'info');
    }
  },

  setModalTransactionStatus(status) {
    const input = document.getElementById('trans-status');
    if (input) input.value = status;
    const btnPago = document.getElementById('trans-btn-status-pago');
    const btnPend = document.getElementById('trans-btn-status-pendente');
    if (status === 'pago') {
      if (btnPago) {
        btnPago.className = 'py-1.5 rounded-xl font-bold text-xs bg-emerald-600 text-white transition flex items-center justify-center space-x-1 shadow-sm';
      }
      if (btnPend) {
        btnPend.className = 'py-1.5 rounded-xl font-bold text-xs bg-slate-800 text-slate-400 transition flex items-center justify-center space-x-1';
      }
    } else {
      if (btnPago) {
        btnPago.className = 'py-1.5 rounded-xl font-bold text-xs bg-slate-800 text-slate-400 transition flex items-center justify-center space-x-1';
      }
      if (btnPend) {
        btnPend.className = 'py-1.5 rounded-xl font-bold text-xs bg-amber-600 text-white transition flex items-center justify-center space-x-1 shadow-sm';
      }
    }
  },

  toggleRepeticaoOptions(tipo) {
    const box = document.getElementById('trans-repeticao-detalhes');
    const lbl = document.getElementById('trans-lbl-qtd');
    const boxModo = document.getElementById('trans-box-valor-modo');
    const lblPrimeira = document.getElementById('trans-lbl-primeira-paga');
    if (!box) return;

    if (tipo === 'unica') {
      box.classList.add('hidden');
    } else {
      box.classList.remove('hidden');
      if (tipo === 'fixa') {
        if (lbl) lbl.textContent = 'Repetir por quantos meses:';
        if (boxModo) boxModo.classList.add('hidden');
        if (lblPrimeira) lblPrimeira.textContent = 'Marcar o mês atual como Pago e os próximos como Pendentes';
      } else if (tipo === 'parcelada') {
        if (lbl) lbl.textContent = 'Qtd de Parcelas (ex: 10):';
        if (boxModo) boxModo.classList.remove('hidden');
        if (lblPrimeira) lblPrimeira.textContent = 'Marcar a 1ª parcela como Paga agora e as demais como Pendentes';
      }
      this.updateRepeticaoResumo();
    }
  },

  updateRepeticaoResumo() {
    const tipo = document.getElementById('trans-repeticao-tipo')?.value || 'unica';
    const valor = parseFloat(document.getElementById('trans-valor')?.value) || 0;
    const qtd = parseInt(document.getElementById('trans-repeticao-qtd')?.value) || 1;
    const modo = document.getElementById('trans-valor-modo')?.value || 'parcela';
    const resumo = document.getElementById('trans-resumo-repeticao');
    if (!resumo || tipo === 'unica') return;

    if (tipo === 'fixa') {
      resumo.textContent = `Serão criados lançamentos mensais de ${this.formatMoney(valor)} para os próximos ${qtd} meses.`;
    } else if (tipo === 'parcelada') {
      const vParcela = modo === 'parcela' ? valor : (valor / qtd);
      const vTotal = modo === 'parcela' ? (valor * qtd) : valor;
      resumo.textContent = `Serão geradas ${qtd} parcelas de ${this.formatMoney(vParcela)} (Total: ${this.formatMoney(vTotal)}).`;
    }
  },

  updateCategoryOptions(tipo) {
    const catSelect = document.getElementById('trans-categoria');
    if (!catSelect) return;

    const despesaCats = [
      'Energia Elétrica (Luz)',
      'Internet / TV / Telefone',
      'Fatura Cartão de Crédito',
      'Água / Saneamento',
      'Gás',
      'Aluguel / Condomínio',
      'Supermercado / Feira',
      'Alimentação / Restaurante',
      'Combustível',
      'Transporte / Uber',
      'Manutenção / Veículo',
      'Farmácia / Remédios',
      'Plano de Saúde / Médico',
      'Streaming / Assinaturas',
      'Lazer / Viagens',
      'Educação / Cursos',
      'Vestuário & Cuidados',
      'Empréstimo / Financiamento',
      'Pets',
      'Outros'
    ];

    const receitaCats = [
      'Salário / Adiantamento',
      '13º Salário / Férias',
      'Bônus / Comissões',
      'Freelance / Serviços',
      'Rendimentos / Dividendos',
      'Venda de Bens',
      'Reembolso',
      'Outros'
    ];

    const cats = tipo === 'receita' ? receitaCats : despesaCats;
    catSelect.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
  },

  async handleSaveTransaction(e) {
    e.preventDefault();
    const id = document.getElementById('trans-id').value;
    const tipo = document.getElementById('trans-tipo').value;
    const descricao = document.getElementById('trans-descricao').value.trim();
    const valor = parseFloat(document.getElementById('trans-valor').value);
    const data = document.getElementById('trans-data').value;
    const categoria = document.getElementById('trans-categoria').value;
    const metodo = document.getElementById('trans-metodo').value;
    const status = document.getElementById('trans-status').value || 'pago';

    if (!valor || isNaN(valor) || valor <= 0) {
      this.showToast('Informe um valor válido maior que zero.', 'warning');
      return;
    }

    const dataNormalizada = window.SheetsService ? window.SheetsService.normalizeDate(data) : data;

    const payload = {
      id: id || undefined,
      tipo,
      descricao: descricao || categoria,
      valor,
      data: dataNormalizada,
      categoria,
      metodo,
      status,
      dataPagamento: status === 'pago' ? dataNormalizada : undefined
    };

    // Ajusta o mês ativo para o mês da transação adicionada para que ela fique visível imediatamente
    const mesTransacao = dataNormalizada.slice(0, 7);
    if (mesTransacao) {
      this.currentMonth = mesTransacao;
      this.filterAllMonths = false;
      const mSelect = document.getElementById('month-selector');
      if (mSelect) mSelect.value = mesTransacao;
      const pSelect = document.getElementById('trans-filter-periodo');
      if (pSelect) pSelect.value = 'mes';
    }

    const repTipo = document.getElementById('trans-repeticao-tipo')?.value || 'unica';
    const repQtd = parseInt(document.getElementById('trans-repeticao-qtd')?.value) || 1;
    const repModo = document.getElementById('trans-valor-modo')?.value || 'parcela';
    const chkPrimeiraPaga = document.getElementById('trans-primeira-paga');
    const marcarPrimeiraPaga = chkPrimeiraPaga ? chkPrimeiraPaga.checked : true;

    // Função auxiliar para avançar meses sem bug de overflow (ex: 31 de janeiro -> 28 de fevereiro)
    const calcFutureDate = (anoBase, mes1Base, diaBase, offset) => {
      const totalMeses = (mes1Base - 1) + offset;
      const y = anoBase + Math.floor(totalMeses / 12);
      const m = ((totalMeses % 12) + 12) % 12;
      const maxDias = new Date(y, m + 1, 0).getDate();
      const d = Math.min(diaBase, maxDias);
      return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    };

    // 1. Recorrência / Fixa Mensal
    if (repTipo === 'fixa' && repQtd > 1) {
      const [ano, mes, dia] = dataNormalizada.split('-').map(Number);
      for (let i = 0; i < repQtd; i++) {
        const dataItem = calcFutureDate(ano, mes, dia, i);
        const itemStatus = (i === 0 && marcarPrimeiraPaga) ? (status || 'pago') : (marcarPrimeiraPaga ? 'pendente' : status);
        const itemPayload = {
          ...payload,
          id: 'tr_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4) + '_' + i,
          data: dataItem,
          status: itemStatus,
          dataPagamento: itemStatus === 'pago' ? dataItem : undefined,
          recorrencia: 'fixa'
        };
        window.StorageService.saveTransaction(itemPayload);
      }
      this.closeModal('modal-transaction');
      this.showToast(`Lançamento recorrente criado para os próximos ${repQtd} meses!`, 'success');
      this.render();

      // Sincroniza em lote seguro para o Sheets sem concorrência
      if (window.SheetsService.isConnected()) {
        window.SheetsService.syncAllToSheets();
      }
      return;
    }

    // 2. Compra Parcelada
    if (repTipo === 'parcelada' && repQtd > 1) {
      const vParcela = repModo === 'parcela' ? valor : (valor / repQtd);
      const [ano, mes, dia] = dataNormalizada.split('-').map(Number);
      for (let p = 1; p <= repQtd; p++) {
        const dataItem = calcFutureDate(ano, mes, dia, p - 1);
        const itemStatus = (p === 1 && marcarPrimeiraPaga) ? (status || 'pago') : (marcarPrimeiraPaga ? 'pendente' : status);
        const itemPayload = {
          ...payload,
          id: 'tr_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4) + '_' + p,
          data: dataItem,
          descricao: `${descricao || categoria} (${p}/${repQtd})`,
          valor: Number(vParcela.toFixed(2)),
          parcela: `${p}/${repQtd}`,
          status: itemStatus,
          dataPagamento: itemStatus === 'pago' ? dataItem : undefined,
          recorrencia: 'parcelada'
        };
        window.StorageService.saveTransaction(itemPayload);
      }
      this.closeModal('modal-transaction');
      this.showToast(`Compra parcelada em ${repQtd}x registrada com sucesso!`, 'success');
      this.render();

      // Sincroniza em lote seguro para o Sheets sem concorrência
      if (window.SheetsService.isConnected()) {
        window.SheetsService.syncAllToSheets();
      }
      return;
    }

    // Salva lançamento único
    window.StorageService.saveTransaction(payload);
    this.closeModal('modal-transaction');
    const msgSalvo = payload.status === 'pago' 
      ? (payload.tipo === 'despesa' ? 'Despesa paga registrada com sucesso!' : 'Receita recebida registrada com sucesso!')
      : (payload.tipo === 'despesa' ? 'Despesa a pagar agendada com sucesso!' : 'Receita a receber agendada com sucesso!');
    this.showToast(msgSalvo, 'success');
    this.render();

    // Envia para o Sheets em segundo plano sem destruir os dados locais
    if (window.SheetsService.isConnected()) {
      window.SheetsService.sendAction('add_transaction', payload);
    }
  },

  deleteTransaction(id) {
    if (!confirm('Deseja realmente excluir esta transação?')) return;
    window.StorageService.deleteTransaction(id);
    this.showToast('Transação excluída.', 'info');
    this.render();

    if (window.SheetsService.isConnected()) {
      window.SheetsService.sendAction('delete_transaction', null, id);
    }
  },

  markAsPaid(id) {
    const list = window.StorageService.getTransactions();
    const t = list.find(item => item.id === id);
    if (t) {
      t.status = 'pago';
      t.dataPagamento = new Date().toISOString().slice(0, 10);
      window.StorageService.saveTransaction(t);
      this.render();
      const msg = t.tipo === 'despesa' ? '✓ Despesa marcada como PAGA!' : '✓ Receita marcada como RECEBIDA!';
      this.showToast(msg, 'success');
      if (window.SheetsService.isConnected()) {
        window.SheetsService.sendAction('add_transaction', t);
      }
    }
  },

  toggleTransactionStatus(id) {
    const list = window.StorageService.getTransactions();
    const t = list.find(item => item.id === id);
    if (t) {
      t.status = t.status === 'pendente' ? 'pago' : 'pendente';
      if (t.status === 'pago') {
        t.dataPagamento = new Date().toISOString().slice(0, 10);
      }
      window.StorageService.saveTransaction(t);
      this.render();
      this.showToast(`Transação alterada para ${t.status === 'pago' ? 'Paga' : 'Pendente'}.`, 'info');
      if (window.SheetsService.isConnected()) {
        window.SheetsService.sendAction('add_transaction', t);
      }
    }
  },

  // Reserva de Emergência Modal
  openEmergencyModal(tipo = 'Aporte') {
    document.getElementById('em-form-tipo').value = tipo;
    document.getElementById('em-form-valor').value = '';
    document.getElementById('em-form-data').value = new Date().toISOString().slice(0, 10);
    document.getElementById('em-form-inst').value = 'Tesouro Selic';
    document.getElementById('em-form-obs').value = '';
    this.openModal('modal-emergency');
  },

  async handleSaveEmergency(e) {
    e.preventDefault();
    const tipo = document.getElementById('em-form-tipo').value;
    const valor = parseFloat(document.getElementById('em-form-valor').value);
    const data = document.getElementById('em-form-data').value;
    const instituicao = document.getElementById('em-form-inst').value.trim();
    const observacao = document.getElementById('em-form-obs').value.trim();

    if (!valor || isNaN(valor) || valor <= 0) {
      this.showToast('Informe um valor válido.', 'warning');
      return;
    }

    const payload = { 
      tipo, 
      valor, 
      data: window.SheetsService ? window.SheetsService.normalizeDate(data) : data, 
      instituicao, 
      observacao 
    };
    window.StorageService.saveEmergencyLog(payload);
    this.closeModal('modal-emergency');
    this.showToast(`${tipo} na reserva registrado!`, 'success');
    this.render();

    if (window.SheetsService.isConnected()) {
      window.SheetsService.sendAction('add_emergency', payload).then(() => {
        window.SheetsService.fetchFromSheets().then(() => App.render());
      });
    }
  },

  deleteEmergencyLog(id) {
    if (!confirm('Deseja excluir este registro da reserva?')) return;
    window.StorageService.deleteEmergencyLog(id);
    this.showToast('Registro excluído da reserva.', 'info');
    this.render();

    if (window.SheetsService.isConnected()) {
      window.SheetsService.sendAction('delete_emergency', null, id);
    }
  },

  // Investimentos Modal
  openInvestmentModal() {
    document.getElementById('inv-form-id').value = '';
    document.getElementById('inv-form-ticker').value = '';
    document.getElementById('inv-form-nome').value = '';
    document.getElementById('inv-form-classe').value = 'Ações';
    document.getElementById('inv-form-qtd').value = '';
    document.getElementById('inv-form-pm').value = '';
    document.getElementById('inv-form-pa').value = '';
    document.getElementById('inv-form-inst').value = 'XP Investimentos';
    this.openModal('modal-investment');
  },

  async handleSaveInvestment(e) {
    e.preventDefault();
    const id = document.getElementById('inv-form-id').value;
    const ticker = document.getElementById('inv-form-ticker').value.trim().toUpperCase();
    const nome = document.getElementById('inv-form-nome').value.trim();
    const classe = document.getElementById('inv-form-classe').value;
    const quantidade = parseFloat(document.getElementById('inv-form-qtd').value);
    const precoMedio = parseFloat(document.getElementById('inv-form-pm').value);
    const precoAtual = parseFloat(document.getElementById('inv-form-pa').value) || precoMedio;
    const instituicao = document.getElementById('inv-form-inst').value.trim();

    if (!ticker) {
      this.showToast('Informe o código ou ticker do ativo.', 'warning');
      return;
    }
    if (!quantidade || quantidade <= 0) {
      this.showToast('Informe uma quantidade válida.', 'warning');
      return;
    }

    const payload = {
      id: id || undefined,
      ticker,
      nome: nome || ticker,
      classe,
      quantidade,
      precoMedio,
      precoAtual,
      instituicao
    };

    window.StorageService.saveInvestment(payload);
    this.closeModal('modal-investment');
    this.showToast('Ativo salvo na carteira!', 'success');
    this.render();

    if (window.SheetsService.isConnected()) {
      window.SheetsService.sendAction('save_investment', payload).then(() => {
        window.SheetsService.fetchFromSheets().then(() => App.render());
      });
    }
  },

  deleteInvestment(id) {
    if (!confirm('Deseja remover este ativo da carteira?')) return;
    window.StorageService.deleteInvestment(id);
    this.showToast('Ativo removido.', 'info');
    this.render();

    if (window.SheetsService.isConnected()) {
      window.SheetsService.sendAction('delete_investment', null, id);
    }
  },

  // Proventos / Dividendos Modal
  openDividendModal() {
    document.getElementById('div-form-ativo').value = '';
    document.getElementById('div-form-tipo').value = 'Dividendo';
    document.getElementById('div-form-valor').value = '';
    document.getElementById('div-form-data').value = new Date().toISOString().slice(0, 10);
    this.openModal('modal-dividend');
  },

  async handleSaveDividend(e) {
    e.preventDefault();
    const ativo = document.getElementById('div-form-ativo').value.trim().toUpperCase();
    const tipo = document.getElementById('div-form-tipo').value;
    const valor = parseFloat(document.getElementById('div-form-valor').value);
    const data = document.getElementById('div-form-data').value;

    if (!ativo || !valor || valor <= 0) {
      this.showToast('Preencha os dados do provento.', 'warning');
      return;
    }

    const payload = { 
      ativo, 
      tipo, 
      valor, 
      data: window.SheetsService ? window.SheetsService.normalizeDate(data) : data 
    };
    window.StorageService.saveDividend(payload);
    this.closeModal('modal-dividend');
    this.showToast('Provento registrado!', 'success');
    this.render();

    if (window.SheetsService.isConnected()) {
      window.SheetsService.sendAction('add_dividend', payload).then(() => {
        window.SheetsService.fetchFromSheets().then(() => App.render());
      });
    }
  },

  deleteDividend(id) {
    if (!confirm('Excluir este dividendo?')) return;
    window.StorageService.deleteDividend(id);
    this.render();
  },

  // Helpers de Modal
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
    if (window.lucide) window.lucide.createIcons();
  },

  

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  // Notificações Toast
  showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const colors = {
      success: 'bg-emerald-600 text-white',
      error: 'bg-rose-600 text-white',
      warning: 'bg-amber-600 text-white',
      info: 'bg-slate-800 text-slate-100 border border-slate-700'
    };

    toast.className = `px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-sm font-semibold transition-all transform duration-300 translate-y-2 opacity-0 ${colors[type] || colors.info}`;
    toast.innerHTML = `<span>${this.escapeHtml(msg)}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[m]);
  },

  // Exportar / Importar
  downloadBackup() {
    const data = window.StorageService.exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financas_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('Backup baixado com sucesso!', 'success');
  },

  exportTransactionsCSV() {
    const list = window.StorageService.getTransactions();
    if (!list || list.length === 0) {
      this.showToast('Nenhuma transação para exportar.', 'warning');
      return;
    }

    const headers = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor (R$)', 'Forma Pagamento', 'Status'];
    const rows = list.map(t => [
      t.data || '',
      t.tipo || '',
      t.categoria || '',
      `"${(t.descricao || '').replace(/"/g, '""')}"`,
      (Number(t.valor) || 0).toFixed(2).replace('.', ','),
      t.metodo || '',
      t.status || ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extrato_financas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('Relatório CSV exportado com sucesso!', 'success');
  },

  triggerRestore() {
    document.getElementById('file-restore-input').click();
  },

  handleFileRestore(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        window.StorageService.importAllData(json);
        this.render();
        this.showToast('Dados restaurados com sucesso!', 'success');
      } catch (err) {
        this.showToast('Arquivo de backup inválido.', 'error');
      }
    };
    reader.readAsText(file);
  },

  // ------------------------------------------
  // METAS DE QUITAÇÃO DE DÍVIDAS
  // ------------------------------------------
  renderDebts() {
    const debts = window.StorageService.getDebts();
    const container = document.getElementById('debts-list-container');
    
    // Resumo
    const totalGeral = debts.reduce((a, d) => a + Number(d.valorTotal || 0), 0);
    const pagoGeral = debts.reduce((a, d) => a + Number(d.valorPago || 0), 0);
    const restanteGeral = Math.max(0, totalGeral - pagoGeral);
    const pctGeral = totalGeral > 0 ? Math.min(100, Math.round((pagoGeral / totalGeral) * 100)) : 100;

    const elTot = document.getElementById('debt-resumo-total');
    const elPago = document.getElementById('debt-resumo-pago');
    const elRest = document.getElementById('debt-resumo-restante');
    const elPct = document.getElementById('debt-resumo-pct');

    if (elTot) elTot.textContent = this.formatMoney(totalGeral);
    if (elPago) elPago.textContent = this.formatMoney(pagoGeral);
    if (elRest) elRest.textContent = this.formatMoney(restanteGeral);
    if (elPct) elPct.textContent = `${pctGeral}%`;

    if (!container) return;

    if (debts.length === 0) {
      container.innerHTML = `
        <div class="p-6 text-center bg-slate-950/40 rounded-2xl border border-slate-800">
          <i data-lucide="shield-check" class="w-10 h-10 text-emerald-500 mx-auto mb-2"></i>
          <p class="text-slate-300 font-bold text-sm">Nenhuma dívida ou pendência cadastrada!</p>
          <p class="text-slate-500 text-xs mt-1">Cadastre financiamentos ou empréstimos para acompanhar a quitação.</p>
          <button onclick="App.openDebtModal()" class="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition">
            + Cadastrar Meta de Quitação
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = debts.map(d => {
      const total = Number(d.valorTotal) || 0;
      const pago = Number(d.valorPago) || 0;
      const restante = Math.max(0, total - pago);
      const pct = total > 0 ? Math.min(100, Math.round((pago / total) * 100)) : 100;
      const parcelasRestantes = d.valorParcela > 0 ? Math.ceil(restante / Number(d.valorParcela)) : 0;
      const quitado = restante <= 0;

      return `
        <div class="p-4 md:p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div class="flex items-center space-x-2">
                <h4 class="font-bold text-white text-base">${this.escapeHtml(d.nome)}</h4>
                ${quitado 
                  ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">✓ 100% Quitado</span>`
                  : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">Em Quitação</span>`
                }
              </div>
              <p class="text-xs text-slate-400 mt-0.5">
                ${d.instituicao ? `<span class="text-slate-300 font-medium">${this.escapeHtml(d.instituicao)}</span> • ` : ''}
                ${d.dataLimite ? `Meta: ${this.formatDate(d.dataLimite)} • ` : ''}
                ${d.observacao ? this.escapeHtml(d.observacao) : ''}
              </p>
            </div>
            <div class="flex items-center space-x-2">
              ${!quitado ? `
                <button onclick="App.openAmortizeModal('${d.id}')" class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md transition">
                  <i data-lucide="dollar-sign" class="w-3.5 h-3.5"></i>
                  <span>Amortizar</span>
                </button>
              ` : ''}
              <button onclick="App.openDebtModal('${d.id}')" title="Editar" class="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition border border-slate-800">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="App.deleteDebt('${d.id}')" title="Excluir" class="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition border border-slate-800">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>

          <!-- Barra de Progresso da Dívida -->
          <div>
            <div class="flex items-center justify-between text-xs mb-1.5">
              <span class="text-slate-400">Pago: <strong class="text-emerald-400">${this.formatMoney(pago)}</strong> de ${this.formatMoney(total)}</span>
              <span class="font-extrabold ${quitado ? 'text-emerald-400' : 'text-blue-400'}">${pct}%</span>
            </div>
            <div class="w-full h-3 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
              <div class="h-full bg-gradient-to-r ${quitado ? 'from-emerald-500 to-teal-400' : 'from-rose-500 via-amber-500 to-emerald-400'} rounded-full transition-all duration-700" style="width: ${pct}%;"></div>
            </div>
          </div>

          <!-- Indicadores de Saldo e Parcelas -->
          <div class="flex flex-wrap items-center justify-between text-xs pt-2 border-t border-slate-800/60 text-slate-400">
            <span>Saldo Devedor: <strong class="text-rose-400 font-bold">${this.formatMoney(restante)}</strong></span>
            ${d.valorParcela > 0 ? `<span>Parcela: <strong class="text-white">${this.formatMoney(d.valorParcela)}</strong> (~${parcelasRestantes} restantes)</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  },

  openDebtModal(id = null) {
    document.getElementById('debt-form-id').value = '';
    document.getElementById('debt-form-nome').value = '';
    document.getElementById('debt-form-inst').value = '';
    document.getElementById('debt-form-total').value = '';
    document.getElementById('debt-form-pago').value = '0';
    document.getElementById('debt-form-parcela').value = '';
    document.getElementById('debt-form-data-limite').value = '';
    document.getElementById('debt-form-obs').value = '';

    const title = document.getElementById('debt-modal-title');
    if (id) {
      const debts = window.StorageService.getDebts();
      const d = debts.find(x => x.id === id);
      if (d) {
        if (title) title.textContent = 'Editar Meta de Quitação';
        document.getElementById('debt-form-id').value = d.id;
        document.getElementById('debt-form-nome').value = d.nome || '';
        document.getElementById('debt-form-inst').value = d.instituicao || '';
        document.getElementById('debt-form-total').value = d.valorTotal || '';
        document.getElementById('debt-form-pago').value = d.valorPago || 0;
        document.getElementById('debt-form-parcela').value = d.valorParcela || '';
        document.getElementById('debt-form-data-limite').value = d.dataLimite ? d.dataLimite.slice(0, 10) : '';
        document.getElementById('debt-form-obs').value = d.observacao || '';
      }
    } else {
      if (title) title.textContent = 'Nova Meta de Quitação';
    }

    this.openModal('modal-debt');
  },

  handleSaveDebt(e) {
    e.preventDefault();
    const id = document.getElementById('debt-form-id').value;
    const nome = document.getElementById('debt-form-nome').value.trim();
    const instituicao = document.getElementById('debt-form-inst').value.trim();
    const valorTotal = parseFloat(document.getElementById('debt-form-total').value);
    const valorPago = parseFloat(document.getElementById('debt-form-pago').value) || 0;
    const valorParcela = parseFloat(document.getElementById('debt-form-parcela').value) || 0;
    const dataLimite = document.getElementById('debt-form-data-limite').value;
    const observacao = document.getElementById('debt-form-obs').value.trim();

    if (!nome || !valorTotal || valorTotal <= 0) {
      this.showToast('Informe o nome da dívida e um valor total válido.', 'warning');
      return;
    }

    const payload = {
      id: id || undefined,
      nome,
      instituicao,
      valorTotal,
      valorPago,
      valorParcela,
      dataLimite,
      observacao,
      atualizadoEm: new Date().toISOString()
    };

    window.StorageService.saveDebt(payload);
    this.closeModal('modal-debt');
    this.showToast('Meta de quitação salva!', 'success');
    this.render();
  },

  deleteDebt(id) {
    if (!confirm('Deseja realmente excluir esta meta de quitação?')) return;
    window.StorageService.deleteDebt(id);
    this.showToast('Meta de quitação excluída.', 'info');
    this.render();
  },

  openAmortizeModal(id) {
    const debts = window.StorageService.getDebts();
    const d = debts.find(x => x.id === id);
    if (!d) return;

    document.getElementById('amort-debt-id').value = d.id;
    document.getElementById('amort-debt-nome').textContent = `${d.nome} (${d.instituicao || 'Dívida'})`;
    const restante = Math.max(0, Number(d.valorTotal) - Number(d.valorPago));
    document.getElementById('amort-debt-restante').textContent = `Saldo Devedor Restante: ${this.formatMoney(restante)}`;
    document.getElementById('amort-valor').value = d.valorParcela || '';
    document.getElementById('amort-data').value = new Date().toISOString().slice(0, 10);
    document.getElementById('amort-lancar-despesa').checked = true;

    this.openModal('modal-amortizar');
  },

  handleSaveAmortization(e) {
    e.preventDefault();
    const id = document.getElementById('amort-debt-id').value;
    const valor = parseFloat(document.getElementById('amort-valor').value);
    const data = document.getElementById('amort-data').value;
    const lancarDespesa = document.getElementById('amort-lancar-despesa').checked;

    if (!valor || valor <= 0) {
      this.showToast('Informe um valor de amortização válido.', 'warning');
      return;
    }

    const updated = window.StorageService.amortizeDebt(id, valor);

    // Se marcado, cria a despesa automaticamente
    if (lancarDespesa && updated) {
      const transPayload = {
        id: 'tr_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
        tipo: 'despesa',
        descricao: `[Quitação] ${updated.nome}`,
        valor,
        data: window.SheetsService.normalizeDate(data),
        categoria: 'Serviços',
        metodo: 'Pix',
        status: 'pago'
      };
      window.StorageService.saveTransaction(transPayload);
      if (window.SheetsService.isConnected()) {
        window.SheetsService.sendAction('add_transaction', transPayload);
      }
    }

    this.closeModal('modal-amortizar');
    this.showToast(`Amortização de ${this.formatMoney(valor)} registrada!`, 'success');
    this.render();
  },

  // ------------------------------------------
  // METAS DE INVESTIMENTO
  // ------------------------------------------
  renderInvestmentGoals() {
    const config = window.StorageService.getConfig();
    const investments = window.StorageService.getInvestments();
    const emergencyFunds = window.StorageService.getEmergencyFunds();
    const dividends = window.StorageService.getDividends();

    // 1. Patrimônio Investido Total
    const totalInvestido = investments.reduce((acc, inv) => {
      const preco = Number(inv.precoAtual || inv.precoMedio) || 0;
      const qtd = Number(inv.quantidade) || 0;
      return acc + (preco * qtd);
    }, 0);
    const metaPatrimonio = Number(config.metaInvestimento) || 100000;
    const pctPatrimonio = Math.min(100, Math.round((totalInvestido / metaPatrimonio) * 100));
    const faltaPatrimonio = Math.max(0, metaPatrimonio - totalInvestido);

    const elGoalPatAtual = document.getElementById('goal-patrimonio-atual');
    const elGoalPatPct = document.getElementById('goal-patrimonio-pct');
    const elGoalPatBar = document.getElementById('goal-patrimonio-bar');
    const elGoalPatFalta = document.getElementById('goal-patrimonio-falta');

    if (elGoalPatAtual) elGoalPatAtual.textContent = this.formatMoney(totalInvestido);
    if (elGoalPatPct) elGoalPatPct.textContent = pctPatrimonio + '%';
    if (elGoalPatBar) elGoalPatBar.style.width = pctPatrimonio + '%';
    if (elGoalPatFalta) elGoalPatFalta.textContent = faltaPatrimonio > 0 ? 'Faltam ' + this.formatMoney(faltaPatrimonio) + ' para a meta de ' + this.formatMoney(metaPatrimonio) : '🎉 Meta de patrimônio atingida!';

    // 2. Aporte Mensal do Mês Ativo
    const aportesMes = emergencyFunds
      .filter(r => r.tipo === 'Aporte' && (window.SheetsService.normalizeDate(r.data) || '').startsWith(this.currentMonth))
      .reduce((a, r) => a + Number(r.valor), 0);
    const metaAporte = Number(config.metaAporteMensal) || 1500;
    const pctAporte = Math.min(100, Math.round((aportesMes / metaAporte) * 100));
    const faltaAporte = Math.max(0, metaAporte - aportesMes);

    const elGoalAporteAtual = document.getElementById('goal-aporte-atual');
    const elGoalAportePct = document.getElementById('goal-aporte-pct');
    const elGoalAporteBar = document.getElementById('goal-aporte-bar');
    const elGoalAporteFalta = document.getElementById('goal-aporte-falta');

    if (elGoalAporteAtual) elGoalAporteAtual.textContent = this.formatMoney(aportesMes);
    if (elGoalAportePct) elGoalAportePct.textContent = pctAporte + '%';
    if (elGoalAporteBar) elGoalAporteBar.style.width = pctAporte + '%';
    if (elGoalAporteFalta) elGoalAporteFalta.textContent = faltaAporte > 0 ? 'Faltam ' + this.formatMoney(faltaAporte) + ' para atingir a meta mensal' : '✓ Meta de aporte mensal alcançada!';

    // 3. Proventos do Mês Ativo
    const proventosMes = dividends
      .filter(d => (window.SheetsService.normalizeDate(d.data) || '').startsWith(this.currentMonth))
      .reduce((a, d) => a + Number(d.valor), 0);
    const metaRenda = Number(config.metaRendaPassiva) || 500;
    const pctRenda = Math.min(100, Math.round((proventosMes / metaRenda) * 100));
    const faltaRenda = Math.max(0, metaRenda - proventosMes);

    const elGoalProvAtual = document.getElementById('goal-proventos-atual');
    const elGoalProvPct = document.getElementById('goal-proventos-pct');
    const elGoalProvBar = document.getElementById('goal-proventos-bar');
    const elGoalProvFalta = document.getElementById('goal-proventos-falta');

    if (elGoalProvAtual) elGoalProvAtual.textContent = this.formatMoney(proventosMes);
    if (elGoalProvPct) elGoalProvPct.textContent = pctRenda + '%';
    if (elGoalProvBar) elGoalProvBar.style.width = pctRenda + '%';
    if (elGoalProvFalta) elGoalProvFalta.textContent = faltaRenda > 0 ? 'Faltam ' + this.formatMoney(faltaRenda) + ' para a meta passiva de ' + this.formatMoney(metaRenda) + '/mês' : '🎉 Meta de renda passiva mensal batida!';
  },

  // ------------------------------------------
  // SEGURANÇA E AUTENTICAÇÃO (LOGIN / SENHA)
  // ------------------------------------------
  checkAuth() {
    const screenAuth = document.getElementById('screen-auth');
    if (!screenAuth) return;

    const hasPass = window.StorageService.hasPassword();
    const isSessionAuth = sessionStorage.getItem('financas_session_authenticated') === 'true';

    // Se já autenticado nesta sessão ou não tem senha e já pulou o setup
    if (isSessionAuth || (!hasPass && window.StorageService.isSetupDismissed())) {
      screenAuth.classList.add('hidden');
      return;
    }

    screenAuth.classList.remove('hidden');

    const formLogin = document.getElementById('form-auth-login');
    const formSetup = document.getElementById('form-auth-setup');
    const subTitle = document.getElementById('auth-subtitle');

    if (hasPass) {
      // Modo Desbloqueio / Login
      if (formLogin) formLogin.classList.remove('hidden');
      if (formSetup) formSetup.classList.add('hidden');
      if (subTitle) subTitle.textContent = 'Digite sua senha para desbloquear seu painel';
      const input = document.getElementById('auth-input-password');
      if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 300);
      }
    } else {
      // Modo Primeiro Acesso / Criar Senha
      if (formLogin) formLogin.classList.add('hidden');
      if (formSetup) formSetup.classList.remove('hidden');
      if (subTitle) subTitle.textContent = 'Crie sua senha de acesso inicial';
      const input = document.getElementById('auth-new-password');
      if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 300);
      }
    }
  },

  handleLogin(e) {
    e.preventDefault();
    const pass = document.getElementById('auth-input-password')?.value || '';
    const errEl = document.getElementById('auth-error-msg');

    if (window.StorageService.verifyAuth(pass)) {
      if (errEl) errEl.classList.add('hidden');
      sessionStorage.setItem('financas_session_authenticated', 'true');
      const screenAuth = document.getElementById('screen-auth');
      if (screenAuth) screenAuth.classList.add('hidden');
      this.showToast('Acesso autorizado! Bem-vindo de volta.', 'success');
      this.checkPWAOffer();
    } else {
      if (errEl) {
        errEl.textContent = 'Senha incorreta. Tente novamente.';
        errEl.classList.remove('hidden');
      }
      const input = document.getElementById('auth-input-password');
      if (input) {
        input.value = '';
        input.focus();
      }
    }
  },

  handleSetupPassword(e) {
    e.preventDefault();
    const pass = document.getElementById('auth-new-password')?.value || '';
    const confirm = document.getElementById('auth-confirm-password')?.value || '';
    const errEl = document.getElementById('auth-setup-error');

    if (pass.length < 4) {
      if (errEl) {
        errEl.textContent = 'A senha deve conter no mínimo 4 caracteres.';
        errEl.classList.remove('hidden');
      }
      return;
    }

    if (pass !== confirm) {
      if (errEl) {
        errEl.textContent = 'As senhas digitadas não coincidem.';
        errEl.classList.remove('hidden');
      }
      return;
    }

    if (errEl) errEl.classList.add('hidden');
    window.StorageService.setAuth(pass);
    sessionStorage.setItem('financas_session_authenticated', 'true');
    const screenAuth = document.getElementById('screen-auth');
    if (screenAuth) screenAuth.classList.add('hidden');
    this.showToast('Senha de acesso criada com sucesso!', 'success');
    this.renderSettings();
    this.checkPWAOffer();
  },

  skipPasswordSetup() {
    window.StorageService.dismissSetup();
    sessionStorage.setItem('financas_session_authenticated', 'true');
    const screenAuth = document.getElementById('screen-auth');
    if (screenAuth) screenAuth.classList.add('hidden');
    this.showToast('Acesso liberado sem senha. Você pode definir uma senha em Configurações.', 'info');
    this.renderSettings();
    this.checkPWAOffer();
  },

  lockApp() {
    if (!window.StorageService.hasPassword()) {
      if (confirm('Você ainda não definiu uma senha de acesso. Deseja cadastrar uma senha agora?')) {
        this.openChangePasswordModal();
      }
      return;
    }
    sessionStorage.removeItem('financas_session_authenticated');
    this.checkAuth();
    this.showToast('Aplicativo bloqueado com segurança.', 'info');
  },

  openChangePasswordModal() {
    const screenAuth = document.getElementById('screen-auth');
    const formLogin = document.getElementById('form-auth-login');
    const formSetup = document.getElementById('form-auth-setup');
    const subTitle = document.getElementById('auth-subtitle');
    const errEl = document.getElementById('auth-setup-error');

    if (errEl) errEl.classList.add('hidden');
    if (subTitle) subTitle.textContent = 'Defina ou altere sua senha de acesso';
    if (formLogin) formLogin.classList.add('hidden');
    if (formSetup) formSetup.classList.remove('hidden');
    if (screenAuth) screenAuth.classList.remove('hidden');

    const input = document.getElementById('auth-new-password');
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 300);
    }
    const inputConf = document.getElementById('auth-confirm-password');
    if (inputConf) inputConf.value = '';
  },

  handleRemovePassword() {
    if (!window.StorageService.hasPassword()) {
      this.showToast('Nenhuma senha está configurada no momento.', 'info');
      return;
    }
    if (confirm('Deseja realmente remover a senha de acesso? O aplicativo ficará aberto sem pedir senha.')) {
      window.StorageService.removeAuth();
      this.showToast('Senha removida com sucesso.', 'info');
      this.renderSettings();
    }
  },

  togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
  },

  // ------------------------------------------
  // INSTALAÇÃO DO APLICATIVO (PWA NO PC & CELULAR)
  // ------------------------------------------
  setupPWA() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      window.deferredInstallPrompt = e;
      this.checkPWAOffer();
    });

    window.addEventListener('appinstalled', () => {
      window.deferredInstallPrompt = null;
      const banner = document.getElementById('pwa-install-banner');
      if (banner) banner.classList.add('hidden');
      const btnHeader = document.getElementById('btn-header-install');
      if (btnHeader) btnHeader.classList.add('hidden');
      this.showToast('🎉 Finanças Pro instalado com sucesso no seu dispositivo!', 'success');
    });

    // Se já estiver em standalone, esconde botão de instalar
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      const btnHeader = document.getElementById('btn-header-install');
      if (btnHeader) btnHeader.classList.add('hidden');
    } else {
      setTimeout(() => this.checkPWAOffer(), 2000);
    }
  },

  checkPWAOffer() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    const isDismissed = sessionStorage.getItem('pwa_banner_dismissed') === 'true';
    const isAuthVisible = !document.getElementById('screen-auth')?.classList.contains('hidden');

    if (!isStandalone && !isDismissed && !isAuthVisible) {
      const banner = document.getElementById('pwa-install-banner');
      if (banner) banner.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
    }
  },

  installPWA() {
    if (window.deferredInstallPrompt) {
      window.deferredInstallPrompt.prompt();
      window.deferredInstallPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          this.showToast('Instalação iniciada!', 'success');
        }
        window.deferredInstallPrompt = null;
        this.dismissInstallBanner();
      });
      return;
    }

    // Se for iOS / iPhone
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      this.openModal('modal-pwa-ios');
      return;
    }

    // Fallback explicativo para navegadores que não disparam o evento automático
    this.showToast('Para instalar: clique no ícone de instalar na barra de endereço ou no menu (⋮) > "Instalar aplicativo".', 'info');
  },

  dismissInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.classList.add('hidden');
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  },

  openInvestmentGoalsModal() {
    const config = window.StorageService.getConfig();
    document.getElementById('goal-set-patrimonio').value = config.metaInvestimento || 100000;
    document.getElementById('goal-set-aporte').value = config.metaAporteMensal || 1500;
    document.getElementById('goal-set-renda').value = config.metaRendaPassiva || 500;
    this.openModal('modal-investment-goals');
  },

  handleSaveInvestmentGoals(e) {
    e.preventDefault();
    const metaInvestimento = parseFloat(document.getElementById('goal-set-patrimonio').value) || 100000;
    const metaAporteMensal = parseFloat(document.getElementById('goal-set-aporte').value) || 1500;
    const metaRendaPassiva = parseFloat(document.getElementById('goal-set-renda').value) || 500;

    window.StorageService.saveConfig({
      metaInvestimento,
      metaAporteMensal,
      metaRendaPassiva
    });

    this.closeModal('modal-investment-goals');
    this.showToast('Metas de investimento atualizadas!', 'success');
    this.render();
  },

};

window.App = App;

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  App.init();

  // Registra o Service Worker (PWA)
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js')
      .then(() => console.log('PWA Service Worker ativo!'))
      .catch(err => console.log('SW registration:', err));
  }
});

