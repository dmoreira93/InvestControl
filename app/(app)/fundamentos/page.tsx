'use client';

import { useMemo } from 'react';
import { usePortfolioData } from '@/lib/hooks/usePortfolioData';
import { useFundamentalsData } from '@/lib/hooks/useFundamentalsData';
import { Button } from '@/components/ui';
import { IconRefresh, IconAlert } from '@/components/ui/icons';
import { FundamentalsTable } from '@/components/fundamentos/FundamentalsTable';
import type { FundamentalsCache } from '@/types';

export default function FundamentosPage() {
  const { transactions, loading: loadingPortfolio } = usePortfolioData();
  const { loading, refreshing, lastUpdated, failedTickers, fundamentals, refresh, upsertManual } = useFundamentalsData();

  const tickersAcoes = useMemo(() => {
    const set = new Set<string>();
    transactions
      .filter((t) => t.categoria === 'bolsa' && t.tipo_ativo === 'acao' && t.ticker)
      .forEach((t) => set.add(t.ticker!));
    return Array.from(set).sort();
  }, [transactions]);

  const rows = useMemo(
    () => tickersAcoes.map((ticker) => ({ ticker, data: fundamentals[ticker] })),
    [tickersAcoes, fundamentals]
  );

  async function handleManualEdit(ticker: string, field: keyof FundamentalsCache, value: number | null) {
    await upsertManual(ticker, { [field]: value } as any);
  }

  if (loading || loadingPortfolio) return <div className="animate-pulse h-96 bg-surface-2 rounded-[20px]" />;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="font-display text-[26px] font-bold">Análise Fundamentalista</h1>
          <p className="text-text-3 text-[13.5px] mt-0.5">P/L, P/VP, ROE, Dividend Yield e EV/Caixa das empresas da sua carteira</p>
        </div>
        <div className="flex items-center gap-3 text-[12px] text-text-3">
          {lastUpdated && !refreshing && (
            <span>Atualizado às {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          )}
          <Button variant="ghost" small onClick={refresh} disabled={refreshing || tickersAcoes.length === 0}>
            <IconRefresh className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Atualizando...' : 'Atualizar via API'}
          </Button>
        </div>
      </div>

      {failedTickers.length > 0 && (
        <div className="flex gap-2.5 p-3.5 px-4 rounded-[12px] border bg-gold/[0.08] border-gold/30 text-[#FFE2A8] text-[12.5px] leading-relaxed mb-4">
          <IconAlert className="text-gold flex-shrink-0 w-4 h-4 mt-0.5" />
          <div>
            Não encontramos dados na API para <strong>{failedTickers.join(', ')}</strong>. Isso pode acontecer com ativos menos líquidos ou BDRs — preencha os campos manualmente na tabela abaixo.
          </div>
        </div>
      )}

      <div className="mb-4 text-[12px] text-text-3">
        Indicadores em branco podem ser preenchidos manualmente — clique no campo, digite o valor e saia do campo (Tab ou clique fora) para salvar.
      </div>

      <FundamentalsTable rows={rows} onManualEdit={handleManualEdit} />
    </div>
  );
}
