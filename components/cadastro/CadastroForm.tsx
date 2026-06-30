'use client';

import { useState, FormEvent } from 'react';
import { usePortfolioData } from '@/lib/hooks/usePortfolioData';
import { useToast } from '@/components/ui/toast';
import { Button, Input, Select, Label, InputGroup, EmptyState, Badge } from '@/components/ui';
import { IconStocks, IconFixedIncome, IconTreasury, IconFunds, IconCrypto, IconAdd, IconTrash, IconEmpty } from '@/components/ui/icons';
import { fmtDateBR, todayISO } from '@/lib/finance/utils';
import type { Categoria, NewTransaction } from '@/types';

const CATEGORIA_OPTIONS: { id: Categoria; label: string; Icon: any }[] = [
  { id: 'bolsa', label: 'Bolsa de Valores', Icon: IconStocks },
  { id: 'renda_fixa', label: 'Renda Fixa', Icon: IconFixedIncome },
  { id: 'tesouro', label: 'Tesouro Direto', Icon: IconTreasury },
  { id: 'fundos', label: 'Fundos de Investimento', Icon: IconFunds },
  { id: 'cripto', label: 'Criptomoedas', Icon: IconCrypto },
];

const CATEGORIA_LABEL: Record<Categoria, string> = {
  bolsa: 'Bolsa', renda_fixa: 'Renda Fixa', tesouro: 'Tesouro Direto', fundos: 'Fundos', cripto: 'Cripto',
};

