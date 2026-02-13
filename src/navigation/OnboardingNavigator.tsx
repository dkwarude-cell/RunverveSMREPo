import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { OnboardingStackParamList } from './types';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import ProfileTypeSelectionScreen from '../screens/onboarding/ProfileTypeSelectionScreen';
import PersonalDetailsScreen from '../screens/onboarding/PersonalDetailsScreen';
import InterestsSelectionScreen from '../screens/onboarding/InterestsSelectionScreen';
import GoalSettingScreen from '../screens/onboarding/GoalSettingScreen';
import OnboardingCompleteScreen from '../screens/onboarding/OnboardingCompleteScreen';

const Stack = createStackNavigator<OnboardingStackParamList>();

const OnboardingNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="ProfileTypeSelection" component={ProfileTypeSelectionScreen} />
    <Stack.Screen name="PersonalDetails" component={PersonalDetailsScreen} />
    <Stack.Screen name="InterestsSelection" component={InterestsSelectionScreen} />
    <Stack.Screen name="GoalSetting" component={GoalSettingScreen} />
    <Stack.Screen name="OnboardingComplete" component={OnboardingCompleteScreen} />
  </Stack.Navigator>
);

export default OnboardingNavigator;
