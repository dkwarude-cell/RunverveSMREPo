/**
 * Screen - standard page wrapper: theme background, safe areas, keyboard handling and scroll.
 */
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  footer?: React.ReactNode; // sticks to the bottom (e.g. Continue button)
  header?: React.ReactNode; // stays at the top while content scrolls
};

export default function Screen({ children, scroll = true, contentStyle, footer, header }: Props) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const top = header ? 4 : insets.top + 12;

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {header ? <View style={[styles.header, { paddingTop: insets.top + 6 }]}>{header}</View> : null}
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.content, { paddingTop: top, paddingBottom: footer ? 24 : insets.bottom + 32 }, contentStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, styles.content, { paddingTop: top, paddingBottom: footer ? 0 : insets.bottom + 16 }, contentStyle]}>{children}</View>
        )}
        {footer ? <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: { paddingHorizontal: 18 },
  content: { paddingHorizontal: 20, flexGrow: 1 },
  footer: { paddingHorizontal: 20, paddingTop: 10 },
});
