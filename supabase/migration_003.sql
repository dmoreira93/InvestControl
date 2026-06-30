-- =============================================================================
-- VÉRTICE — Migration 003
-- Execute este script no SQL Editor do Supabase DEPOIS da migration_002.sql.
-- Adiciona:
--   1) dividend_policy -> política de pagamento de provento por ativo
--      (periodicidade, dia do pagamento, valor médio por cota)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABELA: dividend_policy
-- Política de pagamento de provento de um ativo (FII ou ação), usada para
-- projetar a Renda Passiva Estimada no Dashboard e calcular o Número Mágico
-- com precisão — em vez de um valor "médio" solto, sabemos a periodicidade
-- real (mensal, trimestral, etc.) e em quais meses o provento efetivamente cai.
-- -----------------------------------------------------------------------------
create table if not exists public.dividend_policy (
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  periodicidade text not null check (periodicidade in ('mensal','bimestral','trimestral','semestral','anual','irregular')),
  dia_pagamento integer check (dia_pagamento between 1 and 31),
  valor_por_cota numeric(18,6) not null,
  data_inicio date not null default current_date,  -- a partir de quando essa política vale (mês de referência)
  ativo boolean not null default true,              -- permite "desativar" sem apagar o histórico
  observacao text,
  updated_at timestamptz not null default now(),
  primary key (user_id, ticker)
);

alter table public.dividend_policy enable row level security;

create policy "Usuário gerencia a própria política de provento"
  on public.dividend_policy for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =============================================================================
-- FIM DA MIGRATION 003
-- =============================================================================
