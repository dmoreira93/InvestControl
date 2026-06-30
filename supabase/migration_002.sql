-- =============================================================================
-- VÉRTICE — Migration 002
-- Execute este script no SQL Editor do Supabase DEPOIS do schema.sql original.
-- Adiciona:
--   1) asset_income      -> rendimentos recebidos, vinculados a um ativo/posição
--   2) fundamentals_cache -> cache dos indicadores fundamentalistas (P/L, ROE, etc.)
--   3) ajuste em transactions -> suporte a fundos "sem prazo de resgate"
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABELA: asset_income
-- Rendimentos recebidos vinculados diretamente a uma posição/ativo (dividendos,
-- JCP, cupons de renda fixa, rendimentos de fundos) — separado do Controle
-- Financeiro por design: aqui o vínculo é com o ativo, não com um orçamento.
-- -----------------------------------------------------------------------------
create table if not exists public.asset_income (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  categoria text not null check (categoria in ('bolsa','renda_fixa','tesouro','fundos','cripto')),
  identificador text not null,        -- ticker (bolsa/cripto) ou nome_produto/nome_fundo (renda fixa/tesouro/fundos)
  tipo_rendimento text not null check (tipo_rendimento in ('dividendo','jcp','rendimento_fii','cupom','amortizacao','outro')),
  valor numeric(18,4) not null,
  data date not null,
  observacao text,
  created_at timestamptz not null default now()
);

alter table public.asset_income enable row level security;

create policy "Usuário vê os próprios rendimentos"
  on public.asset_income for select
  using (auth.uid() = user_id);

create policy "Usuário insere os próprios rendimentos"
  on public.asset_income for insert
  with check (auth.uid() = user_id);

create policy "Usuário atualiza os próprios rendimentos"
  on public.asset_income for update
  using (auth.uid() = user_id);

create policy "Usuário exclui os próprios rendimentos"
  on public.asset_income for delete
  using (auth.uid() = user_id);

create index if not exists idx_asset_income_user_identificador
  on public.asset_income (user_id, identificador);

-- -----------------------------------------------------------------------------
-- TABELA: fundamentals_cache
-- Cache por usuário dos indicadores fundamentalistas de cada ticker (vindos da
-- API bolsai ou preenchidos manualmente). Evita repetir chamadas à API a cada
-- carregamento de página e permite edição manual quando a API não cobre o ativo.
-- -----------------------------------------------------------------------------
create table if not exists public.fundamentals_cache (
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  pl numeric(12,4),                   -- Preço / Lucro
  pvp numeric(12,4),                  -- Preço / Valor Patrimonial
  roe numeric(8,4),                   -- Retorno sobre Patrimônio (%)
  dividend_yield numeric(8,4),        -- Dividend Yield 12m (%)
  ev_ebitda numeric(12,4),            -- Valor da Empresa / EBITDA
  enterprise_value numeric(20,2),     -- Valor da Empresa (EV)
  cash numeric(20,2),                 -- Caixa e equivalentes
  market_cap numeric(20,2),           -- Valor de mercado
  fonte text not null default 'manual' check (fonte in ('api','manual')),
  updated_at timestamptz not null default now(),
  primary key (user_id, ticker)
);

alter table public.fundamentals_cache enable row level security;

create policy "Usuário gerencia os próprios fundamentos"
  on public.fundamentals_cache for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- AJUSTE: transactions — fundos sem prazo de resgate
-- Alguns fundos de investimento não têm data de vencimento/resgate definida
-- (ex: fundos abertos perpétuos). Esta coluna marca esse caso explicitamente,
-- em vez de inferir isso pela ausência de uma data.
-- -----------------------------------------------------------------------------
alter table public.transactions
  add column if not exists sem_prazo_resgate boolean not null default false;

-- =============================================================================
-- FIM DA MIGRATION 002
-- =============================================================================
