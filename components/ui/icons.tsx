import { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
});

export const IconDashboard = (p: IconProps) => (
  <svg {...base(p)}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>
);
export const IconAdd = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>
);
export const IconStocks = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 17l5-5 4 4 8-8"/><path d="M14 7h6v6"/></svg>
);
export const IconFixedIncome = (p: IconProps) => (
  <svg {...base(p)}><rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20M7 15h3"/></svg>
);
export const IconTreasury = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 21h18M5 21V10M19 21V10M3 10l9-7 9 7M9 21v-6h6v6"/></svg>
);
export const IconFunds = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
);
export const IconCrypto = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9"/><path d="M9.5 8.5h3.2a2 2 0 110 4H9.5m0 0h3.6a2 2 0 110 4H9.5m0-8V7m0 9.5V18M12 7v1.5M12 16.5V18"/></svg>
);
export const IconWallet = (p: IconProps) => (
  <svg {...base(p)}><path d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5h-5a2 2 0 010-4h5z"/></svg>
);
export const IconTrash = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0l-1 14a1 1 0 01-1 1H7a1 1 0 01-1-1L5 6"/></svg>
);
export const IconEdit = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>
);
export const IconRefresh = (p: IconProps) => (
  <svg {...base(p)}><path d="M21 12a9 9 0 11-2.6-6.4M21 4v5h-5"/></svg>
);
export const IconGear = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h0A1.65 1.65 0 009 4.6V4.5a2 2 0 114 0v.09a1.65 1.65 0 001 1.51h0a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0c.27.62.85 1.05 1.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
);
export const IconAlert = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 9v4M12 17h.01M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.7 3.86a2 2 0 00-3.4 0z"/></svg>
);
export const IconEmpty = (p: IconProps) => (
  <svg {...base({ ...p, strokeWidth: 1.5 })}><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 13l3-3 2 2 3-4"/></svg>
);
export const IconSort = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 7h11M3 12h7M3 17h4M16 5v14M16 5l3 3M16 5l-3 3"/></svg>
);
export const IconMagic = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="2.5"/></svg>
);
export const IconClose = (p: IconProps) => (
  <svg {...base(p)}><path d="M18 6L6 18M6 6l12 12"/></svg>
);
export const IconMenu = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 6h18M3 12h18M3 18h18"/></svg>
);
export const IconLogout = (p: IconProps) => (
  <svg {...base(p)}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
);
export const IconTarget = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>
);
export const IconTrendUp = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 17l6-6 4 4 7-7M14 8h7v7"/></svg>
);
export const IconTrendDown = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 7l6 6 4-4 7 7M21 9v7h-7"/></svg>
);
export const IconCreditCard = (p: IconProps) => (
  <svg {...base(p)}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
);
export const IconMail = (p: IconProps) => (
  <svg {...base(p)}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l8.5 6a3 3 0 003 0L22 7"/></svg>
);
export const IconLock = (p: IconProps) => (
  <svg {...base(p)}><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 118 0v4"/></svg>
);
export const IconUser = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.5-6 8-6s8 2 8 6"/></svg>
);
export const IconEye = (p: IconProps) => (
  <svg {...base(p)}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
);
export const IconEyeOff = (p: IconProps) => (
  <svg {...base(p)}><path d="M17.94 17.94A10.07 10.07 0 0112 19c-6.5 0-10-7-10-7a18.45 18.45 0 014.22-5.27M9.9 4.24A9.12 9.12 0 0112 4c6.5 0 10 7 10 7a18.5 18.5 0 01-2.16 3.19M14.12 14.12a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>
);
