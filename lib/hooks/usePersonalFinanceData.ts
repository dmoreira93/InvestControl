'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type {
  FinanceEntry, NewFinanceEntry,
  Debt, NewDebt,
  FinancialGoal, NewFinancialGoal,
  BudgetLimit, NewBudgetLimit,
} from '@/types';

export function usePersonalFinanceData() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [budgets, setBudgets] = useState<BudgetLimit[]>([]);
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

    const [entriesRes, debtsRes, goalsRes, budgetsRes] = await Promise.all([
      supabase.from('finance_entries').select('*').order('data', { ascending: false }),
      supabase.from('debts').select('*').order('created_at', { ascending: false }),
      supabase.from('financial_goals').select('*').order('created_at', { ascending: false }),
      supabase.from('budget_limits').select('*'),
    ]);

    setEntries(entriesRes.data || []);
    setDebts(debtsRes.data || []);
    setGoals(goalsRes.data || []);
    setBudgets(budgetsRes.data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ---- Lançamentos (receitas, despesas, proventos) ----
  const addEntry = useCallback(async (entry: NewFinanceEntry) => {
    if (!userId) return { error: 'Usuário não autenticado' };
    const { data, error } = await supabase.from('finance_entries').insert({ ...entry, user_id: userId }).select().maybeSingle();
    if (!error && data) setEntries((prev) => [data as FinanceEntry, ...prev]);
    return { data, error };
  }, [supabase, userId]);

  const deleteEntry = useCallback(async (id: string) => {
    const { error } = await supabase.from('finance_entries').delete().eq('id', id);
    if (!error) setEntries((prev) => prev.filter((e) => e.id !== id));
    return { error };
  }, [supabase]);

  // ---- Dívidas ----
  const addDebt = useCallback(async (debt: NewDebt) => {
    if (!userId) return { error: 'Usuário não autenticado' };
    const { data, error } = await supabase.from('debts').insert({ ...debt, user_id: userId }).select().maybeSingle();
    if (!error && data) setDebts((prev) => [data as Debt, ...prev]);
    return { data, error };
  }, [supabase, userId]);

  const updateDebt = useCallback(async (id: string, patch: Partial<NewDebt>) => {
    const { data, error } = await supabase.from('debts').update(patch).eq('id', id).select().maybeSingle();
    if (!error && data) setDebts((prev) => prev.map((d) => (d.id === id ? (data as Debt) : d)));
    return { data, error };
  }, [supabase]);

  const deleteDebt = useCallback(async (id: string) => {
    const { error } = await supabase.from('debts').delete().eq('id', id);
    if (!error) setDebts((prev) => prev.filter((d) => d.id !== id));
    return { error };
  }, [supabase]);

  // ---- Metas financeiras ----
  const addGoal = useCallback(async (goal: NewFinancialGoal) => {
    if (!userId) return { error: 'Usuário não autenticado' };
    const { data, error } = await supabase.from('financial_goals').insert({ ...goal, user_id: userId }).select().maybeSingle();
    if (!error && data) setGoals((prev) => [data as FinancialGoal, ...prev]);
    return { data, error };
  }, [supabase, userId]);

  const updateGoal = useCallback(async (id: string, patch: Partial<NewFinancialGoal>) => {
    const { data, error } = await supabase.from('financial_goals').update(patch).eq('id', id).select().maybeSingle();
    if (!error && data) setGoals((prev) => prev.map((g) => (g.id === id ? (data as FinancialGoal) : g)));
    return { data, error };
  }, [supabase]);

  const deleteGoal = useCallback(async (id: string) => {
    const { error } = await supabase.from('financial_goals').delete().eq('id', id);
    if (!error) setGoals((prev) => prev.filter((g) => g.id !== id));
    return { error };
  }, [supabase]);

  // ---- Orçamento (limites por categoria) ----
  const upsertBudget = useCallback(async (categoria: string, limite_mensal: number) => {
    if (!userId) return { error: 'Usuário não autenticado' };
    const { data, error } = await supabase
      .from('budget_limits')
      .upsert({ user_id: userId, categoria, limite_mensal }, { onConflict: 'user_id,categoria' })
      .select()
      .maybeSingle();
    if (!error && data) {
      setBudgets((prev) => {
        const exists = prev.some((b) => b.categoria === categoria);
        return exists ? prev.map((b) => (b.categoria === categoria ? (data as BudgetLimit) : b)) : [...prev, data as BudgetLimit];
      });
    }
    return { data, error };
  }, [supabase, userId]);

  const deleteBudget = useCallback(async (id: string) => {
    const { error } = await supabase.from('budget_limits').delete().eq('id', id);
    if (!error) setBudgets((prev) => prev.filter((b) => b.id !== id));
    return { error };
  }, [supabase]);

  return {
    loading,
    userId,
    entries, debts, goals, budgets,
    addEntry, deleteEntry,
    addDebt, updateDebt, deleteDebt,
    addGoal, updateGoal, deleteGoal,
    upsertBudget, deleteBudget,
    reload: loadAll,
  };
}
