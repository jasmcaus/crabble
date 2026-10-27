import React from 'react';
import { Main } from './Component/Main';
import {
  QuoteVisibleProvider,
  RabbyFeeProvider,
  RefreshIdProvider,
} from './hooks';
import clsx from 'clsx';
import { getUiType } from '@/ui/utils';
import { withAccountChange } from '@/ui/utils/withAccountChange';
import { FullscreenContainer } from '@/ui/component/FullscreenContainer';
import { DirectSubmitProvider } from '@/ui/hooks/useMiniApprovalDirectSign';
import { useRabbySelector } from '@/ui/store';
const isTab = getUiType().isTab;

const Swap = () => {
  const { userAddress, accountType } = useRabbySelector((state) => ({
    userAddress: state.account.currentAccount?.address || '',
    accountType: state.account.currentAccount?.type,
  }));
  return (
    <RefreshIdProvider key={userAddress + accountType}>
      <QuoteVisibleProvider>
        <RabbyFeeProvider>
          <DirectSubmitProvider>
            <FullscreenContainer className={isTab ? 'h-[700px]' : 'h-[540px]'}>
              <div
                className={clsx(
                  'px-0 overflow-hidden bg-r-neutral-bg-2 h-full relative flex flex-col',
                  isTab
                    ? 'rounded-[16px] shadow-[0px_24px_64px_-12px_rgba(9,9,11,0.18)'
                    : ''
                )}
              >
                <Main />
              </div>
            </FullscreenContainer>
          </DirectSubmitProvider>
        </RabbyFeeProvider>
      </QuoteVisibleProvider>
    </RefreshIdProvider>
  );
};
export default isTab ? withAccountChange(Swap) : Swap;
