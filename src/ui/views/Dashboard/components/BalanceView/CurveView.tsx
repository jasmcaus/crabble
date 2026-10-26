import dayjs from 'dayjs';
import React from 'react';
import { useMemo, useState, useRef, useEffect } from 'react';
import { AreaChart, YAxis, Area, XAxis, Tooltip } from 'recharts';
import styled, { createGlobalStyle } from 'styled-components';
import { ReactComponent as RcIconInfoCC } from '@/ui/assets/tips-cc.svg';
import { useTranslation } from 'react-i18next';
import { getAppChainNames } from '@/ui/hooks/useAppChain';
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
  showAppChainTips?: boolean;
  appChainIds?: string[];
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

const AppChainTips = styled.div`
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  font-size: 9px;
  opacity: 70%;
  pointer-events: none;
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
  appChainIds,
  showAppChainTips = false,
}: CurveThumbnailProps) => {
  // one brand line regardless of direction; the delta badge carries up/down
  const color = 'var(--r-blue-default)';
  // the raw 24h series is minute-level noise; draw ~48 real samples so the
  // curve reads as a trend (hover still lands on actual data points)
  const displayList = useMemo(() => thinSeries(data?.list), [data?.list]);
  const divRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(66);
  const [showTips, setShowTips] = useState(false);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const mouseMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mouseMoveCountRef = useRef(0);
  const { t } = useTranslation();

  useEffect(() => {
    return () => {
      if (mouseMoveTimeoutRef.current) {
        clearTimeout(mouseMoveTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseMove = (event: any) => {
    const currentX = event?.nativeEvent?.offsetX || 0;

    const distance = Math.abs(currentX - mousePositionRef.current.x);

    mousePositionRef.current = { x: currentX, y: 0 };

    const MOVE_THRESHOLD = 5;

    if (distance > MOVE_THRESHOLD) {
      mouseMoveCountRef.current += 1;

      if (mouseMoveCountRef.current >= 3 && isHover) {
        setShowTips(true);
      }
    }

    if (mouseMoveTimeoutRef.current) {
      clearTimeout(mouseMoveTimeoutRef.current);
    }

    mouseMoveTimeoutRef.current = setTimeout(() => {
      setShowTips(false);
    }, 500);
  };

  const handleMouseEnter = () => {
    mouseMoveCountRef.current = 0;
    setShowTips(false);
  };

  const handleMouseLeave = () => {
    setShowTips(false);
    mouseMoveCountRef.current = 0;
    mousePositionRef.current = { x: 0, y: 0 };

    if (mouseMoveTimeoutRef.current) {
      clearTimeout(mouseMoveTimeoutRef.current);
      mouseMoveTimeoutRef.current = null;
    }

    onHover(undefined);
  };

  useEffect(() => {
    if (divRef.current) {
      setHeight(divRef.current.clientHeight);
    }
  }, []);

  const isEmpty = !data;

  return (
    <CurveWrapper ref={divRef} className={className}>
      <CurveGlobalStyle />
      {isEmpty ? null : (
        <AreaChart
          data={displayList}
          width={368}
          height={height}
          style={{ position: 'absolute', left: 0, cursor: 'pointer' }}
          margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
          onMouseMove={(val, event) => {
            if (val?.activePayload) {
              onHover(val.activePayload[0].payload);
            }
            if (showAppChainTips) {
              handleMouseMove(event);
            }
          }}
          onMouseEnter={showAppChainTips ? handleMouseEnter : undefined}
          onMouseLeave={() => {
            onHover(undefined);
            if (showAppChainTips) {
              handleMouseLeave();
            }
          }}
        >
          <defs>
            <linearGradient id="curveThumbnail" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="70%" stopColor={color} stopOpacity={0.04} />
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
                strokeDasharray: '2 3',
                strokeWidth: 0.75,
              }}
              content={({ label }) => {
                return (
                  <div className="px-[6px] py-[2px] rounded-[6px] bg-r-neutral-card1 shadow-[var(--crb-shadow-card)] text-[11px] leading-[14px] font-medium text-r-neutral-body tabular-nums">
                    {dayjs(label * 1000).format('HH:mm')}
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
            strokeWidth={1.75}
            activeDot={{
              r: 4,
              fill: 'var(--r-neutral-card1)',
              stroke: color,
              strokeWidth: 2,
            }}
            fill="url(#curveThumbnail)"
            animationDuration={0}
            fillOpacity={1}
          />
        </AreaChart>
      )}
      {showTips && appChainIds && appChainIds.length > 0 && (
        <AppChainTips>
          <div className="text-r-neutral-title2 mr-[2px]">
            <RcIconInfoCC width={12} height={12} />
          </div>
          <div className="text-r-neutral-title2 whitespace-nowrap">
            {t('page.dashboard.home.slotAppChainTips', {
              appChainNames: getAppChainNames(appChainIds || []),
            })}
          </div>
        </AppChainTips>
      )}
    </CurveWrapper>
  );
};
