import React, { useEffect, useMemo } from 'react';
import { Inbox } from 'lucide-react';
import { TokenSearchInput } from './TokenSearchInput';
import { useRabbySelector } from '@/ui/store';
import { HomeTokenList } from './TokenList';
import useSortTokens from 'ui/hooks/useSortTokens';
import useSearchToken from '@/ui/hooks/useSearchToken';
import {
  TokenListSkeleton,
  TokenListViewSkeleton,
} from './TokenListViewSkeleton';
import ProtocolList from './ProtocolList';
import { useQueryProjects } from 'ui/utils/portfolio';
import { InputRef } from 'antd';
import { useFilterProtocolList } from './useFilterProtocolList';
import { useAppChain } from '@/ui/hooks/useAppChain';
import { useCommonPopupView } from '@/ui/utils';
import { useTranslation } from 'react-i18next';
import { LpTokenSwitch } from '../../DesktopProfile/components/TokensTabPane/components/LpTokenSwitch';
import { HomePerpsPositionList } from './HomePerpsPositionList';
import { uniqBy } from 'lodash';
import omit from 'lodash/omit';
import { concatAndSort } from '@/ui/utils/portfolio/tokenUtils';
import { NftPreviewSection } from './NftPreviewSection';
import type { NftPreviewItem } from './NftPreviewSection';
import { useNFTCollections } from '@/ui/hooks/useNFTCollections';
import { usePortfolioDisplayTokens } from '@/ui/hooks/useRemovedTokens';

export type AssetListTab = 'tokens' | 'defi' | 'nft';

interface Props {
  className?: string;
  selectChainId: string | null;
  visible: boolean;
  onEmptyAssets: (isEmpty: boolean) => void;
  /** render one section only (the dashboard's inline tabs); all when unset */
  tab?: AssetListTab;
  /** show the token search and LP switch row (default true) */
  showSearch?: boolean;
}

