-- =============================================================================
-- VÉRTICE — Schema do Supabase
-- Execute este script no SQL Editor do seu projeto Supabase (uma única vez).
-- Todas as tabelas usam Row Level Security (RLS): cada usuário só vê e edita
-- os próprios dados, identificados por auth.uid().
-- =============================================================================

-- -----------------------------------------------------------------------------
-- EXTENSÕES
-- -----------------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- TABELA: profiles
-- Perfil do usuário, criado automaticamente após o cadastro (trigger abaixo).
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Usuário vê o próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuário edita o próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- Cria o perfil automaticamente quando um novo usuário se cadastra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, new.raw_user_meta_data ->> 'nome');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- -----------------------------------------------------------------------------
-- TABELA: user_config
-- Configurações do usuário: Taxa Selic Meta (calibração manual) e spread CDI.
-- -----------------------------------------------------------------------------
create table if not exists public.user_config (
  user_id uuid primary key references auth.users(id) on delete cascade,
  selic_meta numeric(6,2) not null default 14.90,
  cdi_spread numeric(6,2) not null default 0.10,
  last_calibration timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.user_config enable row level security;

create policy "Usuário gerencia a própria config"
  on public.user_config for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- TABELA: transactions
-- Todas as transações de investimento (Bolsa, Renda Fixa, Tesouro, Fundos, Cripto).
-- Estrutura flexível: campos opcionais conforme a categoria, validados na aplicação.
-- -----------------------------------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  categoria text not null check (categoria in ('bolsa','renda_fixa','tesouro','fundos','cripto')),

  -- Bolsa de Valores (ações/FIIs)
  tipo_ativo text check (tipo_ativo in ('acao','fii')),
  ticker text,
  quantidade numeric(18,8),
  valor_unitario numeric(18,4),
  data_compra date,

  -- Renda Fixa / Tesouro Direto
  nome_produto text,
  produto_tipo text,
  valor_investido numeric(18,4),
  data_aplicacao date,
  indexador text check (indexador in ('CDI','PREFIXADO','IPCA')),
  taxa_contratada numeric(8,4),
  data_vencimento date,

  -- Fundos de Investimento
  nome_fundo text,
  tipo_fundo text,
  cotas numeric(18,8),
  valor_cota_compra numeric(18,8),
  valor_cota_atual numeric(18,8),

  -- Criptomoedas
  ativo text,
  fracao numeric(18,8),
  valor_total_pago numeric(18,4),

  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "Usuário vê as próprias transações"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Usuário insere as próprias transações"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Usuário atualiza as próprias transações"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Usuário exclui as próprias transações"
  on public.transactions for delete
  using (auth.uid() = user_id);

create index if not exists idx_transactions_user_categoria
  on public.transactions (user_id, categoria);

-- -----------------------------------------------------------------------------
-- TABELA: quotes
-- Cotações manuais/simuladas por usuário: preço de ações, VP contábil de FIIs,
-- dividendo médio de FIIs e último preço do Bitcoin obtido.
-- -----------------------------------------------------------------------------
create table if not exists public.quotes (
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  preco_atual numeric(18,4),
  vp_contabil numeric(18,4),
  dividendo_medio numeric(18,4),
  updated_at timestamptz not null default now(),
  primary key (user_id, ticker)
);

alter table public.quotes enable row level security;

create policy "Usuário gerencia as próprias cotações"
  on public.quotes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- TABELA: finance_entries
-- Lançamentos do Controle Financeiro: receitas, despesas e proventos recebidos.
-- -----------------------------------------------------------------------------
create table if not exists public.finance_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('receita','despesa','provento')),
  categoria text not null,           -- ex: Salário, Moradia, Dividendo FII, etc.
  descricao text,
  valor numeric(18,4) not null,
  data date not null,
  recorrente boolean not null default false,
  ticker_origem text,                -- preenchido quando tipo = 'provento', ex: MXRF11
  created_at timestamptz not null default now()
);

alter table public.finance_entries enable row level security;

create policy "Usuário vê os próprios lançamentos"
  on public.finance_entries for select
  using (auth.uid() = user_id);

create policy "Usuário insere os próprios lançamentos"
  on public.finance_entries for insert
  with check (auth.uid() = user_id);

create policy "Usuário atualiza os próprios lançamentos"
  on public.finance_entries for update
  using (auth.uid() = user_id);

create policy "Usuário exclui os próprios lançamentos"
  on public.finance_entries for delete
  using (auth.uid() = user_id);

create index if not exists idx_finance_entries_user_data
  on public.finance_entries (user_id, data desc);

-- -----------------------------------------------------------------------------
-- TABELA: debts
-- Dívidas e empréstimos do usuário (cartão, financiamento, empréstimo pessoal).
-- -----------------------------------------------------------------------------
create table if not exists public.debts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('cartao','emprestimo','financiamento','outro')),
  valor_total numeric(18,4) not null,
  valor_pago numeric(18,4) not null default 0,
  taxa_juros_mensal numeric(8,4),
  parcelas_total integer,
  parcelas_pagas integer not null default 0,
  data_inicio date,
  data_vencimento_proxima date,
  quitada boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.debts enable row level security;

create policy "Usuário vê as próprias dívidas"
  on public.debts for select
  using (auth.uid() = user_id);

create policy "Usuário insere as próprias dívidas"
  on public.debts for insert
  with check (auth.uid() = user_id);

create policy "Usuário atualiza as próprias dívidas"
  on public.debts for update
  using (auth.uid() = user_id);

create policy "Usuário exclui as próprias dívidas"
  on public.debts for delete
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- TABELA: financial_goals
-- Metas financeiras e reservas (ex: Reserva de Emergência, Viagem, Casa).
-- -----------------------------------------------------------------------------
create table if not exists public.financial_goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  valor_meta numeric(18,4) not null,
  valor_atual numeric(18,4) not null default 0,
  data_limite date,
  cor text default '#9D5CFF',
  concluida boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.financial_goals enable row level security;

create policy "Usuário vê as próprias metas"
  on public.financial_goals for select
  using (auth.uid() = user_id);

create policy "Usuário insere as próprias metas"
  on public.financial_goals for insert
  with check (auth.uid() = user_id);

create policy "Usuário atualiza as próprias metas"
  on public.financial_goals for update
  using (auth.uid() = user_id);

create policy "Usuário exclui as próprias metas"
  on public.financial_goals for delete
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- TABELA: budget_limits
-- Orçamento mensal por categoria de despesa (ex: Alimentação -> R$ 800/mês).
-- -----------------------------------------------------------------------------
create table if not exists public.budget_limits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  categoria text not null,
  limite_mensal numeric(18,4) not null,
  created_at timestamptz not null default now(),
  unique (user_id, categoria)
);

alter table public.budget_limits enable row level security;

create policy "Usuário gerencia o próprio orçamento"
  on public.budget_limits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =============================================================================
-- FIM DO SCHEMA
-- =============================================================================
