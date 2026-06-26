'use client';

import { useState, FormEvent, useMemo } from 'react';
import { usePersonalFinanceData } from '@/lib/hooks/usePersonalFinanceData';
import { useToast } from '@/components/ui/toast';
import { Button, Input, Select, Label, InputGroup, EmptyState, Badge } from '@/components/ui';
import { IconAdd, IconTrash, IconEmpty } from '@/components/ui/icons';
import { fmtBRL, fmtDateBR, todayISO } from '@/lib/finance/utils';
import { CATEGORIAS_RECEITA, CATEGORIAS_DESPESA, CATEGORIAS_PROVENTO } from '@/lib/finance/personal-finance';
import type { FinanceEntryTipo } from '@/types';

const TIPO_OPTIONS: { id: FinanceEntryTipo; label: string; color: 'green' | 'red' | 'gold' }[] = [
  { id: 'receita', label: 'Receita', color: 'green' },
  { id: 'despesa', label: 'Despesa', color: 'red' },
  { id: 'provento', label: 'Provento', color: 'gold' },
];

const CATEGORIAS_POR_TIPO: Record<FinanceEntryTipo, string[]> = {
  receita: CATEGORIAS_RECEITA,
  despesa: CATEGORIAS_DESPESA,
  provento: CATEGORIAS_PROVENTO,
};

export function EntriesPanel() {
  const { entries, addEntry, deleteEntry } = usePersonalFinanceData();
  const { showToast } = useToast();
  const [tipo, setTipo] = useState<FinanceEntryTipo>('despesa');
  const [filtro, setFiltro] = useState<'todos' | FinanceEntryTipo>('todos');
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const valor = parseFloat((data.get('valor') as string) || '');
    const categoria = (data.get('categoria') as string) || '';
    const dataLancamento = (data.get('data') as string) || todayISO();
    const descricao = (data.get('descricao') as string) || null;
    const recorrente = data.get('recorrente') === 'on';
    const tickerOrigem = tipo === 'provento' ? ((data.get('tickerOrigem') as string) || null) : null;

    if (isNaN(valor) || valor <= 0 || !categoria) {
      showToast('Preencha o valor e a categoria corretamente.', 'red');
      return;
    }

    setSubmitting(true);
    const { error } = await addEntry({
      tipo, categoria, descricao, valor, data: dataLancamento, recorrente, ticker_origem: tickerOrigem,
    });
    setSubmitting(false);

    if (error) {
      showToast('Erro ao salvar lançamento.', 'red');
    } else {
      showToast('Lançamento registrado com sucesso!');
      form.reset();
      setFormKey((k) => k + 1);
    }
  }

  async function handleDelete(id: string) {
    const { error } = await deleteEntry(id);
    if (error) showToast('Erro ao excluir lançamento.', 'red');
    else showToast('Lançamento excluído.');
  }

  const filtered = useMemo(() => {
    const list = filtro === 'todos' ? entries : entries.filter((e) => e.tipo === filtro);
    return list.slice(0, 40);
  }, [entries, filtro]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5">
      <div className="bg-surface border border-border-soft rounded-[20px] p-[22px] h-fit">
        <h2 className="font-display text-[16px] font-semibold mb-4">Novo lançamento</h2>

        <div className="flex gap-1.5 mb-5">
          {TIPO_OPTIONS.map(({ id, label, color }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTipo(id)}
              className={`flex-1 py-2.5 rounded-[10px] text-[12.5px] font-semibold border transition-colors
                ${tipo === id
                  ? color === 'green' ? 'bg-neon/15 border-neon text-neon'
                  : color === 'red' ? 'bg-red/15 border-red text-red-dim'
                  : 'bg-gold/15 border-gold text-gold'
                  : 'bg-surface-2 border-border text-text-3'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <form key={formKey} onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <InputGroup>
            <Label>Categoria</Label>
            <Select name="categoria" required defaultValue="">
              <option value="" disabled>Selecione...</option>
              {CATEGORIAS_POR_TIPO[tipo].map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </InputGroup>

          {tipo === 'provento' && (
            <InputGroup>
              <Label>Ticker de origem (opcional)</Label>
              <Input name="tickerOrigem" placeholder="Ex: MXRF11" maxLength={8} className="uppercase" />
            </InputGroup>
          )}

          <InputGroup>
            <Label>Valor (R$)</Label>
            <Input type="number" name="valor" placeholder="Ex: 250.00" min="0.01" step="0.01" required />
          </InputGroup>

          <InputGroup>
            <Label>Data</Label>
            <Input type="date" name="data" defaultValue={todayISO()} required />
          </InputGroup>

          <InputGroup>
            <Label>Descrição (opcional)</Label>
            <Input name="descricao" placeholder="Ex: Supermercado do mês" />
          </InputGroup>

          <label className="flex items-center gap-2 text-[13px] text-text-2">
            <input type="checkbox" name="recorrente" className="accent-purple-bright w-4 h-4" />
            Lançamento recorrente (todo mês)
          </label>

          <Button type="submit" variant="neon" disabled={submitting}>
            <IconAdd className="w-4 h-4" /> {submitting ? 'Salvando...' : 'Registrar lançamento'}
          </Button>
        </form>
      </div>

      <div className="bg-surface border border-border-soft rounded-[20px] p-[22px]">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-display text-[16px] font-semibold">Lançamentos recentes</h2>
          <div className="flex gap-1 bg-surface-2 p-1 rounded-[10px] border border-border-soft">
            {(['todos', 'receita', 'despesa', 'provento'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-3 py-1.5 rounded-[7px] text-[12px] font-semibold ${filtro === f ? 'bg-surface-3 text-text-1' : 'text-text-3'}`}
              >
                {f === 'todos' ? 'Todos' : f === 'receita' ? 'Receitas' : f === 'despesa' ? 'Despesas' : 'Proventos'}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<IconEmpty className="w-10 h-10" />} title="Nenhum lançamento encontrado" />
        ) : (
          <div className="flex flex-col gap-2 max-h-[560px] overflow-y-auto pr-1">
            {filtered.map((e) => {
              const color = e.tipo === 'receita' ? 'green' : e.tipo === 'despesa' ? 'red' : 'gold';
              const sign = e.tipo === 'despesa' ? '-' : '+';
              const valueColor = e.tipo === 'despesa' ? 'text-red' : e.tipo === 'receita' ? 'text-neon' : 'text-gold';
              return (
                <div key={e.id} className="flex items-center justify-between gap-3 px-3.5 py-3 bg-surface-2 rounded-[10px] border border-border-soft">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <Badge color={color as any}>{e.categoria}</Badge>
                    <span className="text-[13px] text-text-2 truncate">{e.descricao || '—'}</span>
                    {e.recorrente && <Badge color="purple">Recorrente</Badge>}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[12px] text-text-3 font-mono">{fmtDateBR(e.data)}</span>
                    <span className={`font-mono text-[13.5px] font-semibold ${valueColor}`}>{sign}{fmtBRL(e.valor)}</span>
                    <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-[8px] text-text-3 hover:text-red-dim hover:bg-surface-3">
                      <IconTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
