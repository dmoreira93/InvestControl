'use client';

import { useMemo } from 'react';
import { usePortfolioData } from '@/lib/hooks/usePortfolioData';
import { useBitcoinPrice } from '@/lib/hooks/useQuotes';
import { getCryptoPositions } from '@/lib/finance/portfolio';
import { fmtBRL, fmtNum, fmtPct } from '@/lib/finance/utils';
import { useToast } from '@/components/ui/toast';
import { StatCard, Button, PulseDot, EmptyState } from '@/components/ui';
import { IconRefresh, IconEmpty } from '@/components/ui/icons';

export default function CriptoPage() {
  const { transactions, loading } = usePortfolioData();
  const { price: btcPrice, loading: priceLoading, refresh } = useBitcoinPrice();
  const { showToast } = useToast();

  const positions = useMemo(() => getCryptoPositions(transactions, btcPrice), [transactions, btcPrice]);
  const totalAtualizado = positions.reduce((acc, p) => acc + p.valorAtualizado, 0);

  async function handleRefresh() {
    const price = await refresh();
    if (price) showToast('Cotação do Bitcoin atualizada via CoinGecko.');
    else showToast('Não foi possível buscar o preço agora. Tente novamente em instantes.', 'red');
  }

  if (loading) return <div className="animate-pulse h-96 bg-surface-2 rounded-[20px]" />;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="font-display text-[26px] font-bold">Criptomoedas</h1>
          <p className="text-text-3 text-[13.5px] mt-0.5">Preço do Bitcoin em tempo real via CoinGecko API</p>
        </div>
        <Button variant="ghost" small onClick={handleRefresh} disabled={priceLoading}>
          <IconRefresh className="w-4 h-4" /> {priceLoading ? 'Atualizando...' : 'Atualizar cotação'}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px] mb-6">
        <StatCard
          eyebrow="Bitcoin (BTC/BRL)"
          value={btcPrice ? fmtBRL(btcPrice) : 'Carregando...'}
          valueColor="text-gold"
          delta={<span className="flex items-center gap-1.5"><PulseDot /> Fonte: CoinGecko API</span>}
          glowColor="bg-gold"
        />
        <StatCard eyebrow="Total em Cripto" value={fmtBRL(totalAtualizado)} delta="Convertido na cotação atual" />
      </div>

      <div className="bg-surface border border-border-soft rounded-[20px] p-[22px]">
        <div className="overflow-x-auto rounded-[14px]">
          <table>
            <thead>
              <tr>
                <th>Ativo</th><th>Fração</th><th>Preço Unitário</th><th>Custo Total</th><th>Saldo Atual (R$)</th><th>Lucro/Prejuízo</th>
              </tr>
            </thead>
            <tbody>
              {positions.length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon={<IconEmpty className="w-10 h-10" />} title="Nenhuma posição em cripto cadastrada" /></td></tr>
              ) : positions.map((p) => {
                const lucroClass = p.lucro >= 0 ? 'text-neon' : 'text-red';
                const lucroSign = p.lucro >= 0 ? '+' : '';
                return (
                  <tr key={p.ativo}>
                    <td><strong>{p.ativo}</strong></td>
                    <td className="font-mono">{fmtNum(p.fracao, 8)}</td>
                    <td className="font-mono">{fmtBRL(p.precoUnitario)}</td>
                    <td className="font-mono">{fmtBRL(p.custoTotal)}</td>
                    <td className="font-mono font-bold">{fmtBRL(p.valorAtualizado)}</td>
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
