/**
 * SplashScreen - glowing logo on brand red for a moment, then:
 *   already logged in -> Main
 *   not logged in     -> Welcome
 * Android's launch screen (SplashTheme, res/drawable/splash_background.xml) draws the same logo at the same size,
 * so the app shows it from the first frame and this screen just takes over seamlessly.
 */
import React, { useEffect, useState } from 'react';
import { Image, NativeModules, Platform, StatusBar, StyleSheet, View } from 'react-native';
import { useUser } from '../../context/UserContext';
import { ScreenProps } from '../../navigation/types';

// logo with its white glow baked in. Android: the copy in res/drawable-xxxhdpi (no download from Metro in debug builds).
const LOGO_GLOW = Platform.OS === 'android' ? { uri: 'splash_logo' } : require('../../assets/images/smartheal-logo-glow.png');
const SPLASH_RED = '#EF4444';
// total time from tapping the icon (native launch screen + this screen); always under 3 s
const SPLASH_TOTAL_MS = 2500;
const SplashNative = NativeModules.SplashBackground; // Android only (android/.../SplashBackgroundModule.kt)
const startedAt: number | undefined = SplashNative?.startedAt ?? SplashNative?.getConstants?.().startedAt;

export default function SplashScreen({ navigation }: ScreenProps<'Splash'>) {
  const { user, initializing } = useUser();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Android: count from app start (JS may have taken a while to load); iOS: from now
    const remaining = startedAt ? SPLASH_TOTAL_MS - (Date.now() - startedAt) : 1500;
    const t = setTimeout(() => setReady(true), Math.max(0, remaining));
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (ready && !initializing) {
      SplashNative?.restore(); // launch window background red -> white
      navigation.replace(user ? 'Main' : 'Welcome');
    }
  }, [ready, initializing, user, navigation]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Image source={LOGO_GLOW} style={styles.logo} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: SPLASH_RED },
  logo: { width: 288, height: 288 }, // = splash_logo.png 1152x1152 px at xxxhdpi, matches the native launch screen
});
