/**
 * Mock analytics shaped like aggregates derived from Shopify Admin GraphQL:
 * you'd typically query `orders` with `createdAt`, sum `MoneyV2` into daily buckets.
 * Conversion rates are illustrative only — not FX-accurate.
 */

export type MockCurrencyCode = "INR" | "USD";

/** Same shape as Admin API MoneyV2 (amount is a decimal string). */
interface MockMoneyV2 {
  readonly amount: string;
  readonly currencyCode: MockCurrencyCode;
}

/**
 * Daily row analogous to aggregated `Order` data grouped by UTC date
 * (`occurredOn` like a reporting bucket date).
 */
interface SalesByDayBucket {
  readonly __typename: "SalesByDayBucket";
  readonly occurredOn: string;
  readonly grossSales: MockMoneyV2;
  readonly orderCount: number;
  /** Mock net-style profit (INR `MoneyV2`). */
  readonly profit: MockMoneyV2;
  /** Mock return/refund value for the day (INR, positive for display). */
  readonly returns: MockMoneyV2;
  /** Mock fulfilled units or orders for the day. */
  readonly fulfilledCount: number;
}

/** Mock rate: INR per 1 USD (multiply USD → INR). INR is store native currency. */
const MOCK_INR_PER_USD = 83;

/** Reference “today” for deterministic demo ranges (UTC calendar date). */
export const MOCK_ANALYTICS_TODAY = new Date(Date.UTC(2026, 4, 3));

export function dateToUtcISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export const MOCK_ANALYTICS_TODAY_ISO = dateToUtcISODate(MOCK_ANALYTICS_TODAY);

export function utcISODateToDate(iso: string): Date {
  const [y, m, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

export function parseMoneyAmount(money: MockMoneyV2): number {
  const n = Number.parseFloat(money.amount);
  return Number.isFinite(n) ? n : 0;
}

/** Convert INR (store native mock) numeric amount to selected display currency amount. */
export function convertAmountFromInr(
  amountInInr: number,
  currencyCode: MockCurrencyCode,
): number {
  if (currencyCode === "INR") return amountInInr;
  return amountInInr / MOCK_INR_PER_USD;
}

export function currencyDisplayPrefix(code: MockCurrencyCode): string {
  return code === "INR" ? "₹" : "$";
}

/** Inclusive on both ends; compares `occurredOn` ISO calendar strings only. */
export function filterBucketsByIsoRange(
  buckets: readonly SalesByDayBucket[],
  startIso: string,
  endIso: string,
): SalesByDayBucket[] {
  return buckets.filter((b) => b.occurredOn >= startIso && b.occurredOn <= endIso);
}

function addDaysToIsoUtc(iso: string, deltaDays: number): string {
  const d = utcISODateToDate(iso);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return dateToUtcISODate(d);
}

/** Inclusive span of exact `n` days ending `endIso` (e.g. n=7 → 7 buckets max). */
export function isoRangeEndingOn(endIso: string, dayCount: number): {
  startIso: string;
  endIso: string;
} {
  if (dayCount < 1)
    throw new Error("isoRangeEndingOn: dayCount must be at least 1");
  const startIso = addDaysToIsoUtc(endIso, -(dayCount - 1));
  return { startIso, endIso };
}

export function sumBucketGrossInInr(buckets: readonly SalesByDayBucket[]): number {
  return buckets.reduce((acc, row) => acc + parseMoneyAmount(row.grossSales), 0);
}

export function sumBucketProfitInInr(buckets: readonly SalesByDayBucket[]): number {
  return buckets.reduce((acc, row) => acc + parseMoneyAmount(row.profit), 0);
}

export function sumBucketReturnsInInr(buckets: readonly SalesByDayBucket[]): number {
  return buckets.reduce((acc, row) => acc + parseMoneyAmount(row.returns), 0);
}

export function sumFulfilled(buckets: readonly SalesByDayBucket[]): number {
  return buckets.reduce((acc, row) => acc + row.fulfilledCount, 0);
}

export function toSalesChartSeries(
  buckets: readonly SalesByDayBucket[],
  currencyCode: MockCurrencyCode,
): { occurredOn: string; value: number }[] {
  return buckets.map((row) => ({
    occurredOn: row.occurredOn,
    value: Math.round(convertAmountFromInr(parseMoneyAmount(row.grossSales), currencyCode) * 100) / 100,
  }));
}

export function toProfitChartSeries(
  buckets: readonly SalesByDayBucket[],
  currencyCode: MockCurrencyCode,
): { occurredOn: string; value: number }[] {
  return buckets.map((row) => ({
    occurredOn: row.occurredOn,
    value: Math.round(convertAmountFromInr(parseMoneyAmount(row.profit), currencyCode) * 100) / 100,
  }));
}

export function toReturnsChartSeries(
  buckets: readonly SalesByDayBucket[],
  currencyCode: MockCurrencyCode,
): { occurredOn: string; value: number }[] {
  return buckets.map((row) => ({
    occurredOn: row.occurredOn,
    value: Math.round(convertAmountFromInr(parseMoneyAmount(row.returns), currencyCode) * 100) / 100,
  }));
}

export function toFulfilledChartSeries(
  buckets: readonly SalesByDayBucket[],
): { occurredOn: string; value: number }[] {
  return buckets.map((row) => ({
    occurredOn: row.occurredOn,
    value: row.fulfilledCount,
  }));
}

/** Long legend label for charts (e.g. “May 2, 2026”). */
export function formatLegendDayIso(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(`${iso}T12:00:00`));
  } catch {
    return iso;
  }
}

