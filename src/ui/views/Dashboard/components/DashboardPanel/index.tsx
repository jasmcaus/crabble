import { KEYRING_TYPE, ThemeIconType } from '@/constant';
import RateModal from '@/ui/component/RateModal/RateModal';
import ThemeIcon from '@/ui/component/ThemeMode/ThemeIcon';
import { useRabbyDispatch, useRabbySelector } from '@/ui/store';
import { usePerpsHomePnl } from '@/ui/views/Perps/hooks/usePerpsHomePnl';
import { appIsDev } from '@/utils/env';
import { ga4 } from '@/utils/ga4';
import { matomoRequestEvent } from '@/utils/matomo-request';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge, Skeleton, Tooltip } from 'antd';
import clsx from 'clsx';
import React, { createContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useAsync } from 'react-use';
import { createGlobalStyle } from 'styled-components';
import IconAlertRed from 'ui/assets/alert-red.svg';
import { RcIconJumpCC } from '@/ui/assets/dashboard';

import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Blocks,
  Bridge,
  ChartCandlestick,
  Globe,
  History,
  LayoutGrid,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sprout,
  Star,
  Users,
} from 'lucide-react';
import { Popup } from 'ui/component';

import { usePerpsDefaultAccount } from '@/ui/views/Perps/hooks/usePerpsDefaultAccount';
import { useMemoizedFn, useMount } from 'ahooks';
import { isEqual } from 'lodash';
import {
  formatUsdValue,
  openInTab,
  openInternalPageInTab,
  splitNumberByStep,
  useWallet,
} from 'ui/utils';
import { ClaimRabbyFreeGasBadgeModal } from '../ClaimRabbyBadgeModal/freeGasBadgeModal';
import { EcologyPopup } from '../EcologyPopup';
import { RabbyPointsPopup } from '../RabbyPointsPopup';
import { RecentConnectionsPopup } from '../RecentConnections';
import BigNumber from 'bignumber.js';

export const DragOverlayContext = createContext(false);

const PRIMARY_PANEL_KEYS = ['send', 'receive', 'swap', 'bridge'] as const;

const GlobalStyle = createGlobalStyle`
  .rabby-dashboard-panel-container {
    .crb-quick-actions {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 2px;
    }

    .crb-quick-action {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 6px 0 4px;
      border: 0;
      border-radius: 14px;
      background: transparent;
      cursor: pointer;
      font-family: inherit;
      color: var(--r-neutral-title-1);
      transition: background-color 0.15s var(--crb-ease);

      &:hover .crb-quick-action-icon {
        background: var(--crb-sunken);
        transform: translateY(-1px);
      }

      &:active .crb-quick-action-icon {
        transform: scale(0.94);
      }

      &.is-primary .crb-quick-action-icon {
        background: var(--r-blue-default);
        color: #fff;
        box-shadow: var(--crb-primary-shadow);
      }

      &.is-primary:hover .crb-quick-action-icon {
        background: var(--crb-primary-hover);
      }
    }

    .crb-quick-action-icon {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 46px;
      height: 46px;
      border-radius: 999px;
      background: var(--crb-raised);
      box-shadow: var(--crb-shadow-card);
      transition: background-color 0.15s var(--crb-ease),
        transform 0.15s var(--crb-ease), box-shadow 0.15s var(--crb-ease);

      svg {
        width: 20px;
        height: 20px;
      }
    }

    .crb-quick-action-label {
      font-size: 12px;
      line-height: 16px;
      font-weight: 550;
      letter-spacing: -0.01em;
      color: var(--r-neutral-body);
    }

    .crb-quick-action-dot {
      position: absolute;
      top: 1px;
      right: 1px;
      width: 9px;
      height: 9px;
      border-radius: 999px;
      background: var(--r-red-default);
      box-shadow: 0 0 0 2px var(--r-neutral-bg-2);
    }
  }

  .crb-panel-sheet {
    .dashboard-panel-grid {
      position: relative;
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 4px;
    }

    .panel-item {
      height: 96px;
      width: 100%;
      border-radius: 14px;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-top: 10px;
      gap: 8px;
      cursor: pointer;
      transition: background-color 0.15s var(--crb-ease);

      &:hover {
        background: var(--crb-hover);
      }

      &:hover .panel-item-icon-wrap {
        transform: translateY(-1px);
      }

      &:has(.panel-item-jump-button:hover) {
        background: transparent;
      }

      &-jump-button {
        position: absolute;
        top: 4px;
        right: 4px;
        z-index: 2;

        display: none;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        padding: 0;

        color: var(--r-neutral-foot);
        background: var(--crb-raised);
        box-shadow: var(--crb-shadow-card);
        border: 0;
        border-radius: 7px;
        cursor: pointer;

        &:hover {
          color: var(--r-blue-default);
        }
      }

      &:hover > .panel-item-jump-button {
        display: flex;
      }

      &-icon-wrap {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border-radius: 14px;
        color: var(--r-neutral-title-1);
        background: var(--crb-raised);
        box-shadow: var(--crb-shadow-card);
        transition: transform 0.15s var(--crb-ease);
      }

      &-icon {
        width: 20px;
        height: 20px;
        color: currentColor;

        &.icon-spin {
          animation: icn-spin 1.5s linear infinite;
        }
      }

      &-label {
        font-weight: 550;
        font-size: 12px;
        line-height: 15px;
        letter-spacing: -0.01em;
        color: var(--r-neutral-body);
        text-align: center;
        padding: 0 2px;
      }

      &.is-dragging-overlay {
        background: var(--crb-card-solid);
        box-shadow: var(--crb-shadow-pop);
      }

      @keyframes icn-spin {
        100% {
          transform: rotate(360deg);
        }
      }

      .icon-alert {
        position: absolute;
        right: 18px;
        top: 6px;
        z-index: 1;
      }
    }

    .ant-badge {
      .ant-badge-count {
        background-color: var(--r-blue-default);
        padding: 0 5px;
        font-size: 11px;
        font-weight: 600;
        line-height: 16px;
        height: 16px;
        min-width: 16px;
        border-radius: 999px;
        box-shadow: 0 0 0 2px var(--r-neutral-bg-2);
      }
      &.alert .ant-badge-count {
        background-color: var(--r-red-default);
      }
    }
  }
`;

