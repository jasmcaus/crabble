import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useCurrentAccount } from '../hooks/backgroundState/useAccount';
import { useCheckSeedPhraseBackup } from '../utils/useCheckSeedPhraseBackup';
import { useEnterPassphraseModal } from '../hooks/useEnterPassphraseModal';
import { useMemoizedFn } from 'ahooks';
import AuthenticationModal from './AuthenticationModal';
import { useWallet } from '../utils';
import React from 'react';
import { ChevronRight, ShieldAlert } from 'lucide-react';
import { cn } from './ui/cn';
import { UI_TYPE } from '@/constant/ui';
import { obj2query } from '../utils/url';
import browser from 'webextension-polyfill';

export const SeedPhraseBackupAlert: React.FC<{
  style?: React.CSSProperties;
  className?: string;
}> = ({ style, className }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const wallet = useWallet();
  const currentAccount = useCurrentAccount();

  const { hasBackup } = useCheckSeedPhraseBackup(
    {
      address: currentAccount?.address || '',
      type: currentAccount?.type || '',
    },
    {
      refreshOnWindowFocus: true,
    }
  );
  const invokeEnterPassphrase = useEnterPassphraseModal('address');
  const handleBackup = useMemoizedFn(async () => {
    let data = '';
    const address = currentAccount?.address;
    if (!address) {
      return;
    }
    if (UI_TYPE.isDesktop) {
      await wallet.setPageStateCache({
        path: '/dashboard',
        params: {
          action: 'address-backup',
          backupType: 'mneonics',
        },
        states: {
          action: 'address-backup',
        },
      });
      try {
        await browser.action.openPopup();
      } catch (e) {
        console.error('open popup failed', e);
      }
      // history.push({
      //   pathname: `${history.location.pathname}`,
      //   search: `?${obj2query({
      //     action: 'address-backup',
      //     backupType: 'mneonics',
      //   })}`,
      //   state: {
      //     data: data,
      //   },
      // });
    } else {
      await AuthenticationModal({
        confirmText: t('global.confirm'),
        cancelText: t('global.Cancel'),
        title: t('page.addressDetail.backup-seed-phrase'),
        validationHandler: async (password: string) => {
          await invokeEnterPassphrase(address);

          data = await wallet.getMnemonics(password, address);
        },
        onFinished() {
          history.push({
            pathname: '/settings/address-backup/mneonics',
            state: {
              data: data,
              goBack: true,
            },
          });
        },
        onCancel() {
          // do nothing
        },
        wallet,
      });
    }
  });

  if (hasBackup) {
    return null;
  }

  return (
    <button
      type="button"
      style={style}
      className={cn(
        'w-full flex items-center gap-[10px] px-[12px] py-[10px] rounded-[12px] border-0 cursor-pointer text-left',
        'bg-r-orange-light shadow-[inset_0_0_0_1px_rgba(245,158,11,0.18)]',
        'transition-[filter] hover:brightness-[0.98] active:brightness-[0.96]',
        'focus-visible:shadow-[var(--crb-ring)] outline-none',
        className
      )}
      onClick={handleBackup}
    >
      <span className="w-[28px] h-[28px] shrink-0 rounded-full flex items-center justify-center bg-[rgba(245,158,11,0.16)] text-r-orange-default">
        <ShieldAlert size={16} strokeWidth={2.25} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] leading-[16px] font-semibold text-r-neutral-title1 truncate">
          {t('component.SeedPhraseBackupAlert.title')}
        </span>
        <span className="block mt-[1px] text-[12px] leading-[16px] text-r-neutral-foot truncate">
          {t('component.SeedPhraseBackupAlert.desc')}
        </span>
      </span>
      <ChevronRight
        size={16}
        strokeWidth={2.25}
        className="shrink-0 text-r-neutral-foot"
      />
    </button>
  );
};
