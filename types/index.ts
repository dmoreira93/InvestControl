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
  sem_prazo_resgate?: boolean;

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
  semPrazoResgate: boolean;
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

export interface PatrimonyHistoryPoint {
  monthKey: string;
  label: string;
  custoAcumulado: number;
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

// =============================================================================
// Tipos de domínio — Rendimentos por Ativo
// =============================================================================

export type TipoRendimento = 'dividendo' | 'jcp' | 'rendimento_fii' | 'cupom' | 'amortizacao' | 'outro';

export interface AssetIncome {
  id: string;
  user_id: string;
  categoria: Categoria;
  identificador: string;     // ticker (bolsa/cripto) ou nome_produto/nome_fundo (renda fixa/tesouro/fundos)
  tipo_rendimento: TipoRendimento;
  valor: number;
  data: string;
  observacao: string | null;
  created_at: string;
}

export type NewAssetIncome = Omit<AssetIncome, 'id' | 'user_id' | 'created_at'>;

// =============================================================================
// Tipos de domínio — Análise Fundamentalista
// =============================================================================

export interface FundamentalsCache {
  user_id: string;
  ticker: string;
  pl: number | null;
  pvp: number | null;
  roe: number | null;
  dividend_yield: number | null;
  ev_ebitda: number | null;
  enterprise_value: number | null;
  cash: number | null;
  market_cap: number | null;
  fonte: 'api' | 'manual';
  updated_at: string;
}

export type NewFundamentalsCache = Omit<FundamentalsCache, 'updated_at'>;

/** Valor de empresa sobre caixa, derivado: indica quantas vezes o caixa "cabe" no EV. */
export function calcEvSobreCaixa(enterpriseValue: number | null, cash: number | null): number | null {
  if (!enterpriseValue || !cash || cash <= 0) return null;
  return enterpriseValue / cash;
}

// =============================================================================
// Tipos de domínio — Política de Provento
// =============================================================================

export type Periodicidade = 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual' | 'irregular';

export interface DividendPolicy {
  user_id: string;
  ticker: string;
  periodicidade: Periodicidade;
  dia_pagamento: number | null;
  valor_por_cota: number;
  data_inicio: string;
  ativo: boolean;
  observacao: string | null;
  updated_at: string;
}

export type NewDividendPolicy = Omit<DividendPolicy, 'updated_at'>;

/** Quantos meses se passam entre um pagamento e o próximo, por periodicidade. */
export const PERIODICIDADE_INTERVALO_MESES: Record<Periodicidade, number> = {
  mensal: 1,
  bimestral: 2,
  trimestral: 3,
  semestral: 6,
  anual: 12,
  irregular: 1, // tratado mês a mês como se fosse mensal (melhor estimativa possível)
};

export const PERIODICIDADE_LABELS: Record<Periodicidade, string> = {
  mensal: 'Mensal',
  bimestral: 'Bimestral',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
  irregular: 'Irregular / Variável',
};


