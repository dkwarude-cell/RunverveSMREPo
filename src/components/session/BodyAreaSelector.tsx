import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../../styles/theme';
import { BODY_AREAS } from '../../utils/constants';
import { formatBodyArea } from '../../utils/formatters';
import { BodyArea } from '../../models/Session';

interface Props {
  selected: BodyArea | null;
  onSelect: (area: BodyArea) => void;
}

const BODY_AREA_ICONS: Record<string, string> = {
  lower_back: '🔙', upper_back: '🔝', neck: '🦒',
  shoulder_left: '💪', shoulder_right: '💪',
  elbow_left: '🦾', elbow_right: '🦾',
  knee_left: '🦵', knee_right: '🦵',
  ankle_left: '🦶', ankle_right: '🦶',
  hip_left: '🏋️', hip_right: '🏋️',
};

const BodyAreaSelector: React.FC<Props> = ({ selected, onSelect }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Body Area</Text>
      <ScrollView contentContainerStyle={styles.grid}>
        {BODY_AREAS.map((area) => {
          const isSelected = selected === area;
          return (
            <TouchableOpacity
              key={area}
              style={[styles.item, isSelected && styles.selectedItem]}
              onPress={() => onSelect(area as BodyArea)}
            >
              <Text style={styles.icon}>{BODY_AREA_ICONS[area] || '🎯'}</Text>
              <Text style={[styles.itemText, isSelected && styles.selectedText]}>
                {formatBodyArea(area)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: theme.spacing.md },
  label: { ...theme.typography.h3, color: theme.colors.text.primary, marginBottom: theme.spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  item: {
    width: '30%',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  selectedItem: { borderColor: theme.colors.primary, backgroundColor: '#FFF5F0' },
  icon: { fontSize: 24, marginBottom: 4 },
  itemText: { fontSize: 11, color: theme.colors.text.secondary, textAlign: 'center' },
  selectedText: { color: theme.colors.primary, fontWeight: '600' },
});

export default React.memo(BodyAreaSelector);
