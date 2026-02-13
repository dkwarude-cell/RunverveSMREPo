import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

interface Props {
  connected: boolean;
  deviceName?: string;
}

const ConnectionStatus: React.FC<Props> = ({ connected, deviceName }) => (
  <View style={[styles.container, connected ? styles.connectedBg : styles.disconnectedBg]}>
    <View style={[styles.dot, connected ? styles.dotGreen : styles.dotRed]} />
    <Text style={styles.label}>{connected ? `Connected to ${deviceName || 'device'}` : 'Not connected'}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, alignSelf: 'flex-start' },
  connectedBg: { backgroundColor: 'rgba(46,204,113,0.12)' },
  disconnectedBg: { backgroundColor: 'rgba(231,76,60,0.12)' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  dotGreen: { backgroundColor: theme.colors.success },
  dotRed: { backgroundColor: theme.colors.error },
  label: { fontSize: 13, fontWeight: '500', color: theme.colors.text.primary },
});

export default React.memo(ConnectionStatus);
