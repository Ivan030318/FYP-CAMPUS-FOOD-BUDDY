import { addDoc, collection, doc, getDoc, onSnapshot, query, updateDoc, type Unsubscribe } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import type { Report, ReportStatus } from '../types';

const reportsCol = collection(firestore, 'reports');
const adminUsersCol = collection(firestore, 'adminUsers');

export async function submitReport(
  reporterId: string,
  reportedUserId: string,
  reason: string
): Promise<void> {
  await addDoc(reportsCol, {
    reporter_id: reporterId,
    reported_user_id: reportedUserId,
    reason,
    status: 'pending' as ReportStatus,
    submitted_at: Date.now(),
  });
}

/** Checks the signed-in user's own admin marker. Other users' role records are never readable. */
export async function isAdmin(uid: string): Promise<boolean> {
  const snapshot = await getDoc(doc(adminUsersCol, uid));
  return snapshot.exists();
}

export function subscribeToReports(callback: (reports: Report[]) => void): Unsubscribe {
  return onSnapshot(query(reportsCol), (snapshot) => {
    callback(
      snapshot.docs
        .map((item) => ({ report_id: item.id, ...item.data() } as Report))
        .sort((first, second) => second.submitted_at - first.submitted_at)
    );
  });
}

export async function resolveReport(reportId: string): Promise<void> {
  await updateDoc(doc(reportsCol, reportId), { status: 'resolved' as ReportStatus });
}
