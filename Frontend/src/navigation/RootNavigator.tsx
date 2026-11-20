/**
 * RootNavigator - all screens of the app.
 *
 *  Splash ─┬─ (already logged in) ────────────────────────► Main (dock: Home · AI · Device · Stats · Assistant)
 *          └─ Welcome ─┬─ Login ──────────────────────────► Main
 *                      └─ SignUp ─► VerifyOtp ─► BasicInfo ─► MedicalHistory ─► Goals ─► Celebration ─► Main
 *  Main ─► Profile / Settings / About (from the menu)
 *  Main ─► TherapySession (Start therapy on an AI Scan report)
 */
import React from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RootStackParamList } from './types';
import { useTheme } from '../theme';

import SplashScreen from '../screens/auth/SplashScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import VerifyOtpScreen from '../screens/auth/VerifyOtpScreen';

import BasicInfoScreen from '../screens/onboarding/BasicInfoScreen';
import MedicalHistoryScreen from '../screens/onboarding/MedicalHistoryScreen';
import GoalsScreen from '../screens/onboarding/GoalsScreen';
import CelebrationScreen from '../screens/onboarding/CelebrationScreen';

import MainScreen from '../screens/main/MainScreen';
import ProfileScreen from '../screens/account/ProfileScreen';
import SettingsScreen from '../screens/account/SettingsScreen';
import AboutScreen from '../screens/account/AboutScreen';
import TherapySessionScreen from '../screens/main/therapy/TherapySessionScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { c, dark } = useTheme();
  const base = dark ? DarkTheme : DefaultTheme;
  const navTheme: Theme = {
    ...base,
    colors: { ...base.colors, background: c.background, card: c.background, primary: c.primary, text: c.text, border: c.divider },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: c.background },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />

        <Stack.Screen name="BasicInfo" component={BasicInfoScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="MedicalHistory" component={MedicalHistoryScreen} />
        <Stack.Screen name="Goals" component={GoalsScreen} />
        <Stack.Screen name="Celebration" component={CelebrationScreen} options={{ animation: 'fade', gestureEnabled: false }} />

        <Stack.Screen name="Main" component={MainScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="TherapySession" component={TherapySessionScreen} options={{ gestureEnabled: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
