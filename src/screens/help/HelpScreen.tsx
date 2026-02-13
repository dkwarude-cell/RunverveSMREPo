import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { theme } from '../../styles/theme';

const FAQ_DATA = [
  { q: 'What is SmartHeal?', a: 'SmartHeal is a companion app for ITT electrotherapy devices. It provides AI-guided electrode placement, session management, and personalized therapy.' },
  { q: 'How does AI placement work?', a: 'Point your camera at the treatment area and the AI model detects body landmarks to guide you where to place the electrodes for optimal therapy.' },
  { q: 'Do I need Bluetooth?', a: 'Yes. The app communicates with your SmartHeal device via Bluetooth Low Energy (BLE). Make sure Bluetooth is enabled on your phone.' },
  { q: 'How do I pair a device?', a: 'Go to Devices → Scan → select your SmartHeal device. Follow the on-screen instructions to complete pairing.' },
  { q: 'What therapy modes are available?', a: 'Guided mode walks you through each step. Pro mode gives you full manual control over settings.' },
  { q: 'Is my data secure?', a: 'All data is encrypted in transit and at rest. Biometric authentication and secure storage are used for sensitive information.' },
  { q: 'How do I contact support?', a: 'Email us at support@runverve.com or visit our website at runverve.com/support.' },
];

const HelpScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Help & FAQ</Text>

      {FAQ_DATA.map((item, i) => (
        <FAQItem key={i} question={item.q} answer={item.a} />
      ))}

      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>Still need help?</Text>
        <TouchableOpacity onPress={() => Linking.openURL('mailto:support@runverve.com')}>
          <Text style={styles.contactLink}>Contact Support →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <TouchableOpacity style={styles.faqItem} onPress={() => setOpen(!open)} activeOpacity={0.7}>
      <View style={styles.faqHeader}>
        <Text style={styles.faqQ}>{question}</Text>
        <Text style={styles.faqToggle}>{open ? '−' : '+'}</Text>
      </View>
      {open && <Text style={styles.faqA}>{answer}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: theme.colors.text.primary, marginBottom: theme.spacing.lg },
  faqItem: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, marginBottom: theme.spacing.sm },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQ: { flex: 1, fontSize: 15, fontWeight: '600', color: theme.colors.text.primary },
  faqToggle: { fontSize: 20, color: theme.colors.primary, marginLeft: 8 },
  faqA: { fontSize: 14, color: theme.colors.text.secondary, marginTop: 8, lineHeight: 20 },
  contactCard: { marginTop: theme.spacing.lg, backgroundColor: theme.colors.primaryLight, borderRadius: theme.borderRadius.lg, padding: theme.spacing.lg, alignItems: 'center' },
  contactTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary },
  contactLink: { fontSize: 15, fontWeight: '600', color: theme.colors.primary, marginTop: 8 },
});

export default HelpScreen;
