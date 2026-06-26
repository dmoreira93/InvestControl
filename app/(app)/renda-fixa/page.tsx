'use client';

import { useMemo } from 'react';
import { usePortfolioData } from '@/lib/hooks/usePortfolioData';
import { useConfig } from '@/lib/hooks/useConfig';
import { getFixedIncomePositions } from '@/lib/finance/portfolio';
import { fmtBRL, fmtNum, fmtPct, fmtDateBR } from '@/lib/finance/utils';
import { StatCard, Badge, EmptyState } from '@/components/ui';
import { IconEmpty } from '@/components/ui/icons';

export default function RendaFixaPage() {
  const { transactions, loading } = usePortfolioData();
  const { config } = useConfig();

  const positions = useMemo(() => getFixedIncomePositions(transactions, config), [transactions, config]);

  const totalLiquido = positions.reduce((acc, p) => acc + p.valorLiquido, 0);
  const totalInvestido = positions.reduce((acc, p) => acc + (p.valor_investido || 0), 0);
  const totalLucro = totalLiquido - totalInvestido;

  if (loading) return <div className="animate-pulse h-96 bg-surface-2 rounded-[20px]" />;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-[26px] font-bold">Renda Fixa</h1>
        <p className="text-text-3 text-[13.5px] mt-0.5">CDB, LCI e LCA — cálculo exato com convenção de 252 dias úteis e impostos regressivos</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[18px] mb-6">
        <StatCard eyebrow="Total Investido" value={fmtBRL(totalInvestido)} />
        <StatCard eyebrow="Valor Líquido Hoje" value={fmtBRL(totalLiquido)} valueColor="text-neon" />
        <StatCard
          eyebrow="Rendimento Líquido"
          value={`${totalLucro >= 0 ? '+' : ''}${fmtBRL(totalLucro)}`}
          valueColor={totalLucro >= 0 ? 'text-neon' : 'text-red'}
        />
      </div>

      <div className="bg-surface border border-border-soft rounded-[20px] p-[22px]">
        <div className="text-[11px] text-text-3 mb-2 sm:hidden">← Arraste para o lado para ver mais colunas →</div>
        <div className="overflow-x-auto rounded-[14px]">
          <div className="min-w-[1100px]">
            <table>
              <thead>
                <tr>
                  <th>Produto</th><th>Tipo</th><th>Valor Investido</th><th>Dias Úteis</th><th>Valor Bruto</th>
                  <th>IOF</th><th>IR</th><th>Valor Líquido</th><th>Rendimento</th><th>Vencimento</th>
                </tr>
              </thead>
              <tbody>
                {positions.length === 0 ? (
                  <tr><td colSpan={10}><EmptyState icon={<IconEmpty className="w-10 h-10" />} title="Nenhum produto de Renda Fixa cadastrado" /></td></tr>
                ) : positions.map((p) => {
                  const lucroClass = p.lucro >= 0 ? 'text-neon' : 'text-red';
                  const lucroSign = p.lucro >= 0 ? '+' : '';
                  const indexadorLabel = p.indexador === 'CDI'
                    ? `${fmtNum(p.taxa_contratada || 0, 0)}% do CDI`
                    : p.indexador === 'IPCA'
                    ? `IPCA+ ${fmtNum(p.taxa_contratada || 0, 2)}%`
                    : `${fmtNum(p.taxa_contratada || 0, 2)}% a.a.`;

                  return (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.nome_produto}</strong>
                        <div className="text-[11.5px] text-text-3">{indexadorLabel}</div>
                      </td>
                      <td><Badge color={p.isento ? 'green' : 'purple'}>{p.produto_tipo}</Badge></td>
                      <td className="font-mono">{fmtBRL(p.valor_investido)}</td>
                      <td className="font-mono">{p.diasUteis}</td>
                      <td className="font-mono">{fmtBRL(p.valorBruto)}</td>
                      <td className={`font-mono ${p.iofValor > 0 ? 'text-red' : 'text-text-3'}`}>
                        {p.iofValor > 0 ? `-${fmtBRL(p.iofValor)}` : '—'}
                        {p.iofValor > 0 && <div className="text-[10.5px]">({fmtNum(p.iofAliquota, 0)}%)</div>}
                      </td>
                      <td className={`font-mono ${p.irValor > 0 ? 'text-red' : 'text-text-3'}`}>
                        {p.isento ? <Badge color="green">Isento</Badge> : p.irValor > 0 ? (
                          <>-{fmtBRL(p.irValor)}<div className="text-[10.5px]">({fmtNum(p.irAliquota, 1)}%)</div></>
                        ) : '—'}
                      </td>
                      <td className="font-mono font-bold">{fmtBRL(p.valorLiquido)}</td>
                      <td className={`font-mono ${lucroClass}`}>
                        {lucroSign}{fmtBRL(p.lucro)} <span className="text-[11px]">({lucroSign}{fmtPct(p.lucroPct)})</span>
                      </td>
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
