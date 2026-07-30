'use client';

type SparkProps = {
  values: number[];
  color: string;
  fillOpacity?: number;
  className?: string;
};

export function Sparkline({
  values,
  color,
  fillOpacity = 0.18,
  className = 'h-10 w-full',
}: SparkProps) {
  const w = 120;
  const h = 36;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const pts = values.map((v, i) => {
    const x = values.length <= 1 ? 0 : (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} preserveAspectRatio="none">
      <path d={area} fill={color} opacity={fillOpacity} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

type SeriesPoint = { label: string; salesPence: number; orders: number };

export function SalesOrdersChart({
  series,
  className = 'h-64 w-full',
}: {
  series: SeriesPoint[];
  className?: string;
}) {
  const w = 720;
  const h = 260;
  const pad = { t: 16, r: 44, b: 36, l: 52 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const maxSales = Math.max(...series.map((s) => s.salesPence), 1);
  const maxOrders = Math.max(...series.map((s) => s.orders), 1);

  const xAt = (i: number) =>
    pad.l + (series.length <= 1 ? innerW / 2 : (i / (series.length - 1)) * innerW);
  const ySales = (v: number) => pad.t + innerH - (v / maxSales) * innerH;
  const yOrders = (v: number) => pad.t + innerH - (v / maxOrders) * innerH;

  const salesLine = series
    .map((s, i) => `${i === 0 ? 'M' : 'L'}${xAt(i)},${ySales(s.salesPence)}`)
    .join(' ');
  const salesArea = `${salesLine} L${xAt(series.length - 1)},${pad.t + innerH} L${xAt(0)},${pad.t + innerH} Z`;
  const ordersLine = series
    .map((s, i) => `${i === 0 ? 'M' : 'L'}${xAt(i)},${yOrders(s.orders)}`)
    .join(' ');

  const ticks = 4;
  const labelEvery = Math.max(1, Math.ceil(series.length / 7));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className}>
      {Array.from({ length: ticks + 1 }, (_, i) => {
        const y = pad.t + (innerH / ticks) * i;
        const salesVal = Math.round(((maxSales * (ticks - i)) / ticks) / 100);
        const orderVal = Math.round((maxOrders * (ticks - i)) / ticks);
        return (
          <g key={i}>
            <line
              x1={pad.l}
              x2={w - pad.r}
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,0.06)"
            />
            <text x={pad.l - 8} y={y + 4} textAnchor="end" fill="#6b7585" fontSize="10">
              £{salesVal >= 1000 ? `${(salesVal / 1000).toFixed(1)}k` : salesVal}
            </text>
            <text x={w - pad.r + 8} y={y + 4} textAnchor="start" fill="#6b7585" fontSize="10">
              {orderVal}
            </text>
          </g>
        );
      })}
      <path d={salesArea} fill="url(#salesGrad)" />
      <path d={salesLine} fill="none" stroke="#d4af37" strokeWidth="2.5" />
      <path d={ordersLine} fill="none" stroke="#3b82f6" strokeWidth="2.5" />
      {series.map((s, i) =>
        i % labelEvery === 0 || i === series.length - 1 ? (
          <text
            key={`${s.label}-${i}`}
            x={xAt(i)}
            y={h - 12}
            textAnchor="middle"
            fill="#6b7585"
            fontSize="10"
          >
            {s.label}
          </text>
        ) : null,
      )}
      <defs>
        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4af37" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
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
