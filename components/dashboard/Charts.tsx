'use client';

import { useEffect, useMemo, useRef } from 'react';
import {
  Chart as ChartJS, ArcElement, LineElement, PointElement,
  CategoryScale, LinearScale, Tooltip, Legend, Filler,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { fmtBRL } from '@/lib/finance/utils';
import type { PortfolioSummary } from '@/types';

ChartJS.register(ArcElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

export function AllocationChart({ totals }: { totals: PortfolioSummary['totals'] }) {
  const data = useMemo(() => ({
    labels: ['Bolsa', 'Renda Fixa', 'Tesouro Direto', 'Fundos', 'Criptomoedas'],
    datasets: [{
      data: [totals.bolsa, totals.rendaFixa, totals.tesouro, totals.fundos, totals.cripto],
      backgroundColor: ['#9D5CFF', '#00FFA3', '#FFC857', '#5EA8FF', '#FF7AC8'],
      borderColor: '#161028',
      borderWidth: 3,
      hoverOffset: 6,
    }],
  }), [totals]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: '#B3A8D6', font: { family: 'Inter', size: 11.5 }, padding: 14 } },
      tooltip: { callbacks: { label: (ctx: any) => `${ctx.label}: ${fmtBRL(ctx.raw)}` } },
    },
    cutout: '68%',
  };

  return <Doughnut data={data} options={options} />;
}

export function GrowthChart({ patrimonioTotal }: { patrimonioTotal: number }) {
  const { months, values } = useMemo(() => {
    const monthsArr: string[] = [];
    const valuesArr: number[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthsArr.push(d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''));
      const factor = 0.78 + (5 - i) * 0.044 + (Math.random() * 0.02 - 0.01);
      valuesArr.push(Math.max(0, patrimonioTotal * factor));
    }
    valuesArr[valuesArr.length - 1] = patrimonioTotal;
    return { months: monthsArr, values: valuesArr };
  }, [patrimonioTotal]);

  const data = {
    labels: months,
    datasets: [{
      label: 'Patrimônio',
      data: values,
      borderColor: '#00FFA3',
      backgroundColor: (ctx: any) => {
        const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 260);
        g.addColorStop(0, 'rgba(0,255,163,0.25)');
        g.addColorStop(1, 'rgba(0,255,163,0)');
        return g;
      },
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointBackgroundColor: '#00FFA3',
      borderWidth: 2.5,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx: any) => fmtBRL(ctx.raw) } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#786B9E', font: { family: 'Inter', size: 11 } } },
      y: { grid: { color: '#241a42' }, ticks: { color: '#786B9E', font: { family: 'Inter', size: 11 }, callback: (v: any) => fmtBRL(v) } },
    },
  };

  return <Line data={data} options={options} />;
}
