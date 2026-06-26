'use client';

import { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { fmtBRL } from '@/lib/finance/utils';
import { EmptyState } from '@/components/ui';
import { IconEmpty } from '@/components/ui/icons';

ChartJS.register(ArcElement, Tooltip, Legend);

const PALETTE = ['#FF4D6A', '#9D5CFF', '#FFC857', '#5EA8FF', '#FF7AC8', '#00FFA3', '#786B9E', '#7C3AED', '#FF7A8F', '#00C883'];

export function ExpensesByCategoryChart({ data }: { data: Record<string, number> }) {
  const entries = useMemo(() => Object.entries(data).sort((a, b) => b[1] - a[1]), [data]);

  if (entries.length === 0) {
    return <EmptyState icon={<IconEmpty className="w-10 h-10" />} title="Nenhuma despesa registrada este mês" />;
  }

  const chartData = {
    labels: entries.map(([cat]) => cat),
    datasets: [{
      data: entries.map(([, value]) => value),
      backgroundColor: PALETTE.slice(0, entries.length),
      borderColor: '#161028',
      borderWidth: 3,
      hoverOffset: 6,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: '#B3A8D6', font: { family: 'Inter', size: 11.5 }, padding: 12 } },
      tooltip: { callbacks: { label: (ctx: any) => `${ctx.label}: ${fmtBRL(ctx.raw)}` } },
    },
    cutout: '65%',
  };

  return (
    <div className="h-[260px] relative">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
