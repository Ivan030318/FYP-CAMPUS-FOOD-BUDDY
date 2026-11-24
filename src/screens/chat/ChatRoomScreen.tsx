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
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { markChatRead, subscribeToMessages, sendMessage } from '../../services/chatService';
import { LoadError } from '../../components/LoadError';
import { colors } from '../../theme/colors';
import type { Message } from '../../types';
import type { ChatsStackParamList } from '../../navigation/MainTabs';

type Props = NativeStackScreenProps<ChatsStackParamList, 'ChatRoom'>;

export default function ChatRoomScreen({ route }: Props) {
  const { chatId } = route.params;
  const { firebaseUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const listRef = useRef<FlatList<Message>>(null);

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
    if (!text || !firebaseUser) return;
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
          editable={!sending}
        />
        <Pressable onPress={handleSend} disabled={!draft.trim() || sending} style={[styles.sendButton, (!draft.trim() || sending) && styles.sendButtonDisabled]}>
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
});
