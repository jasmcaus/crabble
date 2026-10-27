import dayjs from 'dayjs';
/* eslint "react-hooks/exhaustive-deps": ["error"] */
/* eslint-enable react-hooks/exhaustive-deps */
import type { Account } from '@/background/service/preference';
import { BALANCE_LOADING_CONFS } from '@/constant/timeout';
import { SvgIconOffline } from '@/ui/assets';
import ArrowNextSVG from '@/ui/assets/dashboard/arrow-next.svg';
import { ReactComponent as UpdateSVG } from '@/ui/assets/dashboard/update.svg';
import { ReactComponent as WarningSVG } from '@/ui/assets/dashboard/warning-1.svg';
import { TooltipWithMagnetArrow } from '@/ui/component/Tooltip/TooltipWithMagnetArrow';
import useCurrentBalance from '@/ui/hooks/useCurrentBalance';
import { useRabbySelector } from '@/ui/store';
import { IExtractFromPromise } from '@/ui/utils/type';
import { BalanceLabel } from '@/ui/views/Dashboard/components/BalanceView/BalanceLabel';
import {
  CurveChartData,
  formChartData,
  getCurveCoverage,
  useCurve,
} from '@/ui/views/Dashboard/components/BalanceView/useCurve';
import { getAppChainNames } from '@/ui/hooks/useAppChain';
import {
  useHomeBalanceView,
  useRefreshHomeBalanceView,
} from '@/ui/views/Dashboard/components/BalanceView/useHomeBalanceView';
import { findChain } from '@/utils/chain';
import { Chain } from '@debank/common';
import { useRequest } from 'ahooks';
import { Skeleton, Tooltip } from 'antd';
import clsx from 'clsx';
import { KEYRING_TYPE } from 'consts';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import {
  openInTab,
  splitNumberByStep,
  useCommonPopupView,
  useWallet,
  formatUsdValue,
} from 'ui/utils';
import { CurvePoint } from './CurveThumbnail';
import { PortfolioChart } from './PortfolioChart';
import { CurveModal } from './CurveModal';
import { useDebounce } from 'react-use';
import { useCurrentAccount } from '@/ui/hooks/backgroundState/useAccount';
import { RcIconRefreshCC } from '@/ui/assets/desktop/profile';

const Container = styled.div`
  .balance-view-content {
  }
`;

