import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { Keypoint, KEYPOINT_NAMES } from '../../models/AIModels';
import { theme } from '../../styles/theme';

interface Props {
  keypoints: Keypoint[];
  width: number;
  height: number;
}

const SKELETON_PAIRS: [number, number][] = [
  [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
  [5, 11], [6, 12], [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
];

const getKeypointScore = (kp: Keypoint): number => kp.score ?? kp.confidence;

const BodyOverlay: React.FC<Props> = ({ keypoints, width, height }) => {
  if (keypoints.length === 0) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { width, height }]} pointerEvents="none">
      <Svg width={width} height={height}>
        {/* Skeleton lines */}
        {SKELETON_PAIRS.map(([a, b], i) => {
          const kpA = keypoints[a];
          const kpB = keypoints[b];
          if (!kpA || !kpB || getKeypointScore(kpA) < 0.3 || getKeypointScore(kpB) < 0.3) return null;
          return (
            <Line
              key={`line-${i}`}
              x1={kpA.x * width} y1={kpA.y * height}
              x2={kpB.x * width} y2={kpB.y * height}
              stroke={theme.colors.primary} strokeWidth={2} opacity={0.7}
            />
          );
        })}

        {/* Keypoints */}
        {keypoints.map((kp, i) => {
          if (getKeypointScore(kp) < 0.3) return null;
          return (
            <Circle
              key={`kp-${i}`}
              cx={kp.x * width} cy={kp.y * height}
              r={4} fill={theme.colors.primary}
            />
          );
        })}
      </Svg>
    </View>
  );
};

export default React.memo(BodyOverlay);
