/**
 * BodyMap - the interactive figure used to say where it hurts.
 *
 * The figure is built the way an artist's mannequin is: each part is its own rounded
 * segment with its own outline, overlapping its neighbours at the joints. That is what
 * makes it read as an articulated body rather than a flat silhouette, and it means a
 * selection is simply that segment filled in - a knee band wraps the knee, a lower-back
 * band spans the waist, with no clipping needed.
 *
 * Segments are authored once on the screen-left and mirrored, which keeps the two sides
 * symmetrical and the anatomy honest: seen from the front a person's right side is on your
 * left, and from behind it is not.
 */
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Ellipse, G, Path, Rect } from 'react-native-svg';

import { BodyRegion, BodySide, BodyView, regionsFor } from '../../data/bodyMap';
import { useTheme } from '../../theme';

export const VIEW_BOX = { width: 200, height: 420 };
const CX = VIEW_BOX.width / 2;

type Shape =
  | { k: 'rect'; x: number; y: number; w: number; h: number; r: number }
  | { k: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { k: 'path'; d: string };

const rect = (x: number, y: number, w: number, h: number, r: number): Shape => ({
  k: 'rect', x, y, w, h, r,
});
const ell = (cx: number, cy: number, rx: number, ry: number): Shape => ({
  k: 'ellipse', cx, cy, rx, ry,
});
const path = (d: string): Shape => ({ k: 'path', d });

/**
 * Every segment of the figure, in paint order: legs first, head last, so the overlaps fall
 * the way a body's do. `region` ties a segment to a selectable area; segments without one
 * are there to complete the figure.
 */
type Segment = {
  key: string;
  /** Region id without the side suffix; sided segments are drawn twice. */
  region?: string;
  sided?: boolean;
  shapes: Shape[];
};

// Limbs taper and bulge the way muscle does; a rounded rectangle reads as a robot.
const HAND = path('M53 198 q-4 13 -2 24 q4 9 12 7 q7 -3 7 -15 q0 -9 -2 -16 Z');
const ARM_UPPER = path('M45 86 q-4 25 3 52 q10 5 20 1 q4 -28 1 -55 q-13 -5 -24 2 Z');
const ARM_ELBOW = path('M48 134 q-3 11 0 22 q9 5 18 1 q3 -12 1 -23 q-10 -4 -19 0 Z');
const ARM_FORE = path('M49 154 q-3 23 4 46 q8 5 15 1 q5 -24 2 -47 q-10 -4 -21 0 Z');
const SHOULDER_CAP = path('M45 84 q-3 -18 12 -24 q16 -6 23 7 q4 10 2 20 q-18 7 -37 -3 Z');

const FRONT: Segment[] = [
  {
    key: 'thigh', region: 'thigh', sided: true,
    shapes: [path('M72 186 q-6 37 4 75 q11 6 22 1 q5 -39 3 -77 q-16 -6 -29 1 Z')],
  },
  {
    key: 'knee', region: 'knee', sided: true,
    shapes: [path('M73 256 q-3 14 0 28 q11 6 22 1 q3 -15 1 -29 q-12 -5 -23 0 Z')],
  },
  {
    key: 'shin', region: 'shin', sided: true,
    shapes: [path('M74 280 q-6 25 3 56 q9 5 17 1 q6 -29 2 -57 q-11 -5 -22 0 Z')],
  },
  {
    key: 'foot', region: 'foot', sided: true,
    shapes: [path('M75 330 q-6 15 -4 25 q9 7 23 3 q7 -5 4 -16 q-3 -7 -3 -12 Z')],
  },
  {
    key: 'hip', region: 'hip', sided: true,
    shapes: [path('M75 158 q-5 18 3 34 q12 10 22 2 V158 Z')],
  },
  {
    key: 'abdomen', region: 'abdomen',
    shapes: [path('M77 106 q-5 15 -1 28 q-3 14 2 27 q21 8 44 0 q5 -13 2 -27 q4 -13 -1 -28 q-23 8 -46 0 Z')],
  },
  {
    key: 'chest', region: 'chest',
    shapes: [path('M70 62 q30 -14 60 0 q3 24 -4 46 q-26 11 -52 0 q-7 -22 -4 -46 Z')],
  },
  { key: 'shoulder', region: 'shoulder', sided: true, shapes: [SHOULDER_CAP] },
  { key: 'upper_arm', region: 'upper_arm', sided: true, shapes: [ARM_UPPER] },
  { key: 'elbow', region: 'elbow', sided: true, shapes: [ARM_ELBOW] },
  { key: 'forearm', region: 'forearm', sided: true, shapes: [ARM_FORE, HAND] },
  {
    key: 'neck', region: 'neck_front',
    shapes: [path('M90 40 q-1 14 1 26 q9 5 18 0 q2 -12 1 -26 Z')],
  },
  {
    key: 'head', region: 'head',
    shapes: [path('M100 2 q19 0 21 23 q1 19 -11 27 q-10 4 -20 0 q-12 -8 -11 -27 q2 -23 21 -23 Z')],
  },
];

const BACK: Segment[] = [
  {
    key: 'hamstring', region: 'hamstring', sided: true,
    shapes: [path('M72 190 q-6 36 4 73 q11 6 22 1 q5 -38 3 -75 q-16 -6 -29 1 Z')],
  },
  {
    key: 'knee_back', sided: true,
    shapes: [path('M73 258 q-3 13 0 26 q11 6 22 1 q3 -14 1 -27 q-12 -5 -23 0 Z')],
  },
  {
    key: 'calf', region: 'calf', sided: true,
    shapes: [path('M74 280 q-7 26 3 56 q9 5 17 1 q7 -30 2 -57 q-11 -5 -22 0 Z')],
  },
  {
    key: 'heel', region: 'heel', sided: true,
    shapes: [path('M75 330 q-6 15 -4 25 q9 7 23 3 q7 -5 4 -16 q-3 -7 -3 -12 Z')],
  },
  {
    key: 'glute', region: 'glute', sided: true,
    shapes: [path('M75 160 q-5 18 3 34 q12 10 22 2 V160 Z')],
  },
  {
    key: 'lower_back', region: 'lower_back',
    shapes: [path('M77 122 q-5 18 -1 36 q22 9 46 0 q4 -18 -1 -36 q-23 8 -44 0 Z')],
  },
  {
    key: 'mid_back', region: 'mid_back',
    shapes: [path('M75 98 q-3 13 0 26 q24 8 50 0 q3 -13 0 -26 q-25 8 -50 0 Z')],
  },
  {
    key: 'upper_back', region: 'upper_back',
    shapes: [path('M70 62 q30 -14 60 0 q3 19 -3 38 q-27 10 -54 0 q-6 -19 -3 -38 Z')],
  },
  {
    key: 'shoulder_blade', region: 'shoulder_blade', sided: true,
    shapes: [path('M76 74 q-4 16 3 29 q8 4 14 -1 q4 -16 0 -30 q-9 -4 -17 2 Z')],
  },
  { key: 'shoulder_back', sided: true, shapes: [SHOULDER_CAP] },
  { key: 'upper_arm_back', sided: true, shapes: [ARM_UPPER] },
  { key: 'elbow_back', sided: true, shapes: [ARM_ELBOW] },
  { key: 'forearm_back', sided: true, shapes: [ARM_FORE, HAND] },
  {
    key: 'neck_back_seg', region: 'neck_back',
    shapes: [path('M90 40 q-1 14 1 26 q9 5 18 0 q2 -12 1 -26 Z')],
  },
  {
    key: 'head_back',
    shapes: [path('M100 2 q19 0 21 23 q1 19 -11 27 q-10 4 -20 0 q-12 -8 -11 -27 q2 -23 21 -23 Z')],
  },
];

/** Muscle definition drawn over the segments. */
const DETAIL: Record<BodyView, string[]> = {
  front: [
    'M100 66 V158',
    'M78 76 q12 19 22 20 q10 -1 22 -20',
    'M82 118 h36 M82 131 h36 M84 144 h32',
    'M76 160 q24 15 48 0',
    'M54 92 q7 11 6 22',
    'M146 92 q-7 11 -6 22',
  ],
  back: [
    'M100 66 V196',
    'M80 76 q20 9 40 0',
    'M82 136 q18 8 36 0',
    'M78 168 q22 11 44 0',
    'M54 92 q7 11 6 22',
    'M146 92 q-7 11 -6 22',
  ],
};

const onScreenLeft = (side: BodySide, view: BodyView) =>
  side === 'right' ? view === 'front' : view === 'back';

function ShapeView({
  shape,
  fill,
  stroke,
  flip,
}: {
  shape: Shape;
  fill: string;
  stroke: string;
  flip: boolean;
}) {
  // a hairline outline keeps the segments reading as one body rather than parts
  const common = { fill, stroke, strokeWidth: 0.7, strokeOpacity: 0.5, strokeLinejoin: 'round' as const };
  if (shape.k === 'ellipse') {
    return (
      <Ellipse
        cx={flip ? 2 * CX - shape.cx : shape.cx}
        cy={shape.cy}
        rx={shape.rx}
        ry={shape.ry}
        {...common}
      />
    );
  }
  if (shape.k === 'rect') {
    return (
      <Rect
        x={flip ? 2 * CX - shape.x - shape.w : shape.x}
        y={shape.y}
        width={shape.w}
        height={shape.h}
        rx={shape.r}
        {...common}
      />
    );
  }
  // a path is mirrored with a transform rather than by rewriting its data
  return (
    <Path
      d={shape.d}
      {...common}
      transform={flip ? `translate(${2 * CX} 0) scale(-1 1)` : undefined}
    />
  );
}

export type BodyMapProps = {
  view: BodyView;
  selectedIds: string[];
  onToggleRegion: (region: BodyRegion) => void;
  /** Region the image model pointed at, shown as a faint tint. */
  suggestedId?: string | null;
};

export default function BodyMap({
  view,
  selectedIds,
  onToggleRegion,
  suggestedId,
}: BodyMapProps) {
  const { c } = useTheme();
  const regions = useMemo(() => regionsFor(view), [view]);
  const segments = view === 'front' ? FRONT : BACK;

  const skin = c.surfaceStrong;
  const line = c.textMuted;

  /** The region a segment stands for on the given screen side. */
  const regionFor = (segment: Segment, screenLeft: boolean): BodyRegion | undefined => {
    if (!segment.region) return undefined;
    if (!segment.sided) return regions.find(r => r.id === segment.region);
    return regions.find(
      r =>
        r.id.replace(/_[lr]$/, '') === segment.region &&
        onScreenLeft(r.side, view) === screenLeft,
    );
  };

  const renderSegment = (segment: Segment, screenLeft: boolean) => {
    const region = regionFor(segment, screenLeft);
    const selected = region ? selectedIds.includes(region.id) : false;
    const suggested = !selected && region != null && region.id === suggestedId;
    const fill = selected ? c.primary : suggested ? c.primary + '55' : skin;
    const stroke = selected ? c.primary : line;

    return (
      <G
        key={`${segment.key}-${screenLeft ? 'l' : 'r'}`}
        onPress={region ? () => onToggleRegion(region) : undefined}
      >
        {segment.shapes.map((shape, index) => (
          <ShapeView key={index} shape={shape} fill={fill} stroke={stroke} flip={!screenLeft} />
        ))}
      </G>
    );
  };

  return (
    <View style={styles.wrap}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${VIEW_BOX.width} ${VIEW_BOX.height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <Ellipse cx={CX} cy={370} rx={52} ry={7} fill={line} opacity={0.16} />

        {segments.map(segment =>
          segment.sided
            ? [renderSegment(segment, true), renderSegment(segment, false)]
            : renderSegment(segment, true),
        )}

        <G stroke={line} strokeWidth={0.7} strokeOpacity={0.35} fill="none">
          {DETAIL[view].map(d => (
            <Path key={d} d={d} />
          ))}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
