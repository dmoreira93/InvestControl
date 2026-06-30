import { AssetIncomePanel } from '@/components/rendimentos/AssetIncomePanel';

export default function RendimentosPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-7">
        <h1 className="font-display text-[26px] font-bold">Rendimentos por Ativo</h1>
        <p className="text-text-3 text-[13.5px] mt-0.5">Dividendos, JCP, cupons e outros rendimentos vinculados diretamente às suas posições</p>
      </div>
      <AssetIncomePanel />
    </div>
  );
}
