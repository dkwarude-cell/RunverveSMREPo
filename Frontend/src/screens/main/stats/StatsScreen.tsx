/**
 * StatsScreen - "Stats" dock tab (Apple Fitness / Mi Fitness style):
 * today's rings, summary tiles, tappable daily bars, therapy split, pain trend and recent sessions.
 * Uses sample data until the device logs real sessions.
 *
 * Layout rules used here so nothing clips or overlaps on small phones:
 *  - every text style sets its own lineHeight (big numbers never inherit the 22px body lineHeight)
 *  - numbers and units are side-by-side Texts, not nested Texts
 *  - chart sizes follow the screen width, and long labels use numberOfLines={1}
 */
import React, { useMemo, useState } from 'react';
import { DimensionValue, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import TabHeader from '../../../components/layout/TabHeader';
import Card from '../../../components/ui/Card';
import { SectionHeader, SegmentedTabs } from '../../../components/ui/Bits';
import { ActivityRings, BarChart, DonutChart, LineChart } from '../../../components/charts/Charts';
import { THERAPY_META, Therapy, therapyColor, WEEKDAY, buildDays, buildSessions, shortDate, summarize } from '../../../data/sampleStats';
import { fonts, radius, DOCK_SPACE, useTheme, useStyles } from '../../../theme';
import type { Palette } from '../../../theme';

type Range = 'Week' | 'Month';
const THERAPIES: Therapy[] = ['heat', 'vibration', 'tens'];
const DAILY_GOAL = THERAPIES.reduce((s, t) => s + THERAPY_META[t].goal, 0); // 50 min
const PAGE_PAD = 18;
const CARD_PAD = 18;

/** extra accent colours for this screen (light / dark) */
const accents = (dark: boolean) => ({
  pain: dark ? '#A78BFA' : '#7C3AED', // violet
  blue: dark ? '#60A5FA' : '#2563EB',
  orange: dark ? '#FB923C' : '#EA580C',
  rose: dark ? '#F472B6' : '#DB2777',
});

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export default function StatsScreen(_: { active: boolean }) {
  const { c: colors } = useTheme();
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const acc = accents(colors.dark);

  const [range, setRange] = useState<Range>('Week');
  const [selected, setSelected] = useState(6);

  const days = useMemo(() => buildDays(range === 'Week' ? 7 : 30), [range]);
  const sum = useMemo(() => summarize(days), [days]);
  const sessions = useMemo(() => buildSessions(days, 6), [days]);

  const lastIdx = days.length - 1;
  const selIdx = Math.min(selected, lastIdx);
  const today = days[lastIdx];
  const sel = days[selIdx];
  const selTotal = sel.heat + sel.vibration + sel.tens;

  const changeRange = (r: Range) => {
    setRange(r);
    setSelected((r === 'Week' ? 7 : 30) - 1); // select the latest day in the same render - no flicker
  };

  // sizes follow the screen width so small phones never clip
  const inner = width - PAGE_PAD * 2 - CARD_PAD * 2;
  const ringSize = Math.round(clamp(inner * 0.44, 108, 140));
  const donutSize = Math.round(clamp(inner * 0.4, 104, 132));

  const labels = days.map(d => (range === 'Week' ? WEEKDAY[d.date.getDay()].slice(0, 1) : `${d.date.getDate()}`));
  const totals = days.map(d => d.heat + d.vibration + d.tens);
  const bestPain = Math.min(...days.map(d => d.pain));
  const painGood = sum.painChange <= 0;
  const painCol = painGood ? colors.success : colors.danger;

  const tiles = [
    { icon: 'timer-outline', label: 'Therapy time', value: `${sum.totalMinutes}`, unit: 'min', color: colors.primary },
    { icon: 'calendar-check-outline', label: 'Sessions', value: `${sum.sessions}`, unit: '', color: acc.blue },
    { icon: 'fire', label: 'Day streak', value: `${sum.streak}`, unit: sum.streak === 1 ? 'day' : 'days', color: acc.orange },
    { icon: 'heart-pulse', label: 'Avg heart rate', value: `${sum.avgHeartRate}`, unit: 'bpm', color: acc.rose },
  ];

  /** big number + small unit, side by side (no nested Text) */
  const Num = ({ value, unit, size = 22, color }: { value: string | number; unit?: string; size?: number; color?: string }) => (
    <View style={styles.numRow}>
      <Text style={[styles.num, { fontSize: size, lineHeight: Math.round(size * 1.2), color: color ?? colors.text }]} numberOfLines={1}>
        {value}
      </Text>
      {unit ? (
        <Text style={styles.unit} numberOfLines={1}>
          {unit}
        </Text>
      ) : null}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 10 }]} showsVerticalScrollIndicator={false}>
      <TabHeader kicker="Therapy stats" title="Activity" />

      <View style={styles.seg}>
        <SegmentedTabs<Range> options={['Week', 'Month']} value={range} onChange={changeRange} />
      </View>

      {/* ───── Today: rings ───── */}
      <Card style={styles.first} padding={CARD_PAD}>
        <View style={styles.ringsRow}>
          <ActivityRings size={ringSize} stroke={Math.round(ringSize / 11)} gap={4} rings={THERAPIES.map(t => ({ value: today[t], goal: THERAPY_META[t].goal, color: therapyColor(t, colors) }))} />
          <View style={styles.ringsText}>
            <Text style={styles.caption}>TODAY</Text>
            {THERAPIES.map(t => (
              <View key={t} style={styles.ringLine}>
                <View style={styles.labelRow}>
                  <View style={[styles.dot, { backgroundColor: therapyColor(t, colors) }]} />
                  <Text style={styles.smallLabel} numberOfLines={1}>
                    {THERAPY_META[t].label}
                  </Text>
                </View>
                <Num value={today[t]} unit={`/ ${THERAPY_META[t].goal} min`} size={20} color={therapyColor(t, colors)} />
              </View>
            ))}
          </View>
        </View>
      </Card>

      {/* ───── Summary tiles ───── */}
      <View style={styles.tiles}>
        {tiles.map(t => (
          <View key={t.label} style={styles.tileCell}>
            <View style={styles.tile}>
              <View style={[styles.tileIcon, { backgroundColor: t.color + '1F' }]}>
                <Icon name={t.icon} size={18} color={t.color} />
              </View>
              <Num value={t.value} unit={t.unit} size={24} />
              <Text style={styles.smallMuted} numberOfLines={1}>
                {t.label}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* ───── Daily minutes (tap a bar) ───── */}
      <SectionHeader title={range === 'Week' ? 'This week' : 'Last 30 days'} />
      <Card padding={CARD_PAD}>
        <View style={styles.chartHead}>
          <View style={styles.flex}>
            <Text style={styles.caption} numberOfLines={1}>
              {selIdx === lastIdx ? 'TODAY' : `${WEEKDAY[sel.date.getDay()]} ${shortDate(sel.date)}`.toUpperCase()}
            </Text>
            <Num value={selTotal} unit="min" size={30} />
          </View>
          <View style={styles.headRight}>
            <Text style={styles.caption}>DAILY AVG</Text>
            <Num value={Math.round(sum.totalMinutes / days.length)} unit="min" size={18} />
          </View>
        </View>

        <BarChart labels={labels} values={totals} selected={selIdx} onSelect={setSelected} goal={DAILY_GOAL} height={176} color={colors.primary} />

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={styles.dash}>
              {[0, 1, 2].map(i => (
                <View key={i} style={styles.dashBit} />
              ))}
            </View>
            <Text style={styles.smallMuted} numberOfLines={1}>
              Goal {DAILY_GOAL} min
            </Text>
          </View>
          <View style={styles.legendItem}>
            <Icon name="gesture-tap" size={14} color={colors.textMuted} />
            <Text style={[styles.smallMuted, styles.legendText]} numberOfLines={1}>
              Tap a bar for details
            </Text>
          </View>
        </View>

        <View style={styles.breakRow}>
          {THERAPIES.map(t => {
            const col = therapyColor(t, colors);
            const pct = Math.min(1, sel[t] / THERAPY_META[t].goal);
            return (
              <View key={t} style={styles.breakCol}>
                <View style={styles.labelRow}>
                  <View style={[styles.dot, { backgroundColor: col }]} />
                  <Text style={styles.smallLabel} numberOfLines={1}>
                    {THERAPY_META[t].label}
                  </Text>
                </View>
                <Num value={sel[t]} unit="min" size={18} />
                <View style={styles.track}>
                  <View style={[styles.trackFill, { width: `${Math.round(pct * 100)}%` as DimensionValue, backgroundColor: col }]} />
                </View>
              </View>
            );
          })}
        </View>
      </Card>

      {/* ───── Therapy split ───── */}
      <SectionHeader title="Therapy split" />
      <Card padding={CARD_PAD}>
        <View style={styles.donutRow}>
          <DonutChart
            size={donutSize}
            stroke={Math.round(donutSize / 7)}
            slices={THERAPIES.map(t => ({ label: t, value: sum[t], color: therapyColor(t, colors) }))}
            centerTop={`${sum.totalMinutes}`}
            centerBottom="minutes"
          />
          <View style={styles.donutTable}>
            {THERAPIES.map((t, i) => {
              const pct = sum.totalMinutes ? Math.round((sum[t] / sum.totalMinutes) * 100) : 0;
              return (
                <View key={t} style={[styles.donutLine, i > 0 && styles.hairTop]}>
                  <View style={[styles.dot, { backgroundColor: therapyColor(t, colors) }]} />
                  <View style={styles.flex}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {THERAPY_META[t].label}
                    </Text>
                    <Text style={styles.smallMuted} numberOfLines={1}>
                      {sum[t]} min
                    </Text>
                  </View>
                  <Text style={styles.donutPct}>{pct}%</Text>
                </View>
              );
            })}
          </View>
        </View>
      </Card>

      {/* ───── Pain trend ───── */}
      <SectionHeader title="Pain trend" />
      <Card padding={CARD_PAD}>
        <View style={styles.chartHead}>
          <View style={styles.flex}>
            <Text style={styles.caption}>LATEST PAIN</Text>
            <Num value={today.pain} unit="/ 10" size={30} />
          </View>
          <View style={[styles.changePill, { backgroundColor: painCol + '1F' }]}>
            <Icon name={painGood ? 'trending-down' : 'trending-up'} size={15} color={painCol} />
            <Text style={[styles.changeText, { color: painCol }]} numberOfLines={1}>
              {Math.abs(sum.painChange)} {painGood ? 'lower' : 'higher'}
            </Text>
          </View>
        </View>

        <LineChart labels={labels} values={days.map(d => d.pain)} min={0} max={10} height={164} color={acc.pain} />

        <View style={[styles.statRow, styles.hairTop]}>
          {[
            { label: 'AVERAGE', value: `${sum.avgPain}` },
            { label: 'LOWEST', value: `${bestPain}` },
            { label: 'ACTIVE DAYS', value: `${sum.activeDays}/${days.length}` },
          ].map(s => (
            <View key={s.label} style={styles.stat}>
              <Text style={styles.caption} numberOfLines={1}>
                {s.label}
              </Text>
              <Num value={s.value} size={18} />
            </View>
          ))}
        </View>
      </Card>

      {/* ───── Recent sessions ───── */}
      <SectionHeader title="Recent sessions" />
      <Card padding={6}>
        {sessions.map((s, i) => {
          const col = therapyColor(s.therapy, colors);
          return (
            <View key={s.id} style={[styles.session, i > 0 && styles.hairTop]}>
              <View style={[styles.sessionIcon, { backgroundColor: col + '1F' }]}>
                <Icon name={THERAPY_META[s.therapy].icon} size={18} color={col} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {THERAPY_META[s.therapy].label} · {shortDate(s.date)}
                </Text>
                <Text style={styles.smallMuted} numberOfLines={1}>
                  {s.intensity}
                </Text>
              </View>
              <View style={styles.sessionRight}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {s.minutes} min
                </Text>
                <View style={styles.painRow}>
                  <Text style={styles.smallMuted}>Pain {s.painBefore}</Text>
                  <Icon name="arrow-right" size={12} color={colors.textMuted} style={styles.painArrow} />
                  <Text style={[styles.smallMuted, styles.painAfter]}>{s.painAfter}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </Card>

      <Text style={[styles.smallMuted, styles.sample]}>Sample data - your real sessions will appear here once the device logs them.</Text>
    </ScrollView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    content: { paddingHorizontal: PAGE_PAD, paddingBottom: DOCK_SPACE + 10 },
    flex: { flex: 1, minWidth: 0 },
    seg: { marginTop: 18 },
    first: { marginTop: 16 },

    // text
    caption: { fontFamily: fonts.medium, fontSize: 11.5, lineHeight: 15, fontWeight: '700', letterSpacing: 0.6, color: c.textMuted, includeFontPadding: false },
    smallLabel: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 13, lineHeight: 17, color: c.textSecondary, includeFontPadding: false },
    smallMuted: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 17, color: c.textMuted, includeFontPadding: false },
    rowTitle: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 20, fontWeight: '700', color: c.text, includeFontPadding: false },
    numRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'nowrap' },
    num: { fontFamily: fonts.bold, fontWeight: '800', letterSpacing: -0.4, includeFontPadding: false, flexShrink: 1 },
    unit: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 16, color: c.textMuted, marginLeft: 4, includeFontPadding: false, flexShrink: 0 },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 7 },
    labelRow: { flexDirection: 'row', alignItems: 'center' },
    hairTop: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.divider },

    // rings
    ringsRow: { flexDirection: 'row', alignItems: 'center' },
    ringsText: { flex: 1, minWidth: 0, marginLeft: 18 },
    ringLine: { marginTop: 8 },

    // tiles
    tiles: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5, marginTop: 10 },
    tileCell: { width: '50%', padding: 5 },
    tile: { padding: 14, borderRadius: radius.lg, backgroundColor: c.surface },
    tileIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },

    // bar chart card
    chartHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 },
    headRight: { alignItems: 'flex-end', marginLeft: 12 },
    legend: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    legendItem: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
    legendText: { marginLeft: 5 },
    dash: { flexDirection: 'row', marginRight: 6 },
    dashBit: { width: 4, height: 2, borderRadius: 1, marginRight: 2, backgroundColor: c.textMuted },
    breakRow: { flexDirection: 'row', marginTop: 16, paddingTop: 14, marginHorizontal: -6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.divider },
    breakCol: { flex: 1, minWidth: 0, paddingHorizontal: 6 },
    track: { height: 5, borderRadius: 3, marginTop: 8, overflow: 'hidden', backgroundColor: c.surfaceStrong },
    trackFill: { height: 5, borderRadius: 3 },

    // donut
    donutRow: { flexDirection: 'row', alignItems: 'center' },
    donutTable: { flex: 1, minWidth: 0, marginLeft: 18 },
    donutLine: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
    donutPct: { fontFamily: fonts.bold, fontWeight: '800', fontSize: 17, lineHeight: 22, color: c.text, marginLeft: 8, includeFontPadding: false },

    // pain
    changePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, marginLeft: 12, marginBottom: 4 },
    changeText: { fontFamily: fonts.medium, fontSize: 12.5, lineHeight: 16, fontWeight: '700', marginLeft: 4, includeFontPadding: false },
    statRow: { flexDirection: 'row', marginTop: 12, paddingTop: 14 },
    stat: { flex: 1, minWidth: 0 },

    // sessions
    session: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10 },
    sessionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    sessionRight: { alignItems: 'flex-end', marginLeft: 10 },
    painRow: { flexDirection: 'row', alignItems: 'center' },
    painArrow: { marginHorizontal: 3 },
    painAfter: { color: c.success, fontWeight: '700' },

    sample: { marginTop: 18, textAlign: 'center', fontStyle: 'italic' },
  });