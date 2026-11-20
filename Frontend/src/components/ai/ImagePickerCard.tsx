/**
 * ImagePickerCard - photo of the affected area: preview + Gallery / Camera buttons.
 * The preview uses a fixed pixel size (from the screen width) so the picked photo always shows.
 */
import React from 'react';
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Card from '../ui/Card';
import { PrimaryButton } from '../ui/Buttons';
import { fonts, radius, useTheme } from '../../theme';

interface Props {
  imageUri: string | null;
  onGallery: () => void;
  onCamera: () => void;
}

const SCREEN_PADDING = 18 * 2;
const CARD_PADDING = 16 * 2;

export default function ImagePickerCard({ imageUri, onGallery, onCamera }: Props) {
  const { c } = useTheme();
  const { width } = useWindowDimensions();
  const previewW = Math.round(width - SCREEN_PADDING - CARD_PADDING);
  const previewH = Math.round(previewW * 0.75);

  return (
    <Card>
      <View style={styles.titleRow}>
        <Icon name="camera-outline" size={20} color={c.primary} />
        <Text style={[styles.title, { color: c.text }]}>Photo of the affected area</Text>
      </View>

      {imageUri ? (
        <View>
          <Image key={imageUri} source={{ uri: imageUri }} style={[styles.image, { width: previewW, height: previewH }]} resizeMode="cover" />
          <View style={styles.readyPill}>
            <Icon name="check-circle" size={14} color="#FFFFFF" />
            <Text style={styles.readyText}>Photo ready</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.placeholder, { width: previewW, height: previewH * 0.8, backgroundColor: c.background }]}>
          <Icon name="image-plus" size={40} color={c.textMuted} />
          <Text style={[styles.placeholderText, { color: c.text }]}>Add a photo to start</Text>
          <Text style={[styles.placeholderHint, { color: c.textMuted }]}>Clear, well-lit and close to the area</Text>
        </View>
      )}

      <View style={styles.row}>
        <PrimaryButton title="Gallery" icon="image-outline" onPress={onGallery} compact style={styles.flex} />
        <View style={styles.gap} />
        <PrimaryButton title="Camera" icon="camera-outline" onPress={onCamera} compact style={styles.flex} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  title: { marginLeft: 8, fontFamily: fonts.medium, fontSize: 16, fontWeight: '700' },
  image: { borderRadius: radius.md, backgroundColor: '#222' },
  readyPill: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  readyText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginLeft: 5 },
  placeholder: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { marginTop: 10, fontFamily: fonts.medium, fontSize: 15, fontWeight: '700' },
  placeholderHint: { marginTop: 4, fontSize: 13 },
  row: { flexDirection: 'row', marginTop: 16 },
  flex: { flex: 1 },
  gap: { width: 10 },
});
