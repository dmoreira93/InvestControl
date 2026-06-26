'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Transaction, NewTransaction, Quote } from '@/types';

/**
 * Hook de dados de investimento: carrega transações e cotações manuais do
 * usuário logado, e expõe funções de mutação que já persistem no Supabase.
 * A configuração (Selic/CDI) vem do ConfigContext (useConfig), não daqui,
 * para evitar duplicidade de fonte de verdade entre Sidebar e páginas.
 */
export function usePortfolioData() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) {
      setLoading(false);
      return;
    }
    setUserId(uid);

    const [txRes, quotesRes] = await Promise.all([
      supabase.from('transactions').select('*').order('created_at', { ascending: false }),
      supabase.from('quotes').select('*').eq('user_id', uid),
    ]);

    setTransactions(txRes.data || []);

    const quotesMap: Record<string, Quote> = {};
    (quotesRes.data || []).forEach((q: Quote) => { quotesMap[q.ticker] = q; });
    setQuotes(quotesMap);

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const addTransaction = useCallback(async (tx: NewTransaction) => {
    if (!userId) return { error: 'Usuário não autenticado' };
    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...tx, user_id: userId })
      .select()
      .maybeSingle();
    if (!error && data) {
      setTransactions((prev) => [data as Transaction, ...prev]);
    }
    return { data, error };
  }, [supabase, userId]);

  const deleteTransaction = useCallback(async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    }
    return { error };
  }, [supabase]);

  const upsertQuote = useCallback(async (ticker: string, patch: Partial<Pick<Quote, 'preco_atual' | 'vp_contabil' | 'dividendo_medio'>>) => {
    if (!userId) return { error: 'Usuário não autenticado' };
    const existing = quotes[ticker];
    const payload = { user_id: userId, ticker, ...existing, ...patch, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from('quotes')
      .upsert(payload, { onConflict: 'user_id,ticker' })
      .select()
      .maybeSingle();
    if (!error && data) {
      setQuotes((prev) => ({ ...prev, [ticker]: data as Quote }));
    }
    return { data, error };
  }, [supabase, userId, quotes]);

  return {
    loading,
    userId,
    transactions,
    quotes,
    addTransaction,
    deleteTransaction,
    upsertQuote,
    reload: loadAll,
  };
}
