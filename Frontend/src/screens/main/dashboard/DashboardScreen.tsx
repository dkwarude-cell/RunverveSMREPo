/**
 * DashboardScreen - "Home" dock tab: greeting, hero, today's rings, device status,
 * therapy guides, how SmartHeal works and a daily tip.
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import TabHeader from '../../../components/layout/TabHeader';
import { useMainNav } from '../../../components/layout/MainNavContext';
import { useTourScroller, useTourTarget } from '../../../components/layout/AppTour';
import AppText from '../../../components/ui/AppText';
import Card from '../../../components/ui/Card';
import PhotoCard from '../../../components/ui/PhotoCard';
import Sheet from '../../../components/ui/Sheet';
import { Pill, SectionHeader } from '../../../components/ui/Bits';
import { PrimaryButton } from '../../../components/ui/Buttons';
import { ActivityRings } from '../../../components/charts/Charts';
import { Spans } from '../../../components/ai/RichText';
import { parseInline } from '../../../utils/markdown';
import { useUser } from '../../../context/UserContext';
import { useBleSnapshot } from '../../../services/bleService';
import { IMAGES } from '../../../data/images';
import { THERAPY_INFO, TIPS } from '../../../data/therapyInfo';
import { THERAPY_META, Therapy, buildDays, therapyColor } from '../../../data/sampleStats';
import { DOCK_SPACE, fonts, radius, useStyles, useTheme } from '../../../theme';
import type { Palette } from '../../../theme';

const THERAPIES: Therapy[] = ['heat', 'vibration', 'tens'];
const greetingFor = (h: number) => (h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');

const STEPS = [
  { icon: 'camera-outline', title: 'Snap a photo', text: 'Take a picture of the injured area and describe your pain - age, height and weight come from your profile.' },
  { icon: 'chip', title: 'Two ML models', text: '**ResNet50** finds the body part and wound type. **Random Forest** predicts heat, vibration and TENS settings.' },
  { icon: 'robot-outline', title: 'AI double-checks', text: 'A **Gemini** agent verifies both models, applies safety rules and explains the plan.' },
  { icon: 'bluetooth-connect', title: 'Therapy on device', text: 'Use the plan on your SmartHeal device and track progress in *Stats*.' },
];

export default function DashboardScreen(_: { active: boolean }) {
  const { c } = useTheme();
  const s = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { setTab } = useMainNav();
  const { firstName } = useUser();
  const { connectedDevice, heartRate, batteryLevel } = useBleSnapshot();
  const [guide, setGuide] = useState<Therapy | null>(null);
  // parts spotlighted by the first-visit tour (AppTour, started from MainScreen)
  const heroRef = useTourTarget('hero');
  const todayRef = useTourTarget('today');
  const deviceRef = useTourTarget('device');
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  useTourScroller(useCallback((dy: number) => scrollRef.current?.scrollTo({ y: Math.max(0, scrollY.current + dy), animated: true }), []));

  const now = new Date();
  const dateText = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const today = useMemo(() => buildDays(1)[0], []);
  const tip = TIPS[now.getDate() % TIPS.length];
  const deviceName = connectedDevice?.name || connectedDevice?.localName || 'SmartHeal device';

  return (
    <ScrollView
      ref={scrollRef}
      onScroll={e => {
        scrollY.current = e.nativeEvent.contentOffset.y;
      }}
      scrollEventThrottle={32}
      style={{ backgroundColor: c.background }} contentContainerStyle={[s.content, { paddingTop: insets.top + 10 }]} showsVerticalScrollIndicator={false}>
      <TabHeader kicker={dateText} title={`${greetingFor(now.getHours())}, ${firstName}`} />

      {/* ───── Hero ───── */}
      <View ref={heroRef} collapsable={false} style={s.hero}>
      <PhotoCard image={IMAGES.hero} height={220} dim={0.15} onPress={() => setTab('analysis')}>
        <AppText variant="h1" tone="white">
          Scan. Analyse.{'\n'}Recover.
        </AppText>
        <View style={s.heroRow}>
          <AppText variant="small" tone="white" style={s.heroText}>
            A personal heat, vibration and TENS plan from one photo.
          </AppText>
          <View style={s.heroArrow}>
            <Icon name="arrow-right" size={20} color="#FFF" />
          </View>
        </View>
      </PhotoCard>
      </View>

      {/* ───── Today ───── */}
      <SectionHeader title="Today" action="See stats" onAction={() => setTab('stats')} />
      <View ref={todayRef} collapsable={false}>
      <Card>
        <View style={s.todayRow}>
          <ActivityRings rings={THERAPIES.map(t => ({ value: today[t], goal: THERAPY_META[t].goal, color: therapyColor(t, c) }))} size={128} stroke={12} />
          <View style={s.todayLegend}>
            {THERAPIES.map(t => (
              <View key={t} style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: therapyColor(t, c) }]} />
                <View>
                  <AppText variant="small" tone="secondary">
                    {THERAPY_META[t].label}
                  </AppText>
                  <AppText style={s.legendValue}>
                    {today[t]}
                    <AppText variant="small" tone="muted">{` / ${THERAPY_META[t].goal} min`}</AppText>
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        </View>
        <AppText variant="small" tone="muted" style={s.sample}>
          Sample data until the device logs sessions.
        </AppText>
      </Card>
      </View>

      {/* ───── Device ───── */}
      <SectionHeader title="Your device" />
      <View ref={deviceRef} collapsable={false}>
      <Card onPress={() => setTab('device')}>
        <View style={s.deviceRow}>
          <View style={[s.deviceIcon, { backgroundColor: connectedDevice ? c.primary : c.surfaceStrong }]}>
            <Icon name={connectedDevice ? 'bluetooth-connect' : 'bluetooth-off'} size={22} color={connectedDevice ? '#FFF' : c.textSecondary} />
          </View>
          <View style={s.flex}>
            <AppText style={s.deviceTitle}>{connectedDevice ? deviceName : 'No device connected'}</AppText>
            <AppText variant="small" tone="muted">
              {connectedDevice ? 'Live data syncing' : 'Tap to scan and connect'}
            </AppText>
          </View>
          <Pill text={connectedDevice ? 'Online' : 'Offline'} color={connectedDevice ? c.success : c.gray} />
        </View>
        <View style={[s.metrics, { borderTopColor: c.divider }]}>
          <Metric icon="heart-pulse" label="Heart rate" value={heartRate != null ? `${heartRate}` : '--'} unit="bpm" />
          <Metric icon="battery-charging-70" label="Battery" value={batteryLevel != null ? `${batteryLevel}` : '--'} unit="%" />
          <Metric icon="signal" label="Status" value={connectedDevice ? 'Ready' : 'Idle'} />
        </View>
      </Card>
      </View>

      {/* ───── Therapy guides ───── */}
      <SectionHeader title="Therapy guides" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hList} style={s.hScroll}>
        {THERAPIES.map(t => (
          <PhotoCard key={t} image={THERAPY_INFO[t].image} height={190} style={s.guideCard} onPress={() => setGuide(t)}>
            <Icon name={THERAPY_META[t].icon} size={22} color="#FFF" style={s.guideIcon} />
            <AppText style={s.guideTitle} tone="white">
              {THERAPY_INFO[t].title}
            </AppText>
            <AppText variant="small" tone="white">
              {THERAPY_INFO[t].tagline}
            </AppText>
          </PhotoCard>
        ))}
      </ScrollView>

      {/* ───── How it works ───── */}
      <SectionHeader title="How SmartHeal works" />
      <Card>
        {STEPS.map((step, i) => (
          <View key={step.title} style={s.step}>
            <View style={s.stepLeft}>
              <View style={[s.stepNum, { backgroundColor: c.ink }]}>
                <AppText style={s.stepNumText} tone="onInk">
                  {i + 1}
                </AppText>
              </View>
              {i < STEPS.length - 1 ? <View style={[s.stepLine, { backgroundColor: c.surfaceStrong }]} /> : null}
            </View>
            <View style={s.stepBody}>
              <AppText style={s.stepTitle}>{step.title}</AppText>
              <Spans spans={parseInline(step.text)} style={[s.stepText, { color: c.textSecondary }]} />
            </View>
          </View>
        ))}
      </Card>

      {/* ───── Tip ───── */}
      <SectionHeader title="Tip of the day" />
      <Card tint={c.primarySoft}>
        <View style={s.tipRow}>
          <Icon name="lightbulb-on-outline" size={22} color={c.primary} />
          <Spans spans={parseInline(tip)} style={[s.tipText, { color: c.text }]} />
        </View>
      </Card>

      <AppText variant="small" tone="muted" center style={s.disclaimer}>
        SmartHeal offers AI-based guidance only and is not a substitute for professional medical advice.
      </AppText>

      {/* ───── Therapy guide sheet ───── */}
      <Sheet visible={!!guide} onClose={() => setGuide(null)} title={guide ? THERAPY_INFO[guide].title : ''} subtitle={guide ? THERAPY_INFO[guide].tagline : ''} scroll>
        {guide ? (
          <View>
            <AppText variant="body" tone="secondary">
              {THERAPY_INFO[guide].how}
            </AppText>
            <View style={s.rangeRow}>
              {THERAPY_INFO[guide].range.map(r => (
                <View key={r.label} style={[s.rangeBox, { backgroundColor: c.surface }]}>
                  <AppText variant="caption" tone="muted">
                    {r.label}
                  </AppText>
                  <AppText style={s.rangeValue}>{r.value}</AppText>
                </View>
              ))}
            </View>
            <AppText variant="h3" style={s.listTitle}>
              Helps with
            </AppText>
            {THERAPY_INFO[guide].helps.map(h => (
              <View key={h} style={s.listRow}>
                <Icon name="check" size={18} color={c.success} />
                <AppText style={s.listText}>{h}</AppText>
              </View>
            ))}
            <AppText variant="h3" style={s.listTitle}>
              Avoid if
            </AppText>
            {THERAPY_INFO[guide].avoid.map(h => (
              <View key={h} style={s.listRow}>
                <Icon name="close" size={18} color={c.danger} />
                <AppText style={s.listText}>{h}</AppText>
              </View>
            ))}
            <PrimaryButton
              title="Get my personal settings"
              icon="line-scan"
              style={s.sheetBtn}
              onPress={() => {
                setGuide(null);
                setTab('analysis');
              }}
            />
          </View>
        ) : null}
      </Sheet>
    </ScrollView>
  );
}

