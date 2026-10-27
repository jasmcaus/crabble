const mockGetAll = jest.fn().mockResolvedValue([]);
const mockOpenNotification = jest.fn();

jest.mock('webextension-polyfill', () => ({
  __esModule: true,
  default: {
    windows: { getAll: mockGetAll, update: jest.fn() },
    action: { setBadgeText: jest.fn(), setBadgeBackgroundColor: jest.fn() },
    browserAction: {
      setBadgeText: jest.fn(),
      setBadgeBackgroundColor: jest.fn(),
    },
  },
}));

jest.mock('consts', () => ({
  KEYRING_CATEGORY_MAP: {},
  IS_LINUX: false,
  IS_VIVALDI: false,
  IS_CHROME: false,
  KEYRING_CATEGORY: {},
  IS_WINDOWS: false,
}));

jest.mock('background/webapi', () => ({
  winMgr: {
    event: { on: jest.fn() },
    openNotification: mockOpenNotification,
    remove: jest.fn(),
  },
}));

jest.mock('@/background/service/transactionHistory', () => ({
  __esModule: true,
  default: { getSigningTx: jest.fn() },
}));
jest.mock('@/background/service/preference', () => ({
  __esModule: true,
  default: { getCurrentAccount: jest.fn() },
}));
jest.mock('@/utils/chain', () => ({ findChain: jest.fn() }));
jest.mock('@/utils/env', () => ({ isManifestV3: false }));

import notificationService from '@/background/service/notification';

describe('notificationService.activeFirstApproval', () => {
  beforeEach(() => {
    notificationService.approvals = [];
    notificationService.currentApproval = null;
    notificationService.notifiWindowId = null;
    mockGetAll.mockReset();
    mockOpenNotification.mockReset();
  });

  test('ignores a queue cleared while checking browser windows', async () => {
    let resolveWindows!: (windows: unknown[]) => void;
    mockGetAll.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveWindows = resolve;
      })
    );
    notificationService.approvals = [
      {
        id: 'approval-id',
        taskId: null,
        data: {
          approvalComponent: 'SignTx',
          account: {
            type: 'PrivateKey',
            address: '0xaccount',
            brandName: '私钥',
          },
        },
        winProps: {},
      },
    ];

    const activation = notificationService.activeFirstApproval();
    notificationService.approvals = [];
    resolveWindows([]);
    await activation;

    expect(mockOpenNotification).not.toHaveBeenCalled();
  });

  test('clears the queue when the windows lookup fails', async () => {
    notificationService.approvals = [{ id: 'approval-1' } as any];
    mockGetAll.mockRejectedValueOnce(new Error('windows lookup failed'));

    await notificationService.activeFirstApproval();

    expect(notificationService.approvals).toEqual([]);
  });
});