export function CadastroForm() {
  const { transactions, addTransaction, deleteTransaction } = usePortfolioData();
  const { showToast } = useToast();
  const [categoria, setCategoria] = useState<Categoria>('bolsa');
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0); // força reset visual do form

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const get = (name: string) => (data.get(name) as string) || '';

    let tx: NewTransaction;

    if (categoria === 'bolsa') {
      const quantidade = parseFloat(get('quantidade'));
      const valorUnitario = parseFloat(get('valorUnitario'));
      const ticker = get('ticker').toUpperCase().trim();
      if (!ticker || isNaN(quantidade) || isNaN(valorUnitario)) {
        showToast('Preencha todos os campos corretamente.', 'red');
        return;
      }
      tx = {
        categoria, tipo_ativo: get('tipoAtivo') as any, ticker, quantidade,
        valor_unitario: valorUnitario, data_compra: get('dataCompra'),
      };
    } else if (categoria === 'renda_fixa' || categoria === 'tesouro') {
      const valorInvestido = parseFloat(get('valorInvestido'));
      const taxaContratada = parseFloat(get('taxaContratada'));
      if (isNaN(valorInvestido) || isNaN(taxaContratada)) {
        showToast('Preencha todos os campos corretamente.', 'red');
        return;
      }
      tx = {
        categoria, nome_produto: get('nomeProduto'), produto_tipo: get('produtoTipo'),
        valor_investido: valorInvestido, data_aplicacao: get('dataAplicacao'),
        indexador: get('indexador') as any, taxa_contratada: taxaContratada,
        data_vencimento: get('dataVencimento'),
      };
    } else if (categoria === 'fundos') {
      const cotas = parseFloat(get('cotas'));
      const valorCotaCompra = parseFloat(get('valorCotaCompra'));
      const valorCotaAtual = parseFloat(get('valorCotaAtual'));
      const semPrazoResgate = data.get('semPrazoResgate') === 'on';
      if (!get('nomeFundo') || isNaN(cotas) || isNaN(valorCotaCompra) || isNaN(valorCotaAtual)) {
        showToast('Preencha todos os campos corretamente.', 'red');
        return;
      }
      tx = {
        categoria, nome_fundo: get('nomeFundo'), tipo_fundo: get('tipoFundo'),
        cotas, valor_cota_compra: valorCotaCompra, valor_cota_atual: valorCotaAtual,
        data_aplicacao: get('dataAplicacao'), sem_prazo_resgate: semPrazoResgate,
      };
    } else {
      const fracao = parseFloat(get('fracao'));
      const valorTotalPago = parseFloat(get('valorTotalPago'));
      if (isNaN(fracao) || isNaN(valorTotalPago)) {
        showToast('Preencha todos os campos corretamente.', 'red');
        return;
      }
      tx = {
        categoria, ativo: get('ativo'), fracao, valor_total_pago: valorTotalPago,
        data_compra: get('dataCompra'),
      };
    }

    setSubmitting(true);
    const { error } = await addTransaction(tx);
    setSubmitting(false);

    if (error) {
      showToast('Erro ao salvar transação. Tente novamente.', 'red');
    } else {
      showToast('Transação cadastrada com sucesso!');
      form.reset();
      setFormKey((k) => k + 1);
    }
  }

  async function handleDelete(id: string) {
    const { error } = await deleteTransaction(id);
    if (error) showToast('Erro ao excluir transação.', 'red');
    else showToast('Transação excluída.');
  }

  const recent = [...transactions].slice(0, 6);

  return (
    <div>
      <div className="bg-surface border border-border-soft rounded-[20px] p-[22px] max-w-[760px]">
        <div className="mb-6">
          <h2 className="font-display text-[17px] font-semibold">1. Selecione a categoria</h2>
          <p className="text-[12.5px] text-text-3 mt-0.5">Isso define quais campos você vai preencher a seguir</p>
        </div>
        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIA_OPTIONS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setCategoria(id)}
              className={`px-4 py-2.5 rounded-[11px] border text-[13px] font-semibold flex items-center gap-2 transition-colors
                ${categoria === id
                  ? 'border-purple-bright bg-purple-bright/15 text-text-1 ring-1 ring-purple-bright ring-inset'
                  : 'border-border bg-surface-2 text-text-2 hover:bg-surface-3'}`}
            >
              <Icon className="w-[15px] h-[15px]" /> {label}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <h2 className="font-display text-[17px] font-semibold">2. Detalhes da transação</h2>
        </div>

        <form key={formKey} onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-[22px]">
            <DynamicFields categoria={categoria} />
          </div>
          <Button type="submit" variant="neon" className="w-full" disabled={submitting}>
            <IconAdd className="w-4 h-4" /> {submitting ? 'Salvando...' : 'Salvar transação'}
          </Button>
        </form>
      </div>

      <div className="bg-surface border border-border-soft rounded-[20px] p-[22px] max-w-[760px] mt-5">
        <h2 className="font-display text-[17px] font-semibold mb-4">Últimas transações cadastradas</h2>
        {recent.length === 0 ? (
          <EmptyState icon={<IconEmpty className="w-10 h-10" />} title="Nenhuma transação ainda" />
        ) : (
          <div className="flex flex-col gap-2">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 px-3.5 py-3 bg-surface-2 rounded-[10px] border border-border-soft">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <Badge color="purple">{CATEGORIA_LABEL[t.categoria]}</Badge>
                  <span className="text-[13.5px] font-semibold truncate">
                    {t.ticker || t.nome_produto || t.nome_fundo || t.ativo || '—'}
                  </span>
                  <span className="text-[12px] text-text-3">{fmtDateBR(t.data_compra || t.data_aplicacao)}</span>
                </div>
                <button onClick={() => handleDelete(t.id)} className="p-2 rounded-[9px] bg-surface-2 border border-border text-text-2 hover:text-red-dim hover:bg-surface-3" title="Excluir">
                  <IconTrash className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DynamicFields({ categoria }: { categoria: Categoria }) {
  const today = todayISO();

  if (categoria === 'bolsa') {
    return (
      <>
        <InputGroup>
          <Label>Tipo de ativo</Label>
          <Select name="tipoAtivo" defaultValue="acao">
            <option value="acao">Ação</option>
            <option value="fii">Fundo Imobiliário (FII)</option>
          </Select>
        </InputGroup>
        <InputGroup>
          <Label>Ticker / Sigla</Label>
          <Input name="ticker" placeholder="Ex: PETR4, MXRF11" required maxLength={8} className="uppercase" />
        </InputGroup>
        <InputGroup>
          <Label>Quantidade</Label>
          <Input type="number" name="quantidade" placeholder="Ex: 100" min="1" step="1" required />
        </InputGroup>
        <InputGroup>
          <Label>Valor unitário da compra (R$)</Label>
          <Input type="number" name="valorUnitario" placeholder="Ex: 28.50" min="0.01" step="0.01" required />
        </InputGroup>
        <InputGroup>
          <Label>Data da compra</Label>
          <Input type="date" name="dataCompra" defaultValue={today} max={today} required />
        </InputGroup>
      </>
    );
  }

  if (categoria === 'renda_fixa' || categoria === 'tesouro') {
    const isTesouro = categoria === 'tesouro';
    return (
      <>
        <div className="sm:col-span-2">
          <InputGroup>
            <Label>{isTesouro ? 'Título do Tesouro' : 'Nome / Produto'}</Label>
            {isTesouro ? (
              <Select name="nomeProduto">
                <option value="Tesouro Selic">Tesouro Selic</option>
                <option value="Tesouro Prefixado">Tesouro Prefixado</option>
                <option value="Tesouro IPCA+">Tesouro IPCA+</option>
              </Select>
            ) : (
              <Input name="nomeProduto" placeholder="Ex: CDB Banco XP 2027" required />
            )}
          </InputGroup>
        </div>
        {!isTesouro ? (
          <InputGroup>
            <Label>Tipo de produto</Label>
            <Select name="produtoTipo">
              <option value="CDB">CDB</option>
              <option value="LCI">LCI (isento de IR)</option>
              <option value="LCA">LCA (isento de IR)</option>
            </Select>
          </InputGroup>
        ) : (
          <input type="hidden" name="produtoTipo" value="Tesouro" />
        )}
        <InputGroup>
          <Label>Valor investido (R$)</Label>
          <Input type="number" name="valorInvestido" placeholder="Ex: 5000.00" min="0.01" step="0.01" required />
        </InputGroup>
        <InputGroup>
          <Label>Data da aplicação</Label>
          <Input type="date" name="dataAplicacao" defaultValue={today} max={today} required />
        </InputGroup>
        <InputGroup>
          <Label>Indexador</Label>
          <Select name="indexador" defaultValue="CDI">
            <option value="CDI">% do CDI (pós-fixado)</option>
            <option value="PREFIXADO">Prefixado (taxa fixa a.a.)</option>
            <option value="IPCA">IPCA+ (taxa fixa a.a. sobre IPCA)</option>
          </Select>
        </InputGroup>
        <InputGroup>
          <Label>Taxa contratada (% do CDI ou a.a.)</Label>
          <Input type="number" name="taxaContratada" placeholder="Ex: 115" min="0.01" step="0.01" required />
        </InputGroup>
        <InputGroup>
          <Label>Data de vencimento</Label>
          <Input type="date" name="dataVencimento" required />
        </InputGroup>
      </>
    );
  }

  if (categoria === 'fundos') {
    return (
      <>
        <div className="sm:col-span-2">
          <InputGroup>
            <Label>Nome do fundo</Label>
            <Input name="nomeFundo" placeholder="Ex: XP Macro FIC FIM" required />
          </InputGroup>
        </div>
        <InputGroup>
          <Label>Tipo de fundo</Label>
          <Select name="tipoFundo" defaultValue="multimercado">
            <option value="multimercado">Multimercado</option>
            <option value="acoes">Ações</option>
            <option value="cambial">Cambial</option>
            <option value="renda_fixa">Renda Fixa</option>
          </Select>
        </InputGroup>
        <InputGroup>
          <Label>Quantidade de cotas</Label>
          <Input type="number" name="cotas" placeholder="Ex: 120.5" min="0.000001" step="0.000001" required />
        </InputGroup>
        <InputGroup>
          <Label>Valor da cota na compra (R$)</Label>
          <Input type="number" name="valorCotaCompra" placeholder="Ex: 102.34" min="0.000001" step="0.000001" required />
        </InputGroup>
        <InputGroup>
          <Label>Valor da cota atualizado (R$)</Label>
          <Input type="number" name="valorCotaAtual" placeholder="Ex: 108.90" min="0.000001" step="0.000001" required />
        </InputGroup>
        <InputGroup>
          <Label>Data da aplicação</Label>
          <Input type="date" name="dataAplicacao" defaultValue={today} max={today} required />
        </InputGroup>
        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-[13px] text-text-2">
            <input type="checkbox" name="semPrazoResgate" className="accent-purple-bright w-4 h-4" />
            Este fundo não tem prazo de resgate definido (fundo aberto perpétuo)
          </label>
        </div>
      </>
    );
  }

  // cripto
  return (
    <>
      <InputGroup>
        <Label>Ativo</Label>
        <Select name="ativo" defaultValue="BTC">
          <option value="BTC">Bitcoin (BTC)</option>
        </Select>
      </InputGroup>
      <InputGroup>
        <Label>Fração comprada</Label>
        <Input type="number" name="fracao" placeholder="Ex: 0.00150000" min="0.00000001" step="0.00000001" required />
      </InputGroup>
      <InputGroup>
        <Label>Valor total pago (R$)</Label>
        <Input type="number" name="valorTotalPago" placeholder="Ex: 850.00" min="0.01" step="0.01" required />
      </InputGroup>
      <InputGroup>
        <Label>Data da compra</Label>
        <Input type="date" name="dataCompra" defaultValue={today} max={today} required />
      </InputGroup>
    </>
  );
}
