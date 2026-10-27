import clsx from 'clsx';
import { KEYRING_TYPE } from 'consts';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useInterval } from 'react-use';

import { useRabbySelector } from 'ui/store';
import { formatUsdValue, useWallet } from 'ui/utils';

import { Check, ChevronDown, Copy, History, Settings } from 'lucide-react';
import { AddressAvatar } from '@/ui/component/ui/AddressAvatar';
import { IconButton } from '@/ui/component/ui/IconButton';
import { useExtensionUpdateBadge } from '@/ui/hooks/useExtensionUpdateSettingsCard';
import { ReactComponent as RcIconGasFullCC } from '@/ui/assets/gas-full-cc.svg';
import { ReactComponent as RcIconGasLowCC } from '@/ui/assets/gas-low-cc.svg';
import { SeedPhraseBackupAlert } from '@/ui/component/SeedPhraseBackupAlert';
import { useCurrentAccount } from '@/ui/hooks/backgroundState/useAccount';
import { copyAddress } from '@/ui/utils/clipboard';
import {
  useGasAccountInfo,
  useGasAccountInfoV2,
  useGasAccountLogin,
} from '@/ui/views/GasAccount/hooks';
import { useMemoizedFn } from 'ahooks';
import styled from 'styled-components';
import {
  BalanceView,
  BalanceViewDataHandler,
  BalanceViewJumpButton,
} from '../BalanceView/BalanceView';
import { useHomeBalanceViewOuterPrefetch } from '../BalanceView/useHomeBalanceView';
import { OfflineChainNotify } from '../OfflineChainNotify';
import Queue from '../Queue';
import Tooltip from 'antd/es/tooltip';
import { LOW_GAS_ACCOUNT_BALANCE } from '@/constant/gas-account';
import { useTransactionsStore } from '@/ui/state/transactions';

const Container = styled.div`
  width: 100%;
  position: relative;
  padding: 10px 12px 0;
`;

export const DashboardHeader: React.FC<{
  onSettingClick?(): void;
  onBalanceData?: BalanceViewDataHandler;
}> = ({ onSettingClick, onBalanceData }) => {
  const showUpdateBadge = useExtensionUpdateBadge();
  const history = useHistory();
  const wallet = useWallet();

  const currentAccount = useCurrentAccount();

  const pendingTxCount = useTransactionsStore(
    (state) => state.pendingTransactionCount
  );
  const getPendingTxCountAsync = useTransactionsStore(
    (state) => state.getPendingTxCountAsync
  );

  const displayName = currentAccount?.alianName || '';
  const isGnosis = currentAccount?.type === KEYRING_TYPE.GnosisKeyring;

  useInterval(() => {
    if (!currentAccount) return;
    if (currentAccount.type === KEYRING_TYPE.GnosisKeyring) return;

    void getPendingTxCountAsync(currentAccount.address);
  }, 30000);

  useEffect(() => {
    if (
      currentAccount?.address &&
      currentAccount.type !== KEYRING_TYPE.GnosisKeyring
    ) {
      void getPendingTxCountAsync(currentAccount.address);
    }
  }, [currentAccount?.address, currentAccount?.type, getPendingTxCountAsync]);

  const { dashboardBalanceCacheInited } = useHomeBalanceViewOuterPrefetch(
    currentAccount?.address
  );

  const handleSwitchAddress = useMemoizedFn(() => {
    history.push('/switch-address');
  });

  const handleCopyAddress = useMemoizedFn(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (!currentAccount) return;
      copyAddress(currentAccount.address);
    }
  );

  const { t } = useTranslation();

  const onClickOpenInDesktop = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    wallet.openInDesktop('/desktop/profile');
    window.close();
  };

  const onClickActivity = useMemoizedFn(() => {
    // the pending count is global and isn't refreshed for Safe accounts
    history.push(!isGnosis && pendingTxCount > 0 ? '/activities' : '/history');
  });

  return (
    <Container>
      {currentAccount && (
        <div className="flex items-center gap-[8px] h-[44px]">
          <div
            role="button"
            tabIndex={0}
            className={clsx(
              'group/account flex items-center gap-[10px] min-w-0 h-[44px]',
              'pl-[4px] pr-[10px] rounded-[14px] cursor-pointer',
              'crb-row'
            )}
            onClick={handleSwitchAddress}
            onKeyDown={(event) => {
              // keys bubbling up from the copy button are the button's
              if (event.target !== event.currentTarget) return;
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleSwitchAddress();
              }
            }}
          >
            <AddressAvatar
              address={currentAccount.address}
              type={currentAccount.type}
              brandName={currentAccount.brandName}
              size={36}
            />
            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-[2px] min-w-0">
                <span
                  className="text-[14px] leading-[18px] font-semibold text-r-neutral-title1 truncate max-w-[150px]"
                  title={displayName}
                >
                  {displayName}
                </span>
                <ChevronDown
                  size={14}
                  strokeWidth={2.25}
                  className="shrink-0 text-r-neutral-foot transition-transform group-hover/account:translate-y-[1px]"
                />
              </div>
              <div className="flex items-center gap-[4px] text-[12px] leading-[16px] text-r-neutral-foot">
                <span className="crb-mono" title={currentAccount.address}>
                  {shortAddress(currentAccount.address)}
                </span>
                <CopyButton
                  label={t('global.copyAddress')}
                  onCopy={handleCopyAddress}
                />
              </div>
            </div>
          </div>

          <div className="shrink-0 ml-auto flex items-center gap-[2px]">
            <IconButton
              label={t('page.dashboard.home.panel.transactions')}
              count={isGnosis ? 0 : pendingTxCount}
              onClick={onClickActivity}
            >
              <History size={18} strokeWidth={2} />
            </IconButton>
            <GasAccountEntry />
            <IconButton
              label={t('page.dashboard.home.panel.settings')}
              dot={showUpdateBadge ? 'danger' : false}
              onClick={onSettingClick}
            >
              <Settings size={18} strokeWidth={2} />
            </IconButton>
          </div>
        </div>
      )}
      <div className="crb-hero-card mt-[6px] group/balance-view-actions">
        {dashboardBalanceCacheInited && (
          <BalanceView
            currentAccount={currentAccount}
            hideJumpButton
            onDataChange={onBalanceData}
          />
        )}

        <div className="absolute right-[4px] top-[2px] z-[1] flex items-center gap-[6px]">
          <BalanceViewJumpButton
            className="group-hover/balance-view-actions:flex"
            onClick={onClickOpenInDesktop}
          />
          {isGnosis ? <Queue count={0} className="transition-all" /> : null}
        </div>
        {dashboardBalanceCacheInited && <OfflineChainNotify />}
      </div>
      <SeedPhraseBackupAlert className="mt-[8px]" />
    </Container>
  );
};

