import { History as HistoryIcon, SquareArrowOutUpRight } from 'lucide-react';
import { IconButton } from '@/ui/component/ui/IconButton';

import { PageHeader } from '@/ui/component';
import React, { useCallback, useState } from 'react';
import { useRabbyFee, useSetRabbyFee } from '../hooks';
import { SwapTxHistory } from './History';
import { useTranslation } from 'react-i18next';
import { useSwapStore } from '@/ui/state/swap';
import { RabbyFeePopup } from './RabbyFeePopup';
import { useHistory } from 'react-router-dom';
import { getUiType } from '@/ui/utils';
const isTab = getUiType().isTab;
const isDesktop = getUiType().isDesktop;

const getContainer = isTab
  ? '.js-rabby-popup-container'
  : isDesktop
  ? '.js-rabby-desktop-swap-container'
  : undefined;

export const Header = ({
  onOpenInTab,
  noShowHeader = false,
}: {
  onOpenInTab?(): void;
  noShowHeader: boolean;
}) => {
  const [historyVisible, setHistoryVisible] = useState(false);
  const { t } = useTranslation();

  const { visible, feeDexDesc, dexName } = useRabbyFee();
  const setRabbyFeeVisible = useSetRabbyFee();

  const openHistory = useCallback(() => {
    setHistoryVisible(true);
  }, []);
  const history = useHistory();

  const gotoDashboard = () => {
    history.push('/dashboard');
  };

  const getSwapSupportedDEXList = useSwapStore(
    (s) => s.getSwapSupportedDEXList
  );

  React.useEffect(() => {
    getSwapSupportedDEXList();
  }, [getSwapSupportedDEXList]);

  return (
    <>
      {!noShowHeader && (
        <PageHeader
          className="mx-[20px] mb-[5px]"
          forceShowBack={!isTab}
          onBack={gotoDashboard}
          canBack={!isTab}
          isShowAccount
          rightSlot={
            <div className="flex items-center gap-[2px] absolute top-[50%] translate-y-[-50%] right-[-6px]">
              {isTab ? null : (
                <IconButton
                  label={t('page.dashboard.assets.openInTabV2')}
                  onClick={() => onOpenInTab?.()}
                >
                  <SquareArrowOutUpRight size={18} strokeWidth={2} />
                </IconButton>
              )}
              <IconButton
                label={t('page.swap.swap-history')}
                onClick={openHistory}
              >
                <HistoryIcon size={18} strokeWidth={2} />
              </IconButton>
            </div>
          }
        >
          {t('page.swap.title')}
        </PageHeader>
      )}
      <SwapTxHistory
        visible={historyVisible}
        onClose={useCallback(() => {
          setHistoryVisible(false);
        }, [])}
        getContainer={getContainer}
      />
      <RabbyFeePopup
        visible={visible}
        dexName={dexName}
        feeDexDesc={feeDexDesc}
        onClose={() => setRabbyFeeVisible({ visible: false })}
        getContainer={getContainer}
      />
    </>
  );
};
