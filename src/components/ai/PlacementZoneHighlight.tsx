import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { PlacementZone } from '../../models/AIModels';
import { theme } from '../../styles/theme';

interface Props {
  zone: PlacementZone | null;
  width: number;
  height: number;
}

const PlacementZoneHighlight: React.FC<Props> = ({ zone, width, height }) => {
  if (!zone) return null;

  const cx = (zone.x ?? 0.5) * width;
  const cy = (zone.y ?? 0.5) * height;
  const r = (zone.radius ?? 0.15) * Math.min(width, height);

  return (
    <View style={[StyleSheet.absoluteFill, { width, height }]} pointerEvents="none">
      <Svg width={width} height={height}>
        <Rect
          x={cx - r} y={cy - r} width={r * 2} height={r * 2}
          rx={8} ry={8}
          stroke={theme.colors.success} strokeWidth={2.5}
          fill="rgba(46, 204, 113, 0.15)"
          strokeDasharray="8,4"
        />
        <SvgText
          x={cx} y={cy - r - 8} textAnchor="middle"
          fontSize={12} fill={theme.colors.success} fontWeight="bold"
        >
          Place here
        </SvgText>
      </Svg>
    </View>
  );
};

export default React.memo(PlacementZoneHighlight);
