import { Button, Input, Skeleton } from 'antd';
import { useMemoizedFn, useRequest } from 'ahooks';
import clsx from 'clsx';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Pin,
  Plus,
  Search,
  Settings2,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import browser from 'webextension-polyfill';

import { KEYRING_CLASS } from '@/constant';
import { UI_TYPE } from '@/constant/ui';
import AuthenticationModal from '@/ui/component/AuthenticationModal';
import { LedgerStatusBar } from '@/ui/component/ConnectStatus/LedgerStatusBar';
import { GridPlusStatusBar } from '@/ui/component/ConnectStatus/GridPlusStatusBar';
import { KeystoneStatusBar } from '@/ui/component/ConnectStatus/KeystoneStatusBar';
import { SessionStatusBar } from '@/ui/component/WalletConnect/SessionStatusBar';
import { AddressAvatar } from '@/ui/component/ui/AddressAvatar';
import { IconButton } from '@/ui/component/ui/IconButton';
import { SelectedMark } from '@/ui/component/ui/SelectedMark';
import { useAccounts } from '@/ui/hooks/useAccounts';
import { useCurrency } from '@/ui/hooks/useCurrency';
import { useEnterPassphraseModal } from '@/ui/hooks/useEnterPassphraseModal';
import { IDisplayedAccountWithBalance } from '@/ui/state/accountToDisplay';
import { useRabbyDispatch, useRabbySelector } from '@/ui/store';
import { formatCurrency, isSameAddress, useWallet } from '@/ui/utils';
import { sortAccountsByBalance } from '@/ui/utils/account';
import { copyAddress } from '@/ui/utils/clipboard';
import { obj2query } from '@/ui/utils/url';
import { isSameAccount } from '@/utils/account';
import { PageHeader } from 'ui/component';
import { BalanceLabel } from '../Dashboard/components/BalanceView/BalanceLabel';
import { getWalletScore, getWalletTypeName } from '../ManageAddress/hooks';

type Account = IDisplayedAccountWithBalance;

type AccountGroup = {
  key: string;
  name: string;
  type: string;
  accounts: Account[];
  total: number;
};

const SEARCH_THRESHOLD = 6;
const NO_SEEDS: string[] = [];

const groupKey = (account: Account) => {
  if (account.type === KEYRING_CLASS.MNEMONIC) {
    return `hd:${account.publicKey || account.brandName}`;
  }
  if (account.type === KEYRING_CLASS.WATCH) return 'watch';
  return `${account.type}:${account.brandName}`;
};

const matchesKeyword = (account: Account, keyword: string) => {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return true;
  const address = account.address.toLowerCase();
  if (address === kw) return true;
  if (account.alianName?.toLowerCase().includes(kw)) return true;
  return kw.replace(/^0x/, '').length >= 2 && address.includes(kw);
};

const shortAddress = (address: string) => {
  const lower = address.toLowerCase();
  return `${lower.slice(0, 6)}…${lower.slice(-4)}`;
};

/**
 * Accounts grouped by wallet the way the user created them: one group per
 * seed phrase, then private keys, hardware and other brands, then watch-only.
 */