const shortAddress = (address: string) => {
  const lower = address.toLowerCase();
  return `${lower.slice(0, 6)}…${lower.slice(-4)}`;
};

const CopyButton = ({
  label,
  onCopy,
}: {
  label: string;
  onCopy: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      aria-label={label}
      className={clsx(
        'inline-flex items-center justify-center w-[18px] h-[18px] rounded-[5px] border-0 p-0',
        'bg-transparent text-r-neutral-foot hover:text-r-neutral-title1 hover:bg-[var(--crb-hover)]',
        'transition-colors'
      )}
      onClick={(event) => {
        onCopy(event);
        setCopied(true);
      }}
    >
      {copied ? (
        <Check size={12} strokeWidth={2.5} className="text-r-green-default" />
      ) : (
        <Copy size={12} strokeWidth={2.25} />
      )}
    </button>
  );
};

const GasAccountEntry = () => {
  const history = useHistory();
  const pendingHardwareAccount = useRabbySelector(
    (state) => state.gasAccount.pendingHardwareAccount
  );

  const { value: gasAccount, loading: gasAccountLoading } = useGasAccountInfo();
  const { isLogin: isGasAccountLogin } = useGasAccountLogin({
    value: gasAccount,
    loading: gasAccountLoading,
  });
  const {
    value: pendingHardwareGasAccountInfo,
    loading: pendingHardwareGasAccountLoading,
  } = useGasAccountInfoV2({
    address: pendingHardwareAccount?.address,
  });

  const gasAccountBalance = gasAccount?.account?.balance || 0;
  const pendingHardwareGasBalance =
    pendingHardwareGasAccountInfo?.account?.balance || 0;
  const visibleGasAccountBalance = Number(
    isGasAccountLogin
      ? gasAccountBalance
      : pendingHardwareAccount
      ? pendingHardwareGasBalance
      : 0
  );
  const isGasAccountBalanceLoading = isGasAccountLogin
    ? gasAccountLoading && !gasAccount
    : pendingHardwareAccount
    ? pendingHardwareGasAccountLoading && !pendingHardwareGasAccountInfo
    : gasAccountLoading;
  const isLowGasAccountBalance =
    !isGasAccountBalanceLoading &&
    visibleGasAccountBalance < LOW_GAS_ACCOUNT_BALANCE;

  const handleClick = useCallback(
    (evt: React.MouseEvent<HTMLButtonElement>) => {
      evt.preventDefault();
      evt.stopPropagation();
      history.push('/gas-account');
    },
    [history]
  );
  const { t } = useTranslation();

  return (
    <Tooltip
      title={t('page.gasAccount.title')}
      placement="bottom"
      overlayClassName="rectangle"
      align={{
        offset: [0, -6],
      }}
    >
      <button
        type="button"
        aria-label={t('page.gasAccount.title')}
        className={clsx(
          'group relative h-[32px] min-w-[32px] max-w-[32px] hover:max-w-[120px] px-[7px] rounded-[10px]',
          'border-0 bg-transparent cursor-pointer overflow-hidden shrink-0',
          'flex items-center gap-[4px]',
          'transition-[max-width,background-color,color] duration-200 ease-out',
          'text-r-neutral-body hover:text-r-neutral-title1 hover:bg-[var(--crb-hover)]'
        )}
        onClick={handleClick}
      >
        {isLowGasAccountBalance ? (
          <RcIconGasLowCC className="shrink-0 w-[18px] h-[18px]" />
        ) : (
          <RcIconGasFullCC className="shrink-0 w-[18px] h-[18px]" />
        )}
        <span
          className={clsx(
            'max-w-0 opacity-0 overflow-hidden whitespace-nowrap',
            'text-[13px] leading-[16px] font-semibold tabular-nums',
            'transition-all duration-200 group-hover:max-w-[90px] group-hover:opacity-100'
          )}
        >
          {formatUsdValue(visibleGasAccountBalance || 0)}
        </span>
      </button>
    </Tooltip>
  );
};
