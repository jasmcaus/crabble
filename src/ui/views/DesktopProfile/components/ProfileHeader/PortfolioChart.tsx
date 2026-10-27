import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CurveChartData } from '@/ui/views/Dashboard/components/BalanceView/useCurve';
import { CurvePoint } from '@/ui/views/Dashboard/components/BalanceView/CurveView';
import { thinSeries } from '@/ui/views/Dashboard/components/BalanceView/CurveView';

const BRAND = 'var(--r-blue-default)';
const TICK = { fill: 'var(--r-neutral-foot)', fontSize: 11 };

const compactUsd = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(value / 1e3).toFixed(abs >= 1e5 ? 0 : 1)}K`;
  return `$${value.toFixed(0)}`;
};

const ChartTooltip: React.FC<{
  active?: boolean;
  payload?: { payload: CurvePoint }[];
}> = ({ active, payload }) => {
  const point = payload?.[0]?.payload;
  if (!active || !point) {
    return null;
  }
  return (
    <div className="rounded-[10px] bg-r-neutral-card1 px-[10px] py-[8px] shadow-[var(--crb-shadow-pop)]">
      <div className="text-[11px] leading-[14px] text-r-neutral-foot">
        {dayjs(point.timestamp * 1000).format('MMM D, HH:mm')}
      </div>
      <div className="mt-[2px] text-[14px] leading-[18px] font-semibold text-r-neutral-title1 tabular-nums">
        {point.netWorth}
      </div>
    </div>
  );
};

/**
 * Net-worth area chart for the desktop portfolio: a calm brand curve over a
 * soft gradient, a compact dollar axis on the right and time ticks below.
 */
export const PortfolioChart: React.FC<{
  data: CurveChartData;
  onHover?(point?: CurvePoint): void;
}> = ({ data, onHover }) => {
  const list = useMemo(() => thinSeries(data.list, 56), [data.list]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={list}
        margin={{ top: 12, right: 0, left: 0, bottom: 0 }}
        onMouseMove={(state) => {
          onHover?.(state?.activePayload?.[0]?.payload);
        }}
        onMouseLeave={() => onHover?.(undefined)}
      >
        <defs>
          <linearGradient id="crbPortfolioFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BRAND} stopOpacity={0.2} />
            <stop offset="75%" stopColor={BRAND} stopOpacity={0.03} />
            <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          vertical={false}
          stroke="var(--crb-hairline)"
          strokeDasharray="2 4"
        />
        <XAxis
          dataKey="timestamp"
          type="number"
          domain={['dataMin', 'dataMax']}
          tickFormatter={(t) => dayjs(t * 1000).format('HH:mm')}
          tick={TICK}
          tickLine={false}
          axisLine={false}
          tickCount={7}
          minTickGap={48}
          padding={{ left: 24, right: 24 }}
        />
        <YAxis
          orientation="right"
          domain={[(min: number) => min * 0.995, (max: number) => max * 1.005]}
          tickFormatter={compactUsd}
          tick={TICK}
          tickLine={false}
          axisLine={false}
          tickCount={4}
          width={72}
        />
        <Tooltip
          content={<ChartTooltip />}
          cursor={{
            stroke: 'var(--r-neutral-foot)',
            strokeDasharray: '2 3',
            strokeWidth: 0.75,
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={BRAND}
          strokeWidth={2}
          fill="url(#crbPortfolioFill)"
          isAnimationActive={false}
          activeDot={{
            r: 5,
            fill: 'var(--r-neutral-card1)',
            stroke: BRAND,
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
