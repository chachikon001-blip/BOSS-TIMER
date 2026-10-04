import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
/* CRITICAL: Must use firestoreDatabaseId from firebase-applet-config.json */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'settings', 'global'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network is waiting to connect.');
    }
  }
}
testFirestoreConnection();

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.setCustomParameters({
  prompt: 'consent',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  try {
    if (token) {
      localStorage.setItem('l2m_google_sheet_token', token);
    } else {
      localStorage.removeItem('l2m_google_sheet_token');
    }
  } catch {
    // ignore
  }
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  try {
    return onAuthStateChanged(
      auth,
      async (user: User | null) => {
        if (user) {
          const token = cachedAccessToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('l2m_google_sheet_token') : null) || '';
          if (onAuthSuccess) onAuthSuccess(user, token);
        } else {
          cachedAccessToken = null;
          if (onAuthFailure) onAuthFailure();
        }
      },
      (error) => {
        console.warn('Firebase Auth state notice:', error?.message || error);
        if (onAuthFailure) onAuthFailure();
      }
    );
  } catch (err) {
    console.warn('Firebase initAuth initialization warning:', err);
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }
};

export const googleSignIn = async (): Promise<{ user: User | null; accessToken: string | null } | null> => {
  if (isSigningIn) return null;
  isSigningIn = true;
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || null;
    if (token) {
      setAccessToken(token);
    }
    return {
      user: result.user,
      accessToken: token,
    };
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === 'auth/popup-blocked') {
      alert('เบราว์เซอร์บล็อกป๊อปอัป กรุณาอนุญาตให้เว็บไซต์นี้เปิดป๊อปอัปเพื่อเข้าสู่ระบบ Google');
    } else if (err.code !== 'auth/popup-closed-by-user') {
      console.warn('Google sign in note:', err.message || error);
    }
    return null;
  } finally {
    isSigningIn = false;
  }
};

export const logoutGoogle = async () => {
  try {
    await signOut(auth);
    setAccessToken(null);
  } catch (error) {
    console.warn('Logout notice:', error);
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    return localStorage.getItem('l2m_google_sheet_token');
  } catch {
    return null;
  }
};
