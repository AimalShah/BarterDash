export interface BidIncrementTier {
  minPrice: number;
  maxPrice: number | null;
  increment: number;
}

export const BID_INCREMENT_TIERS: BidIncrementTier[] = [
  { minPrice: 0, maxPrice: 19.99, increment: 1 },
  { minPrice: 20, maxPrice: 49.99, increment: 2 },
  { minPrice: 50, maxPrice: 99.99, increment: 3 },
  { minPrice: 100, maxPrice: 499.99, increment: 5 },
  { minPrice: 500, maxPrice: 999.99, increment: 10 },
  { minPrice: 1000, maxPrice: 1999.99, increment: 25 },
  { minPrice: 2000, maxPrice: null, increment: 50 },
];

export function getMinimumBidIncrement(currentPrice: number): number {
  const tier = BID_INCREMENT_TIERS.find(
    (t) =>
      currentPrice >= t.minPrice &&
      (t.maxPrice === null || currentPrice <= t.maxPrice),
  );
  return tier?.increment ?? 1;
}

export function getNextMinimumBid(currentPrice: number): number {
  const increment = getMinimumBidIncrement(currentPrice);
  return currentPrice + increment;
}

export function getQuickBidOptions(
  currentPrice?: number,
  baseIncrementOverride?: number,
): number[] {
  const price = Number(currentPrice ?? 0);
  const baseIncrement =
    baseIncrementOverride && baseIncrementOverride > 0
      ? baseIncrementOverride
      : getMinimumBidIncrement(price);

  const multipliers =
    price < 100 ? [1, 2, 5] : price < 500 ? [1, 2, 5] : [1, 2, 4];

  return multipliers.map((multiplier) => baseIncrement * multiplier);
}

export function formatBidAmount(amount: number): string {
  const safeAmount = Number(amount ?? 0);
  return `$${safeAmount.toLocaleString()}`;
}

export function validateBidAmount(
  amount: number,
  currentPrice: number,
): { valid: boolean; error?: string; minimumBid?: number } {
  const minimumBid = getNextMinimumBid(currentPrice);

  if (amount <= 0) {
    return {
      valid: false,
      error: "Bid must be greater than $0",
    };
  }

  if (amount < minimumBid) {
    return {
      valid: false,
      error: `Bid must be at least ${formatBidAmount(minimumBid)}`,
      minimumBid,
    };
  }

  return { valid: true, minimumBid };
}

export function isBidReasonable(amount: number, currentPrice: number): boolean {
  const maxReasonableBid = Math.max(currentPrice * 10, currentPrice + 10000);
  return amount <= maxReasonableBid;
}

export function calculateBidFromSwipe(
  startAmount: number,
  swipeDistance: number,
  increment: number,
): number {
  const increments = Math.floor(swipeDistance / 40);
  return startAmount + increments * increment;
}
