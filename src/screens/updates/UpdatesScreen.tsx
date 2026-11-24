import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { subscribeToMyRequests } from '../../services/requestService';
import { subscribeToMyChats } from '../../services/chatService';
import { getUsersByIds } from '../../services/userService';
import { Avatar } from '../../components/Avatar';
import { colors } from '../../theme/colors';
import { LoadError } from '../../components/LoadError';
import type { Chat, FoodBuddyRequest, PublicUserProfile } from '../../types';

type UpdateItem = {
  id: string;
  kind: 'request' | 'accepted' | 'rejected' | 'chat';
  otherUserId: string;
  timestamp: number;
  detail: string;
  chatId?: string;
};

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' · ' +
    date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function UpdatesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { firebaseUser } = useAuth();
  const [requests, setRequests] = useState<FoodBuddyRequest[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [usersById, setUsersById] = useState<Record<string, PublicUserProfile>>({});
  const [requestsLoaded, setRequestsLoaded] = useState(false);
  const [chatsLoaded, setChatsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!firebaseUser) return;
    setRequestsLoaded(false);
    setLoadError(false);
    return subscribeToMyRequests(
      firebaseUser.uid,
      (items) => {
        setRequests(items);
        setRequestsLoaded(true);
      },
      () => {
        setLoadError(true);
        setRequestsLoaded(true);
      }
    );
  }, [firebaseUser, retryKey]);

  useEffect(() => {
    if (!firebaseUser) return;
    setChatsLoaded(false);
    setLoadError(false);
    return subscribeToMyChats(
      firebaseUser.uid,
      (items) => {
        setChats(items);
        setChatsLoaded(true);
      },
      () => {
        setLoadError(true);
        setChatsLoaded(true);
      }
    );
  }, [firebaseUser, retryKey]);

  const updates = useMemo<UpdateItem[]>(() => {
    if (!firebaseUser) return [];
    const requestUpdates = requests.map((request) => {
      const received = request.recipient_id === firebaseUser.uid;
      const otherUserId = received ? request.requester_id : request.recipient_id;
      const kind: UpdateItem['kind'] = request.status === 'pending'
        ? 'request'
        : request.status === 'accepted'
          ? 'accepted'
          : 'rejected';
      const detail = request.status === 'pending'
        ? received ? 'sent you a food buddy request' : 'Your food buddy request is pending'
        : request.status === 'accepted'
          ? received ? 'You accepted this food buddy request' : 'accepted your food buddy request'
          : received ? 'You declined this food buddy request' : 'declined your food buddy request';
      return { id: `request-${request.request_id}`, kind, otherUserId, timestamp: request.responded_at ?? request.created_at, detail };
    });
    const chatUpdates = chats.flatMap((chat) => {
      if (chat.last_message_sender_id && chat.last_message_sender_id === firebaseUser.uid) return [];
      const otherUserId = chat.user_ids.find((id) => id !== firebaseUser.uid) ?? firebaseUser.uid;
      return [{
        id: `chat-${chat.chat_id}`,
        kind: 'chat' as const,
        otherUserId,
        timestamp: chat.last_message_time,
        detail: chat.last_message_preview,
        chatId: chat.chat_id,
      }];
    });
    return [...requestUpdates, ...chatUpdates].sort((a, b) => b.timestamp - a.timestamp);
  }, [requests, chats, firebaseUser]);

  useEffect(() => {
    const ids = Array.from(new Set(updates.map((item) => item.otherUserId)));
    if (ids.length) getUsersByIds(ids).then(setUsersById);
  }, [updates]);

  if (loadError) {
    return <LoadError title="Could not load updates" onRetry={() => setRetryKey((key) => key + 1)} />;
  }

  if (!requestsLoaded || !chatsLoaded) {
    return <View style={styles.centered}><ActivityIndicator color={colors.primary} /></View>;
  }

  return (
    <FlatList
      data={updates}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={<View style={[styles.intro, { paddingTop: insets.top + 12 }]}><Text style={styles.kicker}>STAY UPDATED</Text><Text style={styles.title}>Updates</Text><Text style={styles.helper}>Requests and chat activity in one place.</Text></View>}
      ListEmptyComponent={<View style={styles.centered}><Text style={styles.emptyEmoji}>🔔</Text><Text style={styles.emptyTitle}>Nothing new yet</Text><Text style={styles.emptyText}>Request and chat activity will appear here, so you never miss a food buddy update.</Text></View>}
      renderItem={({ item }) => {
        const other = usersById[item.otherUserId];
        const otherName = other?.display_name ?? 'Student';
        const icon = item.kind === 'request' ? '🤝' : item.kind === 'accepted' ? '🎉' : item.kind === 'rejected' ? '↩️' : '💬';
        return (
          <Pressable
            style={styles.card}
            onPress={() => item.chatId
              ? navigation.navigate('ChatsTab', { screen: 'ChatRoom', params: { chatId: item.chatId, otherUserName: otherName } })
              : navigation.navigate('RequestsTab')}
          >
            <Avatar name={otherName} uri={other?.profile_photo_url} />
            <View style={styles.body}>
              <View style={styles.row}><Text style={styles.name}>{icon} {otherName}</Text><Text style={styles.time}>{formatTime(item.timestamp)}</Text></View>
              <Text style={styles.detail} numberOfLines={2}>{item.detail}</Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  list: { padding: 20, paddingBottom: 112, flexGrow: 1, backgroundColor: colors.background },
  intro: { paddingBottom: 20 },
  kicker: { fontSize: 11, letterSpacing: 0.5, fontWeight: '700', color: colors.textMuted, marginBottom: 5 },
  title: { fontSize: 30, fontWeight: '700', color: colors.text },
  helper: { fontSize: 13, color: colors.textMuted, marginTop: 5 },
  emptyEmoji: { fontSize: 34, marginBottom: 10 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptyText: { color: colors.textMuted, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  card: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  body: { flex: 1, marginLeft: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, fontSize: 15, fontWeight: '800', color: colors.text },
  time: { fontSize: 10, color: colors.textMuted },
  detail: { fontSize: 13, lineHeight: 18, color: colors.textMuted, marginTop: 4 },
});
