import { Account } from '@/background/service/preference';
import { useSceneAccountInfo } from '@/ui/hooks/backgroundState/useAccount';
import { AddressAvatar } from '@/ui/component/ui/AddressAvatar';
import { ChevronDown, ChevronLeft, Eye } from 'lucide-react';
import { useRabbyDispatch } from '@/ui/store';
import { getUiType, useAlias } from '@/ui/utils';
import clsx from 'clsx';
import React, { ReactNode, SVGProps, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { ReactComponent as RcIconClose } from 'ui/assets/component/close-cc.svg';
import { AccountSelectorModal } from '../AccountSelector/AccountSelectorModal';
import ThemeIcon from '../ThemeMode/ThemeIcon';
import './style.less';
import { KEYRING_TYPE } from '@/constant';
import { UI_TYPE } from '@/constant/ui';
const isTab = UI_TYPE.isTab;
const isDesktop = UI_TYPE.isDesktop;

const PageHeader = ({
  children,
  canBack = true,
  rightSlot,
  onBack,
  forceShowBack,
  fixed = false,
  wrapperClassName = '',
  invertBack = false,
  keepBackLightVersion = false,
  contentClassName,
  className = '',
  closeable = false,
  onClose,
  closeCn,
  isShowAccount,
  disableSwitchAccount,
  showCurrentAccount,
  onSwitchAccountClick,
  onBeforeSwitchAccountChange,
}: {
  children: ReactNode;
  canBack?: boolean;
  rightSlot?: ReactNode;
  onBack?(): void;
  onClose?(): void;
  forceShowBack?: boolean;
  fixed?: boolean;
  wrapperClassName?: string;
  invertBack?: boolean;
  keepBackLightVersion?: boolean;
  contentClassName?: string;
  className?: string;
  closeable?: boolean;
  closeCn?: string;
  isShowAccount?: boolean;
  disableSwitchAccount?: boolean;
  showCurrentAccount?: Account;
  onSwitchAccountClick?: () => void;
  onBeforeSwitchAccountChange?: (nextAccount: Account) => void | Promise<void>;
}) => {
  const history = useHistory();

  const { currentAccount } = useSceneAccountInfo();

  const Content = (
    <>
      <div
        className={clsx(
          'page-header',
          isShowAccount && 'switch-account thin-header',
          contentClassName,
          !fixed && className
        )}
      >
        {(forceShowBack || (canBack && history.length > 1)) && (
          <div
            className="icon-back-container hit-slop-8"
            onClick={onBack || (() => history.goBack())}
          >
            <ChevronLeft
              size={22}
              strokeWidth={2}
              className={clsx(
                'icon icon-back',
                keepBackLightVersion ? 'text-white' : 'text-r-neutral-title1',
                invertBack && 'filter invert'
              )}
            />
          </div>
        )}
        <div className="header-content">
          {children ? (
            <span className="page-header-title">{children}</span>
          ) : null}
          {isShowAccount && currentAccount ? (
            <AccountSwitchInner
              disableSwitch={disableSwitchAccount}
              currentAccount={showCurrentAccount || currentAccount}
              onSwitchAccountClick={onSwitchAccountClick}
              onBeforeSwitchAccountChange={onBeforeSwitchAccountChange}
            />
          ) : null}
        </div>
        {rightSlot && rightSlot}
        {closeable && (
          <ThemeIcon
            src={RcIconClose}
            className={clsx(
              'icon-close text-r-neutral-body',
              invertBack && 'filter invert',
              closeCn
            )}
            onClick={() => {
              if (onClose) {
                onClose();
              } else if (history.length > 1) {
                history.goBack();
              } else {
                history.replace('/');
              }
            }}
          />
        )}
      </div>
    </>
  );
  return fixed ? (
    <div className={clsx('page-header-container', className)}>
      <div className={clsx('page-header-wrap', wrapperClassName)}>
        {Content}
      </div>
    </div>
  ) : (
    Content
  );
};

const AccountSwitchInner = ({
  currentAccount,
  disableSwitch,
  onSwitchAccountClick,
  onBeforeSwitchAccountChange,
}: {
  currentAccount: Account;
  disableSwitch?: boolean;
  onSwitchAccountClick?: () => void;
  onBeforeSwitchAccountChange?: (nextAccount: Account) => void | Promise<void>;
}) => {
  const [alias] = useAlias(currentAccount.address);
  const { t } = useTranslation();

  const [isShowModal, setIsShowModal] = useState(false);

  const isWatchAddress =
    currentAccount?.type === KEYRING_TYPE.WatchAddressKeyring;

  const dispatch = useRabbyDispatch();

  return (
    <>
      <div className="flex justify-center mt-[-1px]">
        <div
          className={clsx(
            'flex items-center justify-center gap-[2px] pl-[6px] pr-[4px] py-[3px] rounded-full group transition-colors',
            !disableSwitch && 'hover:bg-[var(--crb-hover)] cursor-pointer'
          )}
          onClick={() => {
            if (disableSwitch) {
              return;
            }
            if (typeof onSwitchAccountClick === 'function') {
              onSwitchAccountClick();
              return;
            }
            setIsShowModal(true);
          }}
        >
          <AddressAvatar
            address={currentAccount.address}
            type={currentAccount.type}
            brandName={currentAccount.brandName}
            size={18}
            badge={false}
            signal={false}
            className="mr-[4px]"
          />
          <div
            className={clsx(
              'text-r-neutral-body text-[13px] leading-[16px] font-semibold',
              'max-w-[220px] truncate'
            )}
          >
            {alias}
          </div>
          {isWatchAddress && (
            <Eye
              size={13}
              strokeWidth={2.25}
              className="ml-[3px] shrink-0 text-r-neutral-foot"
              aria-label={t('page.manageAddress.watch-address')}
            />
          )}
          {disableSwitch ? null : (
            <ChevronDown
              size={14}
              strokeWidth={2.25}
              className="ml-[1px] shrink-0 text-r-neutral-foot"
            />
          )}
        </div>
      </div>
      <AccountSelectorModal
        // title={t('component.PageHeader.selectAccount')}
        height="calc(100% - 60px)"
        visible={isShowModal}
        value={currentAccount}
        onCancel={() => {
          setIsShowModal(false);
        }}
        getContainer={
          isTab || isDesktop
            ? (document.querySelector(
                '.js-rabby-popup-container'
              ) as HTMLDivElement) || document.body
            : document.body
        }
        onChange={async (val) => {
          try {
            await onBeforeSwitchAccountChange?.(val);
          } catch (error) {
            console.error(
              '[PageHeader] onBeforeSwitchAccountChange error',
              error
            );
          }
          dispatch.account.changeAccountAsync(val);
          setIsShowModal(false);
        }}
      />
    </>
  );
};

export default PageHeader;
