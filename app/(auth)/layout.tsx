export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-[440px]">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-purple-bright to-purple-deep flex items-center justify-center shadow-glow-purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M3 17l5-7 4 4 9-10" />
            </svg>
          </div>
          <div>
            <div className="font-display font-bold text-xl">Vértice</div>
            <div className="text-[10.5px] text-text-3 uppercase tracking-[1.5px] -mt-0.5">Controle de Investimentos</div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
