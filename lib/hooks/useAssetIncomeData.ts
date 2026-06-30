'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AssetIncome, NewAssetIncome } from '@/types';

export function useAssetIncomeData() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [income, setIncome] = useState<AssetIncome[]>([]);
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

    const { data } = await supabase
      .from('asset_income')
      .select('*')
      .order('data', { ascending: false });
    setIncome(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const addIncome = useCallback(async (entry: NewAssetIncome) => {
    if (!userId) return { error: 'Usuário não autenticado' };
    const { data, error } = await supabase
      .from('asset_income')
      .insert({ ...entry, user_id: userId })
      .select()
      .maybeSingle();
    if (!error && data) setIncome((prev) => [data as AssetIncome, ...prev]);
    return { data, error };
  }, [supabase, userId]);

  const deleteIncome = useCallback(async (id: string) => {
    const { error } = await supabase.from('asset_income').delete().eq('id', id);
    if (!error) setIncome((prev) => prev.filter((i) => i.id !== id));
    return { error };
  }, [supabase]);

  return { loading, income, addIncome, deleteIncome, reload: loadAll };
}
