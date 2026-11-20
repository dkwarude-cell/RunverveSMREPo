/**
 * PhotoCard - black & white photo with a flat dark tint so white text stays readable.
 * If the photo can't load (offline) the dark block still looks intentional.
 */
import React from 'react';
import { ImageBackground, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { radius } from '../../theme';
import Touchable from './Touchable';

/** a web URL, or a bundled image: require('../assets/images/...') */
export type PhotoSource = string | number;

type Props = {
  image: PhotoSource;
  height?: number;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  rounded?: number;
  dim?: number; // darkness of the overlay that keeps white text readable (0-1)
};

export default function PhotoCard({ image, height = 200, children, style, onPress, rounded = radius.lg, dim = 0.42 }: Props) {
  const card = (
    <View style={[styles.card, { height, borderRadius: rounded }, style]}>
      <ImageBackground source={typeof image === 'string' ? { uri: image } : image} style={StyleSheet.absoluteFill} imageStyle={{ borderRadius: rounded }} resizeMode="cover" />
      <View style={[StyleSheet.absoluteFill, { borderRadius: rounded, backgroundColor: `rgba(0,0,0,${dim})` }]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
  return onPress ? <Touchable onPress={onPress}>{card}</Touchable> : card;
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', backgroundColor: '#1A1A1A' },
  content: { flex: 1, padding: 18, justifyContent: 'flex-end' },
});