const useAccountGroups = (
  accounts: Account[],
  keyword: string,
  /** seed phrase public keys in keyring (creation) order */
  seedOrder: string[]
) => {
  const { t } = useTranslation();
  const highlighted = useRabbySelector(
    (s) => s.addressManagement.highlightedAddresses
  );

  return useMemo(() => {
    const isPinned = (a: Account) =>
      highlighted.some(
        (h) =>
          isSameAddress(h.address, a.address) && h.brandName === a.brandName
      );

    const byKey = new Map<string, Account[]>();
    accounts.forEach((account) => {
      const key = groupKey(account);
      byKey.set(key, [...(byKey.get(key) || []), account]);
    });

    // number seed phrases by when they were added, not by balance, so
    // "Seed Phrase 2" stays the same wallet as balances move
    const seedRank = (key: string) => {
      const idx = seedOrder.indexOf(key.slice('hd:'.length));
      return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
    };
    const seedKeys = [...byKey.keys()]
      .filter((k) => k.startsWith('hd:'))
      .sort((a, b) => seedRank(a) - seedRank(b));

    const groups: AccountGroup[] = [...byKey.entries()].map(([key, list]) => {
      const { type, brandName } = list[0];
      let name = getWalletTypeName(brandName || type);
      if (key.startsWith('hd:') && seedKeys.length > 1) {
        name = `${name} ${seedKeys.indexOf(key) + 1}`;
      }
      if (type === KEYRING_CLASS.WATCH) {
        name = t('page.manageAddress.watch-address');
      }
      const sorted = sortAccountsByBalance(list);
      const pinned = sorted.filter(isPinned);
      const rest = sorted.filter((a) => !isPinned(a));
      const total = list.reduce((sum, a) => sum + (a.balance || 0), 0);
      return { key, name, type, accounts: [...pinned, ...rest], total };
    });

    groups.sort((a, b) => {
      if (a.type === KEYRING_CLASS.WATCH) return 1;
      if (b.type === KEYRING_CLASS.WATCH) return -1;
      return (
        getWalletScore(a.accounts) - getWalletScore(b.accounts) ||
        seedKeys.indexOf(a.key) - seedKeys.indexOf(b.key)
      );
    });

    const visible = groups
      .map((g) => ({
        ...g,
        accounts: g.accounts.filter((a) => matchesKeyword(a, keyword)),
      }))
      .filter((g) => g.accounts.length > 0);

    return { groups: visible, isPinned };
  }, [accounts, keyword, highlighted, seedOrder, t]);
};

/** which seed phrase groups still need a backup, keyed by group */
const useSeedPhraseBackupStatus = (groups: AccountGroup[]) => {
  const wallet = useWallet();
  const seedGroups = groups.filter((g) => g.type === KEYRING_CLASS.MNEMONIC);
  const depKey = seedGroups.map((g) => g.key).join(',');

  const { data } = useRequest(
    async () => {
      const entries = await Promise.all(
        seedGroups.map(async (g) => {
          try {
            const hasBackup = await wallet.checkSeedPhraseBackup(
              g.accounts[0].address
            );
            return [g.key, !hasBackup] as const;
          } catch (e) {
            return [g.key, false] as const;
          }
        })
      );
      return Object.fromEntries(entries) as Record<string, boolean>;
    },
    { refreshDeps: [depKey], refreshOnWindowFocus: true }
  );

  return data || {};
};

