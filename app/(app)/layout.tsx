import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShellClient } from './AppShellClient';
import type { UserConfig } from '@/types';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let { data: config } = await supabase
    .from('user_config')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!config) {
    const { data: created } = await supabase
      .from('user_config')
      .insert({ user_id: user.id, selic_meta: 14.9, cdi_spread: 0.1 })
      .select()
      .maybeSingle();
    config = created;
  }

  const finalConfig: UserConfig = config ?? {
    user_id: user.id,
    selic_meta: 14.9,
    cdi_spread: 0.1,
    last_calibration: null,
    updated_at: new Date().toISOString(),
  };

  return (
    <AppShellClient initialConfig={finalConfig}>
      {children}
    </AppShellClient>
  );
}
