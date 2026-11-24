import {
  collection,
  doc,
  FieldPath,
  onSnapshot,
  query,
  where,
  orderBy,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import type { Chat, Message } from '../types';

const chatsCol = collection(firestore, 'chats');

export function hasUnreadMessage(chat: Chat, uid: string): boolean {
  return !!chat.last_message_sender_id
    && chat.last_message_sender_id !== uid
    && (chat.last_read_at?.[uid] ?? 0) < chat.last_message_time;
}

export function subscribeToMyChats(
  uid: string,
  callback: (chats: Chat[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(chatsCol, where('user_ids', 'array-contains', uid));
  return onSnapshot(
    q,
    (snap) => {
      const chats = snap.docs
        .map((d) => ({ chat_id: d.id, ...d.data() } as Chat))
        .sort((a, b) => b.last_message_time - a.last_message_time);
      callback(chats);
    },
    onError
  );
}

function messagesCol(chatId: string) {
  return collection(firestore, 'chats', chatId, 'messages');
}

export function subscribeToMessages(
  chatId: string,
  callback: (messages: Message[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(messagesCol(chatId), orderBy('sent_at', 'asc'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ message_id: d.id, ...d.data() } as Message))),
    onError
  );
}

export async function sendMessage(
  chatId: string,
  senderId: string,
  textContent: string
): Promise<void> {
  const text = textContent.trim();
  if (!text) throw new Error('Messages cannot be empty.');
  if (text.length > 1000) throw new Error('Messages must be 1,000 characters or fewer.');

  const sentAt = Date.now();
  const chatRef = doc(chatsCol, chatId);
  const batch = writeBatch(firestore);
  batch.set(doc(messagesCol(chatId)), {
    chat_id: chatId,
    sender_id: senderId,
    text_content: text,
    sent_at: sentAt,
  });
  batch.update(
    chatRef,
    'last_message_preview', text.slice(0, 80),
    'last_message_time', sentAt,
    'last_message_sender_id', senderId,
    new FieldPath('last_read_at', senderId), sentAt
  );
  await batch.commit();
}

export async function markChatRead(chatId: string, uid: string): Promise<void> {
  await updateDoc(doc(chatsCol, chatId), new FieldPath('last_read_at', uid), Date.now());
}
