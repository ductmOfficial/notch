import "server-only";

import { join } from "node:path";

import type {
  AppointmentRow,
  Child,
  HealthEntry,
  Measurement,
  Temperature,
  Vaccination,
} from "@notch/db";
import {
  Document,
  Font,
  Line,
  Page,
  Path,
  renderToBuffer,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";

import { formatAge, formatDate, formatNumber, formatZ, todayInVietnam } from "./format";
import { readGrowth } from "./growth-assessment";
import {
  entryPeriod,
  formatDateTime,
  formatTemperature,
  healthKindLabel,
  temperatureLevel,
  temperatureLevelLabel,
} from "./health-view";
import {
  buildChart,
  type ChartIndicator,
  type ChartModel,
  chartPoints,
  INDICATORS,
} from "./growth-chart";
import { type Locale, translator } from "./i18n/messages";
import { buildVaccinationView, productName, productOrigin } from "./vaccines-view";

// Roboto covers Vietnamese; the files ship with the app (assets/fonts, SIL OFL 1.1).
Font.register({
  family: "Roboto",
  fonts: [
    { src: join(process.cwd(), "assets/fonts/Roboto-Regular.ttf"), fontWeight: 400 },
    { src: join(process.cwd(), "assets/fonts/Roboto-Bold.ttf"), fontWeight: 700 },
  ],
});
// Vietnamese words are not hyphenated.
Font.registerHyphenationCallback((word) => [word]);

/** Print colors: the lotus palette's roles, fixed so the PDF looks the same for every theme. */
const INK = "#201a1b";
const MUTED = "#524346";
const LINE = "#d6c2c5";
const PRIMARY = "#99405e";
const CURVE = { median: "#3d692f", sd2: "#795900", sd3: "#9c8d90", grid: "#ece0e2" };
/**
 * Text inside an <Svg> does not inherit the page's font: without Roboto it falls back to
 * Helvetica, which has no minus sign, so "−2" and "−3" printed without it.
 */
const CHART_TEXT = { fontFamily: "Roboto", fontSize: 7 } as const;
/** Reading labels: green for normal, amber to watch, red to see a doctor. */
const LEVEL_COLOR = { normal: "#3d692f", watch: "#795900", doctor: "#ba1a1a" } as const;

const styles = StyleSheet.create({
  page: { fontFamily: "Roboto", fontSize: 10, color: INK, padding: 36, paddingBottom: 56 },
  brand: { fontSize: 9, color: PRIMARY, fontWeight: 700, marginBottom: 4 },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  muted: { color: MUTED },
  h2: { fontSize: 13, fontWeight: 700, marginTop: 18, marginBottom: 8 },
  row: { flexDirection: "row", gap: 8 },
  card: {
    flexGrow: 1,
    flexBasis: 0,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 6,
    padding: 8,
  },
  big: { fontSize: 16, fontWeight: 700, marginVertical: 2 },
  chartTitle: { fontWeight: 700, marginBottom: 4 },
  table: { borderTopWidth: 1, borderColor: LINE },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderColor: LINE, paddingVertical: 4 },
  th: { fontWeight: 700, color: MUTED },
  footer: {
    position: "absolute",
    left: 36,
    right: 36,
    bottom: 20,
    fontSize: 8,
    color: MUTED,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
});

const W = 523;
const H = 210;
const PAD = { top: 10, right: 30, bottom: 22, left: 34 };

function Chart({ chart, locale }: { chart: ChartModel; locale: Locale }) {
  const t = translator(locale);
  const x = (age: number) => PAD.left + (age / chart.maxAgeDays) * (W - PAD.left - PAD.right);
  const y = (v: number) =>
    H - PAD.bottom - ((v - chart.yMin) / (chart.yMax - chart.yMin)) * (H - PAD.top - PAD.bottom);
  const path = (points: readonly (readonly [number, number])[]) =>
    points
      .map(([a, v], i) => `${i === 0 ? "M" : "L"}${x(a).toFixed(1)},${y(v).toFixed(1)}`)
      .join("");
  const stroke = (z: number) =>
    z === 0 ? CURVE.median : Math.abs(z) === 2 ? CURVE.sd2 : CURVE.sd3;
  const info = INDICATORS[chart.indicator];
  return (
    <View wrap={false} style={{ marginBottom: 10 }}>
      <Text style={styles.chartTitle}>
        {t(info.labelKey)} ({info.unit}) · {t("growth.monthsOfAge")}
      </Text>
      <Svg width={W} height={H} viewBox={`0 0 ${String(W)} ${String(H)}`}>
        {chart.yTicks.map((v) => (
          <Line
            key={`y${String(v)}`}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(v)}
            y2={y(v)}
            stroke={CURVE.grid}
            strokeWidth={0.5}
          />
        ))}
        {chart.xTicks.map((tick) => (
          <Line
            key={`x${String(tick.months)}`}
            x1={x(tick.ageDays)}
            x2={x(tick.ageDays)}
            y1={PAD.top}
            y2={H - PAD.bottom}
            stroke={CURVE.grid}
            strokeWidth={0.5}
          />
        ))}
        {chart.yTicks.map((v) => (
          <Text
            key={`yl${String(v)}`}
            x={PAD.left - 4}
            y={y(v) + 3}
            style={CHART_TEXT}
            fill={MUTED}
            textAnchor="end"
          >
            {formatNumber(v, Number.isInteger(v) ? 0 : 1, locale)}
          </Text>
        ))}
        {chart.xTicks.map((tick) => (
          <Text
            key={`xl${String(tick.months)}`}
            x={x(tick.ageDays)}
            y={H - PAD.bottom + 11}
            style={CHART_TEXT}
            fill={MUTED}
            textAnchor="middle"
          >
            {String(tick.months)}
          </Text>
        ))}
        {chart.curves.map((curve) => (
          <Path
            key={curve.z}
            d={path(curve.points)}
            fill="none"
            stroke={stroke(curve.z)}
            strokeWidth={curve.z === 0 ? 1.4 : 0.9}
            strokeDasharray={Math.abs(curve.z) === 3 ? "3 3" : undefined}
          />
        ))}
        {chart.curves.map((curve) => {
          const last = curve.points.at(-1);
          return last ? (
            <Text
              key={`c${String(curve.z)}`}
              x={x(last[0]) + 3}
              y={y(last[1]) + 2.5}
              style={{ ...CHART_TEXT, fontSize: 6.5 }}
              fill={MUTED}
            >
              {curve.z === 0
                ? t("growth.median")
                : `${curve.z > 0 ? "+" : "−"}${String(Math.abs(curve.z))}`}
            </Text>
          ) : null;
        })}
        {chart.points.length > 1 && (
          <Path
            d={path(chart.points.map((p) => [p.ageDays, p.value] as const))}
            fill="none"
            stroke={PRIMARY}
            strokeWidth={1.4}
          />
        )}
        {chart.points.map((p) => (
          <Path
            key={p.date}
            // A small circle as a path: react-pdf's Circle has no stroke-only fill reliably.
            d={`M${(x(p.ageDays) - 2.2).toFixed(1)},${y(p.value).toFixed(1)}a2.2,2.2 0 1,0 4.4,0a2.2,2.2 0 1,0 -4.4,0`}
            fill={p.estimated ? "#ffffff" : PRIMARY}
            stroke={PRIMARY}
            strokeWidth={1}
          />
        ))}
      </Svg>
    </View>
  );
}

