/**
 * CelebrationScreen - end of onboarding: a check mark, a short message, then Main.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppText from '../../components/ui/AppText';
import { PrimaryButton } from '../../components/ui/Buttons';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../theme';
import { ScreenProps } from '../../navigation/types';

export default function CelebrationScreen({ navigation }: ScreenProps<'Celebration'>) {
  const { c } = useTheme();
  const { firstName } = useUser();
  const scale = useRef(new Animated.Value(0.6)).current;
  const left = useRef(false);

  const goHome = () => {
    if (left.current) return; // button tap and auto-timer must not both navigate
    left.current = true;
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
    const t = setTimeout(goHome, 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <Animated.View style={[styles.badge, { backgroundColor: c.primary, transform: [{ scale }] }]}>
        <Icon name="check-bold" size={52} color="#FFFFFF" />
      </Animated.View>
      <AppText variant="h1" center style={styles.title}>
        You’re all set{firstName ? `, ${firstName}` : ''}!
      </AppText>
      <AppText variant="body" tone="secondary" center>
        Your SmartHeal profile is ready.
      </AppText>
      <PrimaryButton title="Go to home" iconRight="arrow-right" onPress={goHome} style={styles.btn} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  badge: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 26, marginBottom: 6 },
  btn: { marginTop: 30, alignSelf: 'stretch' },
});
