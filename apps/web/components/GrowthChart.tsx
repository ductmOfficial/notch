import { type ChartModel, INDICATORS } from "../lib/growth-chart";
import { formatDate, formatNumber, formatZ } from "../lib/format";
import { type Locale, translator } from "../lib/i18n/messages";

/**
 * Two frames for the same chart. "wide" fills a full-width card and scrolls sideways below
 * 560px on phones; "compact" fits a third of a wide screen with labels about as large.
 */
const SIZES = {
  wide: { width: 720, height: 420, className: "h-auto w-full min-w-[560px]" },
  compact: { width: 420, height: 360, className: "h-auto w-full" },
} as const;
/** Just room for the y tick labels on the left and the curve labels (+3, TB, −3) on the right. */
const PAD = { top: 28, right: 30, bottom: 40, left: 34 };
/** The share of the wide chart's width taken by its y-axis margin, for `GrowthAxis`. */
export const AXIS_WIDTH = `${String((PAD.left / SIZES.wide.width) * 100)}%`;

const CURVE_STYLE: Record<number, { stroke: string; dash?: string; width: number }> = {
  [-3]: { stroke: "var(--chart-sd3)", dash: "4 4", width: 1 },
  [-2]: { stroke: "var(--chart-sd2)", width: 1.5 },
  [0]: { stroke: "var(--chart-median)", width: 2 },
  [2]: { stroke: "var(--chart-sd2)", width: 1.5 },
  [3]: { stroke: "var(--chart-sd3)", dash: "4 4", width: 1 },
};

/**
 * Server-rendered SVG: WHO reference curves (−3, −2, 0, +2, +3 SD) and the
 * child's measurements. No client JavaScript; each point has a <title> for a
 * native tooltip, and the table below the chart carries the same data.
 */