const AccountRow = ({
  account,
  isCurrent,
  isPinned,
  onSelect,
  onDetail,
  children,
}: {
  account: Account;
  isCurrent: boolean;
  isPinned: boolean;
  onSelect: () => void;
  onDetail: () => void;
  children?: React.ReactNode;
}) => {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const hiddenBalance = useRabbySelector((s) => s.preference.hiddenBalance);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <div
      className={clsx(
        'rounded-[14px]',
        isCurrent && 'bg-r-neutral-card1 shadow-[var(--crb-shadow-card)]'
      )}
      // the list isn't virtualised; let the browser skip off-screen rows
      // for wallets with hundreds of accounts
      style={
        isCurrent
          ? undefined
          : { contentVisibility: 'auto', containIntrinsicSize: 'auto 60px' }
      }
    >
      <div
        role="button"
        tabIndex={0}
        aria-current={isCurrent ? 'true' : undefined}
        className={clsx(
          'group/row flex items-center gap-[12px] h-[60px] pl-[10px] pr-[12px] rounded-[14px] cursor-pointer outline-none',
          'focus-visible:shadow-[var(--crb-ring)]',
          !isCurrent && 'crb-row'
        )}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect();
          }
        }}
      >
        <AddressAvatar
          address={account.address}
          type={account.type}
          brandName={account.brandName}
          size={36}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-[4px] min-w-0">
            <span
              className="text-[14px] leading-[18px] font-medium text-r-neutral-title1 truncate"
              title={account.alianName}
            >
              {account.alianName}
            </span>
            {isPinned && (
              <Pin
                size={11}
                strokeWidth={2.25}
                className="shrink-0 text-r-neutral-foot"
                aria-label={t('page.manageAddress.pinned')}
              />
            )}
          </div>
          <div className="flex items-center gap-[6px] mt-[2px] text-[12px] leading-[16px] text-r-neutral-foot tabular-nums">
            <span className="crb-mono" title={account.address}>
              {shortAddress(account.address)}
            </span>
            <span aria-hidden>·</span>
            <span className="truncate">
              {hiddenBalance
                ? '*****'
                : formatCurrency(account.balance || 0, { currency })}
            </span>
          </div>
        </div>
        <div
          className={clsx(
            'flex items-center gap-[2px] opacity-0 transition-opacity',
            'group-hover/row:opacity-100 group-focus-within/row:opacity-100'
          )}
        >
          <IconButton
            size="sm"
            label={copied ? t('global.copied') : t('global.copyAddress')}
            onClick={(e) => {
              e.stopPropagation();
              copyAddress(account.address);
              setCopied(true);
            }}
          >
            <Copy size={14} strokeWidth={2.25} />
          </IconButton>
          <IconButton
            size="sm"
            label={t('page.manageAddress.accountDetails')}
            onClick={(e) => {
              e.stopPropagation();
              onDetail();
            }}
          >
            <Settings2 size={14} strokeWidth={2.25} />
          </IconButton>
        </div>
        <span className="w-[20px] flex justify-end shrink-0">
          {isCurrent && <SelectedMark />}
        </span>
      </div>
      {children}
    </div>
  );
};

const AccountRowsSkeleton = () => (
  <div className="px-[10px] pt-[16px] flex flex-col gap-[16px]">
    {[0, 1, 2].map((i) => (
      <div key={i} className="flex items-center gap-[12px]">
        <Skeleton.Avatar active shape="square" size={36} />
        <div className="flex-1">
          <Skeleton.Input active size="small" style={{ width: 140 }} />
        </div>
      </div>
    ))}
  </div>
);

const CurrentAccountStatusBar = ({ account }: { account: Account }) => {
  const cls = 'mx-[10px] mb-[10px] mt-0 bg-r-neutral-card2';
  if (account.type === KEYRING_CLASS.WALLETCONNECT) {
    return (
      <SessionStatusBar
        address={account.address}
        brandName={account.brandName}
        type={account.type}
        className={cls}
      />
    );
  }
  if (account.type === KEYRING_CLASS.Coinbase) {
    return (
      <SessionStatusBar
        address={account.address}
        brandName={KEYRING_CLASS.Coinbase}
        type={KEYRING_CLASS.Coinbase}
        className={cls}
      />
    );
  }
  if (account.type === KEYRING_CLASS.HARDWARE.LEDGER) {
    return <LedgerStatusBar className={cls} />;
  }
  if (account.type === KEYRING_CLASS.HARDWARE.GRIDPLUS) {
    return <GridPlusStatusBar className={cls} />;
  }
  if (account.brandName === 'Keystone') {
    return <KeystoneStatusBar className={cls} />;
  }
  return null;
};

