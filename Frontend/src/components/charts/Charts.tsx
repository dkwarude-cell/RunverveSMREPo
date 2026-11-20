/**
 * Charts.tsx - lightweight static SVG charts (react-native-svg, already installed).
 * No animation, no gradients: everything is drawn once, so it stays smooth on low-end phones.
 * Arcs are real SVG paths (not dash tricks), so they render cleanly on every Android phone.
 *   ActivityRings - concentric progress rings (Apple Fitness style)
 *   BarChart      - one rounded bar per day, tap a bar to select it
 *   LineChart     - line chart with y-axis labels (e.g. pain level trend)
 *   DonutChart    - donut with small gaps between slices and a centre label
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { fonts, useTheme } from '../../theme';

/** SVG path for an arc from angle a0 to a1 (radians, 0 = top, clockwise) */
function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const sweep = Math.min(a1 - a0, Math.PI * 2 - 0.0001);
  const x0 = cx + r * Math.sin(a0);
  const y0 = cy - r * Math.cos(a0);
  const x1 = cx + r * Math.sin(a0 + sweep);
  const y1 = cy - r * Math.cos(a0 + sweep);
  const large = sweep > Math.PI ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

/** keep a centred text label inside the chart so it is never cut at the edges */
const clampX = (x: number, width: number, half = 10) => Math.min(width - half, Math.max(half, x));

/** which x-axis labels to show: all when few, otherwise ~6 evenly spaced + the last one, never touching */
function labelVisible(i: number, n: number, maxLabels: number) {
  if (n <= maxLabels) return true;
  const every = Math.ceil(n / (maxLabels - 1));
  if (i === n - 1) return true;
  return i % every === 0 && n - 1 - i >= every * 0.6;
}

// ───────────────────────── ActivityRings ─────────────────────────
export type Ring = { value: number; goal: number; color: string };

