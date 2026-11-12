import { type ChartModel, INDICATORS } from "../lib/growth-chart";
import { formatDate, formatNumber, formatZ } from "../lib/format";

const WIDTH = 720;
const HEIGHT = 420;
const PAD = { top: 28, right: 44, bottom: 40, left: 48 };

const CURVE_STYLE: Record<number, { stroke: string; dash?: string; width: number }> = {
  [-3]: { stroke: "var(--curve-3)", dash: "4 4", width: 1 },
  [-2]: { stroke: "var(--curve-2)", width: 1.5 },
  [0]: { stroke: "var(--curve-median)", width: 2 },
  [2]: { stroke: "var(--curve-2)", width: 1.5 },
  [3]: { stroke: "var(--curve-3)", dash: "4 4", width: 1 },
};

/**
 * Server-rendered SVG: WHO reference curves (−3, −2, 0, +2, +3 SD) and the
 * child's measurements. No client JavaScript; each point has a <title> for a
 * native tooltip, and the table below the chart carries the same data.
 */
export function GrowthChart({ chart, titleId }: { chart: ChartModel; titleId: string }) {
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
      // Keep labels readable on phones: the chart scrolls sideways below 600px.
      className="h-auto w-full min-w-[600px]"
    >
      <g aria-hidden="true">
        {chart.yTicks.map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(v)} y2={y(v)} stroke="var(--grid)" />
            <text
              x={PAD.left - 8}
              y={y(v)}
              dy="0.32em"
              textAnchor="end"
              fontSize="11"
              fill="var(--muted)"
            >
              {formatNumber(v, Number.isInteger(v) ? 0 : 1)}
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
              stroke="var(--grid)"
            />
            <text
              x={x(t.ageDays)}
              y={HEIGHT - PAD.bottom + 18}
              textAnchor="middle"
              fontSize="11"
              fill="var(--muted)"
            >
              {t.months}
            </text>
          </g>
        ))}
        <text
          x={(WIDTH + PAD.left - PAD.right) / 2}
          y={HEIGHT - 4}
          textAnchor="middle"
          fontSize="11"
          fill="var(--muted)"
        >
          Tháng tuổi
        </text>
        <text x={PAD.left - 8} y={12} textAnchor="end" fontSize="11" fill="var(--muted)">
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
                  fontSize="10"
                  fill="var(--muted)"
                >
                  {curve.z === 0 ? "TB" : `${curve.z > 0 ? "+" : "−"}${String(Math.abs(curve.z))}`}
                </text>
              )}
            </g>
          );
        })}

        {chart.points.length > 1 && (
          <path
            d={childPath}
            fill="none"
            stroke="var(--point)"
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
          fill={p.estimated ? "var(--surface)" : "var(--point)"}
          stroke="var(--point)"
          strokeWidth={2}
        >
          <title>
            {`${formatDate(p.date)}: ${p.estimated ? "≈" : ""}${formatNumber(p.value, info.digits)} ${info.unit}` +
              (p.z === undefined ? "" : `, z ${formatZ(p.z)}`)}
          </title>
        </circle>
      ))}
    </svg>
  );
}
