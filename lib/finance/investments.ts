import { businessDaysBetween, calendarDaysBetween, todayISO } from './utils';
import type { Transaction, FixedIncomePosition, UserConfig } from '@/types';

// =============================================================================
// MÓDULO DE MATEMÁTICA FINANCEIRA — Investimentos
// =============================================================================

/** IOF regressivo — tabela oficial para aplicações com menos de 30 dias corridos. */
const IOF_TABLE = [96,93,90,86,83,80,76,73,70,66,63,60,56,53,50,46,43,40,36,33,30,26,23,20,16,13,10,6,3,0];

export function getIOFAliquota(diasCorridos: number): number {
  if (diasCorridos >= 30) return 0;
  if (diasCorridos <= 0) return IOF_TABLE[0];
  // Dia 1 de aplicação -> índice 0 (96%); dia 29 -> índice 28 (3%); dia 30+ já retornou 0 acima.
  const idx = Math.min(diasCorridos - 1, IOF_TABLE.length - 1);
  return IOF_TABLE[idx];
}

/** IR regressivo sobre renda fixa (tabela padrão brasileira). */
export function getIRAliquota(diasCorridos: number): number {
  if (diasCorridos <= 180) return 22.5;
  if (diasCorridos <= 360) return 20.0;
  if (diasCorridos <= 720) return 17.5;
  return 15.0;
}

/** Converte SELIC Meta em CDI real: CDI = SELIC - spread padrão de mercado. */
export function getCDIFromSelic(selicMeta: number, spread: number): number {
  return Math.max(0, selicMeta - (spread ?? 0.10));
}

/**
 * Valor atual de uma aplicação pós-fixada (% do CDI), convenção 252 du.
 * Valor Atual = Valor Investido * (1 + Taxa_CDI_Anual_Real)^(Dias_Úteis / 252)
 */
export function calcRendaFixaPosFixado(
  valorInvestido: number,
  percentualCDI: number,
  selicMeta: number,
  cdiSpread: number,
  diasUteis: number
): number {
  const cdiAnual = getCDIFromSelic(selicMeta, cdiSpread) / 100;
  const taxaContratadaAnual = cdiAnual * (percentualCDI / 100);
  const fator = Math.pow(1 + taxaContratadaAnual, diasUteis / 252);
  return valorInvestido * fator;
}

/** Valor atual para Prefixado ou IPCA+ (taxa fixa a.a.), mesma convenção 252 du. */
export function calcRendaFixaPrefixado(valorInvestido: number, taxaAnualPct: number, diasUteis: number): number {
  const taxa = taxaAnualPct / 100;
  const fator = Math.pow(1 + taxa, diasUteis / 252);
  return valorInvestido * fator;
}

/** Resultado completo de uma posição de Renda Fixa / Tesouro, com IOF e IR. */
export function computeFixedIncomePosition(
  tx: Transaction,
  config: { selic_meta: number; cdi_spread: number }
): FixedIncomePosition {
  const dataAplicacao = tx.data_aplicacao || todayISO();
  const diasCorridos = calendarDaysBetween(dataAplicacao, todayISO());
  const diasUteis = businessDaysBetween(dataAplicacao, todayISO());

  const valorInvestido = tx.valor_investido || 0;
  const taxaContratada = tx.taxa_contratada || 0;

  let valorBruto: number;
  if (tx.indexador === 'CDI') {
    valorBruto = calcRendaFixaPosFixado(valorInvestido, taxaContratada, config.selic_meta, config.cdi_spread, diasUteis);
  } else {
    valorBruto = calcRendaFixaPrefixado(valorInvestido, taxaContratada, diasUteis);
  }

  const rendimentoBruto = Math.max(0, valorBruto - valorInvestido);

  const iofAliquota = getIOFAliquota(diasCorridos);
  const iofValor = iofAliquota > 0 ? rendimentoBruto * (iofAliquota / 100) : 0;

  const rendimentoAposIOF = rendimentoBruto - iofValor;

  const isento = tx.produto_tipo === 'LCI' || tx.produto_tipo === 'LCA';
  const irAliquota = isento ? 0 : getIRAliquota(diasCorridos);
  const irValor = irAliquota > 0 ? rendimentoAposIOF * (irAliquota / 100) : 0;

  const valorLiquido = valorInvestido + rendimentoAposIOF - irValor;

  return {
    ...tx,
    diasCorridos,
    diasUteis,
    valorBruto,
    rendimentoBruto,
    iofAliquota,
    iofValor,
    irAliquota: isento ? 0 : irAliquota,
    irValor,
    isento,
    valorLiquido,
    lucro: valorLiquido - valorInvestido,
    lucroPct: valorInvestido > 0 ? ((valorLiquido - valorInvestido) / valorInvestido) * 100 : 0,
  };
}

/** P/VP — preço sobre valor patrimonial. < 1.00 indica desconto. */
export function calcPVP(precoAtual: number, vpContabil: number | null | undefined): number | null {
  if (!vpContabil || vpContabil <= 0) return null;
  return precoAtual / vpContabil;
}

/** "Número Mágico" do Efeito Infinito — cotas necessárias para o reinvestimento ser autossustentável. */
export function calcNumeroMagico(precoAtual: number, dividendoMedioPorCota: number | null | undefined): number | null {
  if (!dividendoMedioPorCota || dividendoMedioPorCota <= 0) return null;
  return Math.ceil(precoAtual / dividendoMedioPorCota);
}

/** Renda mensal estimada de uma posição de renda fixa/tesouro pós-fixada ao CDI. */
export function estimateMonthlyIncomeCDI(
  valorInvestido: number,
  percentualCDI: number,
  selicMeta: number,
  cdiSpread: number
): number {
  const taxaMensal = Math.pow(1 + (getCDIFromSelic(selicMeta, cdiSpread) / 100) * (percentualCDI / 100), 1 / 12) - 1;
  return valorInvestido * taxaMensal;
}
