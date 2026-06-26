'use client';

import { useState, FormEvent, useMemo } from 'react';
import { usePersonalFinanceData } from '@/lib/hooks/usePersonalFinanceData';
import { useToast } from '@/components/ui/toast';
import { Button, Input, Select, Label, InputGroup, EmptyState, ProgressBar } from '@/components/ui';
import { IconAdd, IconTrash, IconEmpty } from '@/components/ui/icons';
import { fmtBRL, fmtNum } from '@/lib/finance/utils';
import { getBudgetStatus, CATEGORIAS_DESPESA } from '@/lib/finance/personal-finance';

export function BudgetPanel() {
  const { entries, budgets, upsertBudget, deleteBudget } = usePersonalFinanceData();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const status = useMemo(() => getBudgetStatus(entries, budgets), [entries, budgets]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const categoria = (data.get('categoria') as string) || '';
    const limite = parseFloat((data.get('limite') as string) || '');

    if (!categoria || isNaN(limite) || limite <= 0) {
      showToast('Preencha a categoria e um limite válido.', 'red');
      return;
    }

    setSubmitting(true);
    const { error } = await upsertBudget(categoria, limite);
    setSubmitting(false);

    if (error) showToast('Erro ao salvar orçamento.', 'red');
    else {
      showToast('Orçamento definido com sucesso!');
      form.reset();
      setFormKey((k) => k + 1);
    }
  }

  async function handleDelete(id: string) {
    const { error } = await deleteBudget(id);
    if (error) showToast('Erro ao remover limite.', 'red');
    else showToast('Limite de orçamento removido.');
  }

  const categoriasDisponiveis = CATEGORIAS_DESPESA.filter((c) => !budgets.some((b) => b.categoria === c));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
      <div className="bg-surface border border-border-soft rounded-[20px] p-[22px] h-fit">
        <h2 className="font-display text-[16px] font-semibold mb-1">Definir orçamento</h2>
        <p className="text-[12.5px] text-text-3 mb-4">Estabeleça um limite mensal de gastos por categoria</p>

        <form key={formKey} onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <InputGroup>
            <Label>Categoria</Label>
            <Select name="categoria" required defaultValue="">
              <option value="" disabled>Selecione...</option>
              {categoriasDisponiveis.map((c) => <option key={c} value={c}>{c}</option>)}
              {budgets.length > 0 && (
                <>
                  <option disabled>──────────</option>
                  {budgets.map((b) => <option key={b.id} value={b.categoria}>{b.categoria} (editar)</option>)}
                </>
              )}
            </Select>
          </InputGroup>
          <InputGroup>
            <Label>Limite mensal (R$)</Label>
            <Input type="number" name="limite" placeholder="Ex: 800.00" min="0.01" step="0.01" required />
          </InputGroup>
          <Button type="submit" variant="primary" disabled={submitting}>
            <IconAdd className="w-4 h-4" /> {submitting ? 'Salvando...' : 'Salvar limite'}
          </Button>
        </form>
      </div>

      <div className="bg-surface border border-border-soft rounded-[20px] p-[22px]">
        <h2 className="font-display text-[16px] font-semibold mb-4">Orçamento do mês atual</h2>

        {status.length === 0 ? (
          <EmptyState icon={<IconEmpty className="w-10 h-10" />} title="Nenhum orçamento definido" description="Defina limites mensais para acompanhar seus gastos por categoria." />
        ) : (
          <div className="flex flex-col gap-5">
            {status.map((s) => {
              const budget = budgets.find((b) => b.categoria === s.categoria);
              return (
                <div key={s.categoria}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13.5px] font-semibold">{s.categoria}</span>
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[12.5px] font-mono ${s.estourou ? 'text-red' : 'text-text-2'}`}>
                        {fmtBRL(s.gasto)} / {fmtBRL(s.limite)}
                      </span>
                      {budget && (
                        <button onClick={() => handleDelete(budget.id)} className="text-text-3 hover:text-red-dim">
                          <IconTrash className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <ProgressBar
                    percent={s.percentual}
                    colorFrom={s.estourou ? '#FF4D6A' : '#4C1D95'}
                    colorTo={s.estourou ? '#FF7A8F' : '#00FFA3'}
                  />
                  {s.estourou && (
                    <p className="text-[11.5px] text-red-dim mt-1">
                      Orçamento estourado em {fmtBRL(s.gasto - s.limite)} ({fmtNum(s.percentual - 100, 0)}% acima do limite)
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
