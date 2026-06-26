'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { ConfigProvider } from '@/lib/hooks/useConfig';
import type { UserConfig } from '@/types';

export function AppShellClient({
  children, initialConfig,
}: {
  children: React.ReactNode;
  initialConfig: UserConfig;
}) {
  return (
    <ConfigProvider initialConfig={initialConfig}>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 min-w-0 p-8 pb-16 px-10">{children}</main>
      </div>
    </ConfigProvider>
  );
}
