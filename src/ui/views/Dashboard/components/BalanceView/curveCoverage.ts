/**
 * The net-worth curve (`total_net_curve`) only covers EVM chains, while the
 * headline balance also counts app chains such as Hyperliquid. When those
 * hold a real share of the balance the chart can't stand in for net worth:
 * hovering it must not replace the headline, and the chart says what it
 * leaves out.
 */
export const getCurveCoverage = (
  balance?: number | null,
  evmBalance?: number | null,
  appChainIds?: string[]
) => {
  const total = balance || 0;
  const excludedValue = Math.max(total - (evmBalance || 0), 0);
  const isPartial =
    !!appChainIds?.length &&
    excludedValue >= 0.01 &&
    excludedValue / Math.max(total, 1e-9) >= 0.005;
  return { isPartial, excludedValue };
};
