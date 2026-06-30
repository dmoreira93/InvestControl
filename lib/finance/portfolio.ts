import type {
  Transaction, Quote, UserConfig, DividendPolicy, PatrimonyHistoryPoint,
  StockPosition, FundPosition, CryptoPosition, PortfolioSummary,
} from '@/types';
import { computeFixedIncomePosition, estimateMonthlyIncomeCDI, calcPVP } from './investments';
import { paysInMonth, projectIncomeForMonth, nextMonthKey, getImplicitMonthlyYield, YIELD_MENSAL_SUSPEITO } from './dividend-policy';

// =============================================================================
// MÓDULO DE AGREGAÇÃO DE PORTFÓLIO
// Consolida a lista de transações (vinda do Supabase) em posições por categoria.
// =============================================================================

function byCategoria(transactions: Transaction[], cat: Transaction['categoria']) {
  return transactions.filter((t) => t.categoria === cat);
}

export function getStockPositions(
  transactions: Transaction[],
  quotesByTicker: Record<string, Quote>
): StockPosition[] {
  const txs = byCategoria(transactions, 'bolsa');
  const map: Record<string, { ticker: string; tipo: 'acao' | 'fii'; qtd: number; custoTotal: number }> = {};

  txs.forEach((t) => {
    const ticker = t.ticker || '';
    if (!map[ticker]) {
      map[ticker] = { ticker, tipo: (t.tipo_ativo as 'acao' | 'fii') || 'acao', qtd: 0, custoTotal: 0 };
    }
    map[ticker].qtd += t.quantidade || 0;
    map[ticker].custoTotal += (t.quantidade || 0) * (t.valor_unitario || 0);
  });

  return Object.values(map).map((p) => {
    const precoMedio = p.qtd > 0 ? p.custoTotal / p.qtd : 0;
    const quote = quotesByTicker[p.ticker];
    const precoAtual = quote?.preco_atual ?? precoMedio;
    const valorAtualizado = precoAtual * p.qtd;
    const lucro = valorAtualizado - p.custoTotal;
    const lucroPct = p.custoTotal > 0 ? (lucro / p.custoTotal) * 100 : 0;
    const vpContabil = quote?.vp_contabil ?? null;
    const pvp = p.tipo === 'fii' ? calcPVP(precoAtual, vpContabil) : null;
    const dividendoMedio = quote?.dividendo_medio ?? null;

    return {
      ...p,
      precoMedio,
      precoAtual,
      valorAtualizado,
      lucro,
      lucroPct,
      vpContabil,
      pvp,
      dividendoMedio,
      isPennyStock: p.tipo === 'acao' && precoAtual < 1.0,
      isDesconto: pvp !== null && pvp < 1.0,
    };
  });
}

export function getFixedIncomePositions(transactions: Transaction[], config: UserConfig) {
  return byCategoria(transactions, 'renda_fixa').map((t) => computeFixedIncomePosition(t, config));
}

export function getTreasuryPositions(transactions: Transaction[], config: UserConfig) {
  return byCategoria(transactions, 'tesouro').map((t) => computeFixedIncomePosition(t, config));
}

export function getFundsPositions(transactions: Transaction[]): FundPosition[] {
  const txs = byCategoria(transactions, 'fundos');
  const map: Record<string, { nomeFundo: string; tipoFundo: string; cotas: number; custoTotal: number; valorCotaAtual: number; semPrazoResgate: boolean }> = {};

  txs.forEach((t) => {
    const key = t.nome_fundo || '';
    if (!map[key]) {
      map[key] = { nomeFundo: key, tipoFundo: t.tipo_fundo || '', cotas: 0, custoTotal: 0, valorCotaAtual: t.valor_cota_atual || 0, semPrazoResgate: false };
    }
    map[key].cotas += t.cotas || 0;
    map[key].custoTotal += (t.cotas || 0) * (t.valor_cota_compra || 0);
    map[key].valorCotaAtual = t.valor_cota_atual || map[key].valorCotaAtual;
    // Se qualquer transação desse fundo foi marcada como "sem prazo de resgate",
    // a posição inteira é tratada como tal (é uma característica do fundo, não do aporte).
    if (t.sem_prazo_resgate) map[key].semPrazoResgate = true;
  });

  return Object.values(map).map((p) => {
    const valorAtualizado = p.cotas * p.valorCotaAtual;
    const lucro = valorAtualizado - p.custoTotal;
    const lucroPct = p.custoTotal > 0 ? (lucro / p.custoTotal) * 100 : 0;
    return { ...p, valorAtualizado, lucro, lucroPct };
  });
}

