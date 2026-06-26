'use client';

import { useState } from 'react';
import { fmtBRL, fmtNum, fmtPct } from '@/lib/finance/utils';
import { usePortfolioData } from '@/lib/hooks/usePortfolioData';
import { useToast } from '@/components/ui/toast';
import { Badge, Input, EmptyState } from '@/components/ui';
import { IconRefresh, IconEmpty } from '@/components/ui/icons';
import type { StockPosition } from '@/types';

export function StockTable({
  positions, onManualPriceChange,
}: {
  positions: StockPosition[];
  onManualPriceChange: () => void;
}) {
  const { upsertQuote } = usePortfolioData();
  const { showToast } = useToast();

  async function handleVpChange(ticker: string, value: string) {
    const val = parseFloat(value.replace(',', '.'));
    if (!isNaN(val) && val > 0) {
      await upsertQuote(ticker, { vp_contabil: val });
      onManualPriceChange();
    } else if (value === '') {
      await upsertQuote(ticker, { vp_contabil: undefined as any });
      onManualPriceChange();
    }
  }

  async function handleRefreshQuote(ticker: string, currentPrice: number) {
    const novoPreco = prompt(`Atualizar cotação manual de ${ticker} (R$):`, fmtNum(currentPrice, 2));
    if (novoPreco !== null) {
      const val = parseFloat(novoPreco.replace(',', '.'));
      if (!isNaN(val) && val > 0) {
        await upsertQuote(ticker, { preco_atual: val });
        onManualPriceChange();
        showToast(`Cotação de ${ticker} atualizada manualmente.`);
      }
    }
  }

  return (
    <div className="bg-surface border border-border-soft rounded-[20px] p-[22px]">
      <div className="text-[11px] text-text-3 mb-2 sm:hidden">← Arraste para o lado para ver mais colunas →</div>
      <div className="overflow-x-auto rounded-[14px]">
        <div className="min-w-[900px]">
          <table>
            <thead>
              <tr>
                <th>Ticker</th><th>Tipo</th><th>Qtd</th><th>Preço Médio</th><th>Preço Atual</th>
                <th>Valor Atualizado</th><th>Lucro/Prejuízo</th><th>VPA / VP Fundo</th><th>P/VP</th><th>Status</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {positions.length === 0 ? (
                <tr><td colSpan={11}><EmptyState icon={<IconEmpty className="w-10 h-10" />} title="Nenhuma posição cadastrada" description="Cadastre uma compra de ação ou FII para começar." /></td></tr>
              ) : positions.map((p) => {
                const lucroClass = p.lucro >= 0 ? 'text-neon' : 'text-red';
                const lucroSign = p.lucro >= 0 ? '+' : '';
                const tipoLabel = p.tipo === 'fii' ? 'FII' : 'Ação';

                return (
                  <tr key={p.ticker}>
                    <td><strong>{p.ticker}</strong></td>
                    <td><Badge color="purple">{tipoLabel}</Badge></td>
                    <td className="font-mono">{fmtNum(p.qtd, 0)}</td>
                    <td className="font-mono">{fmtBRL(p.precoMedio)}</td>
                    <td className="font-mono">{fmtBRL(p.precoAtual)}</td>
                    <td className="font-mono">{fmtBRL(p.valorAtualizado)}</td>
                    <td className={`font-mono ${lucroClass}`}>
                      {lucroSign}{fmtBRL(p.lucro)} <span className="text-[11.5px]">({lucroSign}{fmtPct(p.lucroPct)})</span>
                    </td>
                    <td>
                      {p.tipo === 'fii' ? (
                        <Input
                          type="number" step="0.01" placeholder="VP/cota"
                          defaultValue={p.vpContabil ?? ''}
                          onBlur={(e) => handleVpChange(p.ticker, e.target.value)}
                          className="w-[100px] py-1.5 px-2 text-[13px]"
                        />
                      ) : (
                        <span className="text-text-2">{fmtBRL(p.precoMedio * 0.6)}*</span>
                      )}
                    </td>
                    <td className="font-mono">{p.tipo === 'fii' && p.pvp !== null ? fmtNum(p.pvp, 2) : '—'}</td>
                    <td>
                      <div className="flex gap-1.5 flex-wrap">
                        {p.tipo === 'fii' && p.isDesconto && <Badge color="green">Desconto</Badge>}
                        {p.tipo === 'fii' && !p.isDesconto && p.pvp !== null && <Badge color="gray">Ágio</Badge>}
                        {p.tipo === 'acao' && p.isPennyStock && <Badge color="red">Penny Stock</Badge>}
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => handleRefreshQuote(p.ticker, p.precoAtual)}
                        className="p-2 rounded-[9px] bg-surface-2 border border-border text-text-2 hover:text-text-1 hover:bg-surface-3"
                        title="Atualizar cotação manualmente"
                      >
                        <IconRefresh className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
