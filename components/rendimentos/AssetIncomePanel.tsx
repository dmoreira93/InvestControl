'use client';

import { useState, FormEvent, useMemo } from 'react';
import { usePortfolioData } from '@/lib/hooks/usePortfolioData';
import { useAssetIncomeData } from '@/lib/hooks/useAssetIncomeData';
import { useToast } from '@/components/ui/toast';
import { Button, Input, Select, Label, InputGroup, EmptyState, StatCard, Badge } from '@/components/ui';
import { IconAdd, IconTrash, IconEmpty } from '@/components/ui/icons';
import { fmtBRL, fmtDateBR, todayISO } from '@/lib/finance/utils';
import { getIdentifiersByCategoria } from '@/lib/finance/portfolio';
import {
  groupIncomeByAsset, getTotalIncomeReceived, getTotalIncomeThisMonth, TIPO_RENDIMENTO_LABELS,
} from '@/lib/finance/asset-income';
import type { Categoria, TipoRendimento } from '@/types';

const CATEGORIA_OPTIONS: { id: Categoria; label: string }[] = [
  { id: 'bolsa', label: 'Bolsa de Valores' },
  { id: 'renda_fixa', label: 'Renda Fixa' },
  { id: 'tesouro', label: 'Tesouro Direto' },
  { id: 'fundos', label: 'Fundos de Investimento' },
  { id: 'cripto', label: 'Criptomoedas' },
];

const TIPO_POR_CATEGORIA: Record<Categoria, TipoRendimento[]> = {
  bolsa: ['dividendo', 'jcp', 'rendimento_fii'],
  renda_fixa: ['cupom', 'amortizacao', 'outro'],
  tesouro: ['cupom', 'amortizacao', 'outro'],
  fundos: ['rendimento_fii', 'amortizacao', 'outro'],
  cripto: ['outro'],
};

const CATEGORIA_LABEL: Record<Categoria, string> = {
  bolsa: 'Bolsa', renda_fixa: 'Renda Fixa', tesouro: 'Tesouro Direto', fundos: 'Fundos', cripto: 'Cripto',
};

