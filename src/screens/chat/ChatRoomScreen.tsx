import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { markChatRead, subscribeToMessages, sendMessage } from '../../services/chatService';
import { submitReport } from '../../services/reportService';
import { blockUser } from '../../services/userService';
import { LoadError } from '../../components/LoadError';
import { colors } from '../../theme/colors';
import type { Message } from '../../types';
import type { ChatsStackParamList } from '../../navigation/MainTabs';

type Props = NativeStackScreenProps<ChatsStackParamList, 'ChatRoom'>;

export default function ChatRoomScreen({ route, navigation }: Props) {
  const { chatId, otherUserId, otherUserName } = route.params;
  const { firebaseUser, profile, refreshProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [showSafety, setShowSafety] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [safetyError, setSafetyError] = useState('');
  const listRef = useRef<FlatList<Message>>(null);
  const isBlocked = profile?.blocked_users.includes(otherUserId) ?? false;

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <Pressable onPress={() => setShowSafety((visible) => !visible)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Chat safety options"><Text style={styles.menuButton}>•••</Text></Pressable>,
    });
  }, [navigation]);

  useEffect(() => {
    setLoadError('');
    const unsubscribe = subscribeToMessages(chatId, (nextMessages) => {
      setMessages(nextMessages);
      if (firebaseUser) markChatRead(chatId, firebaseUser.uid).catch(() => undefined);
    }, () => {
      setLoadError('Could not load messages. Check your connection and try again.');
    });
    return unsubscribe;
  }, [chatId, firebaseUser, retryKey]);

  if (loadError) {
    return <LoadError title="Could not load messages" message={loadError} onRetry={() => setRetryKey((key) => key + 1)} />;
  }

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !firebaseUser || isBlocked) return;
    setSendError('');
    setSending(true);
    try {
      await sendMessage(chatId, firebaseUser.uid, text);
      setDraft('');
    } catch (error: any) {
      setSendError(error?.message === 'Messages cannot be empty.' ? error.message : 'Message failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleReport = async () => {
    if (!firebaseUser) return;
    if (!reportReason.trim()) {
      setSafetyError('Please describe the issue before submitting a report.');
      return;
    }
    setSafetyError('');
    setReporting(true);
    try {
      await submitReport(firebaseUser.uid, otherUserId, reportReason.trim());
      setReportReason('');
      setShowSafety(false);
      Alert.alert('Report submitted', 'Thank you. An administrator will review this report.');
    } catch (error: any) {
      setSafetyError(error?.code === 'permission-denied' ? 'Could not submit. Confirm the latest Firestore Rules are published.' : error?.message ?? 'Could not submit this report.');
    } finally {
      setReporting(false);
    }
  };

  const confirmBlock = () => {
    Alert.alert(`Block ${otherUserName}?`, 'They will be hidden from Matches and you will no longer be able to message them from this chat.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block User', style: 'destructive', onPress: () => { void handleBlock(); } },
    ]);
  };

  const handleBlock = async () => {
    if (!firebaseUser) return;
    setSafetyError('');
    setBlocking(true);
    try {
      await blockUser(firebaseUser.uid, otherUserId);
      await refreshProfile();
      setShowSafety(false);
      navigation.goBack();
    } catch (error: any) {
      setSafetyError(error?.code === 'permission-denied' ? 'Could not block. Confirm the latest Firestore Rules are published.' : error?.message ?? 'Could not block this user.');
    } finally {
      setBlocking(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.message_id}
        contentContainerStyle={styles.list}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const mine = item.sender_id === firebaseUser?.uid;
          return (
            <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>
                  {item.text_content}
                </Text>
                <Text style={[styles.time, mine && styles.timeMine]}>
                  {new Date(item.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          );
        }}
      />
      {showSafety ? <View style={styles.safetyPanel}>
        <View style={styles.safetyHeader}><View><Text style={styles.safetyTitle}>Chat safety</Text><Text style={styles.safetyText}>Report or block {otherUserName}.</Text></View><Pressable onPress={() => setShowSafety(false)}><Text style={styles.closeSafety}>Close</Text></Pressable></View>
        <TextInput value={reportReason} onChangeText={setReportReason} placeholder="Why are you reporting this user?" placeholderTextColor={colors.textMuted} style={styles.reportInput} multiline maxLength={1000} editable={!reporting && !blocking} />
        {safetyError ? <Text style={styles.safetyError}>{safetyError}</Text> : null}
        <View style={styles.safetyActions}><Pressable onPress={handleReport} disabled={reporting || blocking} style={styles.reportButton}><Text style={styles.reportButtonText}>{reporting ? 'Sending…' : 'Report'}</Text></Pressable><Pressable onPress={confirmBlock} disabled={reporting || blocking} style={styles.blockButton}><Text style={styles.blockButtonText}>{blocking ? 'Blocking…' : 'Block'}</Text></Pressable></View>
      </View> : null}
      {isBlocked ? <View style={styles.blockedNotice}><Text style={styles.blockedText}>You blocked {otherUserName}. You can no longer send messages in this chat.</Text></View> : null}
      {sendError ? <Text style={styles.errorText}>{sendError}</Text> : null}
      <View style={styles.inputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Type a message..."
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          multiline
          maxLength={1000}
          editable={!sending && !isBlocked}
        />
        <Pressable onPress={handleSend} disabled={!draft.trim() || sending || isBlocked} style={[styles.sendButton, (!draft.trim() || sending || isBlocked) && styles.sendButtonDisabled]}>
          <Text style={styles.sendText}>{sending ? 'Sending' : 'Send'}</Text>
        </Pressable>
      </View>
      <Text style={styles.counter}>{draft.length}/1000</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, paddingTop: 22, flexGrow: 1 },
  bubbleRow: { flexDirection: 'row', marginBottom: 10 },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleTheirs: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopLeftRadius: 4,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderTopRightRadius: 4,
  },
  bubbleText: { fontSize: 15, color: colors.text },
  bubbleTextMine: { color: '#fff' },
  time: { color: colors.textMuted, fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  timeMine: { color: '#D9EBFF' },
  errorText: { color: colors.danger, backgroundColor: '#FFEDEA', padding: 9, fontSize: 12, textAlign: 'center' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 14,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    color: colors.text,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  sendButtonDisabled: { opacity: 0.55 },
  sendText: { color: '#fff', fontWeight: '600' },
  counter: { backgroundColor: colors.card, textAlign: 'right', color: colors.textMuted, fontSize: 10, paddingRight: 16, paddingBottom: 8 },
  menuButton: { color: colors.primary, fontSize: 21, fontWeight: '800', paddingHorizontal: 4, paddingBottom: 6 },
  safetyPanel: { margin: 12, padding: 14, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  safetyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  safetyTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  safetyText: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  closeSafety: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  reportInput: { minHeight: 68, maxHeight: 120, borderWidth: 1, borderColor: colors.border, borderRadius: 10, color: colors.text, padding: 10, marginTop: 12, textAlignVertical: 'top' },
  safetyActions: { flexDirection: 'row', marginTop: 10, gap: 8 },
  reportButton: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: colors.surface },
  reportButtonText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  blockButton: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: '#FFF1F0' },
  blockButtonText: { color: colors.danger, fontWeight: '700', fontSize: 13 },
  safetyError: { color: colors.danger, fontSize: 12, marginTop: 8 },
  blockedNotice: { backgroundColor: '#FFF8E8', padding: 10, borderTopWidth: 1, borderTopColor: '#F3DDA5' },
  blockedText: { color: colors.text, fontSize: 12, textAlign: 'center' },
});
