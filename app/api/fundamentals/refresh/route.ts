import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchBolsaiFundamentalsBatch } from '@/lib/finance/bolsai';

/**
 * POST /api/fundamentals/refresh
 *
 * Busca os indicadores fundamentalistas (bolsai) de todos os tickers de
 * Ações que o usuário logado possui em carteira, e grava no cache
 * `fundamentals_cache`. Só atualiza tickers que ainda não têm um valor
 * preenchido manualmente sobrescrito recentemente — na prática, sempre
 * sobrescreve com `fonte = 'api'`, mas o usuário pode editar manualmente
 * depois (fonte passa a 'manual') e essa edição não é perdida até pedir
 * um novo refresh.
 */
export async function POST() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('ticker, tipo_ativo')
    .eq('categoria', 'bolsa')
    .eq('tipo_ativo', 'acao') // fundamentos (P/L, ROE, etc.) só fazem sentido para ações, não FIIs
    .eq('user_id', userId);

  if (txError) {
    return NextResponse.json({ error: 'Erro ao buscar transações' }, { status: 500 });
  }

  const tickers = Array.from(
    new Set((transactions || []).map((t) => t.ticker).filter((t): t is string => Boolean(t)))
  );

  if (tickers.length === 0) {
    return NextResponse.json({ updated: [], message: 'Nenhuma ação cadastrada.' });
  }

  const results = await fetchBolsaiFundamentalsBatch(tickers);

  const updated: string[] = [];
  const failed: string[] = [];

  for (const r of results) {
    const temAlgumDado = r.pl !== null || r.pvp !== null || r.roe !== null || r.evEbitda !== null || r.dividendYield !== null;

    if (!temAlgumDado) {
      failed.push(r.ticker);
      continue;
    }

    const { error: upsertError } = await supabase
      .from('fundamentals_cache')
      .upsert(
        {
          user_id: userId,
          ticker: r.ticker,
          pl: r.pl,
          pvp: r.pvp,
          roe: r.roe,
          dividend_yield: r.dividendYield,
          ev_ebitda: r.evEbitda,
          enterprise_value: r.enterpriseValue,
          cash: r.cash,
          market_cap: r.marketCap,
          fonte: 'api',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,ticker' }
      );

    if (!upsertError) updated.push(r.ticker);
    else failed.push(r.ticker);
  }

  return NextResponse.json({ updated, failed });
}