type IPanelItem = {
  icon: ThemeIconType;
  content: string;
  onClick: import('react').MouseEventHandler<HTMLElement>;
  badge?: number;
  badgeAlert?: boolean;
  badgeClassName?: string;
  iconSpin?: boolean;
  showAlert?: boolean;
  disabled?: boolean;
  commingSoonBadge?: boolean;
  disableReason?: string;
  eventKey: string;
  iconClassName?: string;
  subContent?: React.ReactNode;
  isFullscreen?: boolean;
  onOpenInDesktop?: () => void;
};

const SortablePanelItem: React.FC<{
  panelKey: string;
  item: IPanelItem;
  index: number;
  onItemClick?: () => void;
}> = ({ panelKey, item, index, onItemClick }) => {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: panelKey,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: isDragging ? 'grabbing' : 'pointer',
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {item.disabled ? (
        <Tooltip
          {...(item.commingSoonBadge && { visible: false })}
          title={item.disableReason || t('page.dashboard.home.comingSoon')}
          overlayClassName="rectangle direction-tooltip"
          autoAdjustOverflow={false}
        >
          <div key={index} className="panel-item opacity-40 cursor-not-allowed">
            <PanelItemBody item={item} />
          </div>
        </Tooltip>
      ) : (
        <div
          key={index}
          onClick={(evt) => {
            matomoRequestEvent({
              category: 'Dashboard',
              action: 'clickEntry',
              label: item.eventKey,
            });

            ga4.fireEvent(`Entry_${item.eventKey}`, {
              event_category: 'Dashboard',
            });

            onItemClick?.();
            item?.onClick(evt);
          }}
          className="panel-item group"
        >
          {item.onOpenInDesktop && (
            <button
              type="button"
              className="panel-item-jump-button"
              aria-label={t('page.dashboard.assets.openInTabV2')}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                item.onOpenInDesktop?.();
              }}
            >
              <RcIconJumpCC width={12} height={12} />
            </button>
          )}
          {item.showAlert && (
            <ThemeIcon src={IconAlertRed} className="icon icon-alert" />
          )}
          <PanelItemBody item={item} />
        </div>
      )}
    </div>
  );
};

const PanelItemIcon: React.FC<{ item: IPanelItem }> = ({ item }) => {
  const Icon = item.icon as React.ComponentType<{
    className?: string;
    strokeWidth?: number;
  }>;
  return (
    <Icon
      strokeWidth={2}
      className={clsx(
        'panel-item-icon',
        item.iconSpin && 'icon-spin',
        item.iconClassName
      )}
    />
  );
};

