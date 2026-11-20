/**
 * AppTour - first-visit guided tour: dims the screen, spotlights one part at a time and explains it.
 *   const ref = useTourTarget('hero');   <View ref={ref} collapsable={false}>...</View>
 *   useTourScroller(dy => ...)           a scrolling screen lets the tour bring targets into view
 *   <AppTour steps={[...]} registry={...} onFinish={...} />   (rendered by MainScreen, above the dock)
 * A step without a target (or whose target isn't on screen) is shown as a centred card.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fonts, radius, useTheme } from '../../theme';
import { PrimaryButton } from '../ui/Buttons';

// ───────── targets ─────────
export type TourRegistry = {
  targets: Map<string, View | null>;
  scrollBy?: (dy: number) => void;
};
const TourContext = createContext<TourRegistry>({ targets: new Map() });
export const TourRegistryProvider = TourContext.Provider;

/** the raw target map - for components that mark several targets in a loop (the dock tabs) */
export const useTourTargets = () => useContext(TourContext).targets;

/** attach the returned ref to the View the tour should spotlight */
export function useTourTarget(key: string) {
  const { targets } = useContext(TourContext);
  return useCallback(
    (v: View | null) => {
      targets.set(key, v);
    },
    [targets, key],
  );
}

/** lets the tour scroll this screen by dy so a target below / above the visible area comes into view */
export function useTourScroller(scrollBy: (dy: number) => void) {
  const registry = useContext(TourContext);
  useEffect(() => {
    registry.scrollBy = scrollBy;
    return () => {
      if (registry.scrollBy === scrollBy) registry.scrollBy = undefined;
    };
  }, [registry, scrollBy]);
}

// ───────── tour ─────────
export type TourStep = {
  target?: string;
  icon: string;
  title: string;
  text: string;
  fixed?: boolean; // target never moves with scrolling (the tab bar) - don't scroll the screen for it
};
type Rect = { x: number; y: number; w: number; h: number };

const PAD = 6; // space between the target and the spotlight edge
const CARD_GAP = 14;
const TOP_SAFE = 90; // status bar + header
const BOTTOM_SAFE = 96; // tab bar + a little room