interface ReportData {
  readonly child: Child;
  readonly measurements: readonly Measurement[];
  readonly vaccinations: readonly Vaccination[];
  readonly appointments: readonly AppointmentRow[];
  /** The health log, newest first. */
  readonly healthEntries?: readonly HealthEntry[];
  /** Temperature readings, oldest first; the latest ones are printed. */
  readonly temperatures?: readonly Temperature[];
  readonly locale: Locale;
  readonly today?: string;
}

/** How many of the latest temperature readings the report lists. */
const REPORT_READINGS = 20;
const NO_ENTRIES: readonly HealthEntry[] = [];
const NO_READINGS: readonly Temperature[] = [];

function Report({
  child,
  measurements,
  vaccinations,
  appointments,
  healthEntries = NO_ENTRIES,
  temperatures = NO_READINGS,
  locale,
  today: givenToday,
}: ReportData) {
  const today = givenToday ?? todayInVietnam();
  const t = translator(locale);
  const date = (d: string) => formatDate(d, locale);
  const view = buildVaccinationView(vaccinations, appointments, today, undefined, locale);
  const latest = (
    ["weight", "length", "head", "bmi"] as const satisfies readonly ChartIndicator[]
  ).flatMap((indicator) => {
    const points = chartPoints(indicator, child.sex, child.birthDate, measurements);
    const point = points.at(-1);
    return point
      ? [
          {
            indicator,
            point,
            reading: readGrowth(indicator, child.sex, child.birthDate, points, locale),
          },
        ]
      : [];
  });
  const charts = (["weight", "length"] as const).map((indicator) =>
    buildChart(indicator, child.sex, child.birthDate, measurements),
  );
  const upcoming = [...view.open, ...view.undated];

  const footer = (
    <View style={styles.footer} fixed>
      <Text style={{ width: 420 }}>{t("report.disclaimer")}</Text>
      <Text
        style={{ width: 70, textAlign: "right" }}
        render={({ pageNumber, totalPages }) =>
          t("report.page", { page: pageNumber, total: totalPages })
        }
      />
    </View>
  );

  return (
    <Document title={t("report.title", { name: child.name })} author="Notch" language={locale}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>NOTCH</Text>
        <Text style={styles.title}>{t("report.title", { name: child.name })}</Text>
        <Text style={styles.muted}>
          {child.sex === "female" ? t("common.female") : t("common.male")} ·{" "}
          {t("report.born", { date: date(child.birthDate) })} ·{" "}
          {formatAge(child.birthDate, today, locale)} ·{" "}
          {t("report.exported", { date: date(today) })}
        </Text>

        <Text style={styles.h2}>{t("report.latest")}</Text>
        {latest.length === 0 ? (
          <Text style={styles.muted}>{t("today.noMeasurements")}</Text>
        ) : (
          <View style={styles.row}>
            {latest.map(({ indicator, point, reading }) => {
              const info = INDICATORS[indicator];
              return (
                <View key={indicator} style={styles.card}>
                  <Text style={styles.muted}>{t(info.labelKey)}</Text>
                  <Text style={styles.big}>
                    {point.estimated ? "≈" : ""}
                    {formatNumber(point.value, info.digits, locale)} {info.unit}
                  </Text>
                  {reading && (
                    <>
                      <Text style={{ fontWeight: 700, color: LEVEL_COLOR[reading.statusLevel] }}>
                        {reading.label}
                      </Text>
                      {reading.range && (
                        <Text style={[styles.muted, { fontSize: 8 }]}>{reading.range}</Text>
                      )}
                      {reading.change && <Text style={{ fontSize: 8 }}>{reading.change}</Text>}
                      <Text style={{ fontSize: 8, marginTop: 2 }}>{reading.advice}</Text>
                    </>
                  )}
                  {point.z !== undefined && point.percentile !== undefined && (
                    <Text style={[styles.muted, { fontSize: 8, marginTop: 2 }]}>
                      {t("growth.percentile")} {String(Math.round(point.percentile))} · z{" "}
                      {formatZ(point.z, locale)}
                    </Text>
                  )}
                  <Text style={[styles.muted, { fontSize: 8, marginTop: 2 }]}>
                    {t("growth.measuredOn", { date: date(point.date) })}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <Text style={styles.h2}>{t("report.charts")}</Text>
        {charts.map((chart) => (
          <Chart key={chart.indicator} chart={chart} locale={locale} />
        ))}
        {footer}
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={[styles.h2, { marginTop: 0 }]}>{t("vaccines.byDisease")}</Text>
        {view.covered.length === 0 ? (
          <Text style={styles.muted}>{t("report.noDoses")}</Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.tr}>
              <Text style={[styles.th, { width: 120 }]}>{t("report.colDisease")}</Text>
              <Text style={[styles.th, { flex: 1 }]}>{t("report.colDoses")}</Text>
            </View>
            {view.covered.map((row) => (
              <View key={row.code} style={styles.tr} wrap={false}>
                <Text style={{ width: 120 }}>{row.name}</Text>
                <Text style={{ flex: 1 }}>
                  {row.doses
                    .map((d) => `${d.productName} ${String(d.doseNo)} (${date(d.givenOn)})`)
                    .join(" · ")}
                </Text>
              </View>
            ))}
          </View>
        )}
        {view.uncovered.length > 0 && (
          <Text style={[styles.muted, { marginTop: 4, fontSize: 8 }]}>
            {t("vaccines.uncovered", { n: view.uncovered.length })}:{" "}
            {view.uncovered.map((r) => r.name).join(", ")}
          </Text>
        )}

        <Text style={styles.h2}>{t("report.history")}</Text>
        {vaccinations.length === 0 ? (
          <Text style={styles.muted}>{t("report.noDoses")}</Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.tr} fixed>
              <Text style={[styles.th, { width: 70 }]}>{t("report.colDate")}</Text>
              <Text style={[styles.th, { flex: 1 }]}>{t("report.colVaccine")}</Text>
              <Text style={[styles.th, { width: 36 }]}>{t("report.colDose")}</Text>
              <Text style={[styles.th, { width: 90 }]}>{t("report.colOrigin")}</Text>
              <Text style={[styles.th, { width: 100 }]}>{t("report.colPlace")}</Text>
              <Text style={[styles.th, { width: 70 }]}>{t("report.colLot")}</Text>
            </View>
            {vaccinations.map((v) => (
              <View key={v.id} style={styles.tr} wrap={false}>
                <Text style={{ width: 70 }}>{date(v.givenOn)}</Text>
                <Text style={{ flex: 1 }}>{productName(v.productCode)}</Text>
                <Text style={{ width: 36 }}>{String(v.doseNo)}</Text>
                <Text style={{ width: 90 }}>{productOrigin(v.productCode, locale) ?? ""}</Text>
                <Text style={{ width: 100 }}>{v.place ?? ""}</Text>
                <Text style={{ width: 70 }}>{v.lot ?? ""}</Text>
              </View>
            ))}
            <Text style={[styles.muted, { marginTop: 4, fontSize: 8 }]}>
              {t("vaccines.originNote")}
            </Text>
          </View>
        )}

        <Text style={styles.h2}>{t("report.upcoming")}</Text>
        {upcoming.length === 0 ? (
          <Text style={styles.muted}>{t("vaccines.noAppointments")}</Text>
        ) : (
          <View style={styles.table}>
            {upcoming.map((a) => (
              <View key={`${a.productCode}-${String(a.doseNo)}`} style={styles.tr} wrap={false}>
                <Text style={{ width: 90 }}>{a.dueOn ? date(a.dueOn) : t("common.noDate")}</Text>
                <Text style={{ flex: 1 }}>
                  {productName(a.productCode)} · {t("common.dose", { n: a.doseNo })}
                </Text>
                <Text style={[styles.muted, { width: 150, textAlign: "right" }]}>
                  {a.note ?? ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.h2}>{t("report.health")}</Text>
        {healthEntries.length === 0 ? (
          <Text style={styles.muted}>{t("report.noHealth")}</Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.tr} fixed>
              <Text style={[styles.th, { width: 70 }]}>{t("report.colKind")}</Text>
              <Text style={[styles.th, { flex: 1 }]}>{t("report.colWhat")}</Text>
              <Text style={[styles.th, { width: 140 }]}>{t("report.colPeriod")}</Text>
            </View>
            {healthEntries.map((e) => (
              <View key={e.id} style={styles.tr} wrap={false}>
                <Text style={{ width: 70 }}>{healthKindLabel(e.kind, locale)}</Text>
                <Text style={{ flex: 1 }}>
                  {e.title}
                  {e.note ? <Text style={styles.muted}> · {e.note}</Text> : null}
                </Text>
                <Text style={{ width: 140 }}>{entryPeriod(e, today, locale)}</Text>
              </View>
            ))}
          </View>
        )}

        {temperatures.length > 0 && (
          <>
            <Text style={styles.h2}>{t("report.recentTemperatures")}</Text>
            <View style={styles.table}>
              <View style={styles.tr} fixed>
                <Text style={[styles.th, { width: 110 }]}>{t("report.colTime")}</Text>
                <Text style={[styles.th, { width: 80 }]}>{t("report.colTemperature")}</Text>
                <Text style={[styles.th, { flex: 1 }]} />
              </View>
              {temperatures
                .slice(-REPORT_READINGS)
                .reverse()
                .map((r) => (
                  <View key={r.id} style={styles.tr} wrap={false}>
                    <Text style={{ width: 110 }}>{formatDateTime(r.measuredAt, locale)}</Text>
                    <Text style={{ width: 80 }}>{formatTemperature(r.tenthsC, locale)}</Text>
                    <Text style={[styles.muted, { flex: 1 }]}>
                      {temperatureLevelLabel(temperatureLevel(r.tenthsC), locale)}
                      {r.note ? ` · ${r.note}` : ""}
                    </Text>
                  </View>
                ))}
            </View>
          </>
        )}
        {footer}
      </Page>
    </Document>
  );
}

/**
 * The child's record as an A4 PDF: profile, latest measurements and WHO charts, then
 * vaccinations and the health log.
 */
export function renderReport(data: ReportData): Promise<Buffer> {
  return renderToBuffer(<Report {...data} />);
}
