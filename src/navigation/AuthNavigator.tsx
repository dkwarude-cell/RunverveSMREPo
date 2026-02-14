import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthStackParamList } from './types';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import BiometricSetupScreen from '../screens/auth/BiometricSetupScreen';
import PhoneVerificationScreen from '../screens/auth/PhoneVerificationScreen';

const Stack = createStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => (
  <Stack.Navigator
    initialRouteName="Welcome"
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: '#F7F9FC' },
      animationEnabled: true,
      gestureEnabled: true,
    }}
  >
    <Stack.Screen
      name="Welcome"
      component={WelcomeScreen}
      options={{ animationTypeForReplace: 'push' }}
    />
    <Stack.Screen
      name="Login"
      component={LoginScreen}
      options={{ gestureDirection: 'horizontal' }}
    />
    <Stack.Screen
      name="Signup"
      component={SignupScreen}
      options={{ gestureDirection: 'horizontal' }}
    />
    <Stack.Screen
      name="PhoneVerification"
      component={PhoneVerificationScreen}
      options={{ gestureDirection: 'horizontal' }}
    />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
  </Stack.Navigator>
);

export default AuthNavigator;