export default function AppTour({
  steps,
  registry,
  onFinish,
}: {
  steps: TourStep[];
  registry: TourRegistry;
  onFinish: () => void;
}) {
  const { c } = useTheme();
  // the overlay's real size (the window height can leave out the status bar / tab bar area on some phones)
  const win = useWindowDimensions();
  const [size, setSize] = useState({ w: win.width, h: win.height });
  const W = size.w;
  const H = size.h;
  const [index, setIndex] = useState(0);
  const [hole, setHole] = useState<Rect | null>(null);
  const [measured, setMeasured] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const rootRef = useRef<View>(null); // positions are measured relative to the overlay itself (status bar offsets differ per phone)
  const step = steps[index];
  const last = index === steps.length - 1;

  // measure the target of the current step (window coordinates); scroll it into view first if needed
  const target = step.target;
  const fixed = !!step.fixed;
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setMeasured(false);
    fade.setValue(0);
    const view = target ? registry.targets.get(target) : null;
    const done = (r: Rect | null) => {
      if (cancelled) return;
      setHole(r);
      setMeasured(true);
      Animated.timing(fade, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    };
    if (!view) {
      done(null);
      return;
    }
    const measure = (allowScroll: boolean) =>
      rootRef.current?.measureInWindow((rx, ry) =>
        view.measureInWindow((wx, wy, w, h) => {
          const x = wx - rx;
          const y = wy - ry;
          if (cancelled) return;
          if (w <= 0 || h <= 0) return done(null);
          const dy =
            y + h > H - BOTTOM_SAFE
              ? y + h - (H - BOTTOM_SAFE)
              : y < TOP_SAFE
              ? y - TOP_SAFE
              : 0;
          if (dy !== 0 && allowScroll && !fixed && registry.scrollBy) {
            registry.scrollBy(dy);
            timer = setTimeout(() => measure(false), 380); // wait for the scroll animation
            return;
          }
          done(
            y < H && y + h > 0
              ? { x: x - PAD, y: y - PAD, w: w + PAD * 2, h: h + PAD * 2 }
              : null,
          );
        }),
      );
    measure(true);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [index, target, fixed, registry, fade, H]);

  // Android back: previous step, or close the tour on the first one
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (index > 0) setIndex(i => i - 1);
      else onFinish();
      return true;
    });
    return () => sub.remove();
  }, [index, onFinish]);

  const next = () => (last ? onFinish() : setIndex(i => i + 1));

  // dimmed layer with a rounded hole: outer rectangle + inner rounded rectangle, even-odd fill
  const r = hole ? Math.min(radius.lg + PAD, hole.h / 2) : 0;
  const path = hole
    ? `M0 0H${W}V${H}H0Z M${hole.x + r} ${hole.y}H${
        hole.x + hole.w - r
      }A${r} ${r} 0 0 1 ${hole.x + hole.w} ${hole.y + r}V${
        hole.y + hole.h - r
      }A${r} ${r} 0 0 1 ${hole.x + hole.w - r} ${hole.y + hole.h}H${
        hole.x + r
      }A${r} ${r} 0 0 1 ${hole.x} ${hole.y + hole.h - r}V${
        hole.y + r
      }A${r} ${r} 0 0 1 ${hole.x + r} ${hole.y}Z`
    : `M0 0H${W}V${H}H0Z`;

  // card goes below the spotlight when it is in the upper half of the screen, otherwise above it
  const below = hole ? hole.y + hole.h / 2 < H / 2 : false;
  const cardPos = !hole
    ? styles.cardCenter
    : below
    ? { top: hole.y + hole.h + CARD_GAP }
    : { bottom: H - hole.y + CARD_GAP };

  return (
    <View
      ref={rootRef}
      collapsable={false}
      onLayout={e => {
        const { width, height } = e.nativeEvent.layout;
        if (width !== W || height !== H) setSize({ w: width, h: height });
      }}
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
    >
      {/* swallow taps so the app underneath can't be used during the tour */}
      <Pressable style={StyleSheet.absoluteFill} onPress={() => {}}>
        <Svg width={W} height={H}>
          <Path d={path} fill="rgba(0,0,0,0.72)" fillRule="evenodd" />
          {hole ? (
            <Path
              d={path.slice(path.indexOf('Z') + 2)}
              fill="none"
              stroke={c.primary}
              strokeWidth={2}
            />
          ) : null}
        </Svg>
      </Pressable>

      {measured ? (
        <Animated.View
          style={[
            styles.card,
            cardPos,
            { backgroundColor: c.background, opacity: fade },
          ]}
        >
          <View style={styles.titleRow}>
            <View
              style={[styles.iconCircle, { backgroundColor: c.primary + '1F' }]}
            >
              <Icon name={step.icon} size={20} color={c.primary} />
            </View>
            <Text style={[styles.title, { color: c.text }]}>{step.title}</Text>
          </View>
          <Text style={[styles.text, { color: c.textSecondary }]}>
            {step.text}
          </Text>

          <View style={styles.footer}>
            <View style={styles.dots}>
              {steps.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { backgroundColor: i === index ? c.primary : c.divider },
                    i === index && styles.dotOn,
                  ]}
                />
              ))}
            </View>
            {!last ? (
              <Pressable onPress={onFinish} hitSlop={8} style={styles.skip}>
                <Text style={[styles.skipText, { color: c.textMuted }]}>
                  Skip
                </Text>
              </Pressable>
            ) : null}
            <PrimaryButton
              title={last ? 'Get started' : index === 0 ? 'Show me' : 'Next'}
              compact
              onPress={next}
            />
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: radius.lg,
    padding: 18,
    elevation: 8,
  },
  cardCenter: { top: '32%' },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: { flex: 1, fontFamily: fonts.bold, fontSize: 17, fontWeight: '700' },
  text: {
    fontFamily: fonts.regular,
    fontSize: 14.5,
    lineHeight: 21,
    marginTop: 10,
  },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  dots: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  dotOn: { width: 16 },
  skip: { paddingHorizontal: 12, paddingVertical: 8, marginRight: 4 },
  skipText: { fontFamily: fonts.medium, fontSize: 14, fontWeight: '600' },
});
