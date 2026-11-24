import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  writeBatch,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import type { PrivateUserData, PublicUserProfile, UserProfile } from '../types';

const usersCol = collection(firestore, 'users');
const privateUsersCol = collection(firestore, 'privateUsers');
const blocksCol = collection(firestore, 'blocks');

export function getBlockId(blockerUid: string, blockedUid: string): string {
  return `${blockerUid}_${blockedUid}`;
}

export async function createUserProfile(
  uid: string,
  data: { display_name: string; university_email: string }
): Promise<UserProfile> {
  const publicProfile: PublicUserProfile = {
    user_id: uid,
    display_name: data.display_name,
    profile_photo_url: null,
    food_preferences: [],
    available_meal_times: [],
    dining_location: '',
    created_at: Date.now(),
  };
  const privateData: PrivateUserData = {
    university_email: data.university_email,
    blocked_users: [],
  };

  const batch = writeBatch(firestore);
  batch.set(doc(usersCol, uid), publicProfile);
  batch.set(doc(privateUsersCol, uid), privateData);
  await batch.commit();
  return { ...publicProfile, ...privateData };
}

export async function getPublicUserProfile(uid: string): Promise<PublicUserProfile | null> {
  const snap = await getDoc(doc(usersCol, uid));
  return snap.exists() ? (snap.data() as PublicUserProfile) : null;
}

/** Fetches the signed-in user's combined public and private profile. */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const [publicProfile, privateSnapshot] = await Promise.all([
    getPublicUserProfile(uid),
    getDoc(doc(privateUsersCol, uid)),
  ]);
  if (!publicProfile) return null;
  // Temporary compatibility for existing test accounts. Run scripts/migrate-user-profiles.mjs
  // before publishing the new rules so this fallback is no longer needed in stored documents.
  if (!privateSnapshot.exists()) {
    const legacy = publicProfile as PublicUserProfile & Partial<PrivateUserData>;
    if (!legacy.university_email) return null;
    return {
      ...publicProfile,
      university_email: legacy.university_email,
      blocked_users: legacy.blocked_users ?? [],
    };
  }
  return { ...publicProfile, ...(privateSnapshot.data() as PrivateUserData) };
}

export async function updateUserProfile(
  uid: string,
  data: Partial<Omit<PublicUserProfile, 'user_id' | 'created_at'>>
): Promise<void> {
  await updateDoc(doc(usersCol, uid), data);
}

export async function getAllOtherUsers(excludeUid: string): Promise<PublicUserProfile[]> {
  const snap = await getDocs(usersCol);
  return snap.docs
    .map((item) => item.data() as PublicUserProfile)
    .filter((profile) => profile.user_id !== excludeUid);
}

export async function getUsersByIds(
  uids: string[]
): Promise<Record<string, PublicUserProfile>> {
  const result: Record<string, PublicUserProfile> = {};
  const fetched = await Promise.allSettled(
    uids.map(async (uid) => ({ uid, profile: await getPublicUserProfile(uid) }))
  );
  fetched.forEach((item) => {
    if (item.status === 'fulfilled' && item.value.profile) {
      result[item.value.uid] = item.value.profile;
    }
  });
  return result;
}

export async function blockUser(uid: string, blockedUid: string): Promise<void> {
  if (uid === blockedUid) throw new Error('You cannot block yourself.');
  const batch = writeBatch(firestore);
  batch.update(doc(privateUsersCol, uid), { blocked_users: arrayUnion(blockedUid) });
  batch.set(doc(blocksCol, getBlockId(uid, blockedUid)), {
    blocker_id: uid,
    blocked_id: blockedUid,
    created_at: Date.now(),
  });
  await batch.commit();
}

export async function unblockUser(uid: string, blockedUid: string): Promise<void> {
  const batch = writeBatch(firestore);
  batch.update(doc(privateUsersCol, uid), { blocked_users: arrayRemove(blockedUid) });
  batch.delete(doc(blocksCol, getBlockId(uid, blockedUid)));
  await batch.commit();
}
