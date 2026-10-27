import dayjs from 'dayjs';
import React from 'react';
import { useMemo, useState, useRef, useEffect } from 'react';
import { AreaChart, YAxis, Area, XAxis, Tooltip } from 'recharts';
import styled, { createGlobalStyle } from 'styled-components';
export type CurvePoint = {
  value: number;
  netWorth: string;
  change: string;
  isLoss: boolean;
  changePercent: string;
  timestamp: number;
};

type Curve = {
  list: CurvePoint[];
  netWorth: string;
  change: string;
  changePercent: string;
  isLoss: boolean;
  isEmptyAssets: boolean;
};

type CurveThumbnailProps = {
  className?: string;
  data?: Curve;
  isHover?: boolean;
  /** put the hovered value in the tooltip (the headline isn't showing it) */
  showValueInTooltip?: boolean;
  onHover: (point?: CurvePoint) => void;
};

const CurveWrapper = styled.div`
  width: 100%;
  height: 100%;
  z-index: 1;
`;

const CurveGlobalStyle = createGlobalStyle`
  :root {
    --color-curve-green: #28E43B;
    --color-curve-red: #FF6A6B;
  }
`;

const MAX_CURVE_POINTS = 48;

export function thinSeries<T>(list?: T[], max = MAX_CURVE_POINTS): T[] {
  if (!list || list.length <= max) {
    return list || [];
  }
  const step = (list.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => list[Math.round(i * step)]);
}

export const CurveThumbnail = ({
  data,
  className,
  isHover,
  onHover,
  showValueInTooltip = false,
}: CurveThumbnailProps) => {
  // one brand line regardless of direction; the delta badge carries up/down
  const color = 'var(--r-blue-default)';
  // the raw 24h series is minute-level noise; draw ~48 real samples so the
  // curve reads as a trend (hover still lands on actual data points)
  const displayList = useMemo(() => thinSeries(data?.list), [data?.list]);
  const divRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(66);
  const [width, setWidth] = useState(376);

  useEffect(() => {
    if (divRef.current) {
      setHeight(divRef.current.clientHeight);
      setWidth(divRef.current.clientWidth || 376);
    }
  }, []);

  const isEmpty = !data;

  return (
    <CurveWrapper ref={divRef} className={className}>
      <CurveGlobalStyle />
      {isEmpty ? null : (
        <AreaChart
          data={displayList}
          width={width}
          height={height}
          style={{ position: 'absolute', left: 0, cursor: 'crosshair' }}
          margin={{ top: 6, right: 0, left: 0, bottom: 2 }}
          onMouseMove={(val) => {
            if (val?.activePayload) {
              onHover(val.activePayload[0].payload);
            }
          }}
          onMouseLeave={() => onHover(undefined)}
        >
          <defs>
            <linearGradient id="curveThumbnail" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="75%" stopColor={color} stopOpacity={0.03} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="timestamp"
            hide
            type="number"
            domain={['dataMin', 'dataMax']}
          />
          <YAxis
            hide
            domain={[(dataMin) => dataMin * 0.985, (dataMax) => dataMax * 1.01]}
          />
          {isHover && (
            <Tooltip
              cursor={{
                stroke: 'var(--r-neutral-foot)',
                strokeDasharray: '3 3',
                strokeWidth: 1,
              }}
              content={({ label, payload }) => {
                const point = payload?.[0]?.payload as CurvePoint | undefined;
                return (
                  <div className="px-[6px] py-[2px] rounded-[6px] bg-[var(--crb-popover)] shadow-[var(--crb-shadow-pop)] text-[11px] leading-[14px] font-medium text-r-neutral-body tabular-nums whitespace-nowrap">
                    {dayjs(label * 1000).format('HH:mm')}
                    {showValueInTooltip && point && (
                      <span className="ml-[6px] text-r-neutral-title1">
                        {point.netWorth}
                      </span>
                    )}
                  </div>
                );
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeOpacity={1}
            strokeWidth={2}
            strokeLinecap="round"
            activeDot={{
              r: 4.5,
              fill: 'var(--crb-card-solid)',
              stroke: color,
              strokeWidth: 2,
            }}
            fill="url(#curveThumbnail)"
            animationDuration={0}
            fillOpacity={1}
          />
        </AreaChart>
      )}
    </CurveWrapper>
  );
};
