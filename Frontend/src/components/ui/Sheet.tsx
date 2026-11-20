/**
 * Sheet - bottom sheet (plain slide-up modal) used for forgot password, pickers, edit profile, etc.
 * When the keyboard opens, the sheet moves up so it sits right on top of the keyboard.
 */
import React, { useEffect, useState } from 'react';
import { Keyboard, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fonts, radius, useTheme } from '../../theme';

type Props = { visible: boolean; onClose: () => void; title?: string; subtitle?: string; children: React.ReactNode; scroll?: boolean };

export default function Sheet({ visible, onClose, title, subtitle, children, scroll }: Props) {
  const { c } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const Body = scroll ? ScrollView : View;

  // keyboard height (0 = closed) - the sheet sits on top of it
  const [kb, setKb] = useState(0);
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, e => setKb(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setKb(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // reset when the sheet closes (keyboard events may not arrive after that)
  useEffect(() => {
    if (!visible) setKb(0);
  }, [visible]);

  const maxHeight = kb ? height - kb - insets.top - 24 : height * 0.88;

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.flex}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: c.overlay }]} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: c.background,
              bottom: kb,
              maxHeight,
              paddingBottom: kb ? 18 : insets.bottom + 18,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: c.surfaceStrong }]} />
          {title ? (
            <View style={styles.header}>
              <View style={styles.flex}>
                <Text style={[styles.title, { color: c.text }]}>{title}</Text>
                {subtitle ? <Text style={[styles.subtitle, { color: c.textSecondary }]}>{subtitle}</Text> : null}
              </View>
              <Pressable onPress={onClose} hitSlop={12} style={[styles.close, { backgroundColor: c.surface }]}>
                <Icon name="close" size={20} color={c.text} />
              </Pressable>
            </View>
          ) : null}
          <Body
            {...(scroll ? { keyboardShouldPersistTaps: 'handled', showsVerticalScrollIndicator: false } : {})}
            style={scroll ? styles.scrollBody : undefined}
          >
            {children}
          </Body>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  title: { fontFamily: fonts.bold, fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  close: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  scrollBody: { flexGrow: 0 },
});