/**
 * AssistantScreen - "Assistant" dock tab: SmartHeal AI chatbot.
 *   - text chat with the SmartHeal agent (Cloud Run, see services/chatService.ts)
 *   - the user's onboarding profile is shared with the agent at the start of each chat
 *   - medical report upload: PDF or image (camera / files)
 *   - voice: tap the mic and talk; the words appear in the box, tap send (replies to voice messages are read aloud)
 *       English         -> inline mic (live text in the box)
 *       हिंदी / मराठी   -> Google's voice-typing popup (tap the language pill to switch)
 *   - "Listen" under any reply reads it aloud
 * Voice lives in services/voiceService.ts (speech kit + the app's native module).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Keyboard,
  NativeSyntheticEvent,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextLayoutEventData,
  TextStyle,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchCamera } from 'react-native-image-picker';
import { errorCodes, isErrorWithCode, pick, types } from '@react-native-documents/picker';

import TabHeader from '../../../components/layout/TabHeader';
import ChatMarkdown from '../../../components/ai/ChatMarkdown';
import { useAppModal } from '../../../components/feedback/AppModalProvider';
import { useUser } from '../../../context/UserContext';
import {
  ChatAttachment,
  ChatError,
  MAX_FILE_MB,
  SUPPORTED_TYPES,
  buildProfileContext,
  resetChat,
  sendChatMessage,
  toSpeechText,
  warmUpChat,
} from '../../../services/chatService';
import { STT_NOTHING_HEARD, Tts, VOICE_LANGUAGES, Voice } from '../../../services/voiceService';
import { fonts, radius, useTheme, useStyles } from '../../../theme';
import type { Palette } from '../../../theme';

/** true = send automatically when you stop talking; false = words go into the box and you tap send */
const AUTO_SEND_VOICE = false;

// ─────────── types ───────────
type Message = {
  id: string;
  role: 'user' | 'bot';
  text: string;
  attachment?: ChatAttachment | null;
  error?: boolean;
  retry?: { text: string; attachment?: ChatAttachment | null; voice: boolean };
};

const REPORT_PROMPT = 'Please review my medical report.';
const SUGGESTIONS = ['Heat or cold for a sprain?', 'TENS settings for back pain', 'Is vibration safe for me?', 'How do I connect my device?'];

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const fileSize = (b?: number) => (!b ? '' : b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const isPdf = (a: ChatAttachment) => a.mimeType === 'application/pdf';
/** Hindi / Marathi (Devanagari) text uses the phone's own font (the app font has no Devanagari letters) */
const isIndic = (t: string) => /[\u0900-\u097F]/.test(t);

function mimeFromName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic' || ext === 'heif') return 'image/heic';
  return 'image/jpeg';
}

/** Splits long replies into pieces the phone's speech engine accepts. */
function speechChunks(text: string, max: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text];
  const out: string[] = [];
  let cur = '';
  for (const s of sentences) {
    if ((cur + s).length > max && cur) {
      out.push(cur.trim());
      cur = '';
    }
    cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(Boolean);
}

// ─────────── small pieces ───────────
/**
 * Text that sizes its bubble from the lines Android actually drew.
 * Android sometimes guesses a text's height one line too short (the last words then get hidden),
 * so after layout we add up the real line heights and make the text at least that tall.
 */
function FitText({ text, style }: { text: string; style: StyleProp<TextStyle> }) {
  const [height, setHeight] = useState(0);
  const onTextLayout = (e: NativeSyntheticEvent<TextLayoutEventData>) => {
    const total = Math.ceil(e.nativeEvent.lines.reduce((sum, line) => sum + line.height, 0));
    if (total > 0 && Math.abs(total - height) > 1) setHeight(total);
  };
  return (
    <Text style={[style, height ? { minHeight: height } : null]} onTextLayout={onTextLayout}>
      {text}
    </Text>
  );
}

function TypingBubble({ label }: { label: string }) {
  const styles = useStyles(makeStyles);
  const { c } = useTheme();
  const pulse = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <View style={styles.botRow}>
      <View style={[styles.bubble, styles.botBubble, styles.typing]}>
        <Animated.View style={[styles.typingDots, { opacity: pulse }]}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.typingDot, { backgroundColor: c.textMuted }]} />
          ))}
        </Animated.View>
        <Text style={styles.typingText}>{label}</Text>
      </View>
    </View>
  );
}

