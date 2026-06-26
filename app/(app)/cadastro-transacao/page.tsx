import { CadastroForm } from '@/components/cadastro/CadastroForm';

export default function CadastroTransacaoPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-7">
        <h1 className="font-display text-[26px] font-bold">Cadastrar Transação</h1>
        <p className="text-text-3 text-[13.5px] mt-0.5">Os campos do formulário se ajustam de acordo com a categoria escolhida</p>
      </div>
      <CadastroForm />
    </div>
  );
}
