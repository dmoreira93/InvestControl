'use client';

import { fmtNum, fmtPct } from '@/lib/finance/utils';
import { calcEvSobreCaixa } from '@/types';
import { Badge, EmptyState, Input } from '@/components/ui';
import { IconEmpty } from '@/components/ui/icons';
import type { FundamentalsCache } from '@/types';

interface Row {
  ticker: string;
  data: FundamentalsCache | undefined;
}

export function FundamentalsTable({
  rows, onManualEdit,
}: {
  rows: Row[];
  onManualEdit: (ticker: string, field: keyof FundamentalsCache, value: number | null) => void;
}) {
  function handleBlur(ticker: string, field: keyof FundamentalsCache, raw: string) {
    const val = raw.trim() === '' ? null : parseFloat(raw.replace(',', '.'));
    if (val !== null && isNaN(val)) return;
    onManualEdit(ticker, field, val);
  }

  return (
    <div className="bg-surface border border-border-soft rounded-[20px] p-[22px]">
      <div className="text-[11px] text-text-3 mb-2 sm:hidden">← Arraste para o lado para ver mais colunas →</div>
      <div className="overflow-x-auto rounded-[14px]">
        <div className="min-w-[920px]">
          <table>
            <thead>
              <tr>
                <th>Ticker</th>
                <th>P/L</th>
                <th>P/VP</th>
                <th>ROE</th>
                <th>Dividend Yield</th>
                <th>EV/EBITDA</th>
                <th>EV / Caixa</th>
                <th>Fonte</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={8}><EmptyState icon={<IconEmpty className="w-10 h-10" />} title="Nenhuma ação cadastrada" description="Cadastre uma compra na Bolsa para avaliar seus fundamentos aqui." /></td></tr>
              ) : rows.map(({ ticker, data }) => {
                const evCaixa = calcEvSobreCaixa(data?.enterprise_value ?? null, data?.cash ?? null);
                return (
                  <tr key={ticker}>
                    <td><strong>{ticker}</strong></td>
                    <td>
                      <Input
                        type="number" step="0.01" placeholder="—"
                        defaultValue={data?.pl ?? ''}
                        onBlur={(e) => handleBlur(ticker, 'pl', e.target.value)}
                        className="w-[90px] py-1.5 px-2 text-[13px] font-mono"
                      />
                    </td>
                    <td>
                      <Input
                        type="number" step="0.01" placeholder="—"
                        defaultValue={data?.pvp ?? ''}
                        onBlur={(e) => handleBlur(ticker, 'pvp', e.target.value)}
                        className="w-[90px] py-1.5 px-2 text-[13px] font-mono"
                      />
                    </td>
                    <td>
                      <Input
                        type="number" step="0.01" placeholder="—"
                        defaultValue={data?.roe ?? ''}
                        onBlur={(e) => handleBlur(ticker, 'roe', e.target.value)}
                        className="w-[90px] py-1.5 px-2 text-[13px] font-mono"
                      />
                      {data?.roe != null && <span className="text-[10.5px] text-text-3 ml-1">%</span>}
                    </td>
                    <td>
                      <Input
                        type="number" step="0.01" placeholder="—"
                        defaultValue={data?.dividend_yield ?? ''}
                        onBlur={(e) => handleBlur(ticker, 'dividend_yield', e.target.value)}
                        className="w-[90px] py-1.5 px-2 text-[13px] font-mono"
                      />
                      {data?.dividend_yield != null && <span className="text-[10.5px] text-text-3 ml-1">%</span>}
                    </td>
                    <td>
                      <Input
                        type="number" step="0.01" placeholder="—"
                        defaultValue={data?.ev_ebitda ?? ''}
                        onBlur={(e) => handleBlur(ticker, 'ev_ebitda', e.target.value)}
                        className="w-[90px] py-1.5 px-2 text-[13px] font-mono"
                      />
                    </td>
                    <td className="font-mono">
                      {evCaixa !== null ? `${fmtNum(evCaixa, 1)}x` : '—'}
                    </td>
                    <td>
                      <Badge color={data?.fonte === 'api' ? 'green' : 'gray'}>
                        {data?.fonte === 'api' ? 'API' : data ? 'Manual' : '—'}
                      </Badge>
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