export function getCryptoPositions(transactions: Transaction[], btcPriceBRL: number | null): CryptoPosition[] {
  const txs = byCategoria(transactions, 'cripto');
  const map: Record<string, { ativo: string; fracao: number; custoTotal: number }> = {};

  txs.forEach((t) => {
    const ativo = t.ativo || '';
    if (!map[ativo]) map[ativo] = { ativo, fracao: 0, custoTotal: 0 };
    map[ativo].fracao += t.fracao || 0;
    map[ativo].custoTotal += t.valor_total_pago || 0;
  });

  const btcPrice = btcPriceBRL || 0;

  return Object.values(map).map((p) => {
    const precoUnitario = p.ativo === 'BTC' ? btcPrice : 0;
    const valorAtualizado = p.fracao * precoUnitario;
    const lucro = valorAtualizado - p.custoTotal;
    const lucroPct = p.custoTotal > 0 ? (lucro / p.custoTotal) * 100 : 0;
    return { ...p, precoUnitario, valorAtualizado, lucro, lucroPct };
  });
}

export function getPortfolioSummary(
  transactions: Transaction[],
  config: UserConfig,
  quotesByTicker: Record<string, Quote>,
  btcPriceBRL: number | null,
  dividendPolicies: Record<string, DividendPolicy> = {}
): PortfolioSummary {
  const stocks = getStockPositions(transactions, quotesByTicker);
  const fixedIncome = getFixedIncomePositions(transactions, config);
  const treasury = getTreasuryPositions(transactions, config);
  const funds = getFundsPositions(transactions);
  const crypto = getCryptoPositions(transactions, btcPriceBRL);

  const sum = <T extends Record<string, any>>(arr: T[], field: keyof T) =>
    arr.reduce((acc, x) => acc + (Number(x[field]) || 0), 0);

  const totals = {
    bolsa: sum(stocks, 'valorAtualizado'),
    rendaFixa: sum(fixedIncome, 'valorLiquido'),
    tesouro: sum(treasury, 'valorLiquido'),
    fundos: sum(funds, 'valorAtualizado'),
    cripto: sum(crypto, 'valorAtualizado'),
  };
  const custos = {
    bolsa: sum(stocks, 'custoTotal'),
    rendaFixa: sum(fixedIncome, 'valor_investido' as any),
    tesouro: sum(treasury, 'valor_investido' as any),
    fundos: sum(funds, 'custoTotal'),
    cripto: sum(crypto, 'custoTotal'),
  };

  const patrimonioTotal = Object.values(totals).reduce((a, b) => a + b, 0);
  const custoTotal = Object.values(custos).reduce((a, b) => a + b, 0);
  const lucroTotal = patrimonioTotal - custoTotal;
  const lucroTotalPct = custoTotal > 0 ? (lucroTotal / custoTotal) * 100 : 0;

  let rendaPassiva = 0;
  fixedIncome.forEach((p) => {
    if (p.indexador === 'CDI') {
      rendaPassiva += estimateMonthlyIncomeCDI(p.valor_investido || 0, p.taxa_contratada || 0, config.selic_meta, config.cdi_spread);
    }
  });
  treasury.forEach((p) => {
    if (p.indexador === 'CDI') {
      rendaPassiva += estimateMonthlyIncomeCDI(p.valor_investido || 0, p.taxa_contratada || 0, config.selic_meta, config.cdi_spread);
    }
  });

  const targetMonth = nextMonthKey();
  stocks.forEach((p) => {
    const policy = dividendPolicies[p.ticker];
    if (!policy || !policy.ativo) return;

    // Trava de sanidade: o yield equivalente mensal implícito não pode passar
    // de ~3% do preço da cota — valor acima disso quase certamente é erro de
    // digitação (ex: confundir valor trimestral com valor mensal, ou casa
    // decimal errada). Ativos com política suspeita não entram na projeção.
    const yieldImplicito = getImplicitMonthlyYield(policy.valor_por_cota, p.precoAtual, policy.periodicidade);
    if (yieldImplicito > YIELD_MENSAL_SUSPEITO) return;

    rendaPassiva += projectIncomeForMonth(policy, p.qtd, targetMonth);
  });

  return {
    totals, custos, patrimonioTotal, custoTotal, lucroTotal, lucroTotalPct, rendaPassiva,
    positions: { stocks, fixedIncome, treasury, funds, crypto },
  };
}

