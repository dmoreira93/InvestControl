'use client';

import { useState, useEffect } from 'react';
import { Select, Input, ProgressBar, InputGroup, Label } from '@/components/ui';
import { calcNumeroMagico } from '@/lib/finance/investments';
import { fmtNum } from '@/lib/finance/utils';
import { usePortfolioData } from '@/lib/hooks/usePortfolioData';
import type { StockPosition } from '@/types';

export function MagicNumberPanel({ fiiList }: { fiiList: StockPosition[] }) {
  const { upsertQuote } = usePortfolioData();
  const [selectedTicker, setSelectedTicker] = useState(fiiList[0]?.ticker || '');
  const [dividendoInput, setDividendoInput] = useState('');

  const pos = fiiList.find((f) => f.ticker === selectedTicker) || fiiList[0];

  useEffect(() => {
    if (pos) setDividendoInput(pos.dividendoMedio ? String(pos.dividendoMedio) : '');
  }, [pos?.ticker, pos?.dividendoMedio]);

  if (!pos) return null;

  async function handleDividendoChange(value: string) {
    setDividendoInput(value);
    const val = parseFloat(value.replace(',', '.'));
    if (!isNaN(val) && val > 0) {
      await upsertQuote(pos.ticker, { dividendo_medio: val });
    }
  }

  const dividendoMedio = parseFloat(dividendoInput.replace(',', '.'));
  const hasValidDividendo = !isNaN(dividendoMedio) && dividendoMedio > 0;
  const magicNumber = hasValidDividendo ? calcNumeroMagico(pos.precoAtual, dividendoMedio) : null;
  const progresso = magicNumber ? Math.min(100, (pos.qtd / magicNumber) * 100) : 0;
  const faltam = magicNumber ? Math.max(0, magicNumber - pos.qtd) : 0;

  return (
    <div className="bg-surface border border-border-soft rounded-[20px] p-[22px]">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="font-display text-[17px] font-semibold flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-purple-bright">
              <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" strokeLinecap="round" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
            Número Mágico — Efeito Infinito
          </h2>
          <p className="text-[12.5px] text-text-3 mt-0.5">Quantas cotas você precisa para que os dividendos paguem uma nova cota sozinhos, todo mês</p>
        </div>
        <Select value={selectedTicker} onChange={(e) => setSelectedTicker(e.target.value)} className="w-auto">
          {fiiList.map((f) => (
            <option key={f.ticker} value={f.ticker}>{f.ticker}</option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
        <InputGroup>
          <Label>Dividendo médio por cota (R$/mês)</Label>
          <Input type="number" step="0.01" placeholder="Ex: 0.85" value={dividendoInput} onChange={(e) => handleDividendoChange(e.target.value)} />
        </InputGroup>
        <div className="pt-1.5">
          {hasValidDividendo && magicNumber ? (
            <div>
              <div className="flex items-baseline gap-2.5 mb-2.5">
                <span className="font-display text-[22px] font-bold text-neon">{fmtNum(magicNumber, 0)}</span>
                <span className="text-text-3 text-[13px]">cotas para o efeito infinito</span>
              </div>
              <ProgressBar percent={progresso} />
              <div className="flex justify-between text-[12.5px] mt-2">
                <span className="text-text-2">Você tem <strong>{fmtNum(pos.qtd, 0)}</strong> cotas ({fmtNum(progresso, 1)}%)</span>
                <span className="text-text-3">{faltam > 0 ? `Faltam ${fmtNum(faltam, 0)} cotas` : 'Meta atingida! 🎉'}</span>
              </div>
            </div>
          ) : (
            <div className="text-text-3 text-[13px] pt-6">Informe o dividendo médio mensal pago por cota para calcular.</div>
          )}
        </div>
      </div>
    </div>
  );
}
