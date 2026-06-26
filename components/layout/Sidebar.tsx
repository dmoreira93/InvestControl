'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fmtPct } from '@/lib/finance/utils';
import { useToast } from '@/components/ui/toast';
import { useConfig } from '@/lib/hooks/useConfig';
import { Button, Input } from '@/components/ui';
import {
  IconDashboard, IconAdd, IconStocks, IconFixedIncome, IconTreasury,
  IconFunds, IconCrypto, IconWallet, IconGear, IconLogout,
} from '@/components/ui/icons';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard Geral', Icon: IconDashboard },
  { href: '/cadastro-transacao', label: 'Cadastrar Transação', Icon: IconAdd },
  { href: '/bolsa', label: 'Bolsa de Valores', Icon: IconStocks },
  { href: '/renda-fixa', label: 'Renda Fixa', Icon: IconFixedIncome },
  { href: '/tesouro', label: 'Tesouro Direto', Icon: IconTreasury },
  { href: '/fundos', label: 'Fundos de Investimento', Icon: IconFunds },
  { href: '/cripto', label: 'Criptomoedas', Icon: IconCrypto },
];

const FINANCE_ITEM = { href: '/financas', label: 'Controle Financeiro', Icon: IconWallet };

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();
  const { config, updateConfig } = useConfig();
  const [modalOpen, setModalOpen] = useState(false);
  const [selicInput, setSelicInput] = useState(String(config.selic_meta));
  const [spreadInput, setSpreadInput] = useState(String(config.cdi_spread));
  const [saving, setSaving] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  async function handleSaveCalibration() {
    const selic = parseFloat(selicInput.replace(',', '.'));
    const spread = parseFloat(spreadInput.replace(',', '.'));
    if (isNaN(selic) || selic < 0) {
      showToast('Informe uma taxa Selic válida.', 'red');
      return;
    }
    setSaving(true);
    await updateConfig(selic, isNaN(spread) ? config.cdi_spread : spread);
    setSaving(false);
    setModalOpen(false);
    showToast(`Selic atualizada para ${fmtPct(selic)}. Rendimentos recalculados.`);
  }

  return (
    <>
      <aside className="w-[264px] flex-shrink-0 bg-gradient-to-b from-[#150F26] to-[#0F0B1C] border-r border-border-soft p-4 pt-7 flex flex-col gap-1.5 sticky top-0 h-screen overflow-y-auto">
        <div className="flex items-center gap-2.5 px-2.5 pb-6">
          <div className="w-[34px] h-[34px] rounded-[10px] bg-gradient-to-br from-purple-bright to-purple-deep flex items-center justify-center shadow-glow-purple flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
              <path d="M3 17l5-7 4 4 9-10" />
            </svg>
          </div>
          <div>
            <div className="font-display font-bold text-[18px]">Vértice</div>
            <div className="text-[10.5px] text-text-3 uppercase tracking-[1.5px] mt-0.5">Controle de Investimentos</div>
          </div>
        </div>

        <nav className="flex flex-col gap-[3px]">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-3 px-3 py-[11px] rounded-[10px] text-sm font-medium transition-colors border
                  ${active ? 'bg-gradient-to-r from-purple-bright/25 to-purple-bright/5 text-text-1 border-border' : 'text-text-2 border-transparent hover:bg-surface-2 hover:text-text-1'}`}
              >
                {active && <span className="absolute -left-4 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded bg-neon shadow-[0_0_10px_rgba(0,255,163,0.35)]" />}
                <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'opacity-100 text-purple-bright' : 'opacity-85'}`} />
                <span>{label}</span>
              </Link>
            );
          })}

          <div className="text-[10.5px] uppercase tracking-[1.6px] text-text-3 font-semibold px-3 pt-4 pb-2">
            Finanças Pessoais
          </div>
          {(() => {
            const active = pathname === FINANCE_ITEM.href;
            const Icon = FINANCE_ITEM.Icon;
            return (
              <Link
                href={FINANCE_ITEM.href}
                className={`relative flex items-center gap-3 px-3 py-[11px] rounded-[10px] text-sm font-medium transition-colors border
                  ${active ? 'bg-gradient-to-r from-neon/20 to-neon/5 text-text-1 border-border' : 'text-text-2 border-transparent hover:bg-surface-2 hover:text-text-1'}`}
              >
                {active && <span className="absolute -left-4 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded bg-neon shadow-[0_0_10px_rgba(0,255,163,0.35)]" />}
                <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'opacity-100 text-neon' : 'opacity-85'}`} />
                <span>{FINANCE_ITEM.label}</span>
              </Link>
            );
          })()}
        </nav>

        <div className="mt-auto pt-3.5 border-t border-border-soft flex flex-col gap-2.5">
          <div className="flex items-center justify-between bg-surface border border-border-soft rounded-[10px] px-3 py-2.5">
            <span className="text-[11px] text-text-3 uppercase tracking-wide">Selic Meta</span>
            <span className="font-mono text-sm text-neon font-semibold">{fmtPct(config.selic_meta)}</span>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="text-[12px] text-purple-bright underline text-left flex items-center gap-1.5 hover:text-purple-300"
          >
            <IconGear className="w-3 h-3" /> Calibrar taxas manualmente
          </button>
          <button
            onClick={handleLogout}
            className="text-[12px] text-text-3 hover:text-red-dim flex items-center gap-1.5 text-left mt-1"
          >
            <IconLogout className="w-3.5 h-3.5" /> Sair da conta
          </button>
        </div>
      </aside>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-5">
          <div className="bg-surface-2 border border-border rounded-[20px] p-[26px] max-w-[440px] w-full shadow-2xl">
            <h3 className="font-display text-lg mb-1.5">Painel de Calibração Matinal</h3>
            <p className="text-[13px] text-text-3 mb-[18px] leading-relaxed">
              Use este painel caso as APIs automáticas estejam fora do ar. Informe a Taxa Selic Meta vigente para recalcular todos os rendimentos de Renda Fixa e Tesouro indexados ao CDI.
            </p>
            <div className="flex flex-col gap-1.5 mb-3.5">
              <label className="text-[12.5px] text-text-2 font-semibold">Taxa Selic Meta (% a.a.)</label>
              <Input type="number" step="0.01" value={selicInput} onChange={(e) => setSelicInput(e.target.value)} placeholder="Ex: 14.90" />
            </div>
            <div className="flex flex-col gap-1.5 mb-5">
              <label className="text-[12.5px] text-text-2 font-semibold">Spread de mercado p/ CDI (% a.a.)</label>
              <Input type="number" step="0.01" value={spreadInput} onChange={(e) => setSpreadInput(e.target.value)} placeholder="Padrão: 0.10" />
            </div>
            <div className="flex gap-2.5 justify-end">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button variant="neon" onClick={handleSaveCalibration} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar e recalcular'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