const PanelItemBody: React.FC<{ item: IPanelItem }> = ({ item }) => {
  const { t } = useTranslation();
  const wrap = (
    <div className="panel-item-icon-wrap">
      <PanelItemIcon item={item} />
    </div>
  );
  return (
    <>
      {item.badge ? (
        <Badge
          count={item.badge}
          size="small"
          offset={[-2, 2]}
          className={clsx(
            {
              alert: item.badgeAlert && !item.badgeClassName,
            },
            item.badgeClassName
          )}
        >
          {wrap}
        </Badge>
      ) : (
        wrap
      )}
      <div className="panel-item-label">{item.content}</div>
      {item.subContent}
      {item.commingSoonBadge && (
        <div className="coming-soon-badge">{t('page.dashboard.home.soon')}</div>
      )}
    </>
  );
};

export const DashboardPanel: React.FC<{ onSettingClick?(): void }> = ({
  onSettingClick,
}) => {
  const { t } = useTranslation();
  const history = useHistory();
  usePerpsDefaultAccount({
    isPro: false,
  });

  const wallet = useWallet();

  const openPanelInDesktop = useMemoizedFn((path: string) => {
    wallet.openInDesktop(path);
    window.close();
  });

  const [badgeModalVisible, setBadgeModalVisible] = useState(false);

  const [isShowEcology, setIsShowEcologyModal] = useState(false);

  const [isShowRabbyPoints, setIsShowRabbyPoints] = useState(false);

  const [isShowDappsPopup, setIsShowDappsPopup] = useState(false);

  const account = useRabbySelector((state) => state.account.currentAccount);
  const dashboardPanelOrder = useRabbySelector(
    (state) => state.preference.dashboardPanelOrder
  );

  const dispatch = useRabbyDispatch();

  const [approvalRiskAlert, setApprovalRiskAlert] = useState(0);

  const { value: approvalState } = useAsync(async () => {
    if (
      account?.address &&
      (account.type !== KEYRING_TYPE.WatchAddressKeyring || appIsDev)
    ) {
      const data = await wallet.openapi.approvalStatus(account.address);
      return data;
    }
    return;
  }, [account?.address]);

  // const isGnosis = useMemo(() => {
  //   return account?.type === KEYRING_TYPE.GnosisKeyring;
  // }, [account]);

  useEffect(() => {
    if (approvalState) {
      setApprovalRiskAlert(
        approvalState.reduce(
          (pre, now) =>
            pre + now.nft_approval_danger_cnt + now.token_approval_danger_cnt,
          0
        )
      );
    } else {
      setApprovalRiskAlert(0);
    }
  }, [approvalState]);

  type IPanelItem = {
    icon: ThemeIconType;
    content: string;
    onClick: import('react').MouseEventHandler<HTMLElement>;
    badge?: number;
    badgeAlert?: boolean;
    badgeClassName?: string;
    iconSpin?: boolean;
    hideForGnosis?: boolean;
    showAlert?: boolean;
    disabled?: boolean;
    commingSoonBadge?: boolean;
    disableReason?: string;
    eventKey: string;
    iconClassName?: string;
    subContent?: React.ReactNode;
    isFullscreen?: boolean;
    onOpenInDesktop?: () => void;
  };

  const hiddenBalance = useRabbySelector((s) => s.preference.hiddenBalance);

  const {
    availableBalance,
    perpsPositionInfo,
    isFetching: perpsFetching,
    positionPnl,
  } = usePerpsHomePnl();

  const perpsSubContentNode = useMemo<React.ReactNode>(() => {
    if (hiddenBalance) {
      return (
        <div
          className={clsx(
            'absolute bottom-[6px] text-[11px] leading-[13px] font-medium text-r-neutral-foot'
          )}
        >
          *****
        </div>
      );
    }
    if (perpsFetching) {
      return (
        <div className="absolute bottom-[6px] text-[11px] font-medium">
          <Skeleton.Button
            active={true}
            className="h-[10px] block rounded-[2px]"
            style={{ width: 42 }}
          />
        </div>
      );
    }
    if (perpsPositionInfo?.assetPositions?.length) {
      return (
        <div
          className={clsx(
            'absolute bottom-[6px] text-[11px] leading-[13px] font-medium',
            positionPnl && positionPnl > 0
              ? 'text-r-green-default'
              : 'text-r-red-default'
          )}
        >
          {positionPnl && positionPnl >= 0 ? '+' : '-'}$
          {splitNumberByStep(Math.abs(positionPnl || 0).toFixed(2))}
        </div>
      );
    }
    return (
      <div
        className={clsx(
          'absolute bottom-[6px] text-[11px] leading-[13px] font-medium text-r-neutral-foot'
        )}
      >
        {formatUsdValue(availableBalance || 0, BigNumber.ROUND_DOWN)}
      </div>
    );
  }, [
    hiddenBalance,
    perpsFetching,
    availableBalance,
    perpsPositionInfo,
    positionPnl,
  ]);

  const panelItems = {
    swap: {
      icon: ArrowLeftRight as ThemeIconType,
      eventKey: 'Swap',
      content: t('page.dashboard.home.panel.swap'),
      onClick: () => {
        history.push('/dex-swap?rbisource=dashboard');
      },
      onOpenInDesktop: () => {
        openPanelInDesktop('/desktop/profile?action=swap&rbisource=dashboard');
      },
    } as IPanelItem,
    send: {
      icon: ArrowUpRight as ThemeIconType,
      eventKey: 'Send',
      content: t('page.dashboard.home.panel.send'),
      onClick: () => {
        history.push('/send-token?rbisource=dashboard');
      },
      onOpenInDesktop: () => {
        openPanelInDesktop('/desktop/profile?action=send&rbisource=dashboard');
      },
    } as IPanelItem,
    bridge: {
      icon: Bridge as ThemeIconType,
      eventKey: 'Bridge',
      content: t('page.dashboard.home.panel.bridge'),
      onClick: () => {
        history.push('/bridge');
      },
      onOpenInDesktop: () => {
        openPanelInDesktop(
          '/desktop/profile?action=bridge&rbisource=dashboard'
        );
      },
    } as IPanelItem,
    receive: {
      icon: ArrowDownLeft as ThemeIconType,
      eventKey: 'Receive',
      content: t('page.dashboard.home.panel.receive'),
      onClick: () => {
        history.push('/receive?rbisource=dashboard');
      },
    } as IPanelItem,
    // queue: {
    //   icon: History as ThemeIconType,
    //   eventKey: 'Queue',
    //   content: t('page.dashboard.home.panel.queue'),
    //   badge: gnosisPendingCount,
    //   onClick: () => {
    //     history.push('/gnosis-queue');
    //   },
    // } as IPanelItem,
    transactions: {
      icon: History as ThemeIconType,
      eventKey: 'Transactions',
      content: t('page.dashboard.home.panel.transactions'),
      onClick: () => {
        history.push('/history');
      },
      onOpenInDesktop: () => {
        openPanelInDesktop('/desktop/profile/transactions');
      },
    } as IPanelItem,
    security: {
      icon: ShieldCheck as ThemeIconType,
      eventKey: 'Approvals',
      content: t('page.dashboard.home.panel.approvals'),
      onClick: async (evt) => {
        history.push('/revoke-approvals');
        // openInternalPageInTab('approval-manage');
        // await wallet.openInDesktop('/desktop/profile/approvals');
        // window.close();
      },
      badge: approvalRiskAlert,
      badgeAlert: approvalRiskAlert > 0,
      isFullscreen: true,
      onOpenInDesktop: () => {
        openPanelInDesktop('/desktop/manage-approvals');
      },
    } as IPanelItem,
    more: {
      icon: Settings as ThemeIconType,
      eventKey: 'More',
      content: t('page.dashboard.home.panel.settings'),
      onClick: onSettingClick,
    } as IPanelItem,
    ecology: {
      icon: Globe as ThemeIconType,
      eventKey: 'Ecology',
      content: t('page.dashboard.home.panel.ecology'),
      onClick: () => {
        setIsShowEcologyModal(true);
      },
    } as IPanelItem,

    points: {
      icon: Star as ThemeIconType,
      eventKey: 'Rabby Points',
      content: t('page.dashboard.home.panel.rabbyPoints'),
      onClick: () => {
        setIsShowRabbyPoints(true);
      },
    } as IPanelItem,
    mobile: {
      icon: Smartphone as ThemeIconType,
      eventKey: 'Rabby Mobile',
      content: t('page.dashboard.home.panel.mobile'),
      onClick: () => {
        openInternalPageInTab('sync');
      },
      isFullscreen: true,
    } as IPanelItem,
    perps: {
      icon: ChartCandlestick as ThemeIconType,
      eventKey: 'Perps',
      iconClassName: 'icon-perps',
      subContent: perpsSubContentNode,
      content: t('page.dashboard.home.panel.perps'),
      onClick: async () => {
        // await wallet.openInDesktop('/desktop/perps');
        history.push('/perps');
        // window.close();
      },
      onOpenInDesktop: () => {
        openPanelInDesktop('/desktop/perps');
      },
      // isFullscreen: true,
    } as IPanelItem,
    searchDapp: {
      icon: Search as ThemeIconType,
      eventKey: 'Search Dapp',
      content: t('page.dashboard.home.panel.searchDapp'),
      onClick: () => {
        openInternalPageInTab('dapp-search');
      },
      isFullscreen: true,
    } as IPanelItem,
    dapps: {
      icon: Blocks as ThemeIconType,
      eventKey: 'Dapps ',
      content: t('page.dashboard.home.panel.dapps'),
      onClick: () => {
        setIsShowDappsPopup(true);
      },
    } as IPanelItem,
    manageAddress: {
      icon: Users as ThemeIconType,
      eventKey: 'Manage Address',
      content: t('page.dashboard.home.panel.manageAddress'),
      onClick: () => {
        history.push('/settings/address');
      },
    } as IPanelItem,
    convertDust: {
      icon: Sparkles as ThemeIconType,
      eventKey: 'Convert Dust',
      content: t('page.dashboard.home.panel.convertDust'),
      onClick: async () => {
        openInTab('desktop.html#/desktop/small-swap', true);
        // await wallet.openInDesktop('/desktop/small-swap');
        // window.close();
      },
      isFullscreen: true,
    } as IPanelItem,
    staking: {
      icon: Sprout as ThemeIconType,
      eventKey: 'Staking',
      content: t('page.dashboard.home.panel.staking'),
      onClick: () => {
        history.push('/staking');
      },
    } as IPanelItem,
  };

  const defaultPanelKeys = useMemo<(keyof typeof panelItems)[]>(() => {
    return [
      'swap',
      'send',
      'bridge',
      'receive',
      'transactions',
      'security',
      'perps',
      'staking',
      'mobile',
      'dapps',
      'convertDust',
      'points',
    ];
  }, []);

  const getPanelKeys = useMemoizedFn(() => {
    const orders = dashboardPanelOrder as (keyof typeof panelItems)[];
    const validKeys = orders.filter(
      (key) => panelItems[key] && defaultPanelKeys.includes(key)
    );
    defaultPanelKeys.forEach((key, index) => {
      if (!validKeys.includes(key)) {
        validKeys.splice(index, 0, key);
      }
    });
    return validKeys;
  });

  const pickedPanelKeys = useMemo(() => {
    return getPanelKeys();
  }, [dashboardPanelOrder]);

  const setPickedPanelKeys = useMemoizedFn(
    (keys: (keyof typeof panelItems)[]) => {
      dispatch.preference.setField({
        dashboardPanelOrder: keys,
      });
      wallet.updateDashboardPanelOrder(keys);
    }
  );

  useMount(() => {
    const panelKeys = getPanelKeys();
    if (!isEqual(dashboardPanelOrder, panelKeys)) {
      setPickedPanelKeys(panelKeys);
    }
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const oldIndex = pickedPanelKeys.findIndex((key) => key === active.id);
    const newIndex = pickedPanelKeys.findIndex((key) => key === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newKeys = [...pickedPanelKeys];
      const [removed] = newKeys.splice(oldIndex, 1);
      newKeys.splice(newIndex, 0, removed);
      setPickedPanelKeys(newKeys);
    }
    setActiveId(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = useMemoizedFn((event: DragStartEvent) => {
    setActiveId(event.active.id);
  });

  const handleDragCancel = useMemoizedFn(() => {
    setActiveId(null);
  });

  const activeItem = useMemo(() => {
    if (!activeId) return null;
    return panelItems[activeId as keyof typeof panelItems] as
      | IPanelItem
      | undefined;
  }, [activeId, panelItems]);

  const [moreOpen, setMoreOpen] = useState(false);

  const sheetPanelKeys = useMemo(() => {
    return pickedPanelKeys.filter(
      (key) => !(PRIMARY_PANEL_KEYS as readonly string[]).includes(key)
    );
  }, [pickedPanelKeys]);

  const sheetHasAlert = useMemo(() => {
    return sheetPanelKeys.some((key) => {
      const item = panelItems[key] as IPanelItem | undefined;
      return !!item?.badgeAlert && !!item.badge;
    });
  }, [sheetPanelKeys, panelItems]);

  const runPanelItem = useMemoizedFn(
    (item: IPanelItem, evt: React.MouseEvent<HTMLElement>) => {
      matomoRequestEvent({
        category: 'Dashboard',
        action: 'clickEntry',
        label: item.eventKey,
      });

      ga4.fireEvent(`Entry_${item.eventKey}`, {
        event_category: 'Dashboard',
      });

      item.onClick(evt);
    }
  );

  return (
    <div
      className={clsx(
        'relative px-[12px] pt-[10px] pb-[6px]',
        'rabby-dashboard-panel-container'
      )}
    >
      <GlobalStyle />
      <div className="crb-quick-actions">
        {PRIMARY_PANEL_KEYS.map((key) => {
          const item = panelItems[key] as IPanelItem;
          const Icon = item.icon as React.ComponentType<{
            strokeWidth?: number;
          }>;
          return (
            <button
              key={key}
              type="button"
              className="crb-quick-action"
              onClick={(evt) => runPanelItem(item, evt)}
            >
              <span className="crb-quick-action-icon">
                <Icon strokeWidth={2.1} />
              </span>
              <span className="crb-quick-action-label">{item.content}</span>
            </button>
          );
        })}
        <button
          type="button"
          className="crb-quick-action"
          onClick={() => setMoreOpen(true)}
        >
          <span className="crb-quick-action-icon">
            <LayoutGrid strokeWidth={2.1} />
            {sheetHasAlert && <span className="crb-quick-action-dot" />}
          </span>
          <span className="crb-quick-action-label">
            {t('page.dashboard.home.panel.more')}
          </span>
        </button>
      </div>

      <Popup
        visible={moreOpen}
        onClose={() => setMoreOpen(false)}
        height="auto"
        isNew
        isSupportDarkMode
        destroyOnClose={false}
        className="crb-panel-sheet"
        bodyStyle={{ padding: '28px 12px 16px' }}
      >
        <DndContext
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
          measuring={{
            droppable: { strategy: MeasuringStrategy.Always },
          }}
          sensors={sensors}
          collisionDetection={closestCenter}
        >
          <SortableContext items={sheetPanelKeys}>
            <div className="dashboard-panel-grid">
              {sheetPanelKeys.map((panelKey, index) => {
                const item = panelItems[panelKey] as IPanelItem;
                if (!item) {
                  return null;
                }
                return (
                  <SortablePanelItem
                    key={panelKey}
                    panelKey={panelKey}
                    item={item}
                    index={index}
                    onItemClick={() => setMoreOpen(false)}
                  />
                );
              })}
            </div>
          </SortableContext>
          <DragOverlay
            dropAnimation={{
              duration: 200,
              easing: 'ease',
            }}
            style={{
              cursor: 'grabbing',
            }}
          >
            <>
              {activeId && activeItem ? (
                <div className="crb-panel-sheet">
                  <div className="panel-item is-dragging-overlay">
                    <DragOverlayContext.Provider value={true}>
                      <PanelItemBody item={activeItem} />
                    </DragOverlayContext.Provider>
                  </div>
                </div>
              ) : null}
            </>
          </DragOverlay>
        </DndContext>
        <div className="mt-[10px] text-center text-[12px] leading-[16px] text-r-neutral-foot">
          {t('page.dashboard.home.panel.dragTip')}
        </div>
      </Popup>

      <ClaimRabbyFreeGasBadgeModal
        visible={badgeModalVisible}
        onCancel={() => {
          setBadgeModalVisible(false);
        }}
      />
      <EcologyPopup
        visible={isShowEcology}
        onClose={() => setIsShowEcologyModal(false)}
      />
      <RabbyPointsPopup
        visible={isShowRabbyPoints}
        onClose={() => setIsShowRabbyPoints(false)}
      />
      <RateModal />

      <RecentConnectionsPopup
        visible={isShowDappsPopup}
        onClose={() => {
          setIsShowDappsPopup(false);
        }}
      />
    </div>
  );
};
