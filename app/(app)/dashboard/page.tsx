'use client';

import Link from 'next/link';
import { usePortfolioData } from '@/lib/hooks/usePortfolioData';
import { useConfig } from '@/lib/hooks/useConfig';
import { useDividendPolicyData } from '@/lib/hooks/useDividendPolicyData';
import { getPortfolioSummary, getPatrimonyHistory } from '@/lib/finance/portfolio';
import { useBitcoinPrice } from '@/lib/hooks/useQuotes';
import { fmtBRL, fmtPct } from '@/lib/finance/utils';
import { StatCard, EmptyState, Button } from '@/components/ui';
import { PulseDot } from '@/components/ui';
import { IconEmpty, IconAdd } from '@/components/ui/icons';
import { AllocationChart, GrowthChart } from '@/components/dashboard/Charts';
import { useMemo } from 'react';

export default function DashboardPage() {
  const { transactions, quotes, loading } = usePortfolioData();
  const { config } = useConfig();
  const { policies, loading: loadingPolicies } = useDividendPolicyData();
  const { price: btcPrice } = useBitcoinPrice();

  const summary = useMemo(
    () => getPortfolioSummary(transactions, config, quotes, btcPrice, policies),
    [transactions, config, quotes, btcPrice, policies]
  );

  const history = useMemo(() => getPatrimonyHistory(transactions), [transactions]);

  const hasData = transactions.length > 0;
  const lucroUp = summary.lucroTotal >= 0;

  if (loading || loadingPolicies) {
    return <PageSkeleton />;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between gap-4 mb-7 flex-wrap">
        <div>
          <h1 className="font-display text-[26px] font-bold">Dashboard Geral</h1>
          <p className="text-text-3 text-[13.5px] mt-0.5">Visão consolidada de todo o seu patrimônio investido</p>
        </div>
        <div className="flex items-center gap-2 text-[12.5px] text-text-3">
          <PulseDot /> Cotações atualizando em tempo real
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px] mb-6">
        <StatCard
          eyebrow="Patrimônio Total"
          value={fmtBRL(summary.patrimonioTotal)}
          delta="Consolidado em todas as classes"
          glowColor="bg-purple-bright"
        />
        <StatCard
          eyebrow="Lucro / Prejuízo Total"
          value={`${lucroUp ? '+' : ''}${fmtBRL(summary.lucroTotal)}`}
          valueColor={lucroUp ? 'text-neon' : 'text-red'}
          delta={<span className={lucroUp ? 'text-neon' : 'text-red'}>{lucroUp ? '+' : ''}{fmtPct(summary.lucroTotalPct)}</span>}
          glowColor={lucroUp ? 'bg-neon' : 'bg-red'}
        />
        <StatCard
          eyebrow="Renda Passiva Estimada"
          value={fmtBRL(summary.rendaPassiva)}
          valueColor="text-gold"
          delta="Projeção real para o próximo mês"
          glowColor="bg-gold"
        />
        <StatCard
          eyebrow="Total de Posições"
          value={String(transactions.length)}
          delta="Transações cadastradas"
          glowColor="bg-purple"
        />
      </div>

      {!hasData ? (
        <div className="bg-surface border border-border-soft rounded-[20px]">
          <EmptyState
            icon={<IconEmpty className="w-10 h-10" />}
            title="Nenhuma transação cadastrada ainda"
            description="Comece cadastrando sua primeira compra para ver os gráficos e indicadores."
          />
          <div className="flex justify-center pb-6">
            <Link href="/cadastro-transacao">
              <Button variant="primary"><IconAdd className="w-4 h-4" /> Cadastrar primeira transação</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[18px]">
          <div className="bg-surface border border-border-soft rounded-[20px] p-[22px]">
            <div className="mb-4">
              <h2 className="font-display text-[17px] font-semibold">Alocação por Classe de Ativos</h2>
              <p className="text-[12.5px] text-text-3 mt-0.5">Distribuição do patrimônio entre Bolsa, Renda Fixa, Tesouro, Fundos e Cripto</p>
            </div>
            <div className="h-[280px] relative">
              <AllocationChart totals={summary.totals} />
            </div>
          </div>
          <div className="bg-surface border border-border-soft rounded-[20px] p-[22px]">
            <div className="mb-4">
              <h2 className="font-display text-[17px] font-semibold">Evolução do Capital Investido</h2>
              <p className="text-[12.5px] text-text-3 mt-0.5">
                {history.length > 1
                  ? 'Total investido (custo histórico) acumulado mês a mês, a partir da sua primeira transação'
                  : 'Cadastre transações em mais de um mês para ver a evolução ao longo do tempo'}
              </p>
            </div>
            <div className="h-[280px] relative">
              {history.length > 1 ? (
                <GrowthChart history={history} />
              ) : (
                <div className="h-full flex items-center justify-center text-text-3 text-[13px] text-center px-6">
                  Ainda não há histórico suficiente. Esse gráfico mostra a evolução real do quanto você investiu mês a mês — volte aqui no próximo mês para começar a ver a curva.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-64 bg-surface-2 rounded mb-2" />
      <div className="h-4 w-96 bg-surface-2 rounded mb-7" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px]">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[110px] bg-surface-2 rounded-[20px]" />
        ))}
      </div>
    </div>
  );
}
