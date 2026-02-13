import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../styles/theme';
import Button from '../../components/common/Button';
import SafeAreaView from '../../components/common/SafeAreaView';
import Card from '../../components/common/Card';
import { ProfileType } from '../../models/User';
import { useDispatch } from 'react-redux';
import { updateProfile } from '../../store/slices/userSlice';

const PROFILE_OPTIONS: { type: ProfileType; icon: string; title: string; description: string }[] = [
  { type: 'runner', icon: '🏃', title: 'Runner', description: 'Marathon, sprinting, trail running & recovery' },
  { type: 'coach', icon: '📋', title: 'Coach', description: 'Client management, rehab & strength training' },
  { type: 'wellness', icon: '🧘', title: 'Wellness', description: 'Pain management, stress relief & flexibility' },
];

export default function ProfileTypeSelectionScreen({ navigation }: any) {
  const [selected, setSelected] = useState<ProfileType | null>(null);
  const dispatch = useDispatch();

  const handleNext = () => {
    if (!selected) return;
    dispatch(updateProfile({ profileType: selected }));
    navigation.navigate('PersonalDetails');
  };

  return (
    <SafeAreaView>
      <View style={styles.container}>
        <Text style={styles.title}>Choose Your Profile</Text>
        <Text style={styles.subtitle}>Select the profile that best describes you</Text>

        {PROFILE_OPTIONS.map((opt) => (
          <Card
            key={opt.type}
            onPress={() => setSelected(opt.type)}
            style={[styles.card, selected === opt.type && styles.selectedCard]}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardIcon}>{opt.icon}</Text>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{opt.title}</Text>
                <Text style={styles.cardDescription}>{opt.description}</Text>
              </View>
            </View>
          </Card>
        ))}

        <Button title="Next" onPress={handleNext} disabled={!selected} size="lg" style={styles.button} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xxl },
  title: { ...theme.typography.h2, color: theme.colors.text.primary, marginBottom: theme.spacing.xs },
  subtitle: { ...theme.typography.body, color: theme.colors.text.secondary, marginBottom: theme.spacing.xl },
  card: { marginBottom: theme.spacing.md },
  selectedCard: { borderWidth: 2, borderColor: theme.colors.primary },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: { fontSize: 40, marginRight: theme.spacing.md },
  cardText: { flex: 1 },
  cardTitle: { ...theme.typography.h3, color: theme.colors.text.primary },
  cardDescription: { ...theme.typography.caption, color: theme.colors.text.secondary },
  button: { marginTop: theme.spacing.lg },
});
