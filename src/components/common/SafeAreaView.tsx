import React from 'react';
import { SafeAreaView as RNSafeAreaView, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../styles/theme';

interface SafeAreaViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const SafeAreaView: React.FC<SafeAreaViewProps> = ({ children, style }) => {
  return <RNSafeAreaView style={[styles.container, style]}>{children}</RNSafeAreaView>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});

export default SafeAreaView;
