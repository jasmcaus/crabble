/* eslint "react-hooks/exhaustive-deps": ["error"] */
/* eslint-enable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { Cex } from '@rabby-wallet/rabby-api/dist/types';

import type { Account } from '@/background/service/preference';
import { ellipsisAddress } from '@/ui/utils/address';

import { getUiType, isSameAddress, useAlias } from '@/ui/utils';
import { Tooltip } from 'antd';
import { ChevronRight, UserRound } from 'lucide-react';
import { AddressAvatar } from '@/ui/component/ui/AddressAvatar';
import { useRabbyDispatch, useRabbySelector } from '@/ui/store';

import { ReactComponent as RcToSwitch } from '@/ui/views/SendToken/icons/to-address-switch.svg';
import { ReactComponent as RcWhitelistGuardBordered } from '@/ui/assets/component/whitelist-guard-bordered.svg';
import { ReactComponent as RcCheckRight } from '@/ui/assets/send-token/check-right.svg';

import { BRAND_ALIAN_TYPE_TEXT, KEYRING_CLASS } from '@/constant';
import { AddressViewer } from '@/ui/component';
import {
  ToAddressPositiveTips,
  useRecentSendToHistoryFor,
} from '@/ui/component/SendLike/hooks/useRecentSend';
import MarkedHeadTailAddress from '../AddressViewer/MarkedHeadTailAddress';

const isTab = getUiType().isTab;

export function AddressInfoTo({
  toAccount,
  titleText,
  loadingToAddressDesc,
  toAddressPositiveTips,
  // isMyImported,
  cexInfo,
  className,
  onClick,
}: {
  className?: string;
  toAccount?: Account;
  titleText?: string;
  loadingToAddressDesc?: boolean;
  toAddressPositiveTips?: ToAddressPositiveTips;
  // isMyImported: boolean | undefined;
  cexInfo?: Cex;
  onClick?: () => void;
}) {
  const { t } = useTranslation();

  const [aliasName] = useAlias(toAccount?.address || '');

  const rDispatch = useRabbyDispatch();

  const { showBorderdDesc, cexInfoText } = useMemo(() => {
    const ret = {
      showCexInfo: false,
      cexInfoText: '',
      showBorderdDesc: false,
    };
    ret.showCexInfo =
      !!cexInfo?.id &&
      !!cexInfo?.is_deposit &&
      toAccount?.type === KEYRING_CLASS.WATCH;

    ret.cexInfoText = ret.showCexInfo
      ? t('page.selectToAddress.riskAlert.cexDepositAddress', {
          cexName: cexInfo?.name,
        })
      : toAccount?.type === KEYRING_CLASS.GNOSIS
      ? t('page.selectToAddress.riskAlert.cexAddress', {
          cexName: BRAND_ALIAN_TYPE_TEXT[toAccount?.type],
        })
      : toAccount?.type
      ? BRAND_ALIAN_TYPE_TEXT[toAccount?.type]
      : '';

    // ret.showBorderdDesc = ret.showCexInfo || toAccount?.type === KEYRING_CLASS.GNOSIS;
    ret.showBorderdDesc = false;

    return ret;
  }, [cexInfo, toAccount?.type, t]);

  useEffect(() => {
    rDispatch.accountToDisplay.getAllAccountsToDisplay();
  }, [rDispatch]);

  return (
    <div className={clsx(className, 'overflow-auto')}>
      <div className="section relative">
        <div className="section-title justify-between items-center flex">
          <span className="section-title__to">
            {titleText || t('page.sendToken.sectionTo.title')}
          </span>

          {toAddressPositiveTips?.hasPositiveTips && (
            <div className="flex items-center justify-end font-medium text-[13px]">
              <RcCheckRight width={16} height={16} className="mr-[3px]" />
              {toAddressPositiveTips.inWhitelist ? (
                <span className="text-r-green-default">
                  {t('page.selectToAddress.positiveTips.whitelistAddress')}
                </span>
              ) : toAddressPositiveTips.isMyImported ? (
                <span className="text-r-green-default">
                  {t('page.selectToAddress.positiveTips.yourOwnAddress')}
                </span>
              ) : toAddressPositiveTips.toAddressIsRecentlySend ? (
                <span className="text-r-green-default">
                  {t('page.selectToAddress.positiveTips.sentBefore')}
                </span>
              ) : null}
            </div>
          )}
        </div>

        {/* selected block  */}
        <div className="mt-[12px]">
          <div
            className={clsx(
              'h-[60px] w-[100%] flex items-center justify-between pl-[14px] pr-[12px]',
              'bg-[var(--crb-card-solid)] shadow-[var(--crb-shadow-card)] rounded-[14px] group',
              'cursor-pointer transition-[box-shadow,background-color] hover:shadow-[var(--crb-shadow-raised)]'
            )}
            onClick={onClick}
          >
            <div className="relative flex items-center justify-start">
              <Tooltip
                overlayClassName="rounded-tooltip"
                title={
                  toAddressPositiveTips?.inWhitelist
                    ? t('page.whitelist.tips.tooltip')
                    : ''
                }
                {...(!toAddressPositiveTips?.inWhitelist && {
                  visible: false,
                })}
              >
                <div className="relative">
                  {!toAccount?.address ? (
                    <div className="w-[32px] h-[32px] rounded-[9px] flex justify-center items-center bg-[var(--crb-sunken)] text-r-neutral-foot">
                      <UserRound size={16} strokeWidth={2} />
                    </div>
                  ) : cexInfo?.logo_url ? (
                    <img
                      src={cexInfo.logo_url}
                      className="w-[32px] h-[32px] rounded-[9px]"
                    />
                  ) : (
                    // the destination's identicon, so it can be checked by eye
                    <AddressAvatar
                      address={toAccount.address}
                      type={toAccount.type}
                      brandName={toAccount.brandName}
                      size={32}
                      signal={false}
                    />
                  )}
                  {toAddressPositiveTips?.inWhitelist && (
                    <div className="absolute w-[18px] h-[18px] whitelist-guard-bordered-view text-r-blue-default">
                      <RcWhitelistGuardBordered
                        width={18}
                        height={18}
                        viewBox="0 0 18 18"
                      />
                    </div>
                  )}
                </div>
              </Tooltip>

              <div className={clsx('flex flex-col items-center', 'ml-[12px]')}>
                {toAccount?.address ? (
                  <Tooltip
                    overlayClassName="address-tooltip address-tooltip-transparent rounded-tooltip"
                    title={
                      <div className="flex flex-col justify-center">
                        {showBorderdDesc && (
                          <div
                            className={clsx(
                              'flex items-center justify-center',
                              'rounded-[12px] bg-r-blue-light1',
                              'px-[12px] h-[32px]',
                              'text-[13px] font-medium text-r-blue-default whitespace-nowrap overflow-hidden text-ellipsis'
                            )}
                          >
                            {cexInfoText}
                          </div>
                        )}
                      </div>
                    }
                    {...(!showBorderdDesc && {
                      visible: false,
                    })}
                  >
                    <div className="flex flex-col justify-center items-start">
                      {aliasName ? (
                        <span className="text-[16px] mb-[4px] font-medium leading-[20px] text-r-neutral-title-1 truncate max-w-[220px]">
                          {aliasName}
                        </span>
                      ) : (
                        <MarkedHeadTailAddress
                          headCount={8}
                          tailCount={4}
                          address={toAccount?.address || ''}
                          className="text-[16px] mb-[4px] font-medium leading-[20px] text-r-neutral-title-1"
                        />
                      )}
                      <AddressViewer
                        address={toAccount?.address?.toLowerCase()}
                        showArrow={false}
                        className={clsx(
                          'text-[12px] text-r-neutral-foot font-normal leading-[16px]'
                        )}
                      />
                    </div>
                  </Tooltip>
                ) : (
                  <span className="text-[15px] font-medium leading-[20px] text-r-neutral-foot group-hover:text-r-neutral-title1 transition-colors">
                    {t('page.sendToken.sectionTo.placeholder')}
                  </span>
                )}
              </div>
            </div>

            {/* {toAccount ? (
              <RcToSwitch width={24} height={24} />
            ) : (
              <RcIconAddressEntry width={20} height={20} />
            )} */}
            <ChevronRight
              size={18}
              strokeWidth={2.25}
              className="text-r-neutral-foot shrink-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
