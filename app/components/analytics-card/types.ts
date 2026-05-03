export type AnalyticsTooltipContent =
  | string
  | { heading: string; body: string };

export type AnalyticsChartDatum = Record<string, unknown>;

export type AnalyticsCardSize = "sm" | "md" | "lg";
