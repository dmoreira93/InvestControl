'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserConfig } from '@/types';

interface ConfigContextValue {
  config: UserConfig;
  updateConfig: (selic: number, spread: number) => Promise<void>;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

export function ConfigProvider({
  children, initialConfig,
}: {
  children: React.ReactNode;
  initialConfig: UserConfig;
}) {
  const [config, setConfig] = useState<UserConfig>(initialConfig);

  const updateConfig = useCallback(async (selic: number, spread: number) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_config')
      .upsert(
        { user_id: config.user_id, selic_meta: selic, cdi_spread: spread, last_calibration: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
      .select()
      .maybeSingle();

    if (!error && data) {
      setConfig(data as UserConfig);
    } else {
      // Fallback local mesmo se o select pós-upsert falhar por algum motivo de RLS/rede
      setConfig((prev) => ({ ...prev, selic_meta: selic, cdi_spread: spread }));
    }
  }, [config.user_id]);

  return (
    <ConfigContext.Provider value={{ config, updateConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig deve ser usado dentro de um ConfigProvider');
  return ctx;
}
