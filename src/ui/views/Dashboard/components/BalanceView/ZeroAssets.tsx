import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/ui/hooks/useCurrency';
import { BalanceLabel } from './BalanceLabel';

/**
 * The hero for an empty wallet: the same Net Worth headline as a funded one,
 * so the page doesn't change shape. The "Add assets" action lives once, in
 * the empty token list below.
 */
export const ZeroAssets = () => {
  const { t } = useTranslation();
  const { currency } = useCurrency();

  return (
    <div className="px-[12px] pt-[12px] pb-[8px]">
      <div className="flex items-center h-[18px]">
        <span className="crb-eyebrow">
          {t('page.desktopProfile.CurveModal.netWorth')}
        </span>
      </div>
      <div className="mt-[4px] text-r-neutral-title1">
        <BalanceLabel balanceUsd={0} currency={currency} />
      </div>
      <p className="mt-[6px] mb-0 text-[13px] leading-[18px] text-r-neutral-foot">
        {t('page.dashboard.ZeroAssets.desc')}
      </p>
    </div>
  );
};
