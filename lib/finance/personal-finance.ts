import type { FinanceEntry, Debt, FinancialGoal, BudgetLimit } from '@/types';
import { monthKeyFromDate, currentMonthKey } from './utils';

// =============================================================================
// MÓDULO DE CONTROLE FINANCEIRO
// Saldo mensal, orçamento por categoria, progresso de dívidas e metas.
// =============================================================================

export interface MonthlySummary {
  receitas: number;
  despesas: number;
  proventos: number;
  saldo: number; // receitas + proventos - despesas
}

export function getMonthlySummary(entries: FinanceEntry[], monthKey: string = currentMonthKey()): MonthlySummary {
  const doMes = entries.filter((e) => monthKeyFromDate(e.data) === monthKey);
  const receitas = doMes.filter((e) => e.tipo === 'receita').reduce((acc, e) => acc + e.valor, 0);
  const despesas = doMes.filter((e) => e.tipo === 'despesa').reduce((acc, e) => acc + e.valor, 0);
  const proventos = doMes.filter((e) => e.tipo === 'provento').reduce((acc, e) => acc + e.valor, 0);
  return { receitas, despesas, proventos, saldo: receitas + proventos - despesas };
}

export interface CategoryBudgetStatus {
  categoria: string;
  gasto: number;
  limite: number;
  percentual: number; // 0-100+
  estourou: boolean;
}

/** Cruza os gastos do mês (despesas) com os limites de orçamento definidos pelo usuário. */
export function getBudgetStatus(
  entries: FinanceEntry[],
  budgets: BudgetLimit[],
  monthKey: string = currentMonthKey()
): CategoryBudgetStatus[] {
  const doMes = entries.filter((e) => e.tipo === 'despesa' && monthKeyFromDate(e.data) === monthKey);
  const gastoPorCategoria: Record<string, number> = {};
  doMes.forEach((e) => {
    gastoPorCategoria[e.categoria] = (gastoPorCategoria[e.categoria] || 0) + e.valor;
  });

  return budgets.map((b) => {
    const gasto = gastoPorCategoria[b.categoria] || 0;
    const percentual = b.limite_mensal > 0 ? (gasto / b.limite_mensal) * 100 : 0;
    return {
      categoria: b.categoria,
      gasto,
      limite: b.limite_mensal,
      percentual,
      estourou: gasto > b.limite_mensal,
    };
  });
}

/** Agrupa despesas do mês por categoria, mesmo sem orçamento definido (para gráficos). */
export function getExpensesByCategory(entries: FinanceEntry[], monthKey: string = currentMonthKey()): Record<string, number> {
  const doMes = entries.filter((e) => e.tipo === 'despesa' && monthKeyFromDate(e.data) === monthKey);
  const result: Record<string, number> = {};
  doMes.forEach((e) => {
    result[e.categoria] = (result[e.categoria] || 0) + e.valor;
  });
  return result;
}

export interface DebtProgress extends Debt {
  saldoRestante: number;
  percentualPago: number;
  parcelaEstimada: number | null;
}

export function getDebtsProgress(debts: Debt[]): DebtProgress[] {
  return debts.map((d) => {
    const saldoRestante = Math.max(0, d.valor_total - d.valor_pago);
    const percentualPago = d.valor_total > 0 ? (d.valor_pago / d.valor_total) * 100 : 0;
    const parcelasRestantes = d.parcelas_total ? d.parcelas_total - d.parcelas_pagas : null;
    const parcelaEstimada = parcelasRestantes && parcelasRestantes > 0 ? saldoRestante / parcelasRestantes : null;
    return { ...d, saldoRestante, percentualPago, parcelaEstimada };
  });
}

export function getTotalDebt(debts: Debt[]): { totalDevido: number; totalPago: number; totalRestante: number } {
  const totalDevido = debts.filter((d) => !d.quitada).reduce((acc, d) => acc + d.valor_total, 0);
  const totalPago = debts.filter((d) => !d.quitada).reduce((acc, d) => acc + d.valor_pago, 0);
  return { totalDevido, totalPago, totalRestante: totalDevido - totalPago };
}

export interface GoalProgress extends FinancialGoal {
  percentual: number;
  faltam: number;
}

export function getGoalsProgress(goals: FinancialGoal[]): GoalProgress[] {
  return goals.map((g) => {
    const percentual = g.valor_meta > 0 ? Math.min(100, (g.valor_atual / g.valor_meta) * 100) : 0;
    const faltam = Math.max(0, g.valor_meta - g.valor_atual);
    return { ...g, percentual, faltam };
  });
}

/** Categorias padrão sugeridas para receitas, despesas e proventos. */
export const CATEGORIAS_RECEITA = ['Salário', 'Freelance', 'Pró-labore', 'Aluguel recebido', 'Outros'];
export const CATEGORIAS_DESPESA = [
  'Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação',
  'Lazer', 'Assinaturas', 'Vestuário', 'Cartão de Crédito', 'Outros',
];
export const CATEGORIAS_PROVENTO = ['Dividendo', 'JCP', 'Rendimento FII', 'Juros Renda Fixa', 'Outros'];
