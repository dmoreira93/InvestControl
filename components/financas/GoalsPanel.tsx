'use client';

import { useState, FormEvent, useMemo } from 'react';
import { usePersonalFinanceData } from '@/lib/hooks/usePersonalFinanceData';
import { useToast } from '@/components/ui/toast';
import { Button, Input, Label, InputGroup, EmptyState, ProgressBar, Badge } from '@/components/ui';
import { IconAdd, IconTrash, IconEmpty, IconTarget } from '@/components/ui/icons';
import { fmtBRL, fmtNum, fmtDateBR } from '@/lib/finance/utils';
import { getGoalsProgress } from '@/lib/finance/personal-finance';

const CORES_SUGERIDAS = ['#9D5CFF', '#00FFA3', '#FFC857', '#5EA8FF', '#FF7AC8', '#FF4D6A'];

export function GoalsPanel() {
  const { goals, addGoal, updateGoal, deleteGoal } = usePersonalFinanceData();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [corSelecionada, setCorSelecionada] = useState(CORES_SUGERIDAS[0]);

  const progress = useMemo(() => getGoalsProgress(goals), [goals]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const nome = (data.get('nome') as string) || '';
    const valorMeta = parseFloat((data.get('valorMeta') as string) || '');
    const valorAtual = parseFloat((data.get('valorAtual') as string) || '0');

    if (!nome || isNaN(valorMeta) || valorMeta <= 0) {
      showToast('Preencha o nome e o valor da meta.', 'red');
      return;
    }

    setSubmitting(true);
    const { error } = await addGoal({
      nome,
      valor_meta: valorMeta,
      valor_atual: isNaN(valorAtual) ? 0 : valorAtual,
      data_limite: (data.get('dataLimite') as string) || null,
      cor: corSelecionada,
      concluida: false,
    });
    setSubmitting(false);

    if (error) showToast('Erro ao salvar meta.', 'red');
    else {
      showToast('Meta criada com sucesso!');
      form.reset();
      setFormKey((k) => k + 1);
      setCorSelecionada(CORES_SUGERIDAS[0]);
    }
  }

  async function handleAporte(id: string, valorAtual: number, valorMeta: number) {
    const valor = prompt('Valor do aporte (R$):');
    if (valor === null) return;
    const val = parseFloat(valor.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;
    const novoValor = valorAtual + val;
    const concluida = novoValor >= valorMeta;
    const { error } = await updateGoal(id, { valor_atual: novoValor, concluida });
    if (error) showToast('Erro ao registrar aporte.', 'red');
    else showToast(concluida ? 'Meta atingida! 🎉🎉' : 'Aporte registrado com sucesso.');
  }

  async function handleDelete(id: string) {
    const { error } = await deleteGoal(id);
    if (error) showToast('Erro ao excluir meta.', 'red');
    else showToast('Meta excluída.');
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
      <div className="bg-surface border border-border-soft rounded-[20px] p-[22px] h-fit">
        <h2 className="font-display text-[16px] font-semibold mb-1">Nova meta</h2>
        <p className="text-[12.5px] text-text-3 mb-4">Reserva de emergência, viagem, entrada de imóvel...</p>

        <form key={formKey} onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <InputGroup>
            <Label>Nome da meta</Label>
            <Input name="nome" placeholder="Ex: Reserva de Emergência" required />
          </InputGroup>
          <div className="grid grid-cols-2 gap-3">
            <InputGroup>
              <Label>Valor da meta (R$)</Label>
              <Input type="number" name="valorMeta" placeholder="Ex: 15000" min="0.01" step="0.01" required />
            </InputGroup>
            <InputGroup>
              <Label>Valor já guardado</Label>
              <Input type="number" name="valorAtual" placeholder="Ex: 2000" min="0" step="0.01" defaultValue="0" />
            </InputGroup>
          </div>
          <InputGroup>
            <Label>Data limite (opcional)</Label>
            <Input type="date" name="dataLimite" />
          </InputGroup>
          <InputGroup>
            <Label>Cor</Label>
            <div className="flex gap-2">
              {CORES_SUGERIDAS.map((cor) => (
                <button
                  key={cor}
                  type="button"
                  onClick={() => setCorSelecionada(cor)}
                  className={`w-7 h-7 rounded-full border-2 ${corSelecionada === cor ? 'border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: cor }}
                />
              ))}
            </div>
          </InputGroup>
          <Button type="submit" variant="primary" disabled={submitting}>
            <IconAdd className="w-4 h-4" /> {submitting ? 'Salvando...' : 'Criar meta'}
          </Button>
        </form>
      </div>

      <div>
        {progress.length === 0 ? (
          <div className="bg-surface border border-border-soft rounded-[20px]">
            <EmptyState icon={<IconEmpty className="w-10 h-10" />} title="Nenhuma meta cadastrada" description="Crie sua primeira meta para começar a acompanhar o progresso." />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {progress.map((g) => (
              <div key={g.id} className="bg-surface border border-border-soft rounded-[20px] p-5 relative overflow-hidden">
                <div className="absolute w-28 h-28 rounded-full -top-12 -right-12 blur-md opacity-30" style={{ backgroundColor: g.cor }} />
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${g.cor}22`, color: g.cor }}>
                      <IconTarget className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-[14px]">{g.nome}</span>
                  </div>
                  <button onClick={() => handleDelete(g.id)} className="p-1.5 text-text-3 hover:text-red-dim rounded-[8px] hover:bg-surface-2">
                    <IconTrash className="w-3.5 h-3.5" />
                  </button>
                </div>

                <ProgressBar percent={g.percentual} colorFrom={g.cor} colorTo={g.cor} />

                <div className="flex justify-between items-center mt-2 text-[12.5px]">
                  <span className="font-mono text-text-2">{fmtBRL(g.valor_atual)} / {fmtBRL(g.valor_meta)}</span>
                  <span className="text-text-3">{fmtNum(g.percentual, 0)}%</span>
                </div>

                <div className="flex items-center justify-between mt-3.5">
                  <div className="text-[11.5px] text-text-3">
                    {g.concluida ? <Badge color="green">Concluída 🎉</Badge> : g.data_limite ? `Meta até ${fmtDateBR(g.data_limite)}` : `Faltam ${fmtBRL(g.faltam)}`}
                  </div>
                  {!g.concluida && (
                    <Button small variant="ghost" onClick={() => handleAporte(g.id, g.valor_atual, g.valor_meta)}>
                      + Aporte
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
