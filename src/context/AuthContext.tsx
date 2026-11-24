import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { createUserProfile, getUserProfile } from '../services/userService';
import { isAdmin as checkIsAdmin } from '../services/reportService';
import { getMySuspension } from '../services/suspensionService';
import type { UserProfile } from '../types';

interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  initializing: boolean;
  isAdmin: boolean;
  accountSuspended: boolean;
  emailVerified: boolean;
  profileError: string | null;
  refreshProfile: () => Promise<void>;
  retryProfile: () => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  refreshEmailVerification: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accountSuspended, setAccountSuspended] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const loadProfile = useCallback(async (uid: string) => {
    try {
      setProfileError(null);
      const p = await getUserProfile(uid);
      if (!p) throw new Error('Your account profile could not be found.');
      setProfile(p);
      try {
        setIsAdmin(await checkIsAdmin(uid));
      } catch {
        // If the role document is not available yet, keep the student app usable.
        setIsAdmin(false);
      }
    } catch {
      setProfile(null);
      setIsAdmin(false);
      setProfileError('Could not load your profile. Check your connection and try again.');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      try {
        if (user) {
          setEmailVerified(user.emailVerified);
          const suspension = await getMySuspension(user.uid);
          setAccountSuspended(Boolean(suspension));
          if (suspension) {
            setProfile(null);
            setProfileError(null);
            setIsAdmin(false);
          } else {
            await loadProfile(user.uid);
          }
        } else {
          setProfile(null);
          setIsAdmin(false);
          setProfileError(null);
          setAccountSuspended(false);
          setEmailVerified(false);
        }
      } finally {
        setInitializing(false);
      }
    });
    return unsubscribe;
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (firebaseUser) await loadProfile(firebaseUser.uid);
  }, [firebaseUser, loadProfile]);

  const retryProfile = useCallback(async () => {
    if (firebaseUser) await loadProfile(firebaseUser.uid);
  }, [firebaseUser, loadProfile]);

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      await updateProfile(credential.user, { displayName });
      await sendEmailVerification(credential.user);
      const created = await createUserProfile(credential.user.uid, {
        display_name: displayName,
        university_email: normalizedEmail,
      });
      setProfile(created);
      setIsAdmin(false);
      setAccountSuspended(false);
      setEmailVerified(false);
    },
    []
  );

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
  }, []);

  const sendVerificationEmail = useCallback(async () => {
    if (!firebaseUser) throw new Error('Please log in again before requesting a verification email.');
    await sendEmailVerification(firebaseUser);
  }, [firebaseUser]);

  const refreshEmailVerification = useCallback(async () => {
    if (!firebaseUser) return;
    await firebaseUser.reload();
    setEmailVerified(auth.currentUser?.emailVerified ?? false);
  }, [firebaseUser]);

  const logout = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  return (
    <AuthContext.Provider
      value={{ firebaseUser, profile, initializing, isAdmin, accountSuspended, emailVerified, profileError, refreshProfile, retryProfile, register, login, resetPassword, sendVerificationEmail, refreshEmailVerification, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
