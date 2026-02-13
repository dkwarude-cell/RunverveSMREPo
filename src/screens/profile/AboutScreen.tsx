import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { theme } from '../../styles/theme';
import Constants from 'expo-constants';

const AboutScreen: React.FC = () => {
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.logo}>🩹</Text>
      <Text style={styles.appName}>SmartHeal</Text>
      <Text style={styles.tagline}>by Runverve</Text>
      <Text style={styles.version}>Version {version}</Text>

      <View style={styles.section}>
        <Text style={styles.body}>
          SmartHeal is an AI-powered companion app for ITT therapy devices. It provides guided electrode placement,
          session management, voice control, and personalized therapy experiences.
        </Text>
      </View>

      <View style={styles.links}>
        <LinkRow label="Website" url="https://runverve.com" />
        <LinkRow label="Privacy Policy" url="https://runverve.com/privacy" />
        <LinkRow label="Terms of Service" url="https://runverve.com/terms" />
        <LinkRow label="Support" url="mailto:support@runverve.com" />
      </View>

      <Text style={styles.copyright}>© {new Date().getFullYear()} Runverve. All rights reserved.</Text>
    </ScrollView>
  );
};

const LinkRow: React.FC<{ label: string; url: string }> = ({ label, url }) => (
  <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL(url)}>
    <Text style={styles.linkLabel}>{label}</Text>
    <Text style={styles.chevron}>›</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, alignItems: 'center' },
  logo: { fontSize: 56, marginTop: theme.spacing.xl },
  appName: { fontSize: 28, fontWeight: '700', color: theme.colors.text.primary, marginTop: 4 },
  tagline: { fontSize: 14, color: theme.colors.primary, fontWeight: '500' },
  version: { fontSize: 13, color: theme.colors.text.disabled, marginTop: 4 },
  section: { marginTop: theme.spacing.lg, width: '100%' },
  body: { fontSize: 14, color: theme.colors.text.secondary, lineHeight: 22, textAlign: 'center' },
  links: { width: '100%', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, overflow: 'hidden', marginTop: theme.spacing.lg, ...theme.shadows.sm },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: theme.spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  linkLabel: { fontSize: 15, color: theme.colors.primary },
  chevron: { fontSize: 20, color: theme.colors.text.disabled },
  copyright: { fontSize: 12, color: theme.colors.text.disabled, marginTop: theme.spacing.xl },
});

export default AboutScreen;
