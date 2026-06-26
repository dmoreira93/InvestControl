'use client';

import { useMemo, useState } from 'react';
import { usePersonalFinanceData } from '@/lib/hooks/usePersonalFinanceData';
import { getMonthlySummary, getExpensesByCategory } from '@/lib/finance/personal-finance';
import { MonthlySummaryCards } from '@/components/financas/MonthlySummaryCards';
import { ExpensesByCategoryChart } from '@/components/financas/ExpensesByCategoryChart';
import { EntriesPanel } from '@/components/financas/EntriesPanel';
import { BudgetPanel } from '@/components/financas/BudgetPanel';
import { DebtsPanel } from '@/components/financas/DebtsPanel';
import { GoalsPanel } from '@/components/financas/GoalsPanel';
import { IconWallet, IconAdd, IconCreditCard, IconTarget } from '@/components/ui/icons';

const TABS = [
  { id: 'resumo', label: 'Resumo do Mês', Icon: IconWallet },
  { id: 'lancamentos', label: 'Lançamentos', Icon: IconAdd },
  { id: 'orcamento', label: 'Orçamento', Icon: IconWallet },
  { id: 'dividas', label: 'Dívidas', Icon: IconCreditCard },
  { id: 'metas', label: 'Metas', Icon: IconTarget },
] as const;

type TabId = typeof TABS[number]['id'];

export default function FinancasPage() {
  const { entries, debts, goals, loading } = usePersonalFinanceData();
  const [tab, setTab] = useState<TabId>('resumo');

  const monthlySummary = useMemo(() => getMonthlySummary(entries), [entries]);
  const expensesByCategory = useMemo(() => getExpensesByCategory(entries), [entries]);

  if (loading) return <div className="animate-pulse h-96 bg-surface-2 rounded-[20px]" />;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-[26px] font-bold">Controle Financeiro</h1>
        <p className="text-text-3 text-[13.5px] mt-0.5">Receitas, despesas, proventos, dívidas e metas — tudo em um só lugar</p>
      </div>

      <div className="flex gap-1 bg-surface-2 p-1 rounded-[12px] border border-border-soft w-fit mb-6 overflow-x-auto max-w-full">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-[9px] text-[13px] font-semibold whitespace-nowrap transition-colors
              ${tab === id ? 'bg-surface-3 text-text-1' : 'text-text-3 hover:text-text-2'}`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'resumo' && (
        <div className="flex flex-col gap-5">
          <MonthlySummaryCards summary={monthlySummary} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-surface border border-border-soft rounded-[20px] p-[22px]">
              <h2 className="font-display text-[16px] font-semibold mb-1">Despesas por Categoria</h2>
              <p className="text-[12.5px] text-text-3 mb-3">Distribuição dos gastos do mês atual</p>
              <ExpensesByCategoryChart data={expensesByCategory} />
            </div>
            <div className="bg-surface border border-border-soft rounded-[20px] p-[22px]">
              <h2 className="font-display text-[16px] font-semibold mb-4">Visão Geral</h2>
              <div className="flex flex-col gap-3 text-[13.5px]">
                <SummaryRow label="Dívidas ativas" value={String(debts.filter((d) => !d.quitada).length)} />
                <SummaryRow label="Dívidas quitadas" value={String(debts.filter((d) => d.quitada).length)} />
                <SummaryRow label="Metas em progresso" value={String(goals.filter((g) => !g.concluida).length)} />
                <SummaryRow label="Metas concluídas" value={String(goals.filter((g) => g.concluida).length)} />
                <SummaryRow label="Lançamentos totais" value={String(entries.length)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'lancamentos' && <EntriesPanel />}
      {tab === 'orcamento' && <BudgetPanel />}
      {tab === 'dividas' && <DebtsPanel />}
      {tab === 'metas' && <GoalsPanel />}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border-soft last:border-b-0">
      <span className="text-text-3">{label}</span>
      <span className="font-mono font-semibold">{value}</span>
    </div>
  );
}
