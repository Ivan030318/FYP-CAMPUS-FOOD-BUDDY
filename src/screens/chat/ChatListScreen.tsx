import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { hasUnreadMessage, subscribeToMyChats } from '../../services/chatService';
import { getUsersByIds } from '../../services/userService';
import { Avatar } from '../../components/Avatar';
import { colors } from '../../theme/colors';
import { LoadError } from '../../components/LoadError';
import type { Chat, PublicUserProfile } from '../../types';
import type { ChatsStackParamList } from '../../navigation/MainTabs';

type Props = NativeStackScreenProps<ChatsStackParamList, 'ChatList'>;

function formatTime(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' ' +
    date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function ChatListScreen({ navigation }: Props) {
  const { firebaseUser } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [usersById, setUsersById] = useState<Record<string, PublicUserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!firebaseUser) return;
    setLoading(true);
    setLoadError(false);
    const unsubscribe = subscribeToMyChats(
      firebaseUser.uid,
      (list) => {
        setChats(list);
        setLoading(false);
      },
      () => {
        setLoadError(true);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [firebaseUser, retryKey]);

  useEffect(() => {
    const otherIds = Array.from(
      new Set(chats.flatMap((c) => c.user_ids).filter((id) => id !== firebaseUser?.uid))
    );
    if (otherIds.length === 0) return;
    getUsersByIds(otherIds).then(setUsersById);
  }, [chats, firebaseUser]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (loadError) return <LoadError title="Could not load chats" onRetry={() => setRetryKey((key) => key + 1)} />;

  return (
    <FlatList
      data={chats}
      keyExtractor={(item) => item.chat_id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.intro}>
          <Text style={styles.kicker}>KEEP IN TOUCH</Text>
          <Text style={styles.title}>Messages</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            No chats yet. Accept a food buddy request to start chatting!
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const otherId = item.user_ids.find((id) => id !== firebaseUser?.uid);
        const other = otherId ? usersById[otherId] : undefined;
        const otherName = other?.display_name ?? 'Student';
        const unread = firebaseUser ? hasUnreadMessage(item, firebaseUser.uid) : false;
        return (
          <Pressable
            style={styles.card}
            onPress={() =>
              navigation.navigate('ChatRoom', {
                chatId: item.chat_id,
                otherUserName: otherName,
              })
            }
          >
            <Avatar name={otherName} uri={other?.profile_photo_url} />
            <View style={styles.cardBody}>
              <View style={styles.rowBetween}>
                <Text style={[styles.name, unread && styles.nameUnread]}>{otherName}</Text>
                <Text style={styles.time}>{formatTime(item.last_message_time)}</Text>
              </View>
              <Text style={[styles.preview, unread && styles.previewUnread]} numberOfLines={1}>
                {item.last_message_preview}
              </Text>
              {unread ? <View style={styles.unreadDot} /> : null}
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { color: colors.textMuted, textAlign: 'center' },
  list: { padding: 20, flexGrow: 1 },
  intro: { paddingBottom: 20 },
  kicker: { fontSize: 11, letterSpacing: 0.5, fontWeight: '700', color: colors.textMuted, marginBottom: 5 },
  title: { fontSize: 30, fontWeight: '700', color: colors.text },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardBody: { marginLeft: 12, flex: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontSize: 16, fontWeight: '800', color: colors.text },
  nameUnread: { color: colors.primary },
  time: { fontSize: 11, color: colors.textMuted },
  preview: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  previewUnread: { color: colors.text, fontWeight: '600' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, position: 'absolute', right: 0, bottom: 4 },
});
