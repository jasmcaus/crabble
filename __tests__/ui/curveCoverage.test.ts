import { getCurveCoverage } from '@/ui/views/Dashboard/components/BalanceView/curveCoverage';

describe('getCurveCoverage', () => {
  it('is complete when everything is on EVM chains', () => {
    expect(getCurveCoverage(1000, 1000, [])).toEqual({
      isPartial: false,
      excludedValue: 0,
    });
  });

  it('is partial when an app chain holds most of the balance', () => {
    // a Hyperliquid-heavy account: $360k net worth, ~$1.1k on EVM chains
    const { isPartial, excludedValue } = getCurveCoverage(
      360042.09,
      1095.74,
      ['hyperliquid']
    );
    expect(isPartial).toBe(true);
    expect(excludedValue).toBeCloseTo(358946.35, 2);
  });

  it('ignores rounding-level differences', () => {
    expect(getCurveCoverage(1000, 999.999, ['hyperliquid']).isPartial).toBe(
      false
    );
    expect(getCurveCoverage(100000, 99800, ['hyperliquid']).isPartial).toBe(
      false
    );
  });

  it('needs an app chain to call the curve partial', () => {
    expect(getCurveCoverage(5000, 1000, []).isPartial).toBe(false);
    expect(getCurveCoverage(5000, 1000, undefined).isPartial).toBe(false);
  });

  it('handles missing balances', () => {
    expect(getCurveCoverage(null, null, ['hyperliquid'])).toEqual({
      isPartial: false,
      excludedValue: 0,
    });
  });
});
