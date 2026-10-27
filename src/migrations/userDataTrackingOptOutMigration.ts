import { PreferenceStore } from '@/background/service/preference';

// Upstream used this version to opt existing users into analytics. Crabble
// has no analytics, so it only drops the leftover preference key.
export default {
  version: 11,
  async migrator(data: { preference: PreferenceStore | undefined }) {
    try {
      if (data.preference === undefined) return undefined;

      const {
        userDataTrackingOptOut: _removed,
        ...preference
      } = data.preference as PreferenceStore & {
        userDataTrackingOptOut?: boolean;
      };
      return { preference };
    } catch (e) {
      return data;
    }
  },
};
