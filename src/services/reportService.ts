import { addDoc, collection } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import type { ReportStatus } from '../types';

const reportsCol = collection(firestore, 'reports');

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
