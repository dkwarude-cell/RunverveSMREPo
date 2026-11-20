/**
 * ReportsListScreen - saved AI Scan reports (newest first). Tap to open, bin icon to delete.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppText from '../../../components/ui/AppText';
import { IconButton } from '../../../components/ui/Buttons';
import { Pill } from '../../../components/ui/Bits';
import Touchable from '../../../components/ui/Touchable';
import { useAppModal } from '../../../components/feedback/AppModalProvider';
import { ReportListItem, ReportService } from '../../../services/reportService';
import { DOCK_SPACE, radius, useTheme } from '../../../theme';
import { prettyLabel } from '../../../utils/format';

type Props = { onBack: () => void; onOpen: (id: string) => void };

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

export default function ReportsListScreen({ onBack, onOpen }: Props) {
  const insets = useSafeAreaInsets();
  const { c } = useTheme();
  const modal = useAppModal();
  const [reports, setReports] = useState<ReportListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setReports(await ReportService.list());
    } catch (e: any) {
      setError(e?.message ?? 'Could not load your reports');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (item: ReportListItem) => {
    const ok = await modal.confirm({ title: 'Delete this report?', message: 'It will be removed from your account.', confirmLabel: 'Delete', destructive: true, icon: 'trash-can-outline' });
    if (!ok) return;
    try {
      await ReportService.remove(item.id);
      setReports(r => r?.filter(x => x.id !== item.id) ?? null);
    } catch (e: any) {
      modal.alert({ type: 'error', title: 'Delete failed', message: e?.message });
    }
  };

  const severityColor = { mild: c.success, moderate: c.warning, severe: c.danger };

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <IconButton icon="chevron-left" onPress={onBack} size={42} />
        <View style={styles.headerText}>
          <AppText variant="caption" tone="red">
            AI INJURY SCAN
          </AppText>
          <AppText variant="h2">My reports</AppText>
        </View>
      </View>

      {reports === null && !error ? (
        <ActivityIndicator color={c.primary} style={styles.loading} />
      ) : (
        <FlatList
          data={reports ?? []}
          keyExtractor={r => r.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              colors={[c.primary]}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name={error ? 'cloud-off-outline' : 'file-document-outline'} size={40} color={c.textMuted} />
              <AppText variant="body" tone="secondary" center style={styles.emptyText}>
                {error ?? 'No reports yet. Your AI scans will be saved here automatically.'}
              </AppText>
            </View>
          }
          renderItem={({ item }) => (
            <Touchable onPress={() => onOpen(item.id)}>
              <View style={[styles.row, { backgroundColor: c.surface }]}>
                {item.thumb ? (
                  <Image source={{ uri: `data:image/jpeg;base64,${item.thumb}` }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.noThumb, { backgroundColor: c.surfaceStrong }]}>
                    <Icon name="image-off-outline" size={22} color={c.textMuted} />
                  </View>
                )}
                <View style={styles.rowText}>
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    {prettyLabel(item.summary.bodyPart)} · {prettyLabel(item.summary.wound)}
                  </AppText>
                  <AppText variant="small" tone="muted">
                    {formatDate(item.createdAt)}
                  </AppText>
                  {item.summary.severity ? (
                    <View style={styles.pill}>
                      <Pill text={item.summary.severity.replace(/^\w/, s => s.toUpperCase())} color={severityColor[item.summary.severity]} />
                    </View>
                  ) : null}
                </View>
                <Touchable onPress={() => remove(item)} hitSlop={10}>
                  <Icon name="trash-can-outline" size={21} color={c.textMuted} />
                </Touchable>
              </View>
            </Touchable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
  headerText: { marginLeft: 12 },
  loading: { marginTop: 60 },
  list: { paddingHorizontal: 16, paddingBottom: DOCK_SPACE, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: radius.lg, marginBottom: 10 },
  thumb: { width: 60, height: 60, borderRadius: radius.md },
  noThumb: { alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, marginHorizontal: 12 },
  pill: { flexDirection: 'row', marginTop: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingTop: 80 },
  emptyText: { marginTop: 10 },
});
