// =============================================================================
// Utilitários gerais — formatação, datas, helpers
// =============================================================================

export function fmtBRL(value: number | null | undefined, opts: Intl.NumberFormatOptions = {}): string {
  const v = value === null || value === undefined || isNaN(value) ? 0 : value;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', ...opts });
}

export function fmtNum(value: number | null | undefined, digits = 2): string {
  const v = value === null || value === undefined || isNaN(value) ? 0 : value;
  return v.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtPct(value: number | null | undefined, digits = 2): string {
  const v = value === null || value === undefined || isNaN(value) ? 0 : value;
  return v.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits }) + '%';
}

export function fmtDateBR(isoStr: string | null | undefined): string {
  if (!isoStr) return '—';
  const [y, m, d] = isoStr.split('-');
  return `${d}/${m}/${y}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * DIATRABALHOTOTAL — conta dias úteis (seg-sex) entre duas datas,
 * exclusive a inicial, inclusive a final.
 */
export function businessDaysBetween(startISO: string, endISO: string): number {
  if (!startISO || !endISO) return 0;
  const start = new Date(startISO + 'T00:00:00');
  const end = new Date(endISO + 'T00:00:00');
  if (end <= start) return 0;
  let count = 0;
  const cur = new Date(start);
  cur.setDate(cur.getDate() + 1);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export function calendarDaysBetween(startISO: string, endISO: string): number {
  if (!startISO || !endISO) return 0;
  const start = new Date(startISO + 'T00:00:00');
  const end = new Date(endISO + 'T00:00:00');
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
}

export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

/** Retorna o mês atual no formato 'YYYY-MM', usado para filtros de orçamento. */
export function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

export function monthKeyFromDate(isoDate: string): string {
  return isoDate.slice(0, 7);
}
