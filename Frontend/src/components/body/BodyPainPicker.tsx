/**
 * BodyPainPicker - "tap where it hurts", then say what you think it is.
 *
 * Owns the whole selection: the figure, the front/back toggle, the chips for what has been
 * chosen so far, and the sheet that lists what each area commonly turns out to be. The
 * caller gets a plain BodySelection[] back and does not need to know about any of it.
 */
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import AppText from '../ui/AppText';
import Sheet from '../ui/Sheet';
import Touchable from '../ui/Touchable';
import { PrimaryButton, SecondaryButton } from '../ui/Buttons';
import BodyMap from './BodyMap';
import {
  BodyRegion,
  BodySelection,
  BodyView,
  regionById,
} from '../../data/bodyMap';
import { radius, useTheme } from '../../theme';

export type BodyPainPickerProps = {
  selections: BodySelection[];
  onChange: (selections: BodySelection[]) => void;
  /** Region the image model pointed at, outlined on the figure as a hint. */
  suggestedId?: string | null;
};

export default function BodyPainPicker({
  selections,
  onChange,
  suggestedId,
}: BodyPainPickerProps) {
  const { c } = useTheme();
  const [view, setView] = useState<BodyView>('front');
  const [openRegion, setOpenRegion] = useState<BodyRegion | null>(null);
  const [draftInjuries, setDraftInjuries] = useState<string[]>([]);

  const selectedIds = useMemo(() => selections.map(s => s.regionId), [selections]);

  const openSheetFor = (region: BodyRegion) => {
    const existing = selections.find(s => s.regionId === region.id);
    setDraftInjuries(existing?.injuryIds ?? []);
    setOpenRegion(region);
    // Jump the figure to the side the region lives on, so it stays visible behind the sheet.
    if (region.view !== view) setView(region.view);
  };

  const commitDraft = () => {
    if (!openRegion) return;
    const others = selections.filter(s => s.regionId !== openRegion.id);
    onChange([...others, { regionId: openRegion.id, injuryIds: draftInjuries }]);
    setOpenRegion(null);
  };

  const removeRegion = (regionId: string) => {
    onChange(selections.filter(s => s.regionId !== regionId));
    setOpenRegion(null);
  };

  const toggleInjury = (injuryId: string) =>
    setDraftInjuries(current =>
      current.includes(injuryId)
        ? current.filter(id => id !== injuryId)
        : [...current, injuryId],
    );

  return (
    <View style={styles.root}>
      <View style={[styles.toggle, { backgroundColor: c.surfaceStrong }]}>
        {(['front', 'back'] as BodyView[]).map(option => {
          const active = view === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setView(option)}
              style={[styles.toggleItem, active && { backgroundColor: c.primary }]}
            >
              <AppText
                variant="bodyStrong"
                style={{ color: active ? '#FFFFFF' : c.textSecondary }}
              >
                {option === 'front' ? 'Front' : 'Back'}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.figure}>
        <BodyMap
          view={view}
          selectedIds={selectedIds}
          onToggleRegion={openSheetFor}
          suggestedId={suggestedId}
        />
      </View>

      {selections.length === 0 ? (
        <AppText variant="small" tone="muted" center style={styles.empty}>
          Tap the part of the body where it hurts. You can choose more than one area.
        </AppText>
      ) : (
        <View style={styles.chips}>
          {selections.map(selection => {
            const region = regionById(selection.regionId);
            if (!region) return null;
            return (
              <Touchable
                key={selection.regionId}
                onPress={() => openSheetFor(region)}
              >
                <View style={[styles.chip, { backgroundColor: c.primary + '1A' }]}>
                  <AppText variant="small" style={{ color: c.primary }}>
                    {region.label}
                    {selection.injuryIds.length ? ` · ${selection.injuryIds.length}` : ''}
                  </AppText>
                  <Icon name="pencil-outline" size={13} color={c.primary} />
                </View>
              </Touchable>
            );
          })}
        </View>
      )}

      <Sheet
        visible={openRegion !== null}
        onClose={() => setOpenRegion(null)}
        title={openRegion ? `${openRegion.shortLabel} pain` : ''}
        subtitle="What do you think it is? Choose any that fit, or none."
        scroll
      >
        {openRegion ? (
          <>
            {openRegion.therapy.tens !== 'ok' && openRegion.therapy.tensNote ? (
              <View style={[styles.safety, { backgroundColor: c.primary + '12' }]}>
                <Icon name="shield-alert-outline" size={18} color={c.primary} />
                <AppText variant="small" tone="secondary" style={styles.flex}>
                  {openRegion.therapy.tensNote}
                </AppText>
              </View>
            ) : null}

            <ScrollView style={styles.injuryList} nestedScrollEnabled>
              {openRegion.injuries.map(injury => {
                const checked = draftInjuries.includes(injury.id);
                return (
                  <Touchable key={injury.id} onPress={() => toggleInjury(injury.id)}>
                    <View style={styles.injuryRow}>
                      <View style={styles.flex}>
                        <AppText variant="bodyStrong">{injury.label}</AppText>
                        <AppText variant="small" tone="secondary">
                          {injury.description}
                        </AppText>
                      </View>
                      <Icon
                        name={checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                        size={24}
                        color={checked ? c.primary : c.textMuted}
                      />
                    </View>
                  </Touchable>
                );
              })}
            </ScrollView>

            <View style={styles.sheetActions}>
              {selectedIds.includes(openRegion.id) ? (
                <SecondaryButton
                  title="Remove"
                  onPress={() => removeRegion(openRegion.id)}
                  style={styles.flex}
                />
              ) : (
                <SecondaryButton
                  title="Cancel"
                  onPress={() => setOpenRegion(null)}
                  style={styles.flex}
                />
              )}
              <PrimaryButton title="Done" onPress={commitDraft} style={styles.flex} />
            </View>
          </>
        ) : null}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  toggle: {
    flexDirection: 'row',
    alignSelf: 'center',
    borderRadius: radius.pill,
    padding: 4,
    gap: 4,
  },
  toggleItem: {
    paddingVertical: 8,
    paddingHorizontal: 28,
    borderRadius: radius.pill,
  },
  figure: { flex: 1, minHeight: 300, marginTop: 8 },
  empty: { marginTop: 8, paddingHorizontal: 24 },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  safety: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 12,
  },
  injuryList: { maxHeight: 340 },
  injuryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 14 },
});