function Metric({ icon, label, value, unit }: { icon: string; label: string; value: string; unit?: string }) {
  const { c } = useTheme();
  const s = useStyles(makeStyles);
  return (
    <View style={s.metric}>
      <Icon name={icon} size={18} color={c.primary} />
      <AppText style={s.metricValue}>
        {value}
        {unit ? <AppText variant="small" tone="muted">{` ${unit}`}</AppText> : null}
      </AppText>
      <AppText variant="small" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

const makeStyles = (_c: Palette) =>
  StyleSheet.create({
    content: { paddingHorizontal: 18, paddingBottom: DOCK_SPACE + 10 },
    flex: { flex: 1 },
    hero: { marginTop: 22 },
    heroRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    heroText: { flex: 1, opacity: 0.9 },
    heroArrow: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#E11D2E', alignItems: 'center', justifyContent: 'center', marginLeft: 12 },

    todayRow: { flexDirection: 'row', alignItems: 'center' },
    todayLegend: { flex: 1, marginLeft: 18 },
    legendItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
    legendValue: { fontFamily: fonts.bold, fontSize: 19, fontWeight: '800' },
    sample: { marginTop: 12, fontStyle: 'italic' },

    deviceRow: { flexDirection: 'row', alignItems: 'center' },
    deviceIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    deviceTitle: { fontFamily: fonts.medium, fontWeight: '700', fontSize: 16 },
    metrics: { flexDirection: 'row', marginTop: 16, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
    metric: { flex: 1, alignItems: 'center' },
    metricValue: { fontFamily: fonts.bold, fontSize: 19, fontWeight: '800', marginTop: 4 },

    hScroll: { marginHorizontal: -18 },
    hList: { paddingHorizontal: 18, gap: 12 },
    guideCard: { width: 230 },
    guideIcon: { marginBottom: 8 },
    guideTitle: { fontFamily: fonts.bold, fontSize: 18, fontWeight: '800' },

    step: { flexDirection: 'row' },
    stepLeft: { alignItems: 'center', width: 28, marginRight: 12 },
    stepNum: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    stepNumText: { fontWeight: '700', fontSize: 13 },
    stepLine: { flex: 1, width: 2, marginVertical: 4 },
    stepBody: { flex: 1, paddingBottom: 16 },
    stepTitle: { fontFamily: fonts.medium, fontWeight: '700', fontSize: 15, marginTop: 3 },
    stepText: { fontSize: 13.5, lineHeight: 20, marginTop: 3 },

    tipRow: { flexDirection: 'row', alignItems: 'flex-start' },
    tipText: { flex: 1, marginLeft: 12, fontSize: 14.5, lineHeight: 21 },
    disclaimer: { marginTop: 22, fontStyle: 'italic' },

    rangeRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
    rangeBox: { flex: 1, padding: 12, borderRadius: radius.md },
    rangeValue: { fontFamily: fonts.bold, fontSize: 17, fontWeight: '800', marginTop: 4 },
    listTitle: { marginTop: 18, marginBottom: 8 },
    listRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
    listText: { marginLeft: 10, flex: 1 },
    sheetBtn: { marginTop: 20 },
  });
