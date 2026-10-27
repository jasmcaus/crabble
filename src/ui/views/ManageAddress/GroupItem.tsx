import { KEYRING_CLASS, KEYRING_ICONS, WALLET_BRAND_CONTENT } from '@/constant';
import ThemeIcon from '@/ui/component/ThemeMode/ThemeIcon';
import { useWalletConnectIcon } from '@/ui/component/WalletConnect/useWalletConnectIcon';
import { useThemeMode } from '@/ui/hooks/usePreference';
import { IDisplayedAccountWithBalance } from '@/ui/state/accountToDisplay';
import { pickKeyringThemeIcon } from '@/utils/account';
import clsx from 'clsx';
import React, { useMemo } from 'react';

export const GroupItem = ({
  item,
  active,
  count,
  onChange,
  type,
  brandName,
}: {
  item?: IDisplayedAccountWithBalance;
  active: boolean;
  count: number;
  type: string;
  brandName?: string;
  onChange: () => void;
}) => {
  const { address } = item || {};
  const brandIcon = useWalletConnectIcon(
    address && brandName
      ? {
          address,
          brandName,
          type,
        }
      : null
  );

  const { isDarkTheme } = useThemeMode();

  const addressTypeIcon = useMemo(
    () =>
      (address && brandName ? brandIcon : null) ||
      pickKeyringThemeIcon(type as any, isDarkTheme) ||
      KEYRING_ICONS[type] ||
      WALLET_BRAND_CONTENT?.[brandName || type]?.maybeSvg ||
      WALLET_BRAND_CONTENT?.[brandName || type]?.image,
    [type, brandName, brandIcon, isDarkTheme]
  );

  return (
    <div
      onClick={onChange}
      className={clsx(
        'w-[56px] h-[40px] rounded-[9px] flex items-center justify-center cursor-pointer transition-[background-color,box-shadow] duration-150',
        active
          ? 'bg-[var(--crb-thumb)] shadow-[var(--crb-shadow-thumb)]'
          : 'hover:bg-[var(--crb-hover)]'
      )}
    >
      <div className="relative flex items-center justify-center">
        <ThemeIcon
          src={addressTypeIcon}
          className={clsx(
            'w-[22px] h-[22px]',
            type !== KEYRING_CLASS.MNEMONIC && 'rounded-full'
          )}
        />
        <div className="absolute -top-[7px] -right-[10px] min-w-[16px] h-[16px] px-[4px] rounded-full bg-r-neutral-title1 text-r-neutral-bg1 text-[10px] leading-[16px] font-semibold text-center tabular-nums">
          {count}
        </div>
      </div>
    </div>
  );
};
