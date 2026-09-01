/**
 * Total Cost Calculator
 * ------------------------------------------------------------
 * 任何"票价"都不是最终成本。这里把接驳、服务费都算进去。
 */

export interface CostBreakdown {
  label: string;
  basePrice: number;
  connectionCost: number;
  serviceFee: number;
  extraCosts: { label: string; amount: number }[];
  totalPerPerson: number;
  partySize: number;
  totalForParty: number;
}

export function calculateTotalCost(input: {
  label: string;
  basePrice: number;
  connectionCost?: number;
  serviceFee?: number;
  extraCosts?: { label: string; amount: number }[];
  partySize: number;
  isPerPersonPrice?: boolean;
}): CostBreakdown {
  const {
    label,
    basePrice,
    connectionCost = 0,
    serviceFee = 0,
    extraCosts = [],
    partySize,
    isPerPersonPrice = true,
  } = input;

  const extrasTotal = extraCosts.reduce((sum, e) => sum + e.amount, 0);

  const totalPerPerson = isPerPersonPrice
    ? basePrice + connectionCost + serviceFee + extrasTotal
    : (basePrice + connectionCost + serviceFee + extrasTotal) / partySize;

  return {
    label,
    basePrice,
    connectionCost,
    serviceFee,
    extraCosts,
    totalPerPerson: round2(totalPerPerson),
    partySize,
    totalForParty: round2(totalPerPerson * partySize),
  };
}

export function compareCostOptions(options: CostBreakdown[]) {
  const sorted = [...options].sort((a, b) => a.totalPerPerson - b.totalPerPerson);
  const cheapest = sorted[0];
  const diffFromCheapest = sorted.map((o) => ({
    ...o,
    diffFromCheapest: round2(o.totalPerPerson - cheapest.totalPerPerson),
  }));
  return { cheapest, ranked: diffFromCheapest };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
