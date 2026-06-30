import type { DividendPolicy, Periodicidade } from '@/types';
import { PERIODICIDADE_INTERVALO_MESES } from '@/types';

// =============================================================================
// MÓDULO DE PROJEÇÃO DE PROVENTOS
// Calcula se/quando um ativo paga provento em um determinado mês, com base na
// política cadastrada (periodicidade + dia + valor por cota + data de início).
// =============================================================================

/**
 * Verifica se a política de provento prevê pagamento no mês de referência
 * (targetMonthKey, formato 'YYYY-MM'), considerando a periodicidade e a
 * data de início da política.
 *
 * Regra: contamos quantos meses se passaram desde data_inicio até o mês de
 * referência; se esse número for múltiplo do intervalo da periodicidade
 * (ex: trimestral = 3), o ativo paga nesse mês. Periodicidade "irregular"
 * é tratada como mensal (estimativa mais conservadora possível sem dados
 * de histórico de pagamento).
 */
export function paysInMonth(policy: DividendPolicy, targetMonthKey: string): boolean {
  if (!policy.ativo) return false;

  const [startYear, startMonth] = policy.data_inicio.slice(0, 7).split('-').map(Number);
  const [targetYear, targetMonth] = targetMonthKey.split('-').map(Number);

  const mesesDesdeInicio = (targetYear - startYear) * 12 + (targetMonth - startMonth);
  if (mesesDesdeInicio < 0) return false; // mês de referência é anterior ao início da política

  const intervalo = PERIODICIDADE_INTERVALO_MESES[policy.periodicidade];
  return mesesDesdeInicio % intervalo === 0;
}

/**
 * Projeta o valor total a receber de um ativo em um mês específico, dado a
 * quantidade de cotas possuída. Retorna 0 se a política não prevê pagamento
 * naquele mês (ex: FII trimestral fora do ciclo).
 */
export function projectIncomeForMonth(policy: DividendPolicy, qtd: number, targetMonthKey: string): number {
  if (!paysInMonth(policy, targetMonthKey)) return 0;
  return qtd * policy.valor_por_cota;
}

/** Mês de referência atual no formato 'YYYY-MM', usado para a projeção do Dashboard. */
export function nextMonthKey(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 7);
}

/**
 * Data prevista do próximo pagamento (próximo mês em que a política prevê
 * pagamento, a partir de hoje), combinando o mês projetado com o dia
 * cadastrado. Retorna null se não houver dia definido ou política inativa.
 */
export function getNextPaymentDate(policy: DividendPolicy): string | null {
  if (!policy.ativo || !policy.dia_pagamento) return null;

  const hoje = new Date();
  // Procura, a partir do mês atual, o próximo mês em que a política paga
  // (no máximo 12 meses adiante, suficiente até para periodicidade anual).
  for (let i = 0; i <= 12; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
    const monthKey = d.toISOString().slice(0, 7);
    if (paysInMonth(policy, monthKey)) {
      const diaDisponivel = Math.min(policy.dia_pagamento, diasNoMes(d.getFullYear(), d.getMonth()));
      const dataPagamento = new Date(d.getFullYear(), d.getMonth(), diaDisponivel);
      // Se esse mês já passou do dia de pagamento, continua procurando o próximo ciclo
      if (i === 0 && dataPagamento < hoje) continue;
      return dataPagamento.toISOString().slice(0, 10);
    }
  }
  return null;
}

function diasNoMes(ano: number, mesIndex0: number): number {
  return new Date(ano, mesIndex0 + 1, 0).getDate();
}

/**
 * Yield mensal implícito da política (valor por cota / preço atual da cota).
 * Usado como trava de sanidade — mesma lógica que já existia no campo simples
 * de dividendo médio, agora aplicada à política completa.
 */
export function getImplicitMonthlyYield(valorPorCota: number, precoAtual: number, periodicidade: Periodicidade): number {
  if (precoAtual <= 0) return 0;
  const intervalo = PERIODICIDADE_INTERVALO_MESES[periodicidade];
  // Normaliza para "equivalente mensal": um pagamento trimestral de X é
  // comparável a X/3 por mês para fins de checagem de plausibilidade.
  return (valorPorCota / intervalo) / precoAtual;
}

export const YIELD_MENSAL_SUSPEITO = 0.03;