export function GrowthChart({
  chart,
  titleId,
  locale,
  size = "wide",
}: {
  chart: ChartModel;
  titleId: string;
  locale: Locale;
  size?: keyof typeof SIZES;
}) {
  const { width: WIDTH, height: HEIGHT, className } = SIZES[size];
  const t = translator(locale);
  const info = INDICATORS[chart.indicator];
  const x = (age: number) => PAD.left + (age / chart.maxAgeDays) * (WIDTH - PAD.left - PAD.right);
  const y = (value: number) =>
    HEIGHT -
    PAD.bottom -
    ((value - chart.yMin) / (chart.yMax - chart.yMin)) * (HEIGHT - PAD.top - PAD.bottom);
  const path = (points: readonly (readonly [number, number])[]) =>
    points
      .map(([a, v], i) => `${i === 0 ? "M" : "L"}${x(a).toFixed(1)},${y(v).toFixed(1)}`)
      .join("");
  const childPath = path(chart.points.map((p) => [p.ageDays, p.value] as const));

  return (
    <svg
      viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`}
      role="img"
      aria-labelledby={titleId}
      className={className}
    >
      <g aria-hidden="true">
        {chart.yTicks.map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--chart-grid)"
            />
            <text
              x={PAD.left - 8}
              y={y(v)}
              dy="0.32em"
              textAnchor="end"
              fontSize="13"
              fill="var(--md-sys-color-on-surface-variant)"
            >
              {formatNumber(v, Number.isInteger(v) ? 0 : 1, locale)}
            </text>
          </g>
        ))}
        {chart.xTicks.map((t) => (
          <g key={t.months}>
            <line
              x1={x(t.ageDays)}
              x2={x(t.ageDays)}
              y1={PAD.top}
              y2={HEIGHT - PAD.bottom}
              stroke="var(--chart-grid)"
            />
            <text
              x={x(t.ageDays)}
              y={HEIGHT - PAD.bottom + 18}
              textAnchor="middle"
              fontSize="13"
              fill="var(--md-sys-color-on-surface-variant)"
            >
              {t.months}
            </text>
          </g>
        ))}
        <text
          x={(WIDTH + PAD.left - PAD.right) / 2}
          y={HEIGHT - 4}
          textAnchor="middle"
          fontSize="13"
          fill="var(--md-sys-color-on-surface-variant)"
        >
          {t("growth.monthsOfAge")}
        </text>
        {/* From the left edge, so a long unit such as kg/m² needs no wider margin. */}
        <text x={2} y={12} fontSize="13" fill="var(--md-sys-color-on-surface-variant)">
          {info.unit}
        </text>

        {chart.curves.map((curve) => {
          const style = CURVE_STYLE[curve.z] ?? CURVE_STYLE[0];
          const last = curve.points.at(-1);
          return (
            <g key={curve.z}>
              <path
                d={path(curve.points)}
                fill="none"
                stroke={style?.stroke}
                strokeWidth={style?.width}
                strokeDasharray={style?.dash}
              />
              {last && (
                <text
                  x={x(last[0]) + 6}
                  y={y(last[1])}
                  dy="0.32em"
                  fontSize="12"
                  fill="var(--md-sys-color-on-surface-variant)"
                >
                  {curve.z === 0
                    ? t("growth.median")
                    : `${curve.z > 0 ? "+" : "−"}${String(Math.abs(curve.z))}`}
                </text>
              )}
            </g>
          );
        })}

        {chart.points.length > 1 && (
          <path
            d={childPath}
            fill="none"
            stroke="var(--chart-point)"
            strokeWidth={2}
            strokeLinejoin="round"
          />
        )}
      </g>
      {chart.points.map((p) => (
        <circle
          key={p.date}
          cx={x(p.ageDays)}
          cy={y(p.value)}
          r={4}
          fill={p.estimated ? "var(--md-sys-color-surface-container-low)" : "var(--chart-point)"}
          stroke="var(--chart-point)"
          strokeWidth={2}
        >
          <title>
            {`${formatDate(p.date, locale)}: ${p.estimated ? "≈" : ""}${formatNumber(p.value, info.digits, locale)} ${info.unit}` +
              (p.z === undefined ? "" : `, z ${formatZ(p.z, locale)}`)}
          </title>
        </circle>
      ))}
    </svg>
  );
}

/**
 * The y-axis of the wide chart alone, for phones: laid over the chart's left edge and kept
 * there while the chart scrolls sideways, so the values stay readable next to the latest
 * measurements. Its frame is the wide chart's left margin at the same scale; decorative,
 * since the chart and its table carry the values.
 */
export function GrowthAxis({ chart, locale }: { chart: ChartModel; locale: Locale }) {
  const { height: HEIGHT } = SIZES.wide;
  const info = INDICATORS[chart.indicator];
  const y = (value: number) =>
    HEIGHT -
    PAD.bottom -
    ((value - chart.yMin) / (chart.yMax - chart.yMin)) * (HEIGHT - PAD.top - PAD.bottom);
  return (
    <svg
      viewBox={`0 0 ${String(PAD.left)} ${String(HEIGHT)}`}
      aria-hidden="true"
      overflow="visible"
      className="h-auto w-full"
    >
      {/* Past the left edge too: the scroll container's padding keeps the axis off it. */}
      <rect
        x={-24}
        y={0}
        width={PAD.left + 24}
        height={HEIGHT - PAD.bottom}
        fill="var(--md-sys-color-surface-container-low)"
      />
      {chart.yTicks.map((v) => (
        <text
          key={v}
          x={PAD.left - 8}
          y={y(v)}
          dy="0.32em"
          textAnchor="end"
          fontSize="13"
          fill="var(--md-sys-color-on-surface-variant)"
        >
          {formatNumber(v, Number.isInteger(v) ? 0 : 1, locale)}
        </text>
      ))}
      <text x={2} y={12} fontSize="13" fill="var(--md-sys-color-on-surface-variant)">
        {info.unit}
      </text>
    </svg>
  );
}
