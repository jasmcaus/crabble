/**
 * @jest-environment jsdom
 */
import userDataTrackingOptOutMigration from '../../src/migrations/userDataTrackingOptOutMigration';

test('drops the leftover analytics opt-out key', async () => {
  const result = await userDataTrackingOptOutMigration.migrator({
    preference: {
      currentVersion: '0.93.92',
      firstOpen: false,
      userDataTrackingOptOut: false,
    } as any,
  });

  expect(result?.preference).not.toHaveProperty('userDataTrackingOptOut');
  expect(result?.preference?.currentVersion).toBe('0.93.92');
});

test('does not create preference for new installs', async () => {
  const result = await userDataTrackingOptOutMigration.migrator({
    preference: undefined,
  });

  expect(result).toBeUndefined();
});
