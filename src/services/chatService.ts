import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import type { Chat, Message } from '../types';

const chatsCol = collection(firestore, 'chats');

export function subscribeToMyChats(uid: string, callback: (chats: Chat[]) => void): Unsubscribe {
  const q = query(chatsCol, where('user_ids', 'array-contains', uid));
  return onSnapshot(q, (snap) => {
    const chats = snap.docs
      .map((d) => ({ chat_id: d.id, ...d.data() } as Chat))
      .sort((a, b) => b.last_message_time - a.last_message_time);
    callback(chats);
  });
}

function messagesCol(chatId: string) {
  return collection(firestore, 'chats', chatId, 'messages');
}

export function subscribeToMessages(
  chatId: string,
  callback: (messages: Message[]) => void
): Unsubscribe {
  const q = query(messagesCol(chatId), orderBy('sent_at', 'asc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ message_id: d.id, ...d.data() } as Message)));
  });
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
  await addDoc(messagesCol(chatId), {
    chat_id: chatId,
    sender_id: senderId,
    text_content: text,
    sent_at: sentAt,
  });
  await updateDoc(doc(chatsCol, chatId), {
    last_message_preview: text.slice(0, 80),
    last_message_time: sentAt,
  });
}