export const AssetListContainer: React.FC<Props> = ({
  className,
  selectChainId,
  visible,
  onEmptyAssets,
  tab,
  showSearch = true,
}) => {
  const showTokens = !tab || tab === 'tokens';
  const showDefi = !tab || tab === 'defi';
  const showNft = !tab || tab === 'nft';
  const { t } = useTranslation();
  const [search, setSearch] = React.useState<string>('');
  const [lpTokenMode, setLpTokenMode] = React.useState(false);
  const handleOnSearch = React.useCallback((value: string) => {
    setSearch(value);
  }, []);
  const { currentAccount } = useRabbySelector((s) => ({
    currentAccount: s.account.currentAccount,
  }));
  const {
    collections: nftCollections,
    isLoading: isNftLoading,
  } = useNFTCollections(currentAccount?.address, {
    preferCacheOnExists: true,
    // the dashboard's inline tabs only need NFTs once that tab is open
    visible: visible && showNft,
  });

  const { setApps } = useCommonPopupView();
  const {
    isTokensLoading,
    isAllTokenLoading,
    isPortfoliosLoading,
    portfolios,
    tokens: tokenList,
    hasTokens,
    removeProtocol,
  } = useQueryProjects(currentAccount?.address, {
    visible,
    lpTokenMode: lpTokenMode ? lpTokenMode : undefined,
    searchMode: !!search,
  });
  const {
    data: appPortfolios,
    isLoading: isAppPortfoliosLoading,
  } = useAppChain(currentAccount?.address, visible);

  const inputRef = React.useRef<InputRef>(null);
  const { isLoading: isSearching, list } = useSearchToken(
    currentAccount?.address,
    search,
    {
      chainServerId: selectChainId ? selectChainId : undefined,
      withBalance: true,
      isTestnet: false,
    }
  );
  const displayTokenList = useMemo(() => {
    const result = uniqBy(
      search ? concatAndSort(list, tokenList, search) : tokenList,
      (token) => {
        return `${token.chain}-${token.id}`;
      }
    );
    if (selectChainId) {
      return result.filter((item) => item.chain === selectChainId);
    }
    return result;
  }, [list, tokenList, search, selectChainId]);

  const displayPortfolios = useMemo(() => {
    const combinedPortfolios = [
      ...(portfolios || []),
      ...(appPortfolios || []),
    ].sort((m, n) => (n.netWorth || 0) - (m.netWorth || 0));
    if (selectChainId) {
      return combinedPortfolios?.filter((item) => item.chain === selectChainId);
    }
    return combinedPortfolios;
  }, [portfolios, appPortfolios, selectChainId]);
  const nftPreviewList = useMemo<NftPreviewItem[]>(() => {
    const result: NftPreviewItem[] = [];

    nftCollections
      .filter((collection) => {
        return !collection.is_hidden && collection.is_core;
      })
      .forEach((collection) => {
        const baseCollection = omit(collection, 'nft_list');
        collection.nft_list.forEach((nft) => {
          result.push({
            nft,
            collection: baseCollection,
          });
        });
      });

    return result.sort(
      (a, b) =>
        (b?.collection?.credit_score || 0) - (a?.collection?.credit_score || 0)
    );
  }, [nftCollections]);

  const isEmptyAssets =
    !isTokensLoading &&
    !displayTokenList.length &&
    !isPortfoliosLoading &&
    !displayPortfolios?.length &&
    !isAppPortfoliosLoading &&
    !appPortfolios?.length &&
    !isNftLoading &&
    !nftPreviewList.length &&
    !search;

  React.useEffect(() => {
    onEmptyAssets(isEmptyAssets && !lpTokenMode);
  }, [isEmptyAssets, onEmptyAssets, lpTokenMode]);

  const sortedTokens = useSortTokens(displayTokenList);
  const sortTokens = usePortfolioDisplayTokens(sortedTokens, !!search);
  const filteredPortfolios = useFilterProtocolList({
    list: displayPortfolios,
    kw: search,
  });

  React.useEffect(() => {
    if (!visible) {
      setSearch('');
      inputRef.current?.focus();
      inputRef.current?.blur();
      setLpTokenMode(false);
    }
  }, [visible]);

  useEffect(() => {
    if (appPortfolios) {
      setApps(
        appPortfolios.map((item) => ({
          logo: item.logo || '',
          name: item.name,
          id: item.id,
          usd_value: item.netWorth || 0,
        }))
      );
    }
  }, [appPortfolios]);
  const appIds = useMemo(() => {
    return [...new Set(appPortfolios?.map((item) => item.id) || [])];
  }, [appPortfolios]);

  if (isTokensLoading && !hasTokens) {
    return <TokenListViewSkeleton />;
  }

  const isNoResults =
    !isSearching &&
    !isTokensLoading &&
    !isPortfoliosLoading &&
    !isAppPortfoliosLoading &&
    !!search &&
    !sortTokens.length &&
    !filteredPortfolios?.length;
  // with tabs each section reports its own empty / no-match state
  const isTokensNoResults =
    tab === 'tokens'
      ? !!search && !isSearching && !isTokensLoading && !sortTokens.length
      : isNoResults;
  const isTokensEmpty =
    tab === 'tokens' &&
    !search &&
    !lpTokenMode &&
    !isTokensLoading &&
    !sortTokens.length;
  const isDefiEmpty =
    tab === 'defi' &&
    !isPortfoliosLoading &&
    !isAppPortfoliosLoading &&
    !filteredPortfolios?.length;

  return (
    <div className={className}>
      {showSearch && (
        <div
          className={
            tab === 'nft'
              ? 'hidden'
              : 'flex items-center justify-between gap-x-12 widget-has-ant-input'
          }
        >
          <div className="flex w-full items-center justify-between">
            <div className="relative w-[60%] leading-[1]">
              <TokenSearchInput
                ref={inputRef}
                placeholder={t('page.dashboard.assets.searchTokenPlaceholder')}
                onSearch={handleOnSearch}
                className="w-full"
              />
            </div>
            {showTokens && (
              <LpTokenSwitch
                lpTokenMode={lpTokenMode}
                onLpTokenModeChange={setLpTokenMode}
              />
            )}
          </div>
        </div>
      )}
      <div
        className={
          showSearch && tab !== 'nft'
            ? 'flex flex-col gap-24 mt-12'
            : 'flex flex-col gap-24'
        }
      >
        {showTokens &&
          (isTokensLoading ||
          isSearching ||
          (lpTokenMode && isAllTokenLoading) ? (
            <TokenListSkeleton />
          ) : (
            <>
              <HomeTokenList
                list={sortTokens}
                isSearch={!!search}
                lpTokenMode={lpTokenMode}
                isNoResults={isTokensNoResults}
              />
              {isTokensEmpty ? (
                <SectionEmpty text={t('page.dashboard.assets.noAssets')} />
              ) : null}
            </>
          ))}

        {showDefi && (
          <div
            className="empty:hidden"
            style={{
              display: visible ? 'block' : 'none',
            }}
          >
            {isPortfoliosLoading && isAppPortfoliosLoading ? (
              <TokenListSkeleton />
            ) : (
              <>
                {visible && !search ? (
                  <HomePerpsPositionList
                    needFetchMarket
                    className="crb-perps-list"
                  />
                ) : null}
                <ProtocolList
                  removeProtocol={removeProtocol}
                  appIds={appIds}
                  isSearch={!!search}
                  list={filteredPortfolios}
                  className="mt-0"
                />
                {isDefiEmpty ? (
                  // hidden by CSS when perps positions rendered above it
                  <SectionEmpty
                    className="crb-defi-empty"
                    text={
                      search
                        ? t('page.dashboard.assets.table.noMatch')
                        : t('page.dashboard.assets.noAssets')
                    }
                  />
                ) : null}
              </>
            )}
          </div>
        )}
        {showNft && (
          <div
            style={{
              display:
                visible && (tab === 'nft' || (!search && !selectChainId))
                  ? 'block'
                  : 'none',
            }}
          >
            <NftPreviewSection
              className="cursor-pointer"
              isLoading={isNftLoading}
              list={nftPreviewList}
              variant={tab === 'nft' ? 'grid' : 'strip'}
            />
            {tab === 'nft' && !isNftLoading && !nftPreviewList.length ? (
              <SectionEmpty text={t('page.dashboard.assets.noAssets')} />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

const SectionEmpty = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => (
  <div
    className={
      'flex flex-col items-center justify-center py-[40px] text-center ' +
      (className || '')
    }
  >
    <div className="w-[40px] h-[40px] rounded-[12px] bg-[var(--crb-sunken)] mb-[10px] flex items-center justify-center text-r-neutral-foot">
      <Inbox size={18} strokeWidth={2} />
    </div>
    <div className="text-[13px] leading-[18px] text-r-neutral-foot">{text}</div>
  </div>
);
