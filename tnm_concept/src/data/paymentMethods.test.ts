import { describe, expect, it } from "vitest";

import { filterMethods } from "./paymentMethods";
import type { PaymentMethodFilters } from "./paymentMethods";
import type { PaymentMethod } from "@/components/payments/PaymentMethodCard";

const baseMethod = ({ id, fee, directions, regions, currencies }: {
  id: string;
  fee: string;
  directions?: PaymentMethod["directions"];
  regions?: PaymentMethod["regions"];
  currencies?: PaymentMethod["currencies"];
}): PaymentMethod => ({
  id,
  name: id,
  type: "local",
  directions: directions ?? ["deposit", "withdrawal"],
  regions: regions ?? ["lebanon"],
  currencies: currencies ?? ["USD"],
  processingTime: "Instant",
  fee,
  minAmount: "$0",
  maxAmount: "$1000",
  kyc: "basic"
});

const baseFilters: PaymentMethodFilters = {
  direction: "all",
  region: "all",
  currency: "all",
  speed: "all",
  maxFee: 100
};

describe("filterMethods - fee filtering", () => {
  const methods: PaymentMethod[] = [
    baseMethod({ id: "low", fee: "0%" }),
    baseMethod({ id: "mid", fee: "1.5%" }),
    baseMethod({ id: "high", fee: "2.5%" })
  ];

  it("keeps methods whose numeric fee is at or below the max", () => {
    const result = filterMethods(methods, { ...baseFilters, maxFee: 2 });
    expect(result.map(method => method.id)).toStrictEqual(["low", "mid"]);
  });

  it("filters out methods whose numeric fee exceeds the max", () => {
    const result = filterMethods(methods, { ...baseFilters, maxFee: 1 });
    expect(result.map(method => method.id)).toStrictEqual(["low"]);
  });
});

describe("filterMethods - special fee values", () => {
  it("treats 'Depends on bank' as zero so it passes tight max fees", () => {
    const depends = baseMethod({ id: "depends", fee: "Depends on bank" });
    const result = filterMethods([depends], { ...baseFilters, maxFee: 0 });
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("depends");
  });
});

describe("filterMethods - direction, region and currency interactions", () => {
  const methods: PaymentMethod[] = [
    baseMethod({ id: "depositOnly", fee: "0%", directions: ["deposit"], regions: ["lebanon"], currencies: ["USD"] }),
    baseMethod({ id: "withdrawalOnly", fee: "0%", directions: ["withdrawal"], regions: ["middle-east"], currencies: ["EUR"] }),
    baseMethod({ id: "global", fee: "0%", directions: ["deposit", "withdrawal"], regions: ["global"], currencies: ["USDT"] })
  ];

  it("defaults to including any direction when the filter is 'all'", () => {
    const result = filterMethods(methods, { ...baseFilters });
    expect(result.map(method => method.id)).toContain("depositOnly");
    expect(result.map(method => method.id)).toContain("withdrawalOnly");
    expect(result.map(method => method.id)).toContain("global");
  });

  it("filters by a specific direction when requested", () => {
    const result = filterMethods(methods, { ...baseFilters, direction: "deposit" });
    expect(result.map(method => method.id)).toStrictEqual(["depositOnly", "global"]);
  });

  it("allows global methods to satisfy specific region filters", () => {
    const result = filterMethods(methods, { ...baseFilters, region: "middle-east" });
    expect(result.map(method => method.id)).toStrictEqual(["withdrawalOnly", "global"]);
  });

  it("requires currencies to match when a specific currency is requested", () => {
    const result = filterMethods(methods, { ...baseFilters, currency: "USD" });
    expect(result.map(method => method.id)).toStrictEqual(["depositOnly"]);
  });
});
