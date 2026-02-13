import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootStackParamList } from './types';
import { RootState } from '../store';

import AuthNavigator from './AuthNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import MainNavigator from './MainNavigator';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { user, isLoading } = useSelector((s: RootState) => s.auth);
  const profile = useSelector((s: RootState) => s.user.profile);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Simulate checking auth state / splash screen delay
    const t = setTimeout(() => setIsReady(true), 500);
    return () => clearTimeout(t);
  }, []);

  if (!isReady || isLoading) {
    return <LoadingSpinner fullScreen message="Loading SmartHeal..." />;
  }

  const hasCompletedOnboarding = !!profile?.profileType;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* DEV: skip auth — go straight to Main */}
        <Stack.Screen name="Main" component={MainNavigator} />
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
