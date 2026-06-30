'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { DividendPolicy, NewDividendPolicy } from '@/types';

export function useDividendPolicyData() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [policies, setPolicies] = useState<Record<string, DividendPolicy>>({});
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

    const { data } = await supabase.from('dividend_policy').select('*').eq('user_id', uid);
    const map: Record<string, DividendPolicy> = {};
    (data || []).forEach((p: DividendPolicy) => { map[p.ticker] = p; });
    setPolicies(map);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const upsertPolicy = useCallback(async (ticker: string, patch: Omit<NewDividendPolicy, 'user_id' | 'ticker'>) => {
    if (!userId) return { error: 'Usuário não autenticado' };
    const payload = { user_id: userId, ticker, ...patch, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from('dividend_policy')
      .upsert(payload, { onConflict: 'user_id,ticker' })
      .select()
      .maybeSingle();
    if (!error && data) {
      setPolicies((prev) => ({ ...prev, [ticker]: data as DividendPolicy }));
    }
    return { data, error };
  }, [supabase, userId]);

  const deletePolicy = useCallback(async (ticker: string) => {
    if (!userId) return { error: 'Usuário não autenticado' };
    const { error } = await supabase.from('dividend_policy').delete().eq('user_id', userId).eq('ticker', ticker);
    if (!error) {
      setPolicies((prev) => {
        const next = { ...prev };
        delete next[ticker];
        return next;
      });
    }
    return { error };
  }, [supabase, userId]);

  return { loading, policies, upsertPolicy, deletePolicy, reload: loadAll };
}