function AttachmentView({ a }: { a: ChatAttachment }) {
  const styles = useStyles(makeStyles);
  if (!isPdf(a)) return <Image source={{ uri: a.uri }} style={styles.attachImage} resizeMode="cover" />;
  return (
    <View style={[styles.fileCard, styles.fileCardOnRed]}>
      <Icon name="file-pdf-box" size={28} color="#FFFFFF" />
      <View style={styles.flex}>
        <Text style={[styles.fileName, styles.white]} numberOfLines={1}>
          {a.name}
        </Text>
        <Text style={[styles.fileMeta, styles.whiteSoft]}>PDF {fileSize(a.size)}</Text>
      </View>
    </View>
  );
}

// ─────────── screen ───────────
export default function AssistantScreen({ active }: { active: boolean }) {
  const { c } = useTheme();
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const modal = useAppModal();
  const { user, profile, firstName, displayName } = useUser();
  const userId = user?.uid ?? 'guest';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [busy, setBusy] = useState<false | 'chat' | 'report'>(false);
  const [listening, setListening] = useState(false);
  const [voiceHint, setVoiceHint] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [voiceLang, setVoiceLang] = useState(Voice.getLanguage());

  const listRef = useRef<FlatList<Message>>(null);
  const rootRef = useRef<View>(null);
  const busyRef = useRef(false); // blocks double sends (state updates are async)
  const activeRef = useRef(active);
  activeRef.current = active;
  const attachmentRef = useRef<ChatAttachment | null>(null);
  attachmentRef.current = attachment;
  const voiceDraft = useRef(false); // the text in the box came from the mic -> read the reply aloud
  const sendRef = useRef<(text: string, a: ChatAttachment | null, voice: boolean) => void>(() => {});

  const profileContext = useMemo(() => buildProfileContext(profile, displayName), [profile, displayName]);

  // ═════════════ KEYBOARD ═════════════
  // the input bar sits right above the keyboard: we measure where this screen ends and where the keyboard starts
  const kbTop = useRef<number | null>(null);
  const [kbOpen, setKbOpen] = useState(false);
  const [kbPad, setKbPad] = useState(0);
  const measureKeyboard = useCallback(() => {
    const top = kbTop.current;
    if (top == null) return;
    rootRef.current?.measureInWindow((_x, y, _w, h) => setKbPad(Math.max(0, Math.round(y + h - top))));
  }, []);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', e => {
      kbTop.current = e.endCoordinates.screenY;
      setKbOpen(true);
      measureKeyboard();
      setTimeout(measureKeyboard, 250); // again after Android has resized the window (if it does)
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 300);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      kbTop.current = null;
      setKbOpen(false);
      setKbPad(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [measureKeyboard]);
  const dockHeight = 6 + 66 + Math.max(insets.bottom, 10);
  const bottomSpace = kbOpen ? kbPad + 8 : dockHeight + 8;

  // ═════════════ TEXT-TO-SPEECH ═════════════
  // one reply is spoken at a time; its pieces get our own ids (msgId-0, msgId-1...)
  const ttsRef = useRef<{ msgId: string | null; ids: Set<string> }>({ msgId: null, ids: new Set() });
  const resetTts = useCallback(() => {
    ttsRef.current = { msgId: null, ids: new Set() };
    setSpeakingId(null);
  }, []);

  useEffect(() => {
    const finishPiece = ({ id }: { id: string }) => {
      const t = ttsRef.current;
      if (!t.ids.delete(id)) return; // not ours (or already finished)
      if (t.ids.size === 0) resetTts();
    };
    const subs = [
      Tts.onDone(finishPiece),
      Tts.onError(finishPiece),
      Tts.onStopped(({ id }) => {
        if (ttsRef.current.ids.has(id)) resetTts();
      }),
    ];
    return () => {
      subs.forEach(s => s.remove());
      Tts.stop();
    };
  }, [resetTts]);

  const stopSpeaking = useCallback(() => {
    resetTts();
    Tts.stop();
  }, [resetTts]);

  const speak = useCallback(
    async (msg: Message) => {
      const chunks = speechChunks(toSpeechText(msg.text), Tts.maxLength);
      if (!chunks.length) return;
      await Tts.stop();
      const ids = chunks.map((_, i) => `${msg.id}-${i}`);
      const current = { msgId: msg.id, ids: new Set(ids) };
      ttsRef.current = current;
      setSpeakingId(msg.id);
      try {
        for (let i = 0; i < chunks.length; i++) {
          if (ttsRef.current !== current) return; // stopped meanwhile
          await Tts.speak(chunks[i], ids[i]);
        }
      } catch (e: any) {
        resetTts();
        const msgText = e?.message ?? 'Text-to-speech is not available on this phone.';
        modal.alert({
          type: 'warning',
          icon: 'volume-off',
          title: "Couldn't read this aloud",
          message: msgText,
          actions:
            e?.code === 'tts_unavailable'
              ? [
                  { label: 'Close', style: 'secondary' },
                  { label: 'Open settings', style: 'primary', onPress: () => Tts.openSettings() },
                ]
              : undefined,
        });
      }
    },
    [modal, resetTts],
  );

  // ═════════════ SPEECH-TO-TEXT ═════════════
  const session = useRef(0); // session number of the current mic tap; -1 = starting, 0 = none
  const voiceBase = useRef(''); // text already in the box when the mic was tapped
  const level = useRef(new Animated.Value(0)).current; // mic loudness for the ring animation
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showHint = useCallback((text: string) => {
    setVoiceHint(text);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setVoiceHint(null), 3500);
  }, []);

  useEffect(() => {
    const mine = (e: { session: number }) => {
      if (session.current === -1) session.current = e.session; // event arrived before start() resolved
      return e.session === session.current;
    };
    const join = (t?: string) => [voiceBase.current, (t ?? '').trim()].filter(Boolean).join(' ');
    const subs = [
      Voice.onPartial(e => {
        if (mine(e)) setInput(join(e.text));
      }),
      Voice.onLevel(e => {
        if (mine(e)) level.setValue(Math.max(0, Math.min(1, ((e.level ?? 0) + 2) / 12)));
      }),
      Voice.onResult(e => {
        if (!mine(e)) return;
        session.current = 0;
        setListening(false);
        level.setValue(0);
        const text = join(e.text);
        if (!e.text?.trim()) {
          setInput(voiceBase.current);
          showHint("Didn't catch that - tap the mic and try again");
          return;
        }
        voiceDraft.current = true;
        if (AUTO_SEND_VOICE) sendRef.current(text, attachmentRef.current, true);
        else setInput(text);
      }),
      Voice.onError(e => {
        if (!mine(e)) return;
        session.current = 0;
        setListening(false);
        level.setValue(0);
        setInput(voiceBase.current);
        showHint(STT_NOTHING_HEARD.includes(e.code ?? -1) ? "Didn't catch that - tap the mic and try again" : e.message ?? 'Voice input failed');
      }),
    ];
    return () => {
      subs.forEach(s => s.remove());
      Voice.cancel();
      if (hintTimer.current) clearTimeout(hintTimer.current);
    };
  }, [level, showHint]);

  const toggleMic = async () => {
    // Hindi / Marathi: Google's voice-typing popup (it handles the microphone itself)
    if (voiceLang && !listening) {
      stopSpeaking();
      Keyboard.dismiss();
      setVoiceHint(null);
      try {
        const lang = VOICE_LANGUAGES.find(l => l.tag === voiceLang);
        const text = (await Voice.dictate(voiceLang, lang?.prompt))?.trim();
        if (!text) return; // closed without speaking
        const full = [input.trim(), text].filter(Boolean).join(' ');
        voiceDraft.current = true;
        if (AUTO_SEND_VOICE) send(full, attachmentRef.current, true);
        else setInput(full);
      } catch (e: any) {
        showHint(e?.message ?? 'Voice typing is not available');
      }
      return;
    }
    // English: inline mic
    if (listening) {
      Voice.stop(); // the final result of what was said still arrives
      setListening(false);
      return;
    }
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
        title: 'Microphone permission',
        message: 'SmartHeal needs the microphone so you can talk to the assistant.',
        buttonPositive: 'OK',
        buttonNegative: 'Cancel',
      });
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        modal.alert({ type: 'warning', icon: 'microphone-off', title: 'Microphone permission needed', message: 'Allow microphone access in Settings to use voice chat.' });
        return;
      }
    }
    stopSpeaking();
    Keyboard.dismiss();
    setVoiceHint(null);
    voiceBase.current = input.trim();
    setListening(true);
    session.current = -1;
    try {
      const s = await Voice.start('en-IN');
      if (session.current === -1) session.current = s;
    } catch (e: any) {
      session.current = 0;
      setListening(false);
      modal.alert({ type: 'warning', icon: 'microphone-off', title: 'Voice input unavailable', message: e?.message ?? 'Please try again.' });
    }
  };

  // voice-input language: tap the pill to switch English -> हिंदी -> मराठी
  const langInfo = VOICE_LANGUAGES.find(l => l.tag === voiceLang) ?? VOICE_LANGUAGES[0];
  const cycleLanguage = () => {
    if (listening) return;
    const i = VOICE_LANGUAGES.findIndex(l => l.tag === voiceLang);
    const next = VOICE_LANGUAGES[(i + 1) % VOICE_LANGUAGES.length];
    setVoiceLang(next.tag);
    Voice.setLanguage(next.tag);
    showHint(`Voice input: ${next.label} - tap the mic and speak`);
  };

  // stop audio when leaving the tab; wake the server when opening it
  useEffect(() => {
    if (active) warmUpChat();
    else {
      stopSpeaking();
      if (session.current) {
        session.current = 0;
        Voice.cancel();
        setListening(false);
      }
    }
  }, [active, stopSpeaking]);

  // ═════════════ ATTACHMENTS ═════════════
  const takePhoto = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        modal.alert({ type: 'warning', icon: 'camera-off', title: 'Camera permission needed', message: 'Allow camera access in Settings to take photos.' });
        return;
      }
    }
    const res = await launchCamera({ mediaType: 'photo', quality: 0.85, maxWidth: 2000, maxHeight: 2000, includeBase64: true });
    const a = res.assets?.[0];
    if (!a?.uri || !a.base64) return;
    setAttachment({ uri: a.uri, name: a.fileName ?? 'report-photo.jpg', mimeType: a.type ?? 'image/jpeg', size: a.fileSize, base64: a.base64 });
  };

  const chooseFile = async () => {
    try {
      const [file] = await pick({ type: [types.pdf, types.images], allowMultiSelection: false });
      const name = file.name ?? 'report';
      const mimeType = (file.type ?? mimeFromName(name)).toLowerCase();
      if (!SUPPORTED_TYPES.includes(mimeType)) {
        modal.alert({ type: 'warning', icon: 'file-alert-outline', title: 'File type not supported', message: 'Please choose a PDF, JPG, PNG or WEBP file.' });
        return;
      }
      if (file.size && file.size > MAX_FILE_MB * 1024 * 1024) {
        modal.alert({ type: 'warning', icon: 'file-alert-outline', title: 'File too large', message: `Please choose a file under ${MAX_FILE_MB} MB.` });
        return;
      }
      setAttachment({ uri: file.uri, name, mimeType, size: file.size ?? undefined });
    } catch (e) {
      if (isErrorWithCode(e) && e.code === errorCodes.OPERATION_CANCELED) return;
      modal.alert({ type: 'error', title: 'Could not open file', message: 'Please try another file.' });
    }
  };

  const openAttach = () =>
    modal.alert({
      type: 'info',
      icon: 'file-document-outline',
      title: 'Add a medical report',
      message: `Blood test, X-ray, MRI or doctor's note - as a PDF or image (JPG, PNG, WEBP), up to ${MAX_FILE_MB} MB.`,
      actions: [
        // small delay so the pop-up is fully closed before the camera / file picker opens
        { label: 'Take photo', style: 'secondary', onPress: () => setTimeout(takePhoto, 300) },
        { label: 'Choose file', style: 'primary', onPress: () => setTimeout(chooseFile, 300) },
      ],
    });

  // ═════════════ SEND ═════════════
  const send = async (text: string, a: ChatAttachment | null, voice: boolean) => {
    const clean = text.trim();
    if (busyRef.current || (!clean && !a)) return;
    busyRef.current = true;
    voiceDraft.current = false;
    stopSpeaking();
    setVoiceHint(null);
    setMessages(m => [...m, { id: newId(), role: 'user', text: clean, attachment: a }]);
    setInput('');
    setAttachment(null);
    setBusy(a ? 'report' : 'chat');
    try {
      const reply = await sendChatMessage(userId, clean || REPORT_PROMPT, a, profileContext);
      const botMsg: Message = { id: newId(), role: 'bot', text: reply };
      setMessages(m => [...m, botMsg]);
      if (voice && activeRef.current) speak(botMsg);
    } catch (e) {
      const msg = e instanceof ChatError ? e.message : 'Something went wrong. Please try again.';
      setMessages(m => [...m, { id: newId(), role: 'bot', text: msg, error: true, retry: { text: clean, attachment: a, voice } }]);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  sendRef.current = send;

  const onChangeText = (t: string) => {
    setInput(t);
    if (!t.trim()) voiceDraft.current = false;
  };

  const retry = (msg: Message) => {
    if (!msg.retry || busyRef.current) return;
    setMessages(m => {
      const i = m.findIndex(x => x.id === msg.id);
      return m.filter((_, k) => k !== i && !(k === i - 1 && m[k].role === 'user'));
    });
    send(msg.retry.text, msg.retry.attachment ?? null, msg.retry.voice);
  };

  const newChat = async () => {
    if (!messages.length || busyRef.current) return;
    const ok = await modal.confirm({ title: 'Start a new chat?', message: 'This clears the current conversation.', confirmLabel: 'New chat', icon: 'chat-plus-outline' });
    if (!ok) return;
    stopSpeaking();
    resetChat();
    setMessages([]);
  };

  // greeting is shown by the app (not sent to the agent)
  const greeting: Message = useMemo(
    () => ({
      id: 'greeting',
      role: 'bot',
      text:
        `Hi ${firstName || 'there'}, I'm your SmartHeal Assistant.\n` +
        'I can help you with:\n' +
        '- **Heat, vibration and TENS** therapy - settings, safety and how to use them\n' +
        '- **Pain and recovery** - injuries, soreness, stiffness and when to see a doctor\n' +
        "- **Medical reports** - attach a PDF or photo and I'll explain it\n" +
        'Type a question, tap the mic to talk, or attach a report.',
    }),
    [firstName],
  );
  const data = useMemo(() => [greeting, ...messages], [greeting, messages]);
  const canSend = !busy && !listening && (input.trim().length > 0 || !!attachment);
  const ringScale = level.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] });

  // ═════════════ RENDER ═════════════
  const renderItem = ({ item }: { item: Message }) => {
    if (item.role === 'user') {
      return (
        <View style={styles.userRow}>
          <View style={[styles.bubble, styles.meBubble]}>
            {item.attachment ? <AttachmentView a={item.attachment} /> : null}
            {item.text ? (
              <FitText
                text={item.text}
                style={[styles.meText, isIndic(item.text) ? styles.indicText : styles.latinText, item.attachment ? styles.textAfterFile : null]}
              />
            ) : null}
          </View>
        </View>
      );
    }
    const speaking = speakingId === item.id;
    return (
      <View style={styles.botRow}>
        <View style={[styles.bubble, styles.botBubble, item.error && { backgroundColor: c.primarySoft }]}>
          {item.error ? (
            <View style={styles.errorRow}>
              <Icon name="alert-circle-outline" size={18} color={c.primary} />
              <Text style={[styles.botText, styles.flex, styles.errorText]}>{item.text}</Text>
            </View>
          ) : (
            <ChatMarkdown text={item.text} />
          )}
        </View>
        <View style={styles.actions}>
          {item.error ? (
            <Pressable onPress={() => retry(item)} hitSlop={10} style={styles.action}>
              <Icon name="refresh" size={16} color={c.primary} />
              <Text style={[styles.actionText, { color: c.primary }]}>Retry</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => (speaking ? stopSpeaking() : speak(item))} hitSlop={10} style={styles.action}>
              <Icon name={speaking ? 'stop-circle-outline' : 'volume-high'} size={16} color={speaking ? c.primary : c.textMuted} />
              <Text style={[styles.actionText, { color: speaking ? c.primary : c.textMuted }]}>{speaking ? 'Stop' : 'Listen'}</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <View ref={rootRef} style={[styles.root, { paddingTop: insets.top + 10 }]} onLayout={measureKeyboard}>
      <View style={styles.header}>
        <TabHeader kicker="SmartHeal AI" title="Assistant" />
        <View style={styles.statusRow}>
          <View style={[styles.onlineDot, { backgroundColor: c.success }]} />
          <Text style={styles.statusText} numberOfLines={1}>
            Chat, voice and medical reports
          </Text>
          <Pressable onPress={cycleLanguage} hitSlop={8} style={styles.langPill}>
            <Icon name="translate" size={14} color={c.text} />
            <Text style={styles.langText}>{langInfo.short}</Text>
          </Pressable>
          {messages.length ? (
            <Pressable onPress={newChat} hitSlop={8} style={styles.newChat}>
              <Icon name="chat-plus-outline" size={16} color={c.primary} />
              <Text style={[styles.actionText, { color: c.primary }]}>New chat</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.flex}>
        <FlatList
          ref={listRef}
          data={data}
          keyExtractor={m => m.id}
          renderItem={renderItem}
          extraData={speakingId}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            <>
              {busy ? <TypingBubble label={busy === 'report' ? 'Reading your report…' : 'Thinking…'} /> : null}
              {!messages.length && !busy ? (
                <View style={styles.suggestions}>
                  {SUGGESTIONS.map(s => (
                    <Pressable key={s} style={styles.suggestion} onPress={() => send(s, null, false)}>
                      <Text style={styles.suggestionText}>{s}</Text>
                    </Pressable>
                  ))}
                  <Pressable style={[styles.suggestion, styles.suggestionRed]} onPress={openAttach}>
                    <Icon name="file-document-outline" size={15} color={c.primary} />
                    <Text style={[styles.suggestionText, { color: c.primary }]}>Explain my report</Text>
                  </Pressable>
                </View>
              ) : null}
            </>
          }
        />
      </View>

      {/* ───── input bar ───── */}
      <View style={[styles.inputArea, { marginBottom: bottomSpace }]}>
        {attachment ? (
          <View style={styles.preview}>
            {isPdf(attachment) ? (
              <Icon name="file-pdf-box" size={30} color={c.primary} />
            ) : (
              <Image source={{ uri: attachment.uri }} style={styles.previewImage} />
            )}
            <View style={styles.flex}>
              <Text style={styles.fileName} numberOfLines={1}>
                {attachment.name}
              </Text>
              <Text style={styles.fileMeta}>{[isPdf(attachment) ? 'PDF' : 'Image', fileSize(attachment.size)].filter(Boolean).join(' · ')}</Text>
            </View>
            <Pressable onPress={() => setAttachment(null)} hitSlop={10} style={styles.previewClose}>
              <Icon name="close" size={18} color={c.text} />
            </Pressable>
          </View>
        ) : null}

        {listening || voiceHint ? (
          <View style={styles.hintRow}>
            <View style={[styles.hintDot, { backgroundColor: listening ? c.primary : c.textMuted }]} />
            <Text style={[styles.hintText, { color: listening ? c.primary : c.textMuted }]} numberOfLines={1}>
              {listening ? `Listening (${langInfo.label})… tap stop when you are done` : voiceHint}
            </Text>
          </View>
        ) : null}

        <View style={styles.inputRow}>
          <Pressable onPress={openAttach} disabled={!!busy || listening} style={styles.roundBtn} hitSlop={4}>
            <Icon name="paperclip" size={21} color={busy || listening ? c.textMuted : c.text} />
          </Pressable>

          <View style={[styles.inputBox, listening && { backgroundColor: c.primarySoft }]}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={onChangeText}
              placeholder={listening ? 'Speak now…' : attachment ? 'Add a note (optional)' : 'Ask anything…'}
              placeholderTextColor={listening ? c.primary : c.textMuted}
              multiline
              maxLength={2000}
              editable={!listening}
            />
          </View>

          {canSend ? (
            <Pressable onPress={() => send(input, attachment, voiceDraft.current)} style={[styles.roundBtn, styles.sendBtn]} hitSlop={4}>
              <Icon name="arrow-up" size={22} color="#FFFFFF" />
            </Pressable>
          ) : busy ? (
            <View style={[styles.roundBtn, styles.sendBtn, styles.sendBtnOff]}>
              <ActivityIndicator size="small" color="#FFFFFF" />
            </View>
          ) : (
            <View style={styles.micWrap}>
              {listening ? <Animated.View style={[styles.micRing, { backgroundColor: c.primary, transform: [{ scale: ringScale }] }]} /> : null}
              <Pressable onPress={toggleMic} style={[styles.roundBtn, listening ? styles.micOn : styles.sendBtn]} hitSlop={4}>
                <Icon name={listening ? 'stop' : 'microphone'} size={22} color={listening ? c.onInk : '#FFFFFF'} />
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1, minWidth: 0 },
    white: { color: '#FFFFFF' },
    whiteSoft: { color: 'rgba(255,255,255,0.8)' },
    header: { paddingHorizontal: 18 },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, marginBottom: 8 },
    onlineDot: { width: 8, height: 8, borderRadius: 4, marginRight: 7 },
    statusText: { flex: 1, fontFamily: fonts.regular, fontSize: 13, lineHeight: 17, color: c.textMuted },
    newChat: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
    langPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: c.surface, overflow: 'hidden', marginLeft: 8 },
    langText: { fontFamily: fonts.medium, fontSize: 12.5, lineHeight: 16, fontWeight: '700', color: c.text },

    list: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 12 },
    // bot replies take the full width (fixed width = text always wraps inside the bubble)
    botRow: { alignSelf: 'stretch', marginRight: 20, marginBottom: 10 },
    userRow: { alignSelf: 'flex-end', maxWidth: '82%', marginBottom: 10 },
    bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
    meBubble: { backgroundColor: c.primary, borderBottomRightRadius: 6 },
    botBubble: { alignSelf: 'stretch', backgroundColor: c.surface, borderBottomLeftRadius: 6 },
    meText: { flexShrink: 1, fontSize: 15, color: '#FFFFFF' },
    latinText: { fontFamily: fonts.regular, lineHeight: 21 },
    // phone font + natural line height (no fixed lineHeight) so tall Hindi / Marathi letters are never clipped
    indicText: { fontFamily: Platform.OS === 'android' ? 'sans-serif' : undefined },
    botText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: c.text },
    textAfterFile: { marginTop: 8 },
    errorRow: { flexDirection: 'row', alignItems: 'flex-start' },
    errorText: { marginLeft: 8 },
    actions: { flexDirection: 'row', marginTop: 4, marginLeft: 6 },
    action: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingRight: 8 },
    actionText: { fontFamily: fonts.medium, fontSize: 12.5, lineHeight: 16, fontWeight: '600', marginLeft: 4 },

    typing: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    typingDots: { flexDirection: 'row', marginRight: 8 },
    typingDot: { width: 7, height: 7, borderRadius: 4, marginRight: 4 },
    typingText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 17, color: c.textMuted },

    attachImage: { width: 190, height: 190, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.1)' },
    fileCard: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 14, width: 220, gap: 10 },
    fileCardOnRed: { backgroundColor: 'rgba(255,255,255,0.18)' },
    fileName: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 18, fontWeight: '600', color: c.text },
    fileMeta: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: c.textMuted },

    suggestions: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
    suggestion: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: c.surface, marginRight: 8, marginBottom: 8 },
    suggestionRed: { backgroundColor: c.primarySoft },
    suggestionText: { fontFamily: fonts.medium, fontSize: 13.5, lineHeight: 18, fontWeight: '600', color: c.text },

    inputArea: { paddingHorizontal: 14, paddingTop: 6 },
    preview: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, marginBottom: 8, borderRadius: radius.lg, backgroundColor: c.surface },
    previewImage: { width: 40, height: 40, borderRadius: 8 },
    previewClose: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surfaceStrong },
    hintRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginLeft: 6 },
    hintDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    hintText: { flex: 1, fontFamily: fonts.medium, fontSize: 12.5, lineHeight: 16, fontWeight: '600' },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    roundBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surface, overflow: 'hidden' },
    sendBtn: { backgroundColor: c.primary },
    sendBtnOff: { opacity: 0.6 },
    micOn: { backgroundColor: c.ink },
    micWrap: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
    micRing: { position: 'absolute', width: 46, height: 46, borderRadius: 23, opacity: 0.25 },
    inputBox: { flex: 1, minHeight: 46, maxHeight: 130, justifyContent: 'center', borderRadius: 23, paddingHorizontal: 16, backgroundColor: c.surface, overflow: 'hidden' },
    input: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 20, color: c.text, paddingTop: 11, paddingBottom: 11, includeFontPadding: false, textAlignVertical: 'center' },
  });