export function AssetIncomePanel() {
  const { transactions } = usePortfolioData();
  const { income, addIncome, deleteIncome, loading } = useAssetIncomeData();
  const { showToast } = useToast();
  const [categoria, setCategoria] = useState<Categoria>('bolsa');
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [filtroAtivo, setFiltroAtivo] = useState<string | null>(null);

  const identificadoresDisponiveis = useMemo(
    () => getIdentifiersByCategoria(transactions, categoria),
    [transactions, categoria]
  );

  const totalRecebido = useMemo(() => getTotalIncomeReceived(income), [income]);
  const totalMesAtual = useMemo(() => getTotalIncomeThisMonth(income), [income]);
  const porAtivo = useMemo(() => groupIncomeByAsset(income), [income]);

  const lancamentosFiltrados = useMemo(() => {
    const list = filtroAtivo ? income.filter((i) => i.identificador === filtroAtivo) : income;
    return list.slice(0, 50);
  }, [income, filtroAtivo]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const identificador = (data.get('identificador') as string) || '';
    const valor = parseFloat((data.get('valor') as string) || '');
    const tipoRendimento = (data.get('tipoRendimento') as TipoRendimento) || 'outro';
    const dataRecebimento = (data.get('data') as string) || todayISO();
    const observacao = (data.get('observacao') as string) || null;

    if (!identificador || isNaN(valor) || valor <= 0) {
      showToast('Selecione o ativo e informe um valor válido.', 'red');
      return;
    }

    setSubmitting(true);
    const { error } = await addIncome({
      categoria, identificador, tipo_rendimento: tipoRendimento, valor, data: dataRecebimento, observacao,
    });
    setSubmitting(false);

    if (error) {
      showToast('Erro ao registrar rendimento.', 'red');
    } else {
      showToast('Rendimento registrado com sucesso!');
      form.reset();
      setFormKey((k) => k + 1);
    }
  }

  async function handleDelete(id: string) {
    const { error } = await deleteIncome(id);
    if (error) showToast('Erro ao excluir rendimento.', 'red');
    else showToast('Rendimento excluído.');
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px] mb-6">
        <StatCard eyebrow="Total Recebido (histórico)" value={fmtBRL(totalRecebido)} valueColor="text-neon" glowColor="bg-neon" />
        <StatCard eyebrow="Recebido Este Mês" value={fmtBRL(totalMesAtual)} valueColor="text-gold" glowColor="bg-gold" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5">
        <div className="bg-surface border border-border-soft rounded-[20px] p-[22px] h-fit">
          <h2 className="font-display text-[16px] font-semibold mb-4">Registrar rendimento</h2>

          <div className="flex flex-col gap-1.5 mb-4">
            <Label>Categoria do ativo</Label>
            <Select value={categoria} onChange={(e) => setCategoria(e.target.value as Categoria)}>
              {CATEGORIA_OPTIONS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </Select>
          </div>

          <form key={formKey} onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <InputGroup>
              <Label>Ativo</Label>
              {identificadoresDisponiveis.length > 0 ? (
                <Select name="identificador" required defaultValue="">
                  <option value="" disabled>Selecione...</option>
                  {identificadoresDisponiveis.map((id) => <option key={id} value={id}>{id}</option>)}
                </Select>
              ) : (
                <>
                  <Input name="identificador" placeholder="Digite o ticker ou nome do ativo" required />
                  <span className="text-[11.5px] text-text-3">Nenhuma posição cadastrada nessa categoria ainda — digite manualmente.</span>
                </>
              )}
            </InputGroup>

            <InputGroup>
              <Label>Tipo de rendimento</Label>
              <Select name="tipoRendimento" defaultValue={TIPO_POR_CATEGORIA[categoria][0]}>
                {TIPO_POR_CATEGORIA[categoria].map((t) => (
                  <option key={t} value={t}>{TIPO_RENDIMENTO_LABELS[t]}</option>
                ))}
              </Select>
            </InputGroup>

            <InputGroup>
              <Label>Valor recebido (R$)</Label>
              <Input type="number" name="valor" placeholder="Ex: 45.30" min="0.01" step="0.01" required />
            </InputGroup>

            <InputGroup>
              <Label>Data do recebimento</Label>
              <Input type="date" name="data" defaultValue={todayISO()} max={todayISO()} required />
            </InputGroup>

            <InputGroup>
              <Label>Observação (opcional)</Label>
              <Input name="observacao" placeholder="Ex: Dividendo trimestral" />
            </InputGroup>

            <Button type="submit" variant="neon" disabled={submitting}>
              <IconAdd className="w-4 h-4" /> {submitting ? 'Salvando...' : 'Registrar rendimento'}
            </Button>
          </form>
        </div>

        <div className="flex flex-col gap-5">
          <div className="bg-surface border border-border-soft rounded-[20px] p-[22px]">
            <h2 className="font-display text-[16px] font-semibold mb-4">Total por ativo</h2>
            {porAtivo.length === 0 ? (
              <EmptyState icon={<IconEmpty className="w-10 h-10" />} title="Nenhum rendimento registrado ainda" />
            ) : (
              <div className="overflow-x-auto rounded-[12px]">
                <table>
                  <thead>
                    <tr>
                      <th>Ativo</th><th>Categoria</th><th>Total Recebido</th><th>Este Mês</th><th>Lançamentos</th><th>Último Recebimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {porAtivo.map((a) => (
                      <tr
                        key={a.identificador}
                        className={`cursor-pointer ${filtroAtivo === a.identificador ? 'bg-purple-bright/10' : ''}`}
                        onClick={() => setFiltroAtivo(filtroAtivo === a.identificador ? null : a.identificador)}
                      >
                        <td><strong>{a.identificador}</strong></td>
                        <td><Badge color="purple">{CATEGORIA_LABEL[a.categoria]}</Badge></td>
                        <td className="font-mono text-neon">{fmtBRL(a.total)}</td>
                        <td className="font-mono">{fmtBRL(a.totalMesAtual)}</td>
                        <td className="font-mono">{a.quantidadeLancamentos}</td>
                        <td>{fmtDateBR(a.ultimoRecebimento)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-surface border border-border-soft rounded-[20px] p-[22px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-[16px] font-semibold">
                Lançamentos {filtroAtivo ? `— ${filtroAtivo}` : 'recentes'}
              </h2>
              {filtroAtivo && (
                <button onClick={() => setFiltroAtivo(null)} className="text-[12px] text-purple-bright hover:underline">
                  Limpar filtro
                </button>
              )}
            </div>
            {lancamentosFiltrados.length === 0 ? (
              <EmptyState icon={<IconEmpty className="w-10 h-10" />} title="Nenhum lançamento encontrado" />
            ) : (
              <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
                {lancamentosFiltrados.map((i) => (
                  <div key={i.id} className="flex items-center justify-between gap-3 px-3.5 py-3 bg-surface-2 rounded-[10px] border border-border-soft">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <Badge color="green">{i.identificador}</Badge>
                      <span className="text-[12.5px] text-text-2">{TIPO_RENDIMENTO_LABELS[i.tipo_rendimento]}</span>
                      {i.observacao && <span className="text-[12px] text-text-3 truncate">{i.observacao}</span>}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-[12px] text-text-3 font-mono">{fmtDateBR(i.data)}</span>
                      <span className="font-mono text-[13.5px] font-semibold text-neon">+{fmtBRL(i.valor)}</span>
                      <button onClick={() => handleDelete(i.id)} className="p-1.5 rounded-[8px] text-text-3 hover:text-red-dim hover:bg-surface-3">
                        <IconTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
