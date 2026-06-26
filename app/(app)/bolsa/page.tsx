'use client';

import { useMemo, useState } from 'react';
import { usePortfolioData } from '@/lib/hooks/usePortfolioData';
import { useLiveStockQuotes } from '@/lib/hooks/useQuotes';
import { getStockPositions } from '@/lib/finance/portfolio';
import { PulseDot } from '@/components/ui';
import { IconSort } from '@/components/ui/icons';
import { StockTable } from '@/components/bolsa/StockTable';
import { MagicNumberPanel } from '@/components/bolsa/MagicNumberPanel';
import type { TipoAtivo } from '@/types';

export default function BolsaPage() {
  const { transactions, quotes, loading } = usePortfolioData();
  const [tab, setTab] = useState<'todos' | TipoAtivo>('todos');
  const [sortByDiscount, setSortByDiscount] = useState(false);

  const allTickers = useMemo(() => {
    const set = new Set<string>();
    transactions.filter((t) => t.categoria === 'bolsa' && t.ticker).forEach((t) => set.add(t.ticker!));
    return Array.from(set);
  }, [transactions]);

  const basePrices = useMemo(() => {
    const map: Record<string, number> = {};
    allTickers.forEach((ticker) => {
      const quote = quotes[ticker];
      if (quote?.preco_atual) map[ticker] = quote.preco_atual;
    });
    return map;
  }, [allTickers, quotes]);

  const { quotes: livePrices, setManualPrice } = useLiveStockQuotes(allTickers, basePrices);

  // Mescla preços simulados em tempo real com os dados salvos (VP, dividendo) do banco
  const quotesWithLivePrice = useMemo(() => {
    const merged = { ...quotes };
    Object.entries(livePrices).forEach(([ticker, price]) => {
      merged[ticker] = { ...(merged[ticker] || { user_id: '', ticker, vp_contabil: null, dividendo_medio: null, updated_at: '' }), preco_atual: price };
    });
    return merged;
  }, [quotes, livePrices]);

  let positions = useMemo(
    () => getStockPositions(transactions, quotesWithLivePrice),
    [transactions, quotesWithLivePrice]
  );

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
    () => getStockPositions(transactions, quotesWithLivePrice).filter((p) => p.tipo === 'fii'),
    [transactions, quotesWithLivePrice]
  );

  if (loading) return <div className="animate-pulse h-96 bg-surface-2 rounded-[20px]" />;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h1 className="font-display text-[26px] font-bold">Bolsa de Valores</h1>
          <p className="text-text-3 text-[13.5px] mt-0.5">Ações e Fundos Imobiliários — preços atualizados em simulação contínua</p>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-text-3">
          <PulseDot /> Mercado simulado ao vivo
        </div>
      </div>

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
        <StockTable positions={positions} onManualPriceChange={setManualPrice} />
      </div>

      {fiiList.length > 0 && <MagicNumberPanel fiiList={fiiList} />}
    </div>
  );
}