function hourLabel12(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

/** Intraday buckets for large “sales over time” cartesian charts (mock). */
type HourlySalesDatum = {
  hourIndex: number;
  hourLabel: string;
  value: number;
  compareValue: number;
};

/**
 * Builds 24 hourly points for primary vs comparison calendar days.
 * Primary spreads `currentDayIso` gross across hours (or stays flat at 0 when forced / zero gross).
 * Comparison ramps after 5 PM when days differ (mirrors Admin placeholder curves).
 */
export function buildHourlySalesOverTimeSeries(opts: {
  currentDayIso: string;
  compareDayIso: string;
  currency: MockCurrencyCode;
  allBuckets: readonly SalesByDayBucket[];
  forcePrimaryFlat?: boolean;
}): HourlySalesDatum[] {
  const curRow = opts.allBuckets.find((b) => b.occurredOn === opts.currentDayIso);
  const cmpRow = opts.allBuckets.find((b) => b.occurredOn === opts.compareDayIso);
  const curDisplay = curRow
    ? Math.round(
        convertAmountFromInr(parseMoneyAmount(curRow.grossSales), opts.currency) *
          100,
      ) / 100
    : 0;
  const cmpDisplay = cmpRow
    ? Math.round(
        convertAmountFromInr(parseMoneyAmount(cmpRow.grossSales), opts.currency) *
          100,
      ) / 100
    : 0;

  const sameDay = opts.currentDayIso === opts.compareDayIso;
  const weights = Array.from(
    { length: 24 },
    (_, hour) => 0.92 + (((hour * 17) % 11) / 100),
  );
  const wSum = weights.reduce((s, w) => s + w, 0);

  const rows: HourlySalesDatum[] = [];
  const cmpCap =
    cmpDisplay > 0
      ? Math.min(
          cmpDisplay * 0.1,
          opts.currency === "INR" ? 14 : 2,
        )
      : 0;

  for (let hour = 0; hour < 24; hour++) {
    const primaryFlat =
      Boolean(opts.forcePrimaryFlat) || curDisplay <= 0;
    const value = primaryFlat
      ? 0
      : Math.round(((curDisplay / wSum) * weights[hour]) * 100) / 100;

    let compareValue = 0;
    if (!sameDay && cmpDisplay > 0 && hour >= 17) {
      compareValue =
        Math.round(((hour - 17) / 7) * cmpCap * 100) / 100;
    }

    rows.push({
      hourIndex: hour,
      hourLabel: hourLabel12(hour),
      value,
      compareValue,
    });
  }

  return rows;
}

/** Row model for `ListCard` sales breakdown lists. */
type SalesBreakdownListRow = {
  id: string;
  label: string;
  valueFormatted: string;
};

/**
 * Deterministic mock lines for an Admin-style “Total sales breakdown” card.
 * Uses filtered-period gross + returns aggregates so rows track date/currency filters.
 */
export function buildSalesBreakdownRows(opts: {
  grossDisplay: number;
  returnsDisplay: number;
  unitPrefix: string;
}): SalesBreakdownListRow[] {
  const fmt = (n: number) =>
    `${opts.unitPrefix}${Math.max(0, n).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const gross = Math.max(0, opts.grossDisplay);
  const returnsAmt = Math.max(0, opts.returnsDisplay);
  const discounts = Math.round(gross * 0.02418 * 100) / 100;
  const netSales = Math.max(0, gross - discounts - returnsAmt);
  const shipping = Math.round(gross * 0.0475 * 100) / 100;
  const returnFees = Math.round(returnsAmt * 0.065 * 100) / 100;
  const taxes = Math.round(netSales * 0.1025 * 100) / 100;
  const totalSales = Math.max(
    0,
    Math.round((netSales + shipping + taxes - returnFees) * 100) / 100,
  );

  return [
    { id: "gross", label: "Gross sales", valueFormatted: fmt(gross) },
    { id: "discounts", label: "Discounts", valueFormatted: fmt(discounts) },
    { id: "returns", label: "Returns", valueFormatted: fmt(returnsAmt) },
    { id: "net", label: "Net sales", valueFormatted: fmt(netSales) },
    { id: "shipping", label: "Shipping charges", valueFormatted: fmt(shipping) },
    { id: "returnFees", label: "Return fees", valueFormatted: fmt(returnFees) },
    { id: "taxes", label: "Taxes", valueFormatted: fmt(taxes) },
    { id: "total", label: "Total sales", valueFormatted: fmt(totalSales) },
  ];
}

/** Sum of gross for headline — same derivation as summing chart `value` in INR-equivalent cents. */
export function totalGrossForDisplay(
  buckets: readonly SalesByDayBucket[],
  currencyCode: MockCurrencyCode,
): number {
  const inInr = sumBucketGrossInInr(buckets);
  const raw = convertAmountFromInr(inInr, currencyCode);
  return Math.round(raw * 100) / 100;
}

export function totalProfitForDisplay(
  buckets: readonly SalesByDayBucket[],
  currencyCode: MockCurrencyCode,
): number {
  const inInr = sumBucketProfitInInr(buckets);
  const raw = convertAmountFromInr(inInr, currencyCode);
  return Math.round(raw * 100) / 100;
}

export function totalReturnsForDisplay(
  buckets: readonly SalesByDayBucket[],
  currencyCode: MockCurrencyCode,
): number {
  const inInr = sumBucketReturnsInInr(buckets);
  const raw = convertAmountFromInr(inInr, currencyCode);
  return Math.round(raw * 100) / 100;
}

function addDaysUtc(d: Date, delta: number): Date {
  const out = new Date(d.getTime());
  out.setUTCDate(out.getUTCDate() + delta);
  return out;
}

/**
 * Deterministic mock store series — daily `grossSales.amount` strings mimic GraphQL decimals;
 * `orderCount` is an aggregate count compatible with bucketed Orders.
 */
function buildDemoBuckets(referenceEnd: Date): SalesByDayBucket[] {
  const start = addDaysUtc(referenceEnd, -30);
  const rows: SalesByDayBucket[] = [];
  let day = start;
  /** INR gross per day (`MoneyV2.amount`-style decimals). */
  const grossAmountsInr = [
    "41250.95", "37980.00", "40733.45", "45112.08", "47775.62", "42892.77",
    "38901.56", "46055.81", "50291.43", "47622.06", "49022.94", "41788.63",
    "44133.71", "51229.91", "49590.52", "46228.54", "43021.92", "50001.87",
    "51944.61", "50555.43", "47990.51", "46001.06", "48915.71", "51088.92",
    "52744.83", "54022.91", "51907.71", "53052.94", "54276.82", "55590.63",
    "75990.72",
  ] as const;
  for (let i = 0; i < grossAmountsInr.length; i++) {
    const iso = dateToUtcISODate(day);
    const amountInRupees = grossAmountsInr[i];
    const grossSales: MockMoneyV2 = {
      amount: amountInRupees,
      currencyCode: "INR",
    };
    const rupeesParsed = Number.parseFloat(amountInRupees);
    const orderCount = Math.max(
      7,
      Math.min(
        32,
        Math.round(rupeesParsed / 2500) + (i % 5) + (i % 3),
      ),
    );
    const profitRatio = 0.28 + (i % 7) * 0.011 + (i % 3) * 0.003;
    const profitInr = Math.max(0, rupeesParsed * Math.min(0.36, Math.max(0.28, profitRatio)));
    const returnsRatio = 0.02 + (i % 5) * 0.008 + (i % 2) * 0.004;
    const returnsInr = Math.max(0, rupeesParsed * Math.min(0.06, returnsRatio));
    const fulfillFactor = 0.88 + (i % 9) * 0.01;
    const fulfilledCount = Math.max(
      1,
      Math.min(
        orderCount,
        Math.round(orderCount * Math.min(0.96, Math.max(0.88, fulfillFactor))),
      ),
    );
    const profit: MockMoneyV2 = {
      amount: profitInr.toFixed(2),
      currencyCode: "INR",
    };
    const returns: MockMoneyV2 = {
      amount: returnsInr.toFixed(2),
      currencyCode: "INR",
    };
    rows.push({
      __typename: "SalesByDayBucket",
      occurredOn: iso,
      grossSales,
      orderCount,
      profit,
      returns,
      fulfilledCount,
    });
    day = addDaysUtc(day, 1);
    if (dateToUtcISODate(day) > dateToUtcISODate(referenceEnd)) break;
  }
  return rows.sort((a, b) => a.occurredOn.localeCompare(b.occurredOn));
}

export const MOCK_SALES_DAY_BUCKETS: readonly SalesByDayBucket[] =
  buildDemoBuckets(MOCK_ANALYTICS_TODAY);
