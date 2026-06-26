'use client';

import { useMemo } from 'react';
import { usePortfolioData } from '@/lib/hooks/usePortfolioData';
import { useConfig } from '@/lib/hooks/useConfig';
import { getTreasuryPositions } from '@/lib/finance/portfolio';
import { fmtBRL, fmtDateBR, fmtPct } from '@/lib/finance/utils';
import { StatCard, EmptyState } from '@/components/ui';
import { IconAlert, IconEmpty } from '@/components/ui/icons';

export default function TesouroPage() {
  const { transactions, loading } = usePortfolioData();
  const { config } = useConfig();

  const positions = useMemo(() => getTreasuryPositions(transactions, config), [transactions, config]);
  const totalLiquido = positions.reduce((acc, p) => acc + p.valorLiquido, 0);

  if (loading) return <div className="animate-pulse h-96 bg-surface-2 rounded-[20px]" />;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-[26px] font-bold">Tesouro Direto</h1>
        <p className="text-text-3 text-[13.5px] mt-0.5">Selic, Prefixado e IPCA+ — títulos públicos federais</p>
      </div>

      <div className="flex gap-3 p-4 px-[18px] rounded-[14px] border bg-gold/[0.08] border-gold/30 text-[#FFE2A8] text-[13px] leading-relaxed mb-6">
        <IconAlert className="text-gold flex-shrink-0 w-5 h-5 mt-0.5" />
        <div>
          <strong>Marcação a Mercado:</strong> o valor exibido para títulos Prefixados e IPCA+ pode flutuar — inclusive ficar temporariamente negativo — caso as taxas de juros subam no mercado. Esse efeito é apenas contábil. Se você carregar o título até a <strong>Data de Vencimento</strong>, o rendimento contratado na compra é garantido pelo Tesouro Nacional, independentemente das oscilações no meio do caminho.
        </div>
      </div>

      <div className="max-w-[340px] mb-6">
        <StatCard eyebrow="Total em Títulos Públicos" value={fmtBRL(totalLiquido)} valueColor="text-neon" />
      </div>

      <div className="bg-surface border border-border-soft rounded-[20px] p-[22px]">
        <div className="overflow-x-auto rounded-[14px]">
          <div className="min-w-[980px]">
            <table>
              <thead>
                <tr>
                  <th>Título</th><th>Valor Investido</th><th>Dias Úteis</th><th>Valor Bruto</th>
                  <th>IR</th><th>Valor Líquido</th><th>Rendimento</th><th>Vencimento</th>
                </tr>
              </thead>
              <tbody>
                {positions.length === 0 ? (
                  <tr><td colSpan={8}><EmptyState icon={<IconEmpty className="w-10 h-10" />} title="Nenhum título do Tesouro cadastrado" /></td></tr>
                ) : positions.map((p) => {
                  const lucroClass = p.lucro >= 0 ? 'text-neon' : 'text-red';
                  const lucroSign = p.lucro >= 0 ? '+' : '';
                  return (
                    <tr key={p.id}>
                      <td><strong>{p.nome_produto}</strong></td>
                      <td className="font-mono">{fmtBRL(p.valor_investido)}</td>
                      <td className="font-mono">{p.diasUteis}</td>
                      <td className="font-mono">{fmtBRL(p.valorBruto)}</td>
                      <td className="font-mono text-red">{p.irValor > 0 ? `-${fmtBRL(p.irValor)}` : '—'}</td>
                      <td className="font-mono font-bold">{fmtBRL(p.valorLiquido)}</td>
                      <td className={`font-mono ${lucroClass}`}>{lucroSign}{fmtBRL(p.lucro)} ({lucroSign}{fmtPct(p.lucroPct)})</td>
                      <td>{fmtDateBR(p.data_vencimento)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
