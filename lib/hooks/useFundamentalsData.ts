'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { FundamentalsCache } from '@/types';

export function useFundamentalsData() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [fundamentals, setFundamentals] = useState<Record<string, FundamentalsCache>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [failedTickers, setFailedTickers] = useState<string[]>([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) {
      setLoading(false);
      return;
    }
    setUserId(uid);

    const { data } = await supabase.from('fundamentals_cache').select('*').eq('user_id', uid);
    const map: Record<string, FundamentalsCache> = {};
    (data || []).forEach((f: FundamentalsCache) => { map[f.ticker] = f; });
    setFundamentals(map);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/fundamentals/refresh', { method: 'POST' });
      const json = await res.json();
      setFailedTickers(json.failed || []);
      setLastUpdated(new Date());
      await loadAll();
      return json;
    } catch (e) {
      console.warn('Falha ao atualizar fundamentos.', e);
      return null;
    } finally {
      setRefreshing(false);
    }
  }, [loadAll]);

  const upsertManual = useCallback(async (
    ticker: string,
    patch: Partial<Pick<FundamentalsCache, 'pl' | 'pvp' | 'roe' | 'dividend_yield' | 'ev_ebitda' | 'enterprise_value' | 'cash' | 'market_cap'>>
  ) => {
    if (!userId) return { error: 'Usuário não autenticado' };
    const existing = fundamentals[ticker];
    const payload = {
      user_id: userId,
      ticker,
      pl: existing?.pl ?? null,
      pvp: existing?.pvp ?? null,
      roe: existing?.roe ?? null,
      dividend_yield: existing?.dividend_yield ?? null,
      ev_ebitda: existing?.ev_ebitda ?? null,
      enterprise_value: existing?.enterprise_value ?? null,
      cash: existing?.cash ?? null,
      market_cap: existing?.market_cap ?? null,
      ...patch,
      fonte: 'manual' as const,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('fundamentals_cache')
      .upsert(payload, { onConflict: 'user_id,ticker' })
      .select()
      .maybeSingle();
    if (!error && data) {
      setFundamentals((prev) => ({ ...prev, [ticker]: data as FundamentalsCache }));
    }
    return { data, error };
  }, [supabase, userId, fundamentals]);

  return { loading, refreshing, lastUpdated, failedTickers, fundamentals, refresh, upsertManual, reload: loadAll };
}
