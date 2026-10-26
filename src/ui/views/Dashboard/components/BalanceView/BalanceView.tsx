/* eslint "react-hooks/exhaustive-deps": ["error"] */
/* eslint-enable react-hooks/exhaustive-deps */
import type { Account } from '@/background/service/preference';
import { BALANCE_LOADING_CONFS } from '@/constant/timeout';
import { ReactComponent as WarningSVG } from '@/ui/assets/dashboard/warning-1.svg';
import { TooltipWithMagnetArrow } from '@/ui/component/Tooltip/TooltipWithMagnetArrow';
import { useCurrency } from '@/ui/hooks/useCurrency';
import useCurrentBalance from '@/ui/hooks/useCurrentBalance';
import { useRabbySelector } from '@/ui/store';
import { IExtractFromPromise } from '@/ui/utils/type';
import { DisplayChainWithWhiteLogo, findChain } from '@/utils/chain';
import { Chain } from '@debank/common';
import { Skeleton } from 'antd';
import clsx from 'clsx';
import { Maximize2, RefreshCw } from 'lucide-react';
import { KEYRING_TYPE } from 'consts';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useDebounce } from 'react-use';
import { useCommonPopupView, useWallet } from 'ui/utils';
import { useQueryProjects } from 'ui/utils/portfolio';
import { BalanceLabel } from './BalanceLabel';
import { CurvePoint, CurveThumbnail } from './CurveView';
import { formChartData, useCurve } from './useCurve';
import {
  useHomeBalanceView,
  useRefreshHomeBalanceView,
} from './useHomeBalanceView';
import { ZeroAssets } from './ZeroAssets';

export const BalanceViewJumpButton = ({
  className,
  onClick,
}: {
  className?: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) => {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className={clsx(
        'balance-view-jump-button hidden shrink-0 items-center justify-center cursor-pointer',
        'w-[28px] h-[28px] rounded-[8px] border-0 p-0',
        'bg-transparent text-r-neutral-foot',
        'hover:bg-[var(--crb-hover)] hover:text-r-neutral-title1',
        className
      )}
      aria-label={t('page.dashboard.assets.openInTabV2')}
      title={t('page.dashboard.assets.openInTabV2')}
      onClick={onClick}
    >
      <Maximize2 size={14} strokeWidth={2.25} />
    </button>
  );
};

export type BalanceViewData = {
  matteredChainBalances: DisplayChainWithWhiteLogo[];
  balance: number | null | undefined;
  balanceLoading: boolean;
  isEmptyAssets: boolean;
  isOffline: boolean;
};

export type BalanceViewDataHandler = (data: BalanceViewData) => void;

