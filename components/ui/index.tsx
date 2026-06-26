import { HTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, ButtonHTMLAttributes, forwardRef } from 'react';

export function Card({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-surface border border-border-soft rounded-[20px] p-[22px] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function StatCard({
  eyebrow, value, valueColor = 'text-text-1', delta, glowColor = 'bg-purple-bright',
}: {
  eyebrow: string;
  value: string;
  valueColor?: string;
  delta?: React.ReactNode;
  glowColor?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[20px] border border-border-soft p-5 bg-gradient-to-br from-surface-2 to-surface">
      <div className={`absolute w-36 h-36 rounded-full -top-16 -right-16 blur-md opacity-50 ${glowColor}`} />
      <div className="text-[11px] uppercase tracking-wider text-text-3 font-semibold">{eyebrow}</div>
      <div className={`font-display text-[28px] font-bold mt-2 -tracking-wide ${valueColor}`}>{value}</div>
      {delta && <div className="text-[12.5px] mt-1.5 font-semibold text-text-3">{delta}</div>}
    </div>
  );
}

type BadgeColor = 'green' | 'red' | 'purple' | 'gold' | 'gray';

const badgeStyles: Record<BadgeColor, string> = {
  green: 'bg-neon/10 text-neon border-neon/30',
  red: 'bg-red/10 text-red-dim border-red/30',
  purple: 'bg-purple-bright/10 text-purple-bright border-purple-bright/35',
  gold: 'bg-gold/10 text-gold border-gold/30',
  gray: 'bg-surface-3 text-text-2 border-border',
};

export function Badge({ color = 'gray', children }: { color?: BadgeColor; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${badgeStyles[color]}`}>
      {children}
    </span>
  );
}

type ButtonVariant = 'primary' | 'neon' | 'ghost' | 'icon';

const buttonStyles: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-br from-purple-bright to-purple-deep text-white shadow-glow-purple hover:brightness-110',
  neon: 'bg-neon text-[#04140C] shadow-glow-neon hover:brightness-105',
  ghost: 'bg-surface-2 text-text-1 border border-border hover:bg-surface-3',
  icon: 'bg-surface-2 border border-border text-text-2 hover:text-text-1 hover:bg-surface-3 p-2.5',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  small?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', small = false, className = '', children, ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center gap-2 justify-center font-semibold rounded-[11px] transition-all duration-150
        ${small ? 'text-[12.5px] px-3 py-1.5 rounded-[9px]' : 'text-[13.5px] px-[18px] py-2.5'}
        ${buttonStyles[variant]} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  )
);
Button.displayName = 'Button';

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`bg-surface-2 border border-border text-text-1 px-[13px] py-[11px] rounded-[10px] text-sm w-full
        placeholder:text-text-3 focus:outline-none focus:border-purple-bright focus:ring-2 focus:ring-purple-bright/20 transition-all ${className}`}
      {...props}
    />
  );
}

export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`bg-surface-2 border border-border text-text-1 px-[13px] py-[11px] rounded-[10px] text-sm w-full
        focus:outline-none focus:border-purple-bright focus:ring-2 focus:ring-purple-bright/20 transition-all ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-[12.5px] text-text-2 font-semibold block mb-1.5">
      {children}
    </label>
  );
}

export function InputGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5">{children}</div>;
}

export function EmptyState({ title, description, icon }: { title: string; description?: string; icon?: React.ReactNode }) {
  return (
    <div className="text-center py-12 px-5 text-text-3">
      {icon && <div className="w-10 h-10 mx-auto mb-3.5 opacity-50">{icon}</div>}
      <div className="text-text-2 font-semibold text-sm mb-1">{title}</div>
      {description && <p className="text-[13px]">{description}</p>}
    </div>
  );
}

export function ProgressBar({ percent, colorFrom = '#4C1D95', colorTo = '#00FFA3' }: { percent: number; colorFrom?: string; colorTo?: string }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className="w-full h-2.5 bg-surface-3 rounded-full overflow-hidden relative">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${clamped}%`, background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})`, boxShadow: '0 0 14px rgba(0,255,163,0.35)' }}
      />
    </div>
  );
}

export function PulseDot() {
  return <span className="w-[7px] h-[7px] rounded-full bg-neon inline-block animate-pulse shadow-[0_0_8px_rgba(0,255,163,0.35)]" />;
}
