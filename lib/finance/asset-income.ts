import type { AssetIncome, Categoria } from '@/types';
import { monthKeyFromDate, currentMonthKey } from './utils';

// =============================================================================
// MÓDULO DE AGREGAÇÃO — Rendimentos por Ativo
// =============================================================================

export interface IncomeByAsset {
  identificador: string;
  categoria: Categoria;
  total: number;
  totalMesAtual: number;
  quantidadeLancamentos: number;
  ultimoRecebimento: string | null; // data ISO do lançamento mais recente
}

/** Agrupa os rendimentos por ativo (ticker ou nome do produto/fundo). */
export function groupIncomeByAsset(income: AssetIncome[]): IncomeByAsset[] {
  const map: Record<string, IncomeByAsset> = {};
  const mesAtual = currentMonthKey();

  income.forEach((i) => {
    const key = i.identificador;
    if (!map[key]) {
      map[key] = { identificador: key, categoria: i.categoria, total: 0, totalMesAtual: 0, quantidadeLancamentos: 0, ultimoRecebimento: null };
    }
    map[key].total += i.valor;
    map[key].quantidadeLancamentos += 1;
    if (monthKeyFromDate(i.data) === mesAtual) {
      map[key].totalMesAtual += i.valor;
    }
    if (!map[key].ultimoRecebimento || i.data > map[key].ultimoRecebimento!) {
      map[key].ultimoRecebimento = i.data;
    }
  });

  return Object.values(map).sort((a, b) => b.total - a.total);
}

export interface MonthlyIncomePoint {
  monthKey: string;
  total: number;
}

/** Total de rendimentos recebidos por mês, para os últimos N meses (gráfico de evolução). */
export function getMonthlyIncomeHistory(income: AssetIncome[], months = 6): MonthlyIncomePoint[] {
  const now = new Date();
  const points: MonthlyIncomePoint[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = d.toISOString().slice(0, 7);
    const total = income.filter((entry) => monthKeyFromDate(entry.data) === monthKey).reduce((acc, entry) => acc + entry.valor, 0);
    points.push({ monthKey, total });
  }

  return points;
}

export function getTotalIncomeReceived(income: AssetIncome[]): number {
  return income.reduce((acc, i) => acc + i.valor, 0);
}

export function getTotalIncomeThisMonth(income: AssetIncome[]): number {
  const mesAtual = currentMonthKey();
  return income.filter((i) => monthKeyFromDate(i.data) === mesAtual).reduce((acc, i) => acc + i.valor, 0);
}

export const TIPO_RENDIMENTO_LABELS: Record<string, string> = {
  dividendo: 'Dividendo',
  jcp: 'JCP',
  rendimento_fii: 'Rendimento FII',
  cupom: 'Cupom',
  amortizacao: 'Amortização',
  outro: 'Outro',
};
