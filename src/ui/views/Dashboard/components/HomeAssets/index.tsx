import { formatAppChain } from '@/ui/hooks/useAppChain';
import { Segmented } from '@/ui/component/ui/Segmented';
import { cn } from '@/ui/component/ui/cn';
import { useRabbySelector } from '@/ui/store';
import { useCommonPopupView } from '@/ui/utils';
import {
  AssetListContainer,
  AssetListTab,
} from '@/ui/views/CommonPopup/AssetList/AssetListContainer';
import { sortChainWithValueDesc } from '@/ui/views/CommonPopup/AssetList/ChainItem';
import { Button } from 'antd';
import { ArrowDownLeft, Wallet } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import type { BalanceViewData } from '../BalanceView/BalanceView';
import { CustomTestnetAssetList } from '@/ui/views/CommonPopup/AssetList/CustomTestnetAssetList';

type HomeAssetsTab = AssetListTab | 'testnet';

const compactUsd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const formatCompactUsd = (value: number) => {
  if (!value) return '$0';
  if (value < 1) return '<$1';
  return compactUsd.format(value);
};

/**
 * The dashboard's inline portfolio: tokens, DeFi positions and NFTs under
 * one set of tabs, filtered by chain. Replaces the old "tap the balance to
 * open the asset sheet" flow.
 */
export const HomeAssets: React.FC<{ data?: BalanceViewData }> = ({ data }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const { apps } = useCommonPopupView();
  const hiddenBalance = useRabbySelector((s) => s.preference.hiddenBalance);
  const address = useRabbySelector((s) => s.account.currentAccount?.address);
  const hasTestnets = useRabbySelector((s) => s.chains.testnetList.length > 0);
  const [tab, setTab] = useState<HomeAssetsTab>('tokens');
  const [chainId, setChainId] = useState<string | null>(null);
  const [isEmptyAssets, setIsEmptyAssets] = useState(false);

  const chains = useMemo(() => {
    return [
      ...(data?.matteredChainBalances || []),
      ...(apps?.map(formatAppChain) || []),
    ].sort(sortChainWithValueDesc);
  }, [data?.matteredChainBalances, apps]);

  // a filter for another account's chain (or one that dropped out of the
  // breakdown) would otherwise stick with no chip showing it as active
  useEffect(() => {
    setChainId(null);
  }, [address]);
  useEffect(() => {
    if (chainId && !chains.some((chain) => chain.id === chainId)) {
      setChainId(null);
    }
  }, [chainId, chains]);
  useEffect(() => {
    if (tab === 'testnet' && !hasTestnets) setTab('tokens');
  }, [tab, hasTestnets]);

  const isMainnetTab = tab !== 'testnet';
  const showChainChips =
    (tab === 'tokens' || tab === 'defi') && chains.length > 1 && !isEmptyAssets;

  return (
    <section className="pb-[20px]">
      <div className="sticky top-0 z-[5] px-[16px] pt-[4px] bg-[var(--r-neutral-bg-2)]">
        <div className="flex items-center justify-between border-b border-solid border-0 border-[var(--crb-hairline)]">
          <Segmented<HomeAssetsTab>
            variant="tabs"
            size="sm"
            aria-label="Assets"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'tokens', label: t('page.desktopProfile.tabs.tokens') },
              { value: 'defi', label: t('page.desktopProfile.tabs.defi') },
              { value: 'nft', label: t('page.nft.title') },
              ...(hasTestnets
                ? [
                    {
                      value: 'testnet' as const,
                      label: t('component.PillsSwitch.NetSwitchTabs.testnet'),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      </div>

      {showChainChips && (
        <div className="flex gap-[6px] overflow-x-auto no-scrollbar px-[16px] pt-[12px] pb-[2px]">
          <ChainChip active={!chainId} onClick={() => setChainId(null)}>
            {t('page.staking.filter.allChains')}
          </ChainChip>
          {chains.map((chain) => (
            <ChainChip
              key={chain.id}
              active={chainId === chain.id}
              onClick={() =>
                setChainId((prev) => (prev === chain.id ? null : chain.id))
              }
              title={chain.name}
            >
              <img
                src={chain.logo_url}
                alt=""
                className={cn(
                  'w-[16px] h-[16px] shrink-0',
                  chain.isAppChain ? 'rounded-[4px]' : 'rounded-full'
                )}
              />
              <span className="tabular-nums">
                {hiddenBalance ? '***' : formatCompactUsd(chain.usd_value)}
              </span>
            </ChainChip>
          ))}
        </div>
      )}

      <div className="px-[12px] pt-[12px]">
        {tab === 'testnet' && <CustomTestnetAssetList visible />}
        {isMainnetTab && isEmptyAssets && (
          <div className="flex flex-col items-center text-center pt-[28px] pb-[12px]">
            <div className="w-[48px] h-[48px] rounded-[16px] bg-[var(--crb-raised)] shadow-[var(--crb-shadow-card)] flex items-center justify-center text-r-neutral-title1 mb-[14px]">
              <Wallet size={22} strokeWidth={1.75} />
            </div>
            <div className="text-[15px] leading-[20px] font-semibold text-r-neutral-title1">
              {t('page.dashboard.assets.noAssets')}
            </div>
            <Button
              type="primary"
              className="mt-[16px] h-[38px] px-[16px] inline-flex items-center gap-[6px]"
              onClick={() => history.push('/receive?rbisource=dashboard')}
            >
              <ArrowDownLeft size={16} strokeWidth={2.25} />
              {t('page.dashboard.assets.addAssets')}
            </Button>
          </div>
        )}
        <div className={cn((isEmptyAssets || !isMainnetTab) && 'hidden')}>
          <AssetListContainer
            tab={isMainnetTab ? tab : 'tokens'}
            selectChainId={tab === 'nft' ? null : chainId}
            visible
            onEmptyAssets={setIsEmptyAssets}
          />
        </div>
      </div>
    </section>
  );
};

const ChainChip: React.FC<{
  active?: boolean;
  onClick(): void;
  title?: string;
  children: React.ReactNode;
}> = ({ active, onClick, title, children }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={cn(
      'shrink-0 inline-flex items-center gap-[6px] h-[30px] px-[10px] rounded-full border-0 cursor-pointer',
      'text-[12px] leading-[16px] font-semibold whitespace-nowrap',
      'transition-[background-color,color,box-shadow] duration-150',
      active
        ? 'bg-r-neutral-title1 text-r-neutral-bg1 shadow-none'
        : 'bg-[var(--crb-raised)] text-r-neutral-body shadow-[var(--crb-shadow-card)] hover:text-r-neutral-title1 hover:bg-[var(--crb-sunken)]'
    )}
  >
    {children}
  </button>
);
