import {
  addDoc,
  collection,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where,
  or,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import type { FoodBuddyRequest, RequestStatus } from '../types';
import { createChatForRequest } from './chatService';

const requestsCol = collection(firestore, 'foodBuddyRequests');

export async function sendBuddyRequest(
  requesterId: string,
  recipientId: string
): Promise<string> {
  const docRef = await addDoc(requestsCol, {
    requester_id: requesterId,
    recipient_id: recipientId,
    status: 'pending' as RequestStatus,
    created_at: Date.now(),
  });
  return docRef.id;
}

export function subscribeToMyRequests(
  uid: string,
  callback: (requests: FoodBuddyRequest[]) => void
): Unsubscribe {
  const q = query(
    requestsCol,
    or(where('requester_id', '==', uid), where('recipient_id', '==', uid))
  );
  return onSnapshot(q, (snap) => {
    const requests = snap.docs
      .map((d) => ({ request_id: d.id, ...d.data() } as FoodBuddyRequest))
      .sort((a, b) => b.created_at - a.created_at);
    callback(requests);
  });
}

export async function respondToRequest(
  request: FoodBuddyRequest,
  accept: boolean
): Promise<void> {
  const status: RequestStatus = accept ? 'accepted' : 'rejected';
  await updateDoc(doc(requestsCol, request.request_id), { status });
  if (accept) {
    await createChatForRequest(request.request_id, [request.requester_id, request.recipient_id]);
  }
}
