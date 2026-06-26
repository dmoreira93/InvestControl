'use client';

import { useMemo } from 'react';
import { usePortfolioData } from '@/lib/hooks/usePortfolioData';
import { getFundsPositions } from '@/lib/finance/portfolio';
import { fmtBRL, fmtNum, fmtPct } from '@/lib/finance/utils';
import { StatCard, Badge, EmptyState } from '@/components/ui';
import { IconEmpty } from '@/components/ui/icons';

const TIPO_LABELS: Record<string, string> = {
  multimercado: 'Multimercado', acoes: 'Ações', cambial: 'Cambial', renda_fixa: 'Renda Fixa',
};

export default function FundosPage() {
  const { transactions, loading } = usePortfolioData();
  const positions = useMemo(() => getFundsPositions(transactions), [transactions]);
  const totalAtualizado = positions.reduce((acc, p) => acc + p.valorAtualizado, 0);

  if (loading) return <div className="animate-pulse h-96 bg-surface-2 rounded-[20px]" />;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-[26px] font-bold">Fundos de Investimento</h1>
        <p className="text-text-3 text-[13.5px] mt-0.5">Controle por quantidade de cotas e valor da cota atualizada</p>
      </div>

      <div className="max-w-[340px] mb-6">
        <StatCard eyebrow="Total em Fundos" value={fmtBRL(totalAtualizado)} valueColor="text-purple-bright" />
      </div>

      <div className="bg-surface border border-border-soft rounded-[20px] p-[22px]">
        <div className="overflow-x-auto rounded-[14px]">
          <table>
            <thead>
              <tr>
                <th>Fundo</th><th>Tipo</th><th>Cotas</th><th>Valor Cota Atual</th>
                <th>Custo Total</th><th>Valor Atualizado</th><th>Lucro/Prejuízo</th>
              </tr>
            </thead>
            <tbody>
              {positions.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon={<IconEmpty className="w-10 h-10" />} title="Nenhum fundo cadastrado" /></td></tr>
              ) : positions.map((p) => {
                const lucroClass = p.lucro >= 0 ? 'text-neon' : 'text-red';
                const lucroSign = p.lucro >= 0 ? '+' : '';
                return (
                  <tr key={p.nomeFundo}>
                    <td><strong>{p.nomeFundo}</strong></td>
                    <td><Badge color="purple">{TIPO_LABELS[p.tipoFundo] || p.tipoFundo}</Badge></td>
                    <td className="font-mono">{fmtNum(p.cotas, 4)}</td>
                    <td className="font-mono">{fmtBRL(p.valorCotaAtual)}</td>
                    <td className="font-mono">{fmtBRL(p.custoTotal)}</td>
                    <td className="font-mono">{fmtBRL(p.valorAtualizado)}</td>
                    <td className={`font-mono ${lucroClass}`}>{lucroSign}{fmtBRL(p.lucro)} ({lucroSign}{fmtPct(p.lucroPct)})</td>
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
