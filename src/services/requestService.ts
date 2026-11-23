import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  or,
  query,
  runTransaction,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import type { FoodBuddyRequest, RequestStatus } from '../types';

const requestsCol = collection(firestore, 'foodBuddyRequests');
const chatsCol = collection(firestore, 'chats');

export class BuddyRequestError extends Error {}

/** One deterministic document for a pair prevents same-direction and reverse duplicates. */
export function getBuddyRequestId(firstUid: string, secondUid: string): string {
  return [firstUid, secondUid].sort().join('_');
}

export async function getBuddyRequest(
  firstUid: string,
  secondUid: string
): Promise<FoodBuddyRequest | null> {
  const requestId = getBuddyRequestId(firstUid, secondUid);
  // Query only records involving the signed-in user. This avoids a denied read when the
  // deterministic document does not exist yet, while preserving private request visibility.
  const snapshot = await getDocs(
    query(
      requestsCol,
      or(where('requester_id', '==', firstUid), where('recipient_id', '==', firstUid))
    )
  );
  const match = snapshot.docs.find((item) => item.id === requestId);
  return match ? ({ request_id: match.id, ...match.data() } as FoodBuddyRequest) : null;
}

export async function sendBuddyRequest(requesterId: string, recipientId: string): Promise<string> {
  if (requesterId === recipientId) throw new BuddyRequestError('You cannot send a request to yourself.');
  const requestId = getBuddyRequestId(requesterId, recipientId);
  const requestRef = doc(requestsCol, requestId);

  try {
    await runTransaction(firestore, async (transaction) => {
      // create(), unlike set(), fails atomically if this pair already has a request.
      transaction.create(requestRef, {
        participant_ids: [requesterId, recipientId].sort(),
        requester_id: requesterId,
        recipient_id: recipientId,
        status: 'pending' as RequestStatus,
        created_at: Date.now(),
      });
    });
  } catch (error: any) {
    if (error?.code === 'already-exists' || error?.code === 'failed-precondition') {
      throw new BuddyRequestError('A request or buddy connection between you already exists.');
    }
    throw error;
  }
  return requestId;
}

export function subscribeToMyRequests(
  uid: string,
  callback: (requests: FoodBuddyRequest[]) => void
): Unsubscribe {
  const requestQuery = query(
    requestsCol,
    or(where('requester_id', '==', uid), where('recipient_id', '==', uid))
  );
  return onSnapshot(requestQuery, (snap) => {
    const requests = snap.docs
      .map((item) => ({ request_id: item.id, ...item.data() } as FoodBuddyRequest))
      .sort((first, second) => second.created_at - first.created_at);
    callback(requests);
  });
}

/**
 * Only the request recipient can accept/reject a pending request. An accepted request and its
 * deterministic chat are written atomically so duplicate chats cannot be created.
 */
export async function respondToRequest(
  request: FoodBuddyRequest,
  responderId: string,
  accept: boolean
): Promise<void> {
  const requestRef = doc(requestsCol, request.request_id);
  const chatRef = doc(chatsCol, request.request_id);

  await runTransaction(firestore, async (transaction) => {
    const current = await transaction.get(requestRef);
    if (!current.exists()) throw new BuddyRequestError('This request no longer exists.');
    const data = current.data() as Omit<FoodBuddyRequest, 'request_id'>;
    if (data.recipient_id !== responderId) throw new BuddyRequestError('Only the recipient can respond.');
    if (data.status !== 'pending') throw new BuddyRequestError('This request has already been handled.');

    if (!accept) {
      transaction.update(requestRef, { status: 'rejected' as RequestStatus });
      return;
    }

    const chat = await transaction.get(chatRef);
    transaction.update(requestRef, { status: 'accepted' as RequestStatus });
    if (!chat.exists()) {
      transaction.set(chatRef, {
        request_id: request.request_id,
        user_ids: [data.requester_id, data.recipient_id],
        last_message_preview: 'You are now matched! Say hi 👋',
        last_message_time: Date.now(),
      });
    }
  });
}