/**
 * Extrai os identificadores únicos (ticker, nome do produto/fundo) de uma
 * categoria, para popular selects de "vincular a um ativo existente" — usado
 * na tela de Rendimentos por Ativo.
 */
export function getIdentifiersByCategoria(transactions: Transaction[], categoria: Transaction['categoria']): string[] {
  const set = new Set<string>();
  transactions
    .filter((t) => t.categoria === categoria)
    .forEach((t) => {
      const id = t.ticker || t.nome_produto || t.nome_fundo || t.ativo;
      if (id) set.add(id);
    });
  return Array.from(set).sort();
}

export type { PatrimonyHistoryPoint } from '@/types';

/**
 * Histórico real de patrimônio: para cada mês desde a primeira transação
 * cadastrada até o mês atual, soma o custo total de tudo que já havia sido
 * comprado até aquele ponto. Isso é uma aproximação por custo histórico
 * (não temos preços de mercado retroativos para Bolsa/Cripto), mas é um
 * dado real derivado das suas transações — não uma simulação inventada.
 *
 * Retorna array vazio se não houver nenhuma transação.
 */
export function getPatrimonyHistory(transactions: Transaction[]): PatrimonyHistoryPoint[] {
  if (transactions.length === 0) return [];

  function custoDaTransacao(t: Transaction): number {
    switch (t.categoria) {
      case 'bolsa': return (t.quantidade || 0) * (t.valor_unitario || 0);
      case 'renda_fixa':
      case 'tesouro': return t.valor_investido || 0;
      case 'fundos': return (t.cotas || 0) * (t.valor_cota_compra || 0);
      case 'cripto': return t.valor_total_pago || 0;
      default: return 0;
    }
  }

  function dataDaTransacao(t: Transaction): string | null | undefined {
    return t.data_compra || t.data_aplicacao;
  }

  const comData = transactions
    .map((t) => ({ data: dataDaTransacao(t), custo: custoDaTransacao(t) }))
    .filter((t): t is { data: string; custo: number } => !!t.data);

  if (comData.length === 0) return [];

  const datas = comData.map((t) => t.data).sort();
  const primeiraData = new Date(datas[0] + 'T00:00:00');
  const hoje = new Date();

  const mesesDesdeInicio = (hoje.getFullYear() - primeiraData.getFullYear()) * 12 + (hoje.getMonth() - primeiraData.getMonth());
  const totalMeses = Math.max(0, mesesDesdeInicio) + 1; // inclusive o mês atual

  const points: PatrimonyHistoryPoint[] = [];
  for (let i = 0; i < totalMeses; i++) {
    const d = new Date(primeiraData.getFullYear(), primeiraData.getMonth() + i, 1);
    const monthKey = d.toISOString().slice(0, 7);
    // Considera o último dia do mês de referência como corte, para incluir
    // todas as transações feitas naquele mês.
    const fimDoMes = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);

    const custoAcumulado = comData
      .filter((t) => t.data <= fimDoMes)
      .reduce((acc, t) => acc + t.custo, 0);

    points.push({
      monthKey,
      label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      custoAcumulado,
    });
  }

  return points;
}


