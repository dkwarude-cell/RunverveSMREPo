import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { theme } from '../../styles/theme';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import SafeAreaView from '../../components/common/SafeAreaView';
import { useDispatch } from 'react-redux';
import { updateProfile } from '../../store/slices/userSlice';
import { isValidAge, isValidWeight, isValidHeight } from '../../utils/validators';
import { calculateBMI } from '../../utils/formatters';

export default function PersonalDetailsScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState('prefer_not_to_say');
  const [activityLevel, setActivityLevel] = useState('moderately_active');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!isValidAge(Number(age))) e.age = 'Age must be between 13 and 120';
    if (!isValidWeight(Number(weight))) e.weight = 'Weight must be between 30 and 300 kg';
    if (!isValidHeight(Number(height))) e.height = 'Height must be between 100 and 250 cm';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    const bmi = calculateBMI(Number(weight), Number(height));
    dispatch(
      updateProfile({
        age: Number(age),
        weight: Number(weight),
        height: Number(height),
        gender: gender as any,
        activityLevel: activityLevel as any,
      }),
    );
    navigation.navigate('InterestsSelection');
  };

  return (
    <SafeAreaView>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Personal Details</Text>
          <Text style={styles.subtitle}>Help us personalize your therapy experience</Text>

          <Input label="Age" value={age} onChangeText={setAge} placeholder="25" keyboardType="numeric" error={errors.age} />
          <Input label="Weight (kg)" value={weight} onChangeText={setWeight} placeholder="70" keyboardType="numeric" error={errors.weight} />
          <Input label="Height (cm)" value={height} onChangeText={setHeight} placeholder="175" keyboardType="numeric" error={errors.height} />

          {/* Gender and Activity Level would use Pickers in production */}
          <Text style={styles.sectionLabel}>Gender</Text>
          <View style={styles.optionsRow}>
            {(['male', 'female', 'other'] as const).map((g) => (
              <Button
                key={g}
                title={g.charAt(0).toUpperCase() + g.slice(1)}
                variant={gender === g ? 'primary' : 'outline'}
                size="sm"
                onPress={() => setGender(g)}
                style={styles.optionButton}
              />
            ))}
          </View>

          <View style={styles.actions}>
            <Button title="Back" onPress={() => navigation.goBack()} variant="outline" size="lg" style={styles.halfButton} />
            <Button title="Next" onPress={handleNext} size="lg" style={styles.halfButton} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xxl },
  title: { ...theme.typography.h2, color: theme.colors.text.primary, marginBottom: theme.spacing.xs },
  subtitle: { ...theme.typography.body, color: theme.colors.text.secondary, marginBottom: theme.spacing.xl },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.text.primary, marginBottom: theme.spacing.sm, marginTop: theme.spacing.sm },
  optionsRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  optionButton: { flex: 1 },
  actions: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.xl },
  halfButton: { flex: 1 },
});
