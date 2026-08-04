'use client';

import { useId, useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type SparkProps = {
  values: number[];
  color: string;
  fillOpacity?: number;
  className?: string;
};

export function Sparkline({
  values,
  color,
  className = 'h-10 w-full',
}: SparkProps) {
  const gradId = useId().replace(/:/g, '');
  const data = useMemo(
    () => values.map((value, i) => ({ i, value })),
    [values],
  );

  if (data.length === 0) {
    return <div className={className} />;
  }

  return (
    <div className={`${className} outline-none [&_.recharts-wrapper]:outline-none [&_.recharts-surface]:outline-none`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 2, right: 0, bottom: 0, left: 0 }}
          style={{ outline: 'none' }}
        >
          <defs>
            <linearGradient id={`spark-${gradId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#spark-${gradId})`}
            isAnimationActive={false}
            dot={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

type SeriesPoint = { label: string; salesPence: number; orders: number };

function formatAxisGbp(pence: number) {
  const pounds = pence / 100;
  if (pounds >= 1000) return `£${(pounds / 1000).toFixed(pounds >= 10000 ? 0 : 1)}k`;
  return `£${Math.round(pounds)}`;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string | number; value?: number | string; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#0f1218] px-3 py-2 text-xs shadow-xl">
      <p className="mb-1.5 font-medium text-white/70">{label}</p>
      {payload.map((item) => {
        const key = String(item.dataKey ?? '');
        const value =
          key === 'salesPence'
            ? formatAxisGbp(Number(item.value) || 0)
            : String(item.value ?? 0);
        return (
          <p key={key} className="flex items-center gap-2 text-white">
            <span
              className="h-2 w-2 rounded-[2px]"
              style={{ background: item.color }}
            />
            {key === 'salesPence' ? 'Sales' : 'Orders'}: {value}
          </p>
        );
      })}
    </div>
  );
}

export function SalesOrdersChart({
  series,
  className = 'h-64 w-full',
}: {
  series: SeriesPoint[];
  className?: string;
}) {
  const gradId = useId().replace(/:/g, '');
  const data = useMemo(
    () =>
      series.map((s) => ({
        label: s.label,
        salesPence: s.salesPence,
        orders: s.orders,
      })),
    [series],
  );

  return (
    <div className={`${className} outline-none [&_.recharts-wrapper]:outline-none [&_.recharts-surface]:outline-none`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          style={{ outline: 'none' }}
        >
          <defs>
            <linearGradient id={`sales-${gradId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d4af37" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#d4af37" stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`orders-${gradId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: '#6b7585', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={28}
            dy={6}
          />
          <YAxis
            yAxisId="sales"
            orientation="left"
            tick={{ fill: '#6b7585', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={formatAxisGbp}
          />
          <YAxis
            yAxisId="orders"
            orientation="right"
            tick={{ fill: '#6b7585', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={32}
            allowDecimals={false}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1 }}
          />
          <Area
            yAxisId="sales"
            type="monotone"
            dataKey="salesPence"
            name="Sales (GBP)"
            stroke="#d4af37"
            strokeWidth={2.5}
            fill={`url(#sales-${gradId})`}
            dot={{ r: 3, fill: '#d4af37', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#d4af37', stroke: '#0b0c10', strokeWidth: 2 }}
          />
          <Area
            yAxisId="orders"
            type="monotone"
            dataKey="orders"
            name="Orders"
            stroke="#3b82f6"
            strokeWidth={2.5}
            fill={`url(#orders-${gradId})`}
            dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#3b82f6', stroke: '#0b0c10', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PlatformDonut({
  slices,
  className = 'h-44 w-44',
}: {
  slices: { label: string; pct: number; color: string; pence: number }[];
  className?: string;
}) {
  const size = 160;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const total = slices.reduce((s, x) => s + x.pct, 0) || 1;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#1a1d24"
        strokeWidth={stroke}
      />
      {slices.map((slice) => {
        const len = (slice.pct / total) * c;
        const el = (
          <circle
            key={slice.label}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={slice.color}
            strokeWidth={stroke}
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        );
        offset += len;
        return el;
      })}
      <text
        x={size / 2}
        y={size / 2 - 4}
        textAnchor="middle"
        fill="#fff"
        fontSize="18"
        fontWeight="700"
      >
        {slices[0] ? `${slices[0].pct}%` : '—'}
      </text>
      <text x={size / 2} y={size / 2 + 14} textAnchor="middle" fill="#6b7585" fontSize="10">
        {slices[0]?.label ?? 'N/A'}
      </text>
    </svg>
  );
}
