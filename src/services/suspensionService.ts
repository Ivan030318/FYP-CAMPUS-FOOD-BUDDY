import { collection, deleteDoc, doc, getDoc, onSnapshot, query, setDoc, type Unsubscribe } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import type { AccountSuspension } from '../types';

const suspensionsCol = collection(firestore, 'accountSuspensions');

export async function getMySuspension(uid: string): Promise<AccountSuspension | null> {
  const snapshot = await getDoc(doc(suspensionsCol, uid));
  return snapshot.exists() ? (snapshot.data() as AccountSuspension) : null;
}

export function subscribeToSuspensions(
  callback: (suspensions: AccountSuspension[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    query(suspensionsCol),
    (snapshot) => callback(
      snapshot.docs
        .map((item) => item.data() as AccountSuspension)
        .sort((first, second) => second.suspended_at - first.suspended_at)
    ),
    onError
  );
}

export async function suspendAccount(adminUid: string, userId: string, reason: string): Promise<void> {
  if (adminUid === userId) throw new Error('You cannot suspend your own administrator account.');
  await setDoc(doc(suspensionsCol, userId), {
    user_id: userId,
    reason: reason.trim() || 'Account suspended after a moderation review.',
    suspended_at: Date.now(),
    suspended_by: adminUid,
  });
}

export async function restoreAccount(userId: string): Promise<void> {
  await deleteDoc(doc(suspensionsCol, userId));
}
