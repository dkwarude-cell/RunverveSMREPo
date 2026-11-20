/**
 * AppModalProvider - clean pop-ups for the whole app (replaces the plain Android Alert).
 *
 *   const modal = useAppModal();
 *   modal.alert({ type: 'error', title: 'Login failed', message: '...' });
 *   const ok = await modal.confirm({ title: 'Log out?', confirmLabel: 'Log out', destructive: true });
 *   modal.toast({ type: 'success', title: 'Logged in' });
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, radius, useTheme } from '../../theme';
import { PrimaryButton, SecondaryButton } from '../ui/Buttons';

export type FeedbackType = 'success' | 'error' | 'info' | 'warning';

type Action = { label: string; onPress?: () => void; style?: 'primary' | 'secondary' };
type AlertOptions = { type?: FeedbackType; title: string; message?: string; actions?: Action[]; icon?: string };
type ConfirmOptions = { title: string; message?: string; confirmLabel?: string; cancelLabel?: string; destructive?: boolean; icon?: string };
type ToastOptions = { type?: FeedbackType; title: string; message?: string };

type Ctx = {
  alert: (o: AlertOptions) => void;
  confirm: (o: ConfirmOptions) => Promise<boolean>;
  toast: (o: ToastOptions) => void;
};

const ModalContext = createContext<Ctx | null>(null);

export function useAppModal(): Ctx {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useAppModal must be used inside AppModalProvider');
  return ctx;
}

const ICONS: Record<FeedbackType, string> = {
  success: 'check-circle',
  error: 'alert-circle',
  info: 'information',
  warning: 'alert',
};

function Dialog({ data, onDone }: { data: AlertOptions; onDone: (action?: Action) => void }) {
  const { c } = useTheme();
  const type = data.type ?? 'info';
  const tint = type === 'warning' ? c.warning : type === 'info' ? c.text : c.primary;
  const actions: Action[] = data.actions?.length ? data.actions : [{ label: 'OK', style: 'primary' }];

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={() => onDone()}>
      <View style={[styles.backdrop, { backgroundColor: c.overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => onDone()} />
        <View style={[styles.dialog, { backgroundColor: c.background }]}>
          <Icon name={data.icon ?? ICONS[type]} size={40} color={tint} />
          <Text style={[styles.title, { color: c.text }]}>{data.title}</Text>
          {data.message ? <Text style={[styles.message, { color: c.textSecondary }]}>{data.message}</Text> : null}
          <View style={actions.length > 1 ? styles.actionsRow : styles.actionsCol}>
            {actions.map((a, i) => {
              const Btn = a.style === 'secondary' ? SecondaryButton : PrimaryButton;
              return <Btn key={a.label + i} title={a.label} compact style={actions.length > 1 ? styles.flex : undefined} onPress={() => onDone(a)} />;
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Toast({ data, onDone }: { data: ToastOptions; onDone: () => void }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => onDone());
  }, [opacity, onDone]);

  const type = data.type ?? 'success';
  return (
    <Animated.View pointerEvents="none" style={[styles.toast, { top: insets.top + 10, opacity, backgroundColor: c.ink }]}>
      <Icon name={ICONS[type]} size={22} color={type === 'warning' ? c.warning : c.primary} />
      <View style={styles.toastText}>
        <Text style={[styles.toastTitle, { color: c.onInk }]}>{data.title}</Text>
        {data.message ? (
          <Text style={[styles.toastMsg, { color: c.onInk }]} numberOfLines={2}>
            {data.message}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

export default function AppModalProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<Array<AlertOptions & { _id: number }>>([]);
  const nextId = useRef(1);
  const [toastData, setToastData] = useState<(ToastOptions & { id: number }) | null>(null);

  const alert = useCallback((o: AlertOptions) => setQueue(q => [...q, { ...o, _id: nextId.current++ }]), []);

  const confirm = useCallback(
    (o: ConfirmOptions) =>
      new Promise<boolean>(resolve => {
        setQueue(q => [
          ...q,
          {
            _id: nextId.current++,
            type: o.destructive ? 'warning' : 'info',
            icon: o.icon,
            title: o.title,
            message: o.message,
            actions: [
              { label: o.cancelLabel ?? 'Cancel', style: 'secondary', onPress: () => resolve(false) },
              { label: o.confirmLabel ?? 'Confirm', style: 'primary', onPress: () => resolve(true) },
            ],
          },
        ]);
      }),
    [],
  );

  const toast = useCallback((o: ToastOptions) => setToastData({ ...o, id: Date.now() }), []);
  const clearToast = useCallback(() => setToastData(null), []);
  const value = useMemo(() => ({ alert, confirm, toast }), [alert, confirm, toast]);
  const current = queue[0];

  return (
    <ModalContext.Provider value={value}>
      {children}
      {current ? (
        <Dialog
          key={current._id}
          data={current}
          onDone={action => {
            setQueue(q => q.slice(1));
            // closing by tapping outside counts as the "Cancel" action, if there is one
            const fallback = current.actions?.find(a => a.style === 'secondary');
            (action ?? fallback)?.onPress?.();
          }}
        />
      ) : null}
      {toastData ? <Toast key={toastData.id} data={toastData} onDone={clearToast} /> : null}
    </ModalContext.Provider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  dialog: { width: '100%', maxWidth: 380, borderRadius: radius.xl, paddingHorizontal: 22, paddingTop: 26, paddingBottom: 20, alignItems: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 21, fontWeight: '800', textAlign: 'center', marginTop: 12 },
  message: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 8 },
  actionsRow: { flexDirection: 'row', alignSelf: 'stretch', marginTop: 22, gap: 10 },
  actionsCol: { alignSelf: 'stretch', marginTop: 22 },
  toast: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: radius.lg, zIndex: 1000, elevation: 20 },
  toastText: { flex: 1, marginLeft: 12 },
  toastTitle: { fontFamily: fonts.medium, fontSize: 15, fontWeight: '700' },
  toastMsg: { fontSize: 13, marginTop: 2, opacity: 0.8 },
});
