import clsx from 'clsx';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from 'antd';

import type {
  CollectionList,
  NFTItem,
} from '@rabby-wallet/rabby-api/dist/types';

import { useWallet } from '@/ui/utils';
import NFTAvatar from '@/ui/views/Dashboard/components/NFT/NFTAvatar';
import { ReactComponent as RcIconJump } from 'ui/assets/tokenDetail/IconJump.svg';

export interface NftPreviewItem {
  nft: NFTItem;
  collection: Omit<CollectionList, 'nft_list'>;
}

interface Props {
  className?: string;
  isLoading: boolean;
  list: NftPreviewItem[];
  onOpenInTab?(): void;
  /** "strip" is the one-row preview card; "grid" is the dashboard NFT tab */
  variant?: 'strip' | 'grid';
}

export const NftPreviewSection: React.FC<Props> = ({
  className,
  isLoading,
  list,
  onOpenInTab,
  variant = 'strip',
}) => {
  const wallet = useWallet();
  const { t } = useTranslation();

  const handleOpenInTab = () => {
    if (onOpenInTab) {
      onOpenInTab();
      return;
    }

    wallet.openInDesktop('/desktop/profile/nft');
    window.close();
  };

  if (variant === 'grid') {
    if (!isLoading && !list.length) return null;
    return (
      <div className={className}>
        <div className="grid grid-cols-3 gap-[8px]">
          {isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <Skeleton.Input
                  key={index}
                  className="block w-full h-auto aspect-square rounded-[14px]"
                  active
                />
              ))
            : list.slice(0, 12).map((item) => (
                <button
                  type="button"
                  key={`${item.collection.chain}-${item.collection.id}-${item.nft.id}`}
                  onClick={handleOpenInTab}
                  className={clsx(
                    'group relative aspect-square w-full p-0 border-0 rounded-[14px] overflow-hidden cursor-pointer',
                    'bg-[var(--crb-sunken)] shadow-[var(--crb-shadow-card)]'
                  )}
                  title={item.nft?.name || item.collection?.name}
                >
                  <NFTAvatar
                    className="w-full h-full transition-transform duration-300 group-hover:scale-[1.04]"
                    type={item.nft?.content_type}
                    content={item.nft?.content}
                    empty={
                      <div className="w-full h-full flex items-center justify-center text-[12px] font-semibold text-r-neutral-foot">
                        NFT
                      </div>
                    }
                  />
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 px-[8px] pb-[6px] pt-[16px] text-left text-[11px] leading-[14px] font-medium text-white truncate opacity-0 group-hover:opacity-100 transition-opacity bg-[linear-gradient(to_top,rgba(0,0,0,0.6),transparent)]">
                    {item.collection?.name}
                  </span>
                </button>
              ))}
        </div>
        {!isLoading && list.length > 0 && (
          <button
            type="button"
            onClick={handleOpenInTab}
            className={clsx(
              'mt-[12px] w-full h-[36px] rounded-[10px] border-0 cursor-pointer',
              'bg-[var(--crb-sunken)] hover:bg-[var(--crb-sunken-hover)]',
              'text-[13px] font-semibold text-r-neutral-title1 transition-colors',
              'flex items-center justify-center gap-[6px]'
            )}
          >
            {t('page.dashboard.assets.openInTabV2')}
            <RcIconJump className="w-[12px] h-[12px]" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={className} onClick={handleOpenInTab}>
      <div
        className={clsx(
          'bg-r-neutral-card1 rounded-[14px] p-[12px] overflow-hidden shadow-[var(--crb-shadow-card)]',
          'hover:bg-[var(--crb-sunken)] transition-colors cursor-pointer'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[8px] min-w-0 text-[15px] leading-[18px]">
            <div className="text-r-neutral-title-1 font-semibold">
              {t('page.dashboard.home.panel.nft')}
            </div>
            <div className="text-r-neutral-foot font-medium">
              {isLoading ? null : `(${list.length})`}
            </div>
          </div>
          <button
            type="button"
            className={clsx(
              'w-[16px] h-[16px] shrink-0 p-0 border-0 bg-transparent',
              'flex items-center justify-center text-r-neutral-title-1',
              'opacity-80 hover:opacity-100 transition-opacity'
            )}
            aria-label={t('page.dashboard.assets.openInTabV2')}
          >
            <RcIconJump className="w-[14px] h-[14px]" />
          </button>
        </div>
        {isLoading ? (
          <div className="mt-[8px] overflow-hidden">
            <div className="flex items-center gap-[4px]">
              {Array.from({ length: 6 }).map((_, index) => {
                return (
                  <Skeleton.Input
                    className="w-[48px] h-[48px] rounded-[4px]"
                    active
                  />
                );
              })}
            </div>
          </div>
        ) : list.length ? (
          <div className="mt-[8px] overflow-hidden">
            <div className="flex w-max items-center gap-[4px]">
              {list.slice(0, 7).map((item) => {
                return (
                  <div
                    key={`${item.collection.chain}-${item.collection.id}-${item.nft.id}`}
                    className="w-[48px] h-[48px] shrink-0 rounded-[4px] overflow-hidden bg-r-neutral-line border-[0.5px] border-rb-neutral-line"
                  >
                    <NFTAvatar
                      className="w-[48px] h-[48px]"
                      type={item.nft?.content_type}
                      content={item.nft?.content}
                      empty={
                        <div className="w-[48px] h-[48px] bg-r-neutral-line flex items-center justify-center rounded-[4px]">
                          <div className="text-[12px] leading-[16px] font-semibold text-r-neutral-foot">
                            NFT
                          </div>
                        </div>
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
