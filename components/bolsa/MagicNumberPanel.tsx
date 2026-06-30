'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Select, Input, ProgressBar, InputGroup, Label, Button, Badge } from '@/components/ui';
import { calcNumeroMagico, valorPorCotaEquivalenteMensal } from '@/lib/finance/investments';
import { getImplicitMonthlyYield, getNextPaymentDate, YIELD_MENSAL_SUSPEITO } from '@/lib/finance/dividend-policy';
import { fmtNum, fmtPct, fmtDateBR } from '@/lib/finance/utils';
import { useDividendPolicyData } from '@/lib/hooks/useDividendPolicyData';
import { useToast } from '@/components/ui/toast';
import { IconAlert } from '@/components/ui/icons';
import { PERIODICIDADE_LABELS } from '@/types';
import type { StockPosition, Periodicidade } from '@/types';

export function MagicNumberPanel({ fiiList }: { fiiList: StockPosition[] }) {
  const { policies, upsertPolicy } = useDividendPolicyData();
  const { showToast } = useToast();
  const [selectedTicker, setSelectedTicker] = useState(fiiList[0]?.ticker || '');
  const [submitting, setSubmitting] = useState(false);

  const pos = fiiList.find((f) => f.ticker === selectedTicker) || fiiList[0];
  const policy = pos ? policies[pos.ticker] : undefined;

  useEffect(() => {
    if (fiiList.length > 0 && !fiiList.some((f) => f.ticker === selectedTicker)) {
      setSelectedTicker(fiiList[0].ticker);
    }
  }, [fiiList, selectedTicker]);

  if (!pos) return null;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const valorPorCota = parseFloat((data.get('valorPorCota') as string) || '');
    const diaPagamento = parseInt((data.get('diaPagamento') as string) || '', 10);
    const periodicidade = data.get('periodicidade') as Periodicidade;

    if (isNaN(valorPorCota) || valorPorCota <= 0) {
      showToast('Informe um valor por cota válido.', 'red');
      return;
    }

    setSubmitting(true);
    const { error } = await upsertPolicy(pos.ticker, {
      periodicidade,
      dia_pagamento: isNaN(diaPagamento) ? null : diaPagamento,
      valor_por_cota: valorPorCota,
      data_inicio: policy?.data_inicio || new Date().toISOString().slice(0, 10),
      ativo: true,
      observacao: null,
    });
    setSubmitting(false);

    if (error) showToast('Erro ao salvar política de provento.', 'red');
    else showToast('Política de provento atualizada com sucesso!');
  }

  const yieldImplicito = policy ? getImplicitMonthlyYield(policy.valor_por_cota, pos.precoAtual, policy.periodicidade) : 0;
  const yieldSuspeito = yieldImplicito > YIELD_MENSAL_SUSPEITO;

  const valorMensalEquivalente = policy ? valorPorCotaEquivalenteMensal(policy.valor_por_cota, policy.periodicidade) : null;
  const magicNumber = valorMensalEquivalente ? calcNumeroMagico(pos.precoAtual, valorMensalEquivalente) : null;
  const progresso = magicNumber ? Math.min(100, (pos.qtd / magicNumber) * 100) : 0;
  const faltam = magicNumber ? Math.max(0, magicNumber - pos.qtd) : 0;

  const proximoPagamento = policy ? getNextPaymentDate(policy) : null;

  return (
    <div className="bg-surface border border-border-soft rounded-[20px] p-[22px]">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="font-display text-[17px] font-semibold flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-purple-bright">
              <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" strokeLinecap="round" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
            Política de Provento &amp; Número Mágico
          </h2>
          <p className="text-[12.5px] text-text-3 mt-0.5">Cadastre a periodicidade real de pagamento para projetar a renda passiva com precisão</p>
        </div>
        <Select value={selectedTicker} onChange={(e) => setSelectedTicker(e.target.value)} className="w-auto">
          {fiiList.map((f) => (
            <option key={f.ticker} value={f.ticker}>{f.ticker}</option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <InputGroup>
              <Label>Periodicidade</Label>
              <Select name="periodicidade" defaultValue={policy?.periodicidade || 'mensal'} key={`${pos.ticker}-periodicidade`}>
                {Object.entries(PERIODICIDADE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </InputGroup>
            <InputGroup>
              <Label>Dia do pagamento</Label>
              <Input
                type="number" name="diaPagamento" placeholder="Ex: 15" min="1" max="31"
                defaultValue={policy?.dia_pagamento ?? ''} key={`${pos.ticker}-dia`}
              />
            </InputGroup>
          </div>
          <InputGroup>
            <Label>Valor por cota no período (R$)</Label>
            <Input
              type="number" step="0.01" name="valorPorCota" placeholder="Ex: 0.85 (mensal) ou 2.55 (trimestral)"
              defaultValue={policy?.valor_por_cota ?? ''} key={`${pos.ticker}-valor`} required
            />
            <span className="text-[11px] text-text-3">
              Informe o valor pago em cada evento, não a média mensal — ex: se um FII trimestral paga R$2,55 a cada 3 meses, digite 2,55, não 0,85.
            </span>
          </InputGroup>

          {policy && (
            <span className="text-[11.5px] text-text-3">
              Equivalente a {fmtPct(yieldImplicito * 100, 2)} do preço atual da cota (R$ {fmtNum(pos.precoAtual, 2)}) por mês, em média.
            </span>
          )}

          {yieldSuspeito && (
            <div className="flex gap-2 p-2.5 px-3 rounded-[10px] border bg-red/[0.08] border-red/30 text-red-dim text-[11.5px] leading-relaxed">
              <IconAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>
                Esse valor implica {fmtPct(yieldImplicito * 100, 1)} de yield <strong>mensal médio</strong> — bem acima do normal para FIIs (geralmente até ~2%/mês). Confira a periodicidade e o valor digitado. Por isso esse ativo não está entrando na "Renda Passiva Estimada" do Dashboard.
              </span>
            </div>
          )}

          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Salvando...' : policy ? 'Atualizar política' : 'Cadastrar política'}
          </Button>
        </form>

        <div className="pt-1.5">
          {policy ? (
            <div className="flex flex-col gap-4">
              {proximoPagamento && (
                <div className="flex items-center gap-2.5">
                  <Badge color="gold">Próximo pagamento previsto</Badge>
                  <span className="font-mono text-[13.5px]">{fmtDateBR(proximoPagamento)}</span>
                </div>
              )}
              {magicNumber ? (
                <div>
                  <div className="flex items-baseline gap-2.5 mb-2.5">
                    <span className="font-display text-[22px] font-bold text-neon">{fmtNum(magicNumber, 0)}</span>
                    <span className="text-text-3 text-[13px]">cotas para o efeito infinito</span>
                  </div>
                  <ProgressBar percent={progresso} />
                  <div className="flex justify-between text-[12.5px] mt-2">
                    <span className="text-text-2">Você tem <strong>{fmtNum(pos.qtd, 0)}</strong> cotas ({fmtNum(progresso, 1)}%)</span>
                    <span className="text-text-3">{faltam > 0 ? `Faltam ${fmtNum(faltam, 0)} cotas` : 'Meta atingida! 🎉'}</span>
                  </div>
                </div>
              ) : (
                <div className="text-text-3 text-[13px]">Yield suspeito — corrija a política para calcular o Número Mágico.</div>
              )}
            </div>
          ) : (
            <div className="text-text-3 text-[13px] pt-6">Cadastre a política de provento ao lado para ver a projeção e o Número Mágico.</div>
          )}
        </div>
      </div>
    </div>
  );
}