export const BalanceView = ({
  currentAccount,
  hideJumpButton,
  onDataChange,
}: {
  currentAccount?: Account | null;
  hideJumpButton?: boolean;
  /** lets the dashboard reuse the chain breakdown for the inline asset list */
  onDataChange?: BalanceViewDataHandler;
}) => {
  const { t } = useTranslation();
  const { currency, syncCurrencyList } = useCurrency();

  const { currentHomeBalanceCache } = useHomeBalanceView(
    currentAccount?.address
  );

  const initHasCacheRef = useRef(!!currentHomeBalanceCache?.balance);
  const [accountBalanceUpdateNonce, setAccountBalanceUpdateNonce] = useState(
    initHasCacheRef?.current ? -1 : 0
  );

  useEffect(() => {
    if (!initHasCacheRef?.current) return;
    const timer = setTimeout(() => {
      setAccountBalanceUpdateNonce((prev) => prev + 1);
    }, BALANCE_LOADING_CONFS.TIMEOUT);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const {
    balance: latestBalance,
    evmBalance: latestEvmBalance,
    appChainIds: latestAppChainIds,
    matteredChainBalances: latestMatteredChainBalances,
    chainBalancesWithValue: latestChainBalancesWithValue,
    success: loadBalanceSuccess,
    balanceLoading,
    balanceFromCache,
    isCurrentBalanceExpired,
    refreshBalance,
    missingList,
  } = useCurrentBalance(currentAccount?.address, {
    update: true,
    noNeedBalance: false,
    nonce: accountBalanceUpdateNonce,
    initBalanceFromLocalCache: !!currentHomeBalanceCache?.balance,
  });

  const {
    curveData: latestCurveData,
    curveChartData: latestCurveChartData,
    refresh: refreshCurve,
    isCurveCollectionExpired,
    isLoading: curveLoading,
  } = useCurve(currentAccount?.address, {
    nonce: accountBalanceUpdateNonce,
    realtimeNetWorth: latestEvmBalance,
    initData: currentHomeBalanceCache?.originalCurveData,
    currency,
  });
  const wallet = useWallet();
  const [gnosisNetworks, setGnosisNetworks] = useState<Chain[]>([]);
  const [isHover, setHover] = useState(false);
  const [curvePoint, setCurvePoint] = useState<CurvePoint>();
  const [isDebounceHover, setIsDebounceHover] = useState(false);
  const isGnosis = useMemo(() => {
    return currentAccount?.type === KEYRING_TYPE.GnosisKeyring;
  }, [currentAccount?.type]);

  const {
    balance,
    evmBalance,
    curveChartData,
    matteredChainBalances,
    chainBalancesWithValue,
    appChainIds,
  } = useMemo(() => {
    const balanceValue = latestBalance || currentHomeBalanceCache?.balance;
    const evmBalanceValue =
      latestEvmBalance || currentHomeBalanceCache?.evmBalance;
    const appChainIds = latestAppChainIds?.length
      ? latestAppChainIds
      : currentHomeBalanceCache?.appChainIds || [];
    return {
      appChainIds,
      balance: balanceValue,
      evmBalance: evmBalanceValue,
      curveChartData:
        latestCurveChartData ||
        formChartData(
          currentHomeBalanceCache?.originalCurveData || [],
          undefined,
          undefined,
          currency
        ),
      matteredChainBalances: latestMatteredChainBalances.length
        ? latestMatteredChainBalances
        : currentHomeBalanceCache?.matteredChainBalances || [],
      chainBalancesWithValue: latestChainBalancesWithValue.length
        ? latestChainBalancesWithValue
        : currentHomeBalanceCache?.chainBalancesWithValue || [],
    };
  }, [
    latestBalance,
    latestEvmBalance,
    latestAppChainIds,
    latestMatteredChainBalances,
    latestChainBalancesWithValue,
    latestCurveChartData,
    currentHomeBalanceCache,
    currency,
  ]);

  const getCacheExpired = useCallback(async () => {
    const res = {
      balanceExpired: await isCurrentBalanceExpired(),
      curveExpired: await isCurveCollectionExpired(),
      expired: false,
    };
    res.expired = res.balanceExpired || res.curveExpired;

    return res;
  }, [isCurrentBalanceExpired, isCurveCollectionExpired]);

  const { isManualRefreshing, onRefresh } = useRefreshHomeBalanceView({
    currentAddress: currentAccount?.address,
    refreshBalance,
    refreshCurve,
    isExpired: getCacheExpired,
  });
  const { refreshPositions } = useQueryProjects(currentAccount?.address, {
    visible: true,
    autoLoad: false,
  });

  // const refreshTimerlegacy = useRef<NodeJS.Timeout>();
  // only execute once on component mounted or address changed
  useEffect(
    () => {
      (async () => {
        let expirationInfo: IExtractFromPromise<
          ReturnType<typeof getCacheExpired>
        > | null = null;
        if (!currentHomeBalanceCache?.balance) {
          onRefresh({
            balanceExpired: true,
            curveExpired: true,
            isManual: false,
          });
        } else if (
          (expirationInfo = await getCacheExpired()) &&
          expirationInfo.expired
        ) {
          onRefresh({
            balanceExpired: expirationInfo.balanceExpired,
            curveExpired: expirationInfo.curveExpired,
            isManual: false,
          });
        }
      })();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    syncCurrencyList();
  }, [syncCurrencyList]);

  const handleIsGnosisChange = useCallback(async () => {
    if (!currentAccount) return;
    const networkIds = await wallet.getGnosisNetworkIds(currentAccount.address);
    const chains = networkIds
      .map((networkId) => {
        return findChain({
          id: Number(networkId),
        });
      })
      .filter((v) => !!v);
    setGnosisNetworks(chains as Chain[]);
  }, [currentAccount, wallet]);

  const handleHoverCurve = (data) => {
    setCurvePoint(data);
  };

  const { setData, componentName } = useCommonPopupView();

  useEffect(() => {
    if (componentName === 'AssetList') {
      setData({
        matteredChainBalances: chainBalancesWithValue,
        balance,
        balanceLoading,
        isEmptyAssets: !matteredChainBalances.length,
        isOffline: !loadBalanceSuccess,
      });
    }
  }, [
    chainBalancesWithValue,
    matteredChainBalances.length,
    balance,
    balanceLoading,
    componentName,
    setData,
    loadBalanceSuccess,
  ]);

  useEffect(() => {
    onDataChange?.({
      matteredChainBalances: chainBalancesWithValue,
      balance,
      balanceLoading,
      isEmptyAssets: !matteredChainBalances.length,
      isOffline: !loadBalanceSuccess,
    });
  }, [
    onDataChange,
    chainBalancesWithValue,
    matteredChainBalances.length,
    balance,
    balanceLoading,
    loadBalanceSuccess,
  ]);

  const hasCustomNetwork = useRabbySelector(
    (store) => !!store.chains.testnetList?.length
  );

  useEffect(() => {
    if (isGnosis) {
      handleIsGnosisChange();
    }
  }, [isGnosis, handleIsGnosisChange]);

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

  const handleClickRefresh = () => {
    refreshPositions();
    onRefresh({ isManual: true });
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

  const currentBalance = currentHover ? curvePoint?.value || balance : balance;
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
    !curveChartData?.startUsdValue;

  const shouldRenderCurve =
    !shouldShowLoading && !hiddenBalance && !!curveChartData;

  const showAppChainTips = useMemo(() => {
    return evmBalance !== balance;
  }, [evmBalance, balance]);

  const onClickOpenInDesktop = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    wallet.openInDesktop('/desktop/profile');
    window.close();
  };

  if (
    !balanceLoading &&
    !isGnosis &&
    !hasCustomNetwork &&
    !chainBalancesWithValue?.length &&
    !balance
  ) {
    return <ZeroAssets />;
  }

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
    <div onMouseLeave={onMouseLeave} className={clsx('w-full')}>
      <div
        className={clsx('balance-view-card group/balance-card relative w-full')}
      >
        {!hideJumpButton && (
          <BalanceViewJumpButton
            className="absolute right-[4px] top-[2px] z-[1] group-hover/balance-card:flex"
            onClick={onClickOpenInDesktop}
          />
        )}
        <div className="px-[12px] pt-[12px]">
          <div className="flex items-center gap-[6px] h-[18px]">
            <span className="crb-eyebrow">
              {t('page.desktopProfile.CurveModal.netWorth')}
            </span>
            {missingList?.length ? (
              <TooltipWithMagnetArrow
                overlayClassName="rectangle font-normal whitespace-pre-wrap"
                title={t('page.dashboard.home.missingDataTooltip', {
                  text:
                    missingList.join(t('page.dashboard.home.chain')) +
                    t('page.dashboard.home.chainEnd'),
                })}
              >
                <div
                  className="crb-recolor text-r-orange-default flex"
                  onClick={(evt) => evt.stopPropagation()}
                >
                  <WarningSVG />
                </div>
              </TooltipWithMagnetArrow>
            ) : null}
            <button
              type="button"
              aria-label="Refresh"
              className={clsx(
                'crb-recolor inline-flex items-center justify-center w-[18px] h-[18px] p-0 border-0 bg-transparent',
                'text-r-neutral-foot hover:text-r-neutral-title1 transition-opacity',
                shouldShowRefreshButton
                  ? 'opacity-100'
                  : 'opacity-0 group-hover/balance-card:opacity-100',
                hiddenBalance && 'hidden'
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClickRefresh();
              }}
            >
              <RefreshCw
                size={12}
                strokeWidth={2.25}
                className={clsx(shouldShowRefreshButton && 'animate-spin')}
              />
            </button>
          </div>
          <div className="mt-[4px] pr-[40px] text-r-neutral-title1 max-w-full">
            {shouldShowBalanceLoading ? (
              <Skeleton.Input
                active
                className="w-[220px] h-[48px] rounded-[10px] block"
              />
            ) : (
              <BalanceLabel
                balanceUsd={currentBalance || 0}
                currency={currency}
              />
            )}
          </div>
          <div className="flex items-center gap-[8px] mt-[6px] min-h-[22px]">
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
              {currentChangePercent === '0%' ? '0.00%' : currentChangePercent}
            </span>
            {!shouldHidePercentChange && (
              <span className="text-[12px] leading-[16px] font-medium text-r-neutral-foot tabular-nums">
                {currentChangeValue ||
                  t('page.signTx.BroadcastMode.lowGasDeadline.24h')}
              </span>
            )}
          </div>
        </div>
        <div
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          className={clsx('mt-[6px]', 'relative cursor-crosshair')}
        >
          <div className={clsx('h-[80px] w-full relative')}>
            {!!shouldRenderCurve && !!curveChartData && (
              <CurveThumbnail
                isHover={currentHover}
                data={curveChartData}
                showAppChainTips={showAppChainTips}
                appChainIds={appChainIds}
                onHover={handleHoverCurve}
              />
            )}
            {!!shouldShowLoading && (
              <div className="px-[12px]">
                <Skeleton.Input
                  active
                  className="w-full h-[68px] mt-[6px] rounded-[12px] block"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
