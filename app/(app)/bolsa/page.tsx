'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePortfolioData } from '@/lib/hooks/usePortfolioData';
import { useRealStockQuotes } from '@/lib/hooks/useQuotes';
import { getStockPositions } from '@/lib/finance/portfolio';
import { Button } from '@/components/ui';
import { IconSort, IconRefresh, IconAlert } from '@/components/ui/icons';
import { StockTable } from '@/components/bolsa/StockTable';
import { MagicNumberPanel } from '@/components/bolsa/MagicNumberPanel';
import type { TipoAtivo } from '@/types';

export default function BolsaPage() {
  const { transactions, quotes, loading, reload } = usePortfolioData();
  const { loading: refreshing, lastUpdated, failedTickers, refresh } = useRealStockQuotes();
  const [tab, setTab] = useState<'todos' | TipoAtivo>('todos');
  const [sortByDiscount, setSortByDiscount] = useState(false);

  // Quando o refresh de cotações reais termina, recarrega as quotes do banco
  // (que o Route Handler já atualizou) para refletir os novos preços na tela.
  useEffect(() => {
    if (!refreshing && lastUpdated) {
      reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshing, lastUpdated]);

  let positions = useMemo(() => getStockPositions(transactions, quotes), [transactions, quotes]);

  if (tab !== 'todos') {
    positions = positions.filter((p) => p.tipo === tab);
  }
  if (sortByDiscount) {
    positions = [...positions].sort((a, b) => {
      const av = a.pvp === null ? Infinity : a.pvp;
      const bv = b.pvp === null ? Infinity : b.pvp;
      return av - bv;
    });
  }

  const fiiList = useMemo(
    () => getStockPositions(transactions, quotes).filter((p) => p.tipo === 'fii'),
    [transactions, quotes]
  );

  function handleManualPriceChange() {
    // O preço manual já é salvo direto no Supabase via upsertQuote (chamado
    // dentro do StockTable); aqui só recarregamos para refletir na tela.
    reload();
  }

  if (loading) return <div className="animate-pulse h-96 bg-surface-2 rounded-[20px]" />;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h1 className="font-display text-[26px] font-bold">Bolsa de Valores</h1>
          <p className="text-text-3 text-[13.5px] mt-0.5">Ações e Fundos Imobiliários — cotações reais via brapi.dev</p>
        </div>
        <div className="flex items-center gap-3 text-[12px] text-text-3">
          {lastUpdated && !refreshing && (
            <span>Atualizado às {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          )}
          <Button variant="ghost" small onClick={refresh} disabled={refreshing}>
            <IconRefresh className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Atualizando...' : 'Atualizar cotações'}
          </Button>
        </div>
      </div>

      {failedTickers.length > 0 && (
        <div className="flex gap-2.5 p-3.5 px-4 rounded-[12px] border bg-gold/[0.08] border-gold/30 text-[#FFE2A8] text-[12.5px] leading-relaxed mb-4">
          <IconAlert className="text-gold flex-shrink-0 w-4 h-4 mt-0.5" />
          <div>
            Não foi possível atualizar a cotação de <strong>{failedTickers.join(', ')}</strong> agora. Mantendo o último preço salvo — você pode atualizar manualmente na tabela se precisar.
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mb-4.5 flex-wrap">
        <div className="flex gap-1 bg-surface-2 p-1 rounded-[11px] border border-border-soft w-fit">
          {(['todos', 'acao', 'fii'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-[8px] text-[13px] font-semibold ${tab === t ? 'bg-surface-3 text-text-1' : 'text-text-3'}`}
            >
              {t === 'todos' ? 'Todos' : t === 'acao' ? 'Ações' : 'FIIs'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setSortByDiscount((v) => !v)}
          className="flex items-center gap-2 bg-surface-2 text-text-1 border border-border px-3 py-1.5 rounded-[9px] text-[12.5px] font-semibold hover:bg-surface-3"
        >
          <IconSort className="w-4 h-4" /> {sortByDiscount ? 'Ordenado por desconto ✓' : 'Ordenar por maior desconto'}
        </button>
      </div>

      <div className="mb-6">
        <StockTable positions={positions} onManualPriceChange={handleManualPriceChange} />
      </div>

      {fiiList.length > 0 && <MagicNumberPanel fiiList={fiiList} />}
    </div>
  );
}