const AccountSwitcher = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const dispatch = useRabbyDispatch();
  const wallet = useWallet();
  const { currency } = useCurrency();

  const { accountsList, fetchAllAccounts, loadingAccounts } = useAccounts();
  const currentAccount = useRabbySelector((s) => s.account.currentAccount);
  const hiddenBalance = useRabbySelector((s) => s.preference.hiddenBalance);

  const [keyword, setKeyword] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchAllAccounts();
  }, []);

  const { data: seedOrder = NO_SEEDS } = useRequest(async () => {
    const keyrings = await wallet.getAllClassAccounts();
    return (keyrings || [])
      .filter((k) => k.type === KEYRING_CLASS.MNEMONIC && !!k.publicKey)
      .map((k) => k.publicKey as string);
  });
  const { groups, isPinned } = useAccountGroups(
    accountsList,
    keyword,
    seedOrder
  );
  const needsBackup = useSeedPhraseBackupStatus(groups);

  const { ownedTotal, watchedTotal, hasWatched } = useMemo(() => {
    let owned = 0;
    let watched = 0;
    let anyWatched = false;
    accountsList.forEach((a) => {
      if (a.type === KEYRING_CLASS.WATCH) {
        watched += a.balance || 0;
        anyWatched = true;
      } else {
        owned += a.balance || 0;
      }
    });
    return { ownedTotal: owned, watchedTotal: watched, hasWatched: anyWatched };
  }, [accountsList]);

  const switchAccount = useMemoizedFn(async (account: Account) => {
    if (!currentAccount || !isSameAccount(account, currentAccount)) {
      await dispatch.account.changeAccountAsync(account);
    }
    history.replace('/dashboard');
  });

  const gotoDetail = useMemoizedFn((account: Account) => {
    history.push(
      `/settings/address-detail?${obj2query({
        address: account.address,
        type: account.type,
        brandName: account.brandName,
        byImport: ((account.byImport as unknown) as string) || '',
      })}`
    );
  });

  const invokeEnterPassphrase = useEnterPassphraseModal('address');
  const backupSeedPhrase = useMemoizedFn(async (address: string) => {
    if (UI_TYPE.isDesktop) {
      await wallet.setPageStateCache({
        path: '/switch-address',
        params: { action: 'address-backup', backupType: 'mneonics' },
        states: { action: 'address-backup' },
      });
      try {
        await browser.action.openPopup();
      } catch (e) {
        console.error('open popup failed', e);
      }
      return;
    }

    let data = '';
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
          // without the address the backup page confirms the *current*
          // account's seed phrase, which may be a different one
          state: { data, address, goBack: true },
        });
      },
      onCancel() {
        // keep the switcher open
      },
      wallet,
    });
  });

  const showSearch = accountsList.length > SEARCH_THRESHOLD || !!keyword;

  return (
    <div className="h-[100vh] flex flex-col bg-r-neutral-bg2">
      <div className="px-[20px] shrink-0">
        <PageHeader className="mb-[12px]">
          {t('page.manageAddress.accounts')}
        </PageHeader>
      </div>

      <section className="px-[20px] pb-[16px] shrink-0">
        <div className="crb-eyebrow">{t('page.manageAddress.totalAssets')}</div>
        <div className="mt-[2px] text-r-neutral-title1">
          <BalanceLabel balanceUsd={ownedTotal} currency={currency} />
        </div>
        {hasWatched && (
          <div className="mt-[2px] text-[12px] leading-[16px] text-r-neutral-foot tabular-nums">
            {t('page.manageAddress.watchingValue', {
              value: hiddenBalance
                ? '*****'
                : formatCurrency(watchedTotal, { currency }),
            })}
          </div>
        )}
      </section>

      <div className="h-px mx-[20px] bg-[var(--crb-hairline)] shrink-0" />

      {showSearch && (
        <div className="px-[20px] pt-[12px] shrink-0">
          <Input
            allowClear
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={t('page.manageAddress.search')}
            prefix={
              <Search
                size={15}
                strokeWidth={2.25}
                className="text-r-neutral-foot"
              />
            }
            className="h-[40px]"
          />
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto px-[10px] pb-[12px]">
        {loadingAccounts && !accountsList.length ? (
          <AccountRowsSkeleton />
        ) : !groups.length ? (
          <div className="pt-[48px] text-center text-[13px] text-r-neutral-foot">
            {keyword
              ? t('page.manageAddress.no-match')
              : t('page.manageAddress.no-address')}
          </div>
        ) : (
          groups.map((group) => {
            const isCollapsed = !!collapsed[group.key] && !keyword;
            const groupContainsCurrent =
              !!currentAccount &&
              group.accounts.some((a) => isSameAccount(a, currentAccount));
            return (
              <section key={group.key} className="pt-[14px]">
                <button
                  type="button"
                  aria-expanded={!isCollapsed}
                  className={clsx(
                    'w-full flex items-center justify-between gap-[8px] px-[10px] py-[6px] rounded-[10px]',
                    'border-0 bg-transparent text-left cursor-pointer crb-row'
                  )}
                  onClick={() =>
                    setCollapsed((prev) => ({
                      ...prev,
                      [group.key]: !prev[group.key],
                    }))
                  }
                >
                  <div className="min-w-0">
                    <div className="text-[15px] leading-[20px] font-semibold text-r-neutral-title1 truncate">
                      {group.name}
                    </div>
                    <div className="text-[12px] leading-[16px] text-r-neutral-foot tabular-nums">
                      {hiddenBalance
                        ? '*****'
                        : formatCurrency(group.total, { currency })}
                      {isCollapsed && groupContainsCurrent && (
                        <span className="ml-[6px] text-r-neutral-body">
                          · {t('page.manageAddress.current')}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDown
                    size={16}
                    strokeWidth={2.25}
                    className={clsx(
                      'shrink-0 text-r-neutral-foot transition-transform duration-200',
                      !isCollapsed && 'rotate-180'
                    )}
                  />
                </button>

                {!isCollapsed && (
                  <div className="mt-[4px] flex flex-col gap-[2px]">
                    {group.accounts.map((account) => {
                      const isCurrent =
                        !!currentAccount &&
                        isSameAccount(account, currentAccount);
                      return (
                        <AccountRow
                          key={`${account.type}-${account.brandName}-${account.address}`}
                          account={account}
                          isCurrent={isCurrent}
                          isPinned={isPinned(account)}
                          onSelect={() => switchAccount(account)}
                          onDetail={() => gotoDetail(account)}
                        >
                          {isCurrent && (
                            <CurrentAccountStatusBar account={account} />
                          )}
                        </AccountRow>
                      );
                    })}
                  </div>
                )}

                {needsBackup[group.key] && (
                  <button
                    type="button"
                    className={clsx(
                      'mt-[6px] mx-auto flex items-center gap-[4px] px-[10px] h-[28px] rounded-[8px]',
                      'border-0 bg-transparent cursor-pointer text-[13px] font-medium text-r-red-default',
                      'hover:bg-[var(--crb-hover)]'
                    )}
                    onClick={() => backupSeedPhrase(group.accounts[0].address)}
                  >
                    {t('page.manageAddress.seedPhraseNotBackedUp')} ·{' '}
                    {t('page.manageAddress.backupSeedPhraseNow')}
                    <ChevronRight size={14} strokeWidth={2.25} />
                  </button>
                )}
              </section>
            );
          })
        )}
      </div>

      <footer className="shrink-0 flex gap-[10px] px-[20px] pt-[12px] pb-[16px] border-t border-solid border-0 border-t-[var(--crb-hairline)] bg-r-neutral-bg2">
        <Button
          size="large"
          className="flex-1 h-[48px]"
          onClick={() => history.push('/settings/address?back=true')}
        >
          {t('page.manageAddress.manage')}
        </Button>
        <Button
          type="primary"
          size="large"
          className="flex-[1.6] h-[48px] inline-flex items-center justify-center gap-[6px]"
          onClick={() => history.push('/add-address')}
        >
          <Plus size={16} strokeWidth={2.5} />
          {t('page.manageAddress.addNewAddress')}
        </Button>
      </footer>
    </div>
  );
};

export default AccountSwitcher;
