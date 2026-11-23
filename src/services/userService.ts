import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  arrayUnion,
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import type { UserProfile } from '../types';

const usersCol = collection(firestore, 'users');

export async function createUserProfile(
  uid: string,
  data: { display_name: string; university_email: string }
): Promise<UserProfile> {
  const profile: UserProfile = {
    user_id: uid,
    display_name: data.display_name,
    university_email: data.university_email,
    profile_photo_url: null,
    food_preferences: [],
    available_meal_times: [],
    dining_location: '',
    blocked_users: [],
    created_at: Date.now(),
  };
  await setDoc(doc(usersCol, uid), profile);
  return profile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(usersCol, uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function updateUserProfile(
  uid: string,
  data: Partial<Omit<UserProfile, 'user_id' | 'created_at'>>
): Promise<void> {
  await updateDoc(doc(usersCol, uid), data);
}

export async function getAllOtherUsers(excludeUid: string): Promise<UserProfile[]> {
  const snap = await getDocs(usersCol);
  return snap.docs
    .map((d) => d.data() as UserProfile)
    .filter((u) => u.user_id !== excludeUid);
}

export async function getUsersByIds(uids: string[]): Promise<Record<string, UserProfile>> {
  const result: Record<string, UserProfile> = {};
  await Promise.all(
    uids.map(async (uid) => {
      const profile = await getUserProfile(uid);
      if (profile) result[uid] = profile;
    })
  );
  return result;
}

export async function blockUser(uid: string, blockedUid: string): Promise<void> {
  await updateDoc(doc(usersCol, uid), {
    blocked_users: arrayUnion(blockedUid),
  });
}
