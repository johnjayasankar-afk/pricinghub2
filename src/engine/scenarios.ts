import { solveListFloor } from "./solve";
import { quoteProfit } from "./fees";
import type { Charm, CostInput, FloorResult, ProfitResult, SaleInput } from "./types";

export type ScenarioId = "organic" | "ads15" | "ads12" | "freeShip" | "freeAds";

export type Scenario = {
  id: ScenarioId;
  label: string;
  atPrice: ProfitResult;
  floor: FloorResult;
};

export function runScenarios(
  base: Omit<SaleInput, "itemPriceCents" | "offsiteRate" | "shippingChargedCents"> & {
    itemPriceCents: number;
    shippingChargedCents: number;
  },
  costs: CostInput,
  targetCents: number,
  salePercent: number,
  charm: Charm,
): Scenario[] {
  const { itemPriceCents, shippingChargedCents, ...rest } = base;
  const specs: { id: ScenarioId; label: string; offsiteRate: number; ship: number }[] = [
    { id: "organic", label: "Organic", offsiteRate: 0, ship: shippingChargedCents },
    { id: "ads15", label: "Offsite 15%", offsiteRate: 0.15, ship: shippingChargedCents },
    { id: "ads12", label: "Offsite 12%", offsiteRate: 0.12, ship: shippingChargedCents },
    { id: "freeShip", label: "Free shipping", offsiteRate: 0, ship: 0 },
    { id: "freeAds", label: "Free + 15% ads", offsiteRate: 0.15, ship: 0 },
  ];
  return specs.map((spec) => {
    const shared = { ...rest, shippingChargedCents: spec.ship, offsiteRate: spec.offsiteRate };
    return {
      id: spec.id,
      label: spec.label,
      atPrice: quoteProfit({ ...shared, itemPriceCents }, costs),
      floor: solveListFloor(shared, costs, targetCents, salePercent, charm),
    };
  });
}

export function sensitivity(
  sale: SaleInput,
  costs: CostInput,
  listCents: number,
  chargedAt: (list: number) => number,
): { id: string; label: string; profitCents: number }[] {
  const q = (item: number, cogsAdj: number) =>
    quoteProfit(
      { ...sale, itemPriceCents: item },
      { ...costs, cogsCents: Math.max(0, costs.cogsCents + cogsAdj) },
    ).profitCents;
  return [
    { id: "now", label: "This price", profitCents: q(chargedAt(listCents), 0) },
    { id: "up", label: "List +$1", profitCents: q(chargedAt(listCents + 100), 0) },
    { id: "down", label: "List −$1", profitCents: q(chargedAt(Math.max(0, listCents - 100)), 0) },
    { id: "cogs", label: "COGS +$1", profitCents: q(chargedAt(listCents), 100) },
    { id: "cogs5", label: "COGS +5%", profitCents: q(chargedAt(listCents), Math.round(costs.cogsCents * 0.05)) },
    { id: "cogs10", label: "COGS +10%", profitCents: q(chargedAt(listCents), Math.round(costs.cogsCents * 0.1)) },
  ];
}
