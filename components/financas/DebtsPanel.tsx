'use client';

import { useState, FormEvent, useMemo } from 'react';
import { usePersonalFinanceData } from '@/lib/hooks/usePersonalFinanceData';
import { useToast } from '@/components/ui/toast';
import { Button, Input, Select, Label, InputGroup, EmptyState, ProgressBar, Badge, StatCard } from '@/components/ui';
import { IconAdd, IconTrash, IconEmpty, IconCreditCard } from '@/components/ui/icons';
import { fmtBRL, fmtNum, fmtDateBR, todayISO } from '@/lib/finance/utils';
import { getDebtsProgress, getTotalDebt } from '@/lib/finance/personal-finance';
import type { DebtTipo } from '@/types';

const TIPO_LABELS: Record<DebtTipo, string> = {
  cartao: 'Cartão de Crédito', emprestimo: 'Empréstimo Pessoal', financiamento: 'Financiamento', outro: 'Outro',
};

export function DebtsPanel() {
  const { debts, addDebt, updateDebt, deleteDebt } = usePersonalFinanceData();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const progress = useMemo(() => getDebtsProgress(debts.filter((d) => !d.quitada)), [debts]);
  const quitadas = useMemo(() => debts.filter((d) => d.quitada), [debts]);
  const totals = useMemo(() => getTotalDebt(debts), [debts]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const nome = (data.get('nome') as string) || '';
    const valorTotal = parseFloat((data.get('valorTotal') as string) || '');
    const valorPago = parseFloat((data.get('valorPago') as string) || '0');
    const parcelasTotal = parseInt((data.get('parcelasTotal') as string) || '', 10);
    const parcelasPagas = parseInt((data.get('parcelasPagas') as string) || '0', 10);
    const taxaJuros = parseFloat((data.get('taxaJuros') as string) || '');

    if (!nome || isNaN(valorTotal) || valorTotal <= 0) {
      showToast('Preencha o nome e o valor total da dívida.', 'red');
      return;
    }

    setSubmitting(true);
    const { error } = await addDebt({
      nome,
      tipo: data.get('tipo') as DebtTipo,
      valor_total: valorTotal,
      valor_pago: isNaN(valorPago) ? 0 : valorPago,
      taxa_juros_mensal: isNaN(taxaJuros) ? null : taxaJuros,
      parcelas_total: isNaN(parcelasTotal) ? null : parcelasTotal,
      parcelas_pagas: isNaN(parcelasPagas) ? 0 : parcelasPagas,
      data_inicio: (data.get('dataInicio') as string) || null,
      data_vencimento_proxima: (data.get('dataVencimento') as string) || null,
      quitada: false,
    });
    setSubmitting(false);

    if (error) showToast('Erro ao salvar dívida.', 'red');
    else {
      showToast('Dívida cadastrada com sucesso!');
      form.reset();
      setFormKey((k) => k + 1);
    }
  }

  async function handleMarkPaid(id: string, valorTotal: number) {
    const { error } = await updateDebt(id, { valor_pago: valorTotal, quitada: true });
    if (error) showToast('Erro ao atualizar dívida.', 'red');
    else showToast('Dívida marcada como quitada! 🎉');
  }

  async function handleRegisterPayment(id: string, currentPaid: number, totalValue: number) {
    const valor = prompt('Valor do pagamento (R$):');
    if (valor === null) return;
    const val = parseFloat(valor.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;
    const novoValorPago = Math.min(totalValue, currentPaid + val);
    const quitada = novoValorPago >= totalValue;
    const { error } = await updateDebt(id, { valor_pago: novoValorPago, quitada });
    if (error) showToast('Erro ao registrar pagamento.', 'red');
    else showToast(quitada ? 'Pagamento registrado — dívida quitada! 🎉' : 'Pagamento registrado com sucesso.');
  }

  async function handleDelete(id: string) {
    const { error } = await deleteDebt(id);
    if (error) showToast('Erro ao excluir dívida.', 'red');
    else showToast('Dívida excluída.');
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[18px] mb-5">
        <StatCard eyebrow="Total em Dívidas" value={fmtBRL(totals.totalDevido)} valueColor="text-red" glowColor="bg-red" />
        <StatCard eyebrow="Já Pago" value={fmtBRL(totals.totalPago)} valueColor="text-neon" glowColor="bg-neon" />
        <StatCard eyebrow="Saldo Restante" value={fmtBRL(totals.totalRestante)} glowColor="bg-purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5">
        <div className="bg-surface border border-border-soft rounded-[20px] p-[22px] h-fit">
          <h2 className="font-display text-[16px] font-semibold mb-4">Nova dívida</h2>
          <form key={formKey} onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <InputGroup>
              <Label>Nome / Descrição</Label>
              <Input name="nome" placeholder="Ex: Cartão Nubank, Financiamento do carro" required />
            </InputGroup>
            <InputGroup>
              <Label>Tipo</Label>
              <Select name="tipo" defaultValue="cartao">
                <option value="cartao">Cartão de Crédito</option>
                <option value="emprestimo">Empréstimo Pessoal</option>
                <option value="financiamento">Financiamento</option>
                <option value="outro">Outro</option>
              </Select>
            </InputGroup>
            <div className="grid grid-cols-2 gap-3">
              <InputGroup>
                <Label>Valor total (R$)</Label>
                <Input type="number" name="valorTotal" placeholder="Ex: 12000" min="0.01" step="0.01" required />
              </InputGroup>
              <InputGroup>
                <Label>Já pago (R$)</Label>
                <Input type="number" name="valorPago" placeholder="Ex: 3000" min="0" step="0.01" defaultValue="0" />
              </InputGroup>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InputGroup>
                <Label>Parcelas totais</Label>
                <Input type="number" name="parcelasTotal" placeholder="Ex: 12" min="1" step="1" />
              </InputGroup>
              <InputGroup>
                <Label>Parcelas pagas</Label>
                <Input type="number" name="parcelasPagas" placeholder="Ex: 3" min="0" step="1" defaultValue="0" />
              </InputGroup>
            </div>
            <InputGroup>
              <Label>Taxa de juros mensal (% opcional)</Label>
              <Input type="number" name="taxaJuros" placeholder="Ex: 2.5" min="0" step="0.01" />
            </InputGroup>
            <div className="grid grid-cols-2 gap-3">
              <InputGroup>
                <Label>Data de início</Label>
                <Input type="date" name="dataInicio" defaultValue={todayISO()} />
              </InputGroup>
              <InputGroup>
                <Label>Próx. vencimento</Label>
                <Input type="date" name="dataVencimento" />
              </InputGroup>
            </div>
            <Button type="submit" variant="primary" disabled={submitting}>
              <IconAdd className="w-4 h-4" /> {submitting ? 'Salvando...' : 'Cadastrar dívida'}
            </Button>
          </form>
        </div>

        <div className="flex flex-col gap-4">
          {progress.length === 0 && quitadas.length === 0 ? (
            <div className="bg-surface border border-border-soft rounded-[20px]">
              <EmptyState icon={<IconEmpty className="w-10 h-10" />} title="Nenhuma dívida cadastrada" description="Ótimo sinal — ou cadastre suas dívidas para acompanhar o progresso de pagamento." />
            </div>
          ) : (
            <>
              {progress.map((d) => (
                <div key={d.id} className="bg-surface border border-border-soft rounded-[20px] p-[20px]">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-[10px] bg-surface-2 border border-border flex items-center justify-center text-text-2 flex-shrink-0">
                        <IconCreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-[14.5px]">{d.nome}</div>
                        <Badge color="purple">{TIPO_LABELS[d.tipo]}</Badge>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(d.id)} className="p-2 text-text-3 hover:text-red-dim rounded-[8px] hover:bg-surface-2">
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </div>

                  <ProgressBar percent={d.percentualPago} colorFrom="#4C1D95" colorTo="#9D5CFF" />

                  <div className="flex justify-between items-center mt-2 text-[12.5px]">
                    <span className="text-text-2 font-mono">{fmtBRL(d.valor_pago)} pago de {fmtBRL(d.valor_total)}</span>
                    <span className="text-text-3">{fmtNum(d.percentualPago, 0)}%</span>
                  </div>

                  <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                    <div className="text-[12px] text-text-3 flex gap-3">
                      {d.parcelas_total && <span>Parcela {d.parcelas_pagas}/{d.parcelas_total}</span>}
                      {d.parcelaEstimada && <span>≈ {fmtBRL(d.parcelaEstimada)}/parcela</span>}
                      {d.data_vencimento_proxima && <span>Vence em {fmtDateBR(d.data_vencimento_proxima)}</span>}
                    </div>
                    <div className="flex gap-2">
                      <Button small variant="ghost" onClick={() => handleRegisterPayment(d.id, d.valor_pago, d.valor_total)}>
                        Registrar pagamento
                      </Button>
                      <Button small variant="neon" onClick={() => handleMarkPaid(d.id, d.valor_total)}>
                        Marcar quitada
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {quitadas.length > 0 && (
                <div className="bg-surface border border-border-soft rounded-[20px] p-[20px]">
                  <h3 className="text-[13px] font-semibold text-text-3 mb-3">Dívidas quitadas ({quitadas.length})</h3>
                  <div className="flex flex-col gap-2">
                    {quitadas.map((d) => (
                      <div key={d.id} className="flex items-center justify-between px-3 py-2.5 bg-surface-2 rounded-[9px] border border-border-soft">
                        <span className="text-[13px] text-text-2 line-through">{d.nome}</span>
                        <div className="flex items-center gap-2">
                          <Badge color="green">Quitada</Badge>
                          <button onClick={() => handleDelete(d.id)} className="text-text-3 hover:text-red-dim">
                            <IconTrash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