export function ActivityRings({ rings, size = 150, stroke = 14, gap = 4 }: { rings: Ring[]; size?: number; stroke?: number; gap?: number }) {
  const center = size / 2;
  return (
    <Svg width={size} height={size}>
      {rings.map((r, i) => {
        const radius = center - stroke / 2 - i * (stroke + gap);
        if (radius <= stroke / 2) return null;
        const pct = Math.min(1, r.goal ? r.value / r.goal : 0);
        return (
          <React.Fragment key={i}>
            {/* faint track in the ring's own colour */}
            <Circle cx={center} cy={center} r={radius} stroke={r.color} strokeOpacity={0.16} strokeWidth={stroke} fill="none" />
            {pct > 0.005 ? (
              <Path d={arcPath(center, center, radius, 0, pct * Math.PI * 2)} stroke={r.color} strokeWidth={stroke} strokeLinecap="round" fill="none" />
            ) : null}
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

// ───────────────────────── BarChart ─────────────────────────
/** One rounded bar per day. Tap a bar to select it (onSelect); the selected bar shows its value. */
export function BarChart({
  labels,
  values,
  height = 180,
  selected,
  onSelect,
  goal,
  color,
}: {
  labels: string[];
  values: number[];
  height?: number;
  selected?: number;
  onSelect?: (index: number) => void;
  goal?: number; // optional dashed goal line
  color?: string;
}) {
  const { c } = useTheme();
  const [width, setWidth] = useState(0);
  const fill = color ?? c.primary;
  const n = labels.length;
  const top = Math.ceil(Math.max(10, goal ?? 0, ...values) / 10) * 10;

  const plotTop = 20; // room for the value label above the tallest bar
  const labelH = 24;
  const base = height - labelH; // y of the bars' bottom
  const slot = width / Math.max(1, n);
  const barW = Math.max(4, Math.min(22, slot * 0.56));
  const y = (v: number) => base - (v / top) * (base - plotTop);
  const showTracks = n <= 10;
  const hasSel = selected !== undefined && selected >= 0 && selected < n;

  return (
    <View onLayout={e => setWidth(Math.floor(e.nativeEvent.layout.width))} style={{ height }}>
      {width > 0 ? (
        <>
          <Svg width={width} height={height}>
            {/* empty tracks so every day has a bar shape (week view only) */}
            {showTracks
              ? values.map((_, i) => (
                  <Rect key={`t${i}`} x={i * slot + (slot - barW) / 2} y={plotTop} width={barW} height={base - plotTop} rx={barW / 2} fill={c.surfaceStrong} />
                ))
              : null}

            <Line x1={0} x2={width} y1={base} y2={base} stroke={c.divider} strokeWidth={1} />
            {goal ? <Line x1={0} x2={width} y1={y(goal)} y2={y(goal)} stroke={c.textMuted} strokeWidth={1} strokeDasharray="4 4" /> : null}

            {values.map((v, i) => {
              if (v <= 0) return null;
              const h = Math.max(barW, base - y(v));
              const x = i * slot + (slot - barW) / 2;
              const on = !hasSel || selected === i;
              return <Rect key={`b${i}`} x={x} y={base - h} width={barW} height={h} rx={barW / 2} fill={fill} fillOpacity={on ? 1 : 0.3} />;
            })}

            {/* value above the selected bar */}
            {hasSel && values[selected!] > 0 ? (
              <SvgText
                x={clampX(selected! * slot + slot / 2, width, 12)}
                y={base - Math.max(barW, base - y(values[selected!])) - 6}
                fill={c.text}
                fontSize={11}
                fontWeight="bold"
                textAnchor="middle"
              >
                {values[selected!]}
              </SvgText>
            ) : null}

            {labels.map((l, i) =>
              labelVisible(i, n, 7) ? (
                <SvgText
                  key={`l${i}`}
                  x={clampX(i * slot + slot / 2, width)}
                  y={height - 7}
                  fill={selected === i ? c.text : c.textMuted}
                  fontSize={11}
                  fontWeight={selected === i ? 'bold' : 'normal'}
                  textAnchor="middle"
                >
                  {l}
                </SvgText>
              ) : null,
            )}
          </Svg>

          {onSelect ? (
            <View style={[StyleSheet.absoluteFill, styles.touchRow]}>
              {values.map((_, i) => (
                <Pressable key={i} style={styles.touchCol} onPress={() => onSelect(i)} />
              ))}
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

// ───────────────────────── LineChart ─────────────────────────
export function LineChart({
  labels,
  values,
  height = 160,
  min = 0,
  max,
  color,
}: {
  labels: string[];
  values: number[];
  height?: number;
  min?: number;
  max?: number;
  color?: string;
}) {
  const { c } = useTheme();
  const stroke = color ?? c.primary;
  const [width, setWidth] = useState(0);
  const top = max ?? Math.max(...values, min + 1);
  const n = values.length;

  const gutter = 26; // y-axis labels
  const padR = 10;
  const padT = 10;
  const labelH = 24;
  const plotB = height - labelH;
  const yOf = (v: number) => padT + (1 - (v - min) / (top - min || 1)) * (plotB - padT);
  const pts = values.map((v, i) => ({
    x: n === 1 ? (gutter + width - padR) / 2 : gutter + 6 + (i / (n - 1)) * (width - gutter - 6 - padR),
    y: yOf(v),
  }));
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const last = pts[pts.length - 1];
  const area = pts.length > 1 ? `${d} L ${last.x} ${plotB} L ${pts[0].x} ${plotB} Z` : '';
  const ticks = [top, (top + min) / 2, min];
  const fmt = (v: number) => `${Math.round(v * 10) / 10}`;

  return (
    <View onLayout={e => setWidth(Math.floor(e.nativeEvent.layout.width))} style={{ height }}>
      {width > 0 && pts.length ? (
        <Svg width={width} height={height}>
          {ticks.map(t => (
            <React.Fragment key={t}>
              <Line x1={gutter} x2={width} y1={yOf(t)} y2={yOf(t)} stroke={c.divider} strokeWidth={1} />
              <SvgText x={gutter - 8} y={yOf(t) + 4} fill={c.textMuted} fontSize={10.5} textAnchor="end">
                {fmt(t)}
              </SvgText>
            </React.Fragment>
          ))}

          {area ? <Path d={area} fill={stroke} fillOpacity={0.1} /> : null}
          <Path d={d} stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" fill="none" />
          {n <= 10 ? pts.slice(0, -1).map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={3.2} fill={c.surface} stroke={stroke} strokeWidth={2} />) : null}
          {last ? (
            <>
              <Circle cx={last.x} cy={last.y} r={6.5} fill={stroke} fillOpacity={0.25} />
              <Circle cx={last.x} cy={last.y} r={4} fill={stroke} />
            </>
          ) : null}

          {labels.map((l, i) =>
            labelVisible(i, n, 7) ? (
              <SvgText key={`l${i}`} x={clampX(pts[i]?.x ?? 0, width)} y={height - 7} fill={c.textMuted} fontSize={11} textAnchor="middle">
                {l}
              </SvgText>
            ) : null,
          )}
        </Svg>
      ) : null}
    </View>
  );
}

// ───────────────────────── DonutChart ─────────────────────────
export type Slice = { label: string; value: number; color: string };

export function DonutChart({ slices, size = 150, stroke = 22, centerTop, centerBottom }: { slices: Slice[]; size?: number; stroke?: number; centerTop?: string; centerBottom?: string }) {
  const { c } = useTheme();
  const total = slices.reduce((s, x) => s + x.value, 0);
  const r = size / 2 - stroke / 2;
  const center = size / 2;
  const visible = slices.filter(s => s.value > 0);
  const gap = visible.length > 1 ? 0.06 : 0; // small gap between slices (radians)
  let angle = 0;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={r} stroke={c.surfaceStrong} strokeWidth={stroke} fill="none" />
        {total > 0
          ? visible.map(s => {
              const sweep = (s.value / total) * Math.PI * 2;
              const start = angle;
              angle += sweep;
              return sweep - gap > 0.02 ? <Path key={s.label} d={arcPath(center, center, r, start + gap / 2, start + sweep - gap / 2)} stroke={s.color} strokeWidth={stroke} fill="none" /> : null;
            })
          : null}
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        {centerTop ? (
          <Text style={[styles.centerTop, { color: c.text, maxWidth: size - stroke * 2 - 8 }]} numberOfLines={1} adjustsFontSizeToFit>
            {centerTop}
          </Text>
        ) : null}
        {centerBottom ? (
          <Text style={[styles.centerBottom, { color: c.textMuted }]} numberOfLines={1}>
            {centerBottom}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  touchRow: { flexDirection: 'row' },
  touchCol: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  centerTop: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 28, fontWeight: '800', includeFontPadding: false, textAlign: 'center' },
  centerBottom: { fontSize: 11, lineHeight: 14, includeFontPadding: false },
});