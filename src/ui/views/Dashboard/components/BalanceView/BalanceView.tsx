/* eslint "react-hooks/exhaustive-deps": ["error"] */
/* eslint-enable react-hooks/exhaustive-deps */
import type { Account } from '@/background/service/preference';
import { BALANCE_LOADING_CONFS } from '@/constant/timeout';
import {
  RcIconArrowRightDashboardCC,
  RcIconJumpCC,
} from '@/ui/assets/dashboard';
import { ReactComponent as UpdateSVG } from '@/ui/assets/dashboard/update.svg';
import { ReactComponent as WarningSVG } from '@/ui/assets/dashboard/warning-1.svg';
import { TooltipWithMagnetArrow } from '@/ui/component/Tooltip/TooltipWithMagnetArrow';
import { useCurrency } from '@/ui/hooks/useCurrency';
import useCurrentBalance from '@/ui/hooks/useCurrentBalance';
import { useRabbySelector } from '@/ui/store';
import { IExtractFromPromise } from '@/ui/utils/type';
import { findChain } from '@/utils/chain';
import { ga4 } from '@/utils/ga4';
import { matomoRequestEvent } from '@/utils/matomo-request';
import { Chain } from '@debank/common';
import { Skeleton } from 'antd';
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
import { useDebounce } from 'react-use';
import { useCommonPopupView, useWallet } from 'ui/utils';
import { useQueryProjects } from 'ui/utils/portfolio';
import { BalanceLabel } from './BalanceLabel';
import { ChainList } from './ChainList';
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
        'balance-view-jump-button hidden shrink-0 items-center justify-center cursor-pointer rounded-[4px] border-0',
        'bg-[var(--crb-sunken)] p-[6px] opacity-70',
        'hover:bg-[var(--crb-sunken-hover)] hover:opacity-100',
        className
      )}
      aria-label={t('page.dashboard.assets.openInTabV2')}
      onClick={onClick}
    >
      <RcIconJumpCC className="h-[12px] w-[12px] text-r-neutral-title1" />
    </button>
  );
};

export const BalanceView = ({
  currentAccount,
  hideJumpButton,
}: {
  currentAccount?: Account | null;
  hideJumpButton?: boolean;
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

  const { activePopup, setData, componentName } = useCommonPopupView();

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

  const onClickViewAssets = () => {
    if (shouldShowBalanceLoading) {
      return;
    }
    matomoRequestEvent({
      category: 'Front Page Click',
      action: 'Click_BalanceCard',
    });
    ga4.fireEvent('Click_BalanceCard', {
      event_category: 'Front Page Click',
    });
    activePopup('AssetList');
    // wallet.openInDesktop('/desktop/profile');
    // window.close();
  };

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
        className={clsx(
          'balance-view-card group/balance-card relative w-full cursor-pointer'
        )}
        onClick={onClickViewAssets}
      >
        {!hideJumpButton && (
          <BalanceViewJumpButton
            className="absolute right-[12px] top-[12px] z-[1] group-hover/balance-card:flex"
            onClick={onClickOpenInDesktop}
          />
        )}
        <div className="px-[16px] pt-[14px]">
          <div className="crb-eyebrow">
            {t('page.desktopProfile.CurveModal.netWorth')}
          </div>
          <div className="group mt-[4px] pr-[40px] text-r-neutral-title1 max-w-full">
            {shouldShowBalanceLoading ? (
              <Skeleton.Input
                active
                className="w-[200px] h-[44px] rounded block"
              />
            ) : (
              <BalanceLabel
                balanceUsd={currentBalance || 0}
                currency={currency}
              />
            )}
          </div>
          <div
            className="group flex items-center gap-[8px] mt-[6px] min-h-[22px] cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClickRefresh();
            }}
          >
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
              <span className="text-[12px] leading-[14px] text-r-neutral-foot tabular-nums">
                {currentChangeValue ||
                  t('page.signTx.BroadcastMode.lowGasDeadline.24h')}
              </span>
            )}
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
                  className="crb-recolor text-r-orange-default"
                  onClick={(evt) => evt.stopPropagation()}
                >
                  <WarningSVG />
                </div>
              </TooltipWithMagnetArrow>
            ) : null}
            <div
              className={clsx('crb-recolor text-r-neutral-foot', {
                'block animate-spin': shouldShowRefreshButton,
                hidden: !shouldShowRefreshButton,
                'group-hover:block': !hiddenBalance,
              })}
            >
              <UpdateSVG />
            </div>
          </div>
        </div>
        <div
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          className={clsx('mt-[4px]', 'relative cursor-pointer')}
        >
          <div className={clsx('crb-chart-glow h-[72px] w-full relative')}>
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
              <div className="flex">
                <Skeleton.Input
                  active
                  className="mx-auto mt-[4px] w-[344px] h-[66px] rounded block"
                />
              </div>
            )}
          </div>
          {!shouldShowLoading && loadBalanceSuccess && (
            <div className="px-[16px] pt-[6px] pb-[12px] pointer-events-none">
              {chainBalancesWithValue.length > 0 ? (
                <div className="w-full flex items-center gap-[4px]">
                  <ChainList
                    isGnosis={isGnosis}
                    matteredChainBalances={chainBalancesWithValue.slice(0)}
                    gnosisNetworks={gnosisNetworks}
                  />
                  <RcIconArrowRightDashboardCC className="w-[16px] h-[16px] text-r-neutral-foot" />
                </div>
              ) : (
                <div className="w-full flex items-center gap-[4px]">
                  <div className="text-[12px] leading-[14px] text-r-neutral-foot">
                    {t('page.dashboard.assets.noAssets')}
                  </div>
                  <RcIconArrowRightDashboardCC className="w-[16px] h-[16px] text-r-neutral-foot" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
