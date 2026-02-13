import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MainTabParamList, SessionStackParamList, DeviceStackParamList, ProfileStackParamList } from './types';
import { theme } from '../styles/theme';

// Screens
import HomeScreen from '../screens/home/HomeScreen';
import SessionConfigScreen from '../screens/session/SessionConfigScreen';
import AIPlacementScreen from '../screens/session/AIPlacementScreen';
import ActiveSessionScreen from '../screens/session/ActiveSessionScreen';
import SessionCompleteScreen from '../screens/session/SessionCompleteScreen';
import SessionHistoryScreen from '../screens/session/SessionHistoryScreen';
import DevicesListScreen from '../screens/device/DevicesListScreen';
import DeviceScanScreen from '../screens/device/DeviceScanScreen';
import DevicePairingScreen from '../screens/device/DevicePairingScreen';
import DeviceDetailsScreen from '../screens/device/DeviceDetailsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import AchievementsScreen from '../screens/profile/AchievementsScreen';
import GoalsScreen from '../screens/profile/GoalsScreen';
import AboutScreen from '../screens/profile/AboutScreen';
import HelpScreen from '../screens/help/HelpScreen';

// ─── Session Stack ───────────────────────────────────────
const SessionStack = createStackNavigator<SessionStackParamList>();

const SessionNavigator: React.FC = () => (
  <SessionStack.Navigator screenOptions={{ headerShown: false }}>
    <SessionStack.Screen name="SessionConfig" component={SessionConfigScreen} />
    <SessionStack.Screen name="AIPlacement" component={AIPlacementScreen} />
    <SessionStack.Screen name="ActiveSession" component={ActiveSessionScreen} />
    <SessionStack.Screen name="SessionComplete" component={SessionCompleteScreen} />
  </SessionStack.Navigator>
);

// ─── Device Stack ────────────────────────────────────────
const DeviceStack = createStackNavigator<DeviceStackParamList>();

const DeviceNavigator: React.FC = () => (
  <DeviceStack.Navigator screenOptions={{ headerShown: false }}>
    <DeviceStack.Screen name="DevicesList" component={DevicesListScreen} />
    <DeviceStack.Screen name="DeviceScan" component={DeviceScanScreen} />
    <DeviceStack.Screen name="DevicePairing" component={DevicePairingScreen} />
    <DeviceStack.Screen name="DeviceDetails" component={DeviceDetailsScreen} />
  </DeviceStack.Navigator>
);

// ─── Profile Stack ───────────────────────────────────────
const ProfileStack = createStackNavigator<ProfileStackParamList>();

const ProfileNavigator: React.FC = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="Profile" component={ProfileScreen} />
    <ProfileStack.Screen name="Settings" component={SettingsScreen} />
    <ProfileStack.Screen name="Achievements" component={AchievementsScreen} />
    <ProfileStack.Screen name="Goals" component={GoalsScreen} />
    <ProfileStack.Screen name="About" component={AboutScreen} />
    <ProfileStack.Screen name="Help" component={HelpScreen} />
  </ProfileStack.Navigator>
);

// ─── Main Tab Navigator ─────────────────────────────────
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.text.disabled,
      tabBarStyle: { borderTopColor: theme.colors.border },
    }}
  >
    <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Home', tabBarIcon: ({ color }) => tabIcon('🏠', color) }} />
    <Tab.Screen name="DevicesTab" component={DeviceNavigator} options={{ tabBarLabel: 'Devices', tabBarIcon: ({ color }) => tabIcon('🩹', color) }} />
    <Tab.Screen name="SessionTab" component={SessionNavigator} options={{ tabBarLabel: 'Session', tabBarIcon: ({ color }) => tabIcon('⚡', color) }} />
    <Tab.Screen name="HistoryTab" component={SessionHistoryScreen} options={{ tabBarLabel: 'History', tabBarIcon: ({ color }) => tabIcon('📊', color) }} />
    <Tab.Screen name="ProfileTab" component={ProfileNavigator} options={{ tabBarLabel: 'Profile', tabBarIcon: ({ color }) => tabIcon('👤', color) }} />
  </Tab.Navigator>
);

// We use emoji icons; for production swap to a vector icon library
const tabIcon = (emoji: string, _color: string) => {
  const React = require('react');
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
};

export default MainNavigator;
