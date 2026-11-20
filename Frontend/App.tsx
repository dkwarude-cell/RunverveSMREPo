/**
 * SmartHeal - app entry.
 * Providers: safe areas -> logged-in user -> light/dark theme -> pop-ups -> navigation.
 */
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RootNavigator from './src/navigation/RootNavigator';
import UserProvider from './src/context/UserContext';
import ThemeProvider from './src/theme/ThemeContext';
import AppModalProvider from './src/components/feedback/AppModalProvider';

export default function App() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <ThemeProvider>
          <AppModalProvider>
            <RootNavigator />
          </AppModalProvider>
        </ThemeProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}
