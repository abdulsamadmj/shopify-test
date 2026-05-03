/** Primary series — Polaris emphasis (adapts with admin theme). */
export const DEFAULT_CHART_STROKE = "var(--p-color-icon-emphasis)";
/** Comparison / dashed series — lighter info border for contrast on surface. */
export const DEFAULT_COMPARISON_STROKE = "var(--p-color-border-info)";

export const POLAR_CHART_GRID_STROKE = "var(--p-color-border-secondary)";
export const POLAR_CHART_AXIS_STROKE = "var(--p-color-border-secondary)";
export const POLAR_CHART_TICK_FILL = "var(--p-color-text-secondary)";

export const INLINE_GRID_COLUMNS = {
  xs: "minmax(0, 1fr)",
  md: "minmax(0, 1fr) minmax(140px, 2fr)",
} as const;