export const BalanceView: React.FC<{
  balance?: number | null;
  evmBalance?: number | null;
  curveChartData?: CurveChartData;
  isLoading?: boolean;
  isRefreshing?: boolean;
  isManualRefreshing?: boolean;
  balanceLoading?: boolean;
  curveLoading?: boolean;
  balanceFromCache?: boolean;
  onRefresh?(): void;
  appChainIds: string[];
}> = ({
  balance,
  evmBalance,
  curveChartData,
  isLoading,
  isRefreshing,
  isManualRefreshing,
  balanceLoading,
  curveLoading,
  balanceFromCache,
  onRefresh,
  appChainIds,
}) => {
  const { t } = useTranslation();
  const [isHover, setHover] = useState(false);
  const [curvePoint, setCurvePoint] = useState<CurvePoint>();
  const [isDebounceHover, setIsDebounceHover] = useState(false);
  const currentAccount = useCurrentAccount();

  const { currentHomeBalanceCache } = useHomeBalanceView(
    currentAccount?.address
  );

  useEffect(() => {
    if (!isHover) {
      setCurvePoint(undefined);
    }
  }, [isHover]);

  // useEffect(() => {
  //   if (!balanceLoading && !curveLoading) {
  //     setIsManualRefreshing(false);
  //   }
  // }, [balanceLoading, curveLoading]);

  const onMouseMove = () => {
    setHover(true);
  };
  const onMouseLeave = () => {
    setHover(false);
    setIsDebounceHover(false);
  };

  useDebounce(
    () => {
      if (isHover) {
        setIsDebounceHover(true);
      }
    },
    300,
    [isHover]
  );

  const currentHover = isDebounceHover;

  // the curve is EVM-only; when app chains hold real value it can't stand in
  // for net worth, so the headline keeps the total (the tooltip has the point)
  const coverage = getCurveCoverage(balance, evmBalance, appChainIds);
  const currentBalance =
    currentHover && !coverage.isPartial
      ? curvePoint?.value || balance
      : balance;
  const currentChangePercent = currentHover
    ? curvePoint?.changePercent || curveChartData?.changePercent
    : curveChartData?.changePercent;
  const currentIsLoss =
    currentHover && curvePoint ? curvePoint.isLoss : curveChartData?.isLoss;
  const currentChangeValue = currentHover ? curvePoint?.change : null;
  const { hiddenBalance } = useRabbySelector((state) => state.preference);

  const shouldShowRefreshButton =
    isManualRefreshing || balanceLoading || curveLoading;

  const couldShowLoadingDueToBalanceNil =
    currentBalance === null || (balanceFromCache && currentBalance === 0);
  // const couldShowLoadingDueToUpdateSource = !balanceFromCache || isManualRefreshing;
  const couldShowLoadingDueToUpdateSource =
    !currentHomeBalanceCache?.balance || isManualRefreshing;

  const shouldShowBalanceLoading =
    couldShowLoadingDueToBalanceNil ||
    (couldShowLoadingDueToUpdateSource && balanceLoading);
  const shouldShowCurveLoading =
    couldShowLoadingDueToBalanceNil ||
    (couldShowLoadingDueToUpdateSource && curveLoading);
  const shouldShowLoading = shouldShowBalanceLoading || shouldShowCurveLoading;
  const shouldHidePercentChange =
    !currentChangePercent ||
    hiddenBalance ||
    shouldShowLoading ||
    !curveChartData?.startUsdValue ||
    isLoading;

  const shouldRenderCurve =
    !shouldShowLoading && !hiddenBalance && !!curveChartData && !isLoading;

  const handleHoverCurve = (data) => {
    setCurvePoint(data);
  };

  const stats = useMemo(() => {
    const values = (curveChartData?.list || []).map((p) => p.value);
    if (!values.length) {
      return null;
    }
    const last = curveChartData?.list[curveChartData.list.length - 1];
    return {
      high: Math.max(...values),
      low: Math.min(...values),
      updatedAt: last ? dayjs(last.timestamp * 1000).format('HH:mm') : '-',
    };
  }, [curveChartData]);

  const deltaArrow = (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path
        d={
          currentIsLoss
            ? 'M2 2.5L8 7.5M8 7.5H3.5M8 7.5V3'
            : 'M2 7.5L8 2.5M8 2.5H3.5M8 2.5V7'
        }
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <>
      <Container onMouseLeave={onMouseLeave}>
        <div className="px-[28px] pt-[24px]">
          <div className="crb-eyebrow">
            {t('page.desktopProfile.CurveModal.netWorth')}
          </div>
          <div className="mt-[6px] min-h-[68px] text-r-neutral-title1">
            {isLoading ? (
              <Skeleton.Input
                active
                className="w-[320px] h-[60px] rounded block"
              />
            ) : (
              <div className="crb-display text-[64px] leading-[68px]">
                <SplitCents
                  text={`$${splitNumberByStep(
                    (currentBalance || 0).toFixed(2)
                  )}`}
                />
              </div>
            )}
          </div>
          <div className="mt-[10px] flex items-center gap-[10px] min-h-[24px]">
            <span
              className={clsx(
                'crb-delta',
                currentIsLoss ? 'is-down' : 'is-up',
                {
                  hidden: shouldHidePercentChange,
                }
              )}
            >
              {deltaArrow}
              {currentIsLoss ? '-' : '+'}
              {currentChangePercent === '0%' ? '0.00%' : currentChangePercent}
            </span>
            {!shouldHidePercentChange && (
              <span className="text-[13px] leading-[16px] text-r-neutral-foot tabular-nums">
                {currentChangeValue
                  ? `${currentIsLoss ? '-' : '+'}${currentChangeValue}`
                  : t('page.signTx.BroadcastMode.lowGasDeadline.24h')}
                {coverage.isPartial &&
                  ` · ${t('page.dashboard.home.evmChainsOnly')}`}
              </span>
            )}
            <RcIconRefreshCC
              viewBox="0 0 16 16"
              className={clsx(
                'w-[18px] h-[18px] text-r-neutral-foot cursor-pointer',
                'hover:text-r-neutral-title1',
                isRefreshing ? 'animate-spin' : ''
              )}
              onClick={onRefresh}
            />
          </div>
        </div>
        <div
          className="crb-chart-glow relative mt-[8px] h-[240px] pl-[8px]"
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
        >
          {!!shouldRenderCurve && !!curveChartData && (
            <PortfolioChart data={curveChartData} onHover={handleHoverCurve} />
          )}
          {!!isLoading && (
            <Skeleton.Input
              active
              className="mx-[20px] mt-[20px] w-[calc(100%-40px)] h-[200px] rounded block"
            />
          )}
        </div>
        {coverage.isPartial && !!shouldRenderCurve && (
          <div className="px-[28px] mt-[4px] text-[12px] leading-[16px] text-r-neutral-foot">
            {t('page.dashboard.home.chartExcludes', {
              names:
                getAppChainNames(appChainIds) ||
                t('page.dashboard.home.appChains'),
              value: formatUsdValue(coverage.excludedValue),
            })}
          </div>
        )}
        <div className="mt-[8px] grid grid-cols-4 border-0 border-t border-solid border-[var(--crb-hairline)]">
          {[
            {
              label: t('page.desktopProfile.stats.change'),
              value: curveChartData
                ? `${curveChartData.isLoss ? '-' : '+'}${curveChartData.change}`
                : '-',
              tone: curveChartData
                ? curveChartData.isLoss
                  ? 'text-r-red-default'
                  : 'text-r-green-default'
                : '',
            },
            {
              label: t('page.desktopProfile.stats.high'),
              value: stats ? formatUsdValue(stats.high) : '-',
            },
            {
              label: t('page.desktopProfile.stats.low'),
              value: stats ? formatUsdValue(stats.low) : '-',
            },
            {
              label: t('page.desktopProfile.stats.updated'),
              value: stats ? stats.updatedAt : '-',
            },
          ].map((item, idx) => (
            <div
              key={item.label}
              className={clsx(
                'px-[28px] py-[18px]',
                idx > 0 &&
                  'border-0 border-l border-solid border-[var(--crb-hairline)]'
              )}
            >
              <div className="crb-eyebrow">{item.label}</div>
              <div
                className={clsx(
                  'mt-[6px] text-[17px] leading-[22px] font-medium tabular-nums',
                  item.tone || 'text-r-neutral-title1'
                )}
              >
                {isLoading ? '-' : item.value}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </>
  );
};

/** "$1,234.56" with the trailing cents quieter, as on a statement. */
const SplitCents: React.FC<{ text: string }> = ({ text }) => {
  const match = /^(.*?)(\.\d{1,2})$/.exec(text);
  if (!match) {
    return <>{text}</>;
  }
  return (
    <>
      {match[1]}
      <span className="crb-cents">{match[2]}</span>
    </>
  );
};
