import { CurrencyItem } from '@/background/service/openapi';
import { useRabbyDispatch, useRabbySelector } from '@/ui/store';
import { formatCurrencyParts } from '@/ui/utils';
import clsx from 'clsx';
import React from 'react';

interface Props {
  // isCache: boolean;
  balanceUsd: number;
  currency: CurrencyItem;
}
export const BalanceLabel: React.FC<Props> = ({ balanceUsd, currency }) => {
  const formattedBalance = formatCurrencyParts(balanceUsd || 0, { currency });
  const { hiddenBalance } = useRabbySelector((state) => state.preference);
  const dispatch = useRabbyDispatch();

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch.preference.setHiddenBalance(!hiddenBalance);
  };

  return (
    <div
      className={clsx('cursor-pointer transition-opacity truncate')}
      onClick={handleClick}
    >
      {hiddenBalance ? (
        <div
          className={clsx(
            'crb-display text-[44px] leading-[48px] tracking-[12px]',
            'mr-[-12px]'
          )}
        >
          *****
        </div>
      ) : formattedBalance.isPrefix ? (
        <div
          className={clsx(
            'crb-display text-[44px] leading-[48px] truncate max-w-full'
          )}
        >
          <SplitCents text={formattedBalance.text} />
        </div>
      ) : (
        <div
          className={clsx(
            'inline-flex items-end gap-[6px] max-w-full overflow-hidden',
            'crb-display text-[44px] leading-[48px]'
          )}
        >
          <span className="min-w-0 truncate">
            {formattedBalance.sign}
            {formattedBalance.isLessThan ? '<' : ''}
            <SplitCents text={formattedBalance.amount} />
          </span>
          <span
            className={clsx(
              'shrink-0 pb-[7px] font-sans text-[15px] leading-[18px] font-medium text-r-neutral-foot'
            )}
          >
            {formattedBalance.symbol}
          </span>
        </div>
      )}
    </div>
  );
};

/** Renders "1,234.56" with the trailing ".56" quieter, the way statements do. */
const SplitCents: React.FC<{ text: string }> = ({ text }) => {
  const match = /^(.*?)([.,]\d{1,2})$/.exec(text);
  if (!match) {
    return <>{text}</>;
  }
  return (
    <>
      {match[1]}
      <span className="crb-cents">{match[2]}</span>
    </>
  );
};
