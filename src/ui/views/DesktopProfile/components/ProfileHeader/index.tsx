import { RcIconCopyCC, RcIconQrCodeCC } from '@/ui/assets/desktop/profile';
import { useCurrentAccount } from '@/ui/hooks/backgroundState/useAccount';
import { ellipsisAddress } from '@/ui/utils/address';
import { copyAddress } from '@/ui/utils/clipboard';
import { CurveChartData } from '@/ui/views/Dashboard/components/BalanceView/useCurve';
import { Popover } from 'antd';
import QRCode from 'qrcode.react';
import React from 'react';
import { createGlobalStyle } from 'styled-components';
import { BalanceView } from './BalanceView';
import { SeedPhraseBackupAlert } from '@/ui/component/SeedPhraseBackupAlert';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

const GlobalStyle = createGlobalStyle`
  .global-qr-code-popover {
    .ant-popover-arrow {
      display: none;
    }
    .ant-popover-inner {
      border-radius: 12px;
      border: 1px solid var(--r-neutral-line, #E4E4E7);
      box-shadow: none;
    }
    .ant-popover-inner-content {
      padding: 14px;
    }
  }
`;

export const ProfileHeader: React.FC<{
  balance?: number | null;
  evmBalance?: number | null;
  curveChartData?: CurveChartData;
  appChainIds: string[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?(): void;
}> = (props) => {
  const currentAccount = useCurrentAccount();
  const { t } = useTranslation();

  if (!currentAccount) {
    return null;
  }

  return (
    <>
      <GlobalStyle />
      <div className="px-[4px] pt-[20px] pb-[24px] relative">
        <h1 className="crb-display m-0 text-[48px] leading-[52px] text-r-neutral-title1">
          {t('component.DesktopNav.portfolio')}
        </h1>
        <div className="mt-[8px] flex items-center gap-[8px] text-[15px] leading-[20px]">
          <span className="font-medium text-r-neutral-title1">
            {currentAccount.alianName}
          </span>
          <span className="font-mono text-[13px] text-r-neutral-foot">
            {ellipsisAddress(currentAccount?.address || '')}
          </span>
          <div className="flex items-center gap-[4px]">
            <div
              onClick={() => {
                copyAddress(currentAccount?.address);
              }}
              className="cursor-pointer rounded-[6px] p-[2px] text-r-neutral-foot hover:bg-[var(--crb-sunken)] hover:text-r-neutral-title1"
            >
              <RcIconCopyCC />
            </div>
            <Popover
              placement="bottom"
              overlayClassName="global-qr-code-popover"
              trigger={'click'}
              content={
                <div>
                  <QRCode value={currentAccount.address || ''} size={250} />
                </div>
              }
            >
              <div className="cursor-pointer rounded-[6px] p-[2px] text-r-neutral-foot hover:bg-[var(--crb-sunken)] hover:text-r-neutral-title1">
                <RcIconQrCodeCC />
              </div>
            </Popover>
            <SeedPhraseBackupAlert className={clsx('rounded-[12px]')} />
          </div>
        </div>
      </div>
      <div className="crb-hero-card">
        <BalanceView {...props} />
      </div>
    </>
  );
};
