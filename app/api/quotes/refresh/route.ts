import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchBrapiQuotes } from '@/lib/finance/brapi';

/**
 * POST /api/quotes/refresh
 *
 * Busca as cotações reais (brapi.dev) de todos os tickers de Bolsa que o
 * usuário logado possui em carteira, e grava o preço atualizado na tabela
 * `quotes`. Pensado para ser chamado uma vez quando a página de Bolsa carrega
 * (não em polling contínuo), já que o caso de uso é "abrir o app 1-2x/dia e
 * ver o preço certo", não tempo real.
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
    .select('ticker')
    .eq('categoria', 'bolsa')
    .eq('user_id', userId);

  if (txError) {
    return NextResponse.json({ error: 'Erro ao buscar transações' }, { status: 500 });
  }

  const tickers = Array.from(
    new Set((transactions || []).map((t) => t.ticker).filter((t): t is string => Boolean(t)))
  );

  if (tickers.length === 0) {
    return NextResponse.json({ updated: [], message: 'Nenhum ticker de Bolsa cadastrado.' });
  }

  const quotes = await fetchBrapiQuotes(tickers);

  const updated: string[] = [];
  const failed: string[] = [];

  for (const q of quotes) {
    if (q.preco === null) {
      failed.push(q.ticker);
      continue;
    }

    const { data: existing } = await supabase
      .from('quotes')
      .select('*')
      .eq('user_id', userId)
      .eq('ticker', q.ticker)
      .maybeSingle();

    const { error: upsertError } = await supabase
      .from('quotes')
      .upsert(
        { ...existing, user_id: userId, ticker: q.ticker, preco_atual: q.preco, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,ticker' }
      );

    if (!upsertError) updated.push(q.ticker);
    else failed.push(q.ticker);
  }

  return NextResponse.json({ updated, failed });
}
