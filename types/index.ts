// =============================================================================
// Tipos de domínio — Investimentos
// =============================================================================

export type Categoria = 'bolsa' | 'renda_fixa' | 'tesouro' | 'fundos' | 'cripto';
export type TipoAtivo = 'acao' | 'fii';
export type Indexador = 'CDI' | 'PREFIXADO' | 'IPCA';
export type ProdutoTipo = 'CDB' | 'LCI' | 'LCA' | 'Tesouro';
export type TipoFundo = 'multimercado' | 'acoes' | 'cambial' | 'renda_fixa';

export interface Transaction {
  id: string;
  user_id: string;
  categoria: Categoria;

  // Bolsa
  tipo_ativo?: TipoAtivo | null;
  ticker?: string | null;
  quantidade?: number | null;
  valor_unitario?: number | null;
  data_compra?: string | null;

  // Renda Fixa / Tesouro
  nome_produto?: string | null;
  produto_tipo?: ProdutoTipo | string | null;
  valor_investido?: number | null;
  data_aplicacao?: string | null;
  indexador?: Indexador | null;
  taxa_contratada?: number | null;
  data_vencimento?: string | null;

  // Fundos
  nome_fundo?: string | null;
  tipo_fundo?: TipoFundo | string | null;
  cotas?: number | null;
  valor_cota_compra?: number | null;
  valor_cota_atual?: number | null;

  // Cripto
  ativo?: string | null;
  fracao?: number | null;
  valor_total_pago?: number | null;

  created_at: string;
}

export type NewTransaction = Omit<Transaction, 'id' | 'user_id' | 'created_at'>;

export interface UserConfig {
  user_id: string;
  selic_meta: number;
  cdi_spread: number;
  last_calibration: string | null;
  updated_at: string;
}

export interface Quote {
  user_id: string;
  ticker: string;
  preco_atual: number | null;
  vp_contabil: number | null;
  dividendo_medio: number | null;
  updated_at: string;
}

// Posições consolidadas (calculadas no cliente a partir das transações)

export interface StockPosition {
  ticker: string;
  tipo: TipoAtivo;
  qtd: number;
  custoTotal: number;
  precoMedio: number;
  precoAtual: number;
  valorAtualizado: number;
  lucro: number;
  lucroPct: number;
  vpContabil: number | null;
  pvp: number | null;
  isPennyStock: boolean;
  isDesconto: boolean;
  dividendoMedio: number | null;
}

export interface FixedIncomePosition extends Transaction {
  diasCorridos: number;
  diasUteis: number;
  valorBruto: number;
  rendimentoBruto: number;
  iofAliquota: number;
  iofValor: number;
  irAliquota: number;
  irValor: number;
  isento: boolean;
  valorLiquido: number;
  lucro: number;
  lucroPct: number;
}

export interface FundPosition {
  nomeFundo: string;
  tipoFundo: string;
  cotas: number;
  custoTotal: number;
  valorCotaAtual: number;
  valorAtualizado: number;
  lucro: number;
  lucroPct: number;
}

export interface CryptoPosition {
  ativo: string;
  fracao: number;
  custoTotal: number;
  precoUnitario: number;
  valorAtualizado: number;
  lucro: number;
  lucroPct: number;
}

export interface PortfolioSummary {
  totals: {
    bolsa: number;
    rendaFixa: number;
    tesouro: number;
    fundos: number;
    cripto: number;
  };
  custos: {
    bolsa: number;
    rendaFixa: number;
    tesouro: number;
    fundos: number;
    cripto: number;
  };
  patrimonioTotal: number;
  custoTotal: number;
  lucroTotal: number;
  lucroTotalPct: number;
  rendaPassiva: number;
  positions: {
    stocks: StockPosition[];
    fixedIncome: FixedIncomePosition[];
    treasury: FixedIncomePosition[];
    funds: FundPosition[];
    crypto: CryptoPosition[];
  };
}

// =============================================================================
// Tipos de domínio — Controle Financeiro
// =============================================================================

export type FinanceEntryTipo = 'receita' | 'despesa' | 'provento';

export interface FinanceEntry {
  id: string;
  user_id: string;
  tipo: FinanceEntryTipo;
  categoria: string;
  descricao: string | null;
  valor: number;
  data: string;
  recorrente: boolean;
  ticker_origem: string | null;
  created_at: string;
}

export type NewFinanceEntry = Omit<FinanceEntry, 'id' | 'user_id' | 'created_at'>;

export type DebtTipo = 'cartao' | 'emprestimo' | 'financiamento' | 'outro';

export interface Debt {
  id: string;
  user_id: string;
  nome: string;
  tipo: DebtTipo;
  valor_total: number;
  valor_pago: number;
  taxa_juros_mensal: number | null;
  parcelas_total: number | null;
  parcelas_pagas: number;
  data_inicio: string | null;
  data_vencimento_proxima: string | null;
  quitada: boolean;
  created_at: string;
}

export type NewDebt = Omit<Debt, 'id' | 'user_id' | 'created_at'>;

export interface FinancialGoal {
  id: string;
  user_id: string;
  nome: string;
  valor_meta: number;
  valor_atual: number;
  data_limite: string | null;
  cor: string;
  concluida: boolean;
  created_at: string;
}

export type NewFinancialGoal = Omit<FinancialGoal, 'id' | 'user_id' | 'created_at'>;

export interface BudgetLimit {
  id: string;
  user_id: string;
  categoria: string;
  limite_mensal: number;
  created_at: string;
}

export type NewBudgetLimit = Omit<BudgetLimit, 'id' | 'user_id' | 'created_at'>;
