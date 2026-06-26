'use client';

import { StatCard } from '@/components/ui';
import { fmtBRL } from '@/lib/finance/utils';
import type { MonthlySummary } from '@/lib/finance/personal-finance';

export function MonthlySummaryCards({ summary }: { summary: MonthlySummary }) {
  const saldoPositivo = summary.saldo >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px]">
      <StatCard eyebrow="Receitas do Mês" value={fmtBRL(summary.receitas)} valueColor="text-neon" glowColor="bg-neon" />
      <StatCard eyebrow="Despesas do Mês" value={fmtBRL(summary.despesas)} valueColor="text-red" glowColor="bg-red" />
      <StatCard eyebrow="Proventos Recebidos" value={fmtBRL(summary.proventos)} valueColor="text-gold" glowColor="bg-gold" />
      <StatCard
        eyebrow="Saldo do Mês"
        value={`${saldoPositivo ? '+' : ''}${fmtBRL(summary.saldo)}`}
        valueColor={saldoPositivo ? 'text-neon' : 'text-red'}
        glowColor={saldoPositivo ? 'bg-neon' : 'bg-red'}
        delta={saldoPositivo ? 'Sobrou no mês' : 'Déficit no mês'}
      />
    </div>
  );
}
