import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Boss, UserAccount, NotificationSettings, SheetConfig } from '../types/boss';

const BOSSES_COLLECTION = 'bosses';
const USERS_COLLECTION = 'users';
const SETTINGS_COLLECTION = 'settings';
const SHEET_CONFIG_COLLECTION = 'sheetConfig';

/**
 * Real-time listener for Bosses from Firestore
 */
export function subscribeToFirestoreBosses(
  onUpdate: (bosses: Boss[]) => void,
  onError?: (err: unknown) => void
) {
  try {
    const colRef = collection(db, BOSSES_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const bosses: Boss[] = [];
        snapshot.forEach((docSnap) => {
          bosses.push(docSnap.data() as Boss);
        });
        onUpdate(bosses);
      },
      (error) => {
        console.error('Firestore Bosses subscription error:', error);
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, BOSSES_COLLECTION);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, BOSSES_COLLECTION);
    return () => {};
  }
}

/**
 * Real-time listener for Guild Users from Firestore
 */
export function subscribeToFirestoreUsers(
  onUpdate: (users: UserAccount[]) => void,
  onError?: (err: unknown) => void
) {
  try {
    const colRef = collection(db, USERS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const users: UserAccount[] = [];
        snapshot.forEach((docSnap) => {
          users.push(docSnap.data() as UserAccount);
        });
        onUpdate(users);
      },
      (error) => {
        console.error('Firestore Users subscription error:', error);
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, USERS_COLLECTION);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, USERS_COLLECTION);
    return () => {};
  }
}

/**
 * Real-time listener for Settings from Firestore
 */
export function subscribeToFirestoreSettings(
  onUpdate: (settings: NotificationSettings) => void,
  onError?: (err: unknown) => void
) {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, 'global');
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          onUpdate(docSnap.data() as NotificationSettings);
        }
      },
      (error) => {
        console.error('Firestore Settings subscription error:', error);
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, `${SETTINGS_COLLECTION}/global`);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${SETTINGS_COLLECTION}/global`);
    return () => {};
  }
}

/**
 * Real-time listener for SheetConfig from Firestore
 */
export function subscribeToFirestoreSheetConfig(
  onUpdate: (config: SheetConfig) => void,
  onError?: (err: unknown) => void
) {
  try {
    const docRef = doc(db, SHEET_CONFIG_COLLECTION, 'global');
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          onUpdate(docSnap.data() as SheetConfig);
        }
      },
      (error) => {
        console.error('Firestore SheetConfig subscription error:', error);
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, `${SHEET_CONFIG_COLLECTION}/global`);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${SHEET_CONFIG_COLLECTION}/global`);
    return () => {};
  }
}

/**
 * Strips all undefined fields recursively so Firestore never rejects documents
 * with "Unsupported field value: undefined"
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

/**
 * Save single boss to Firestore
 */
export async function saveBossToFirestore(boss: Boss) {
  const path = `${BOSSES_COLLECTION}/${boss.id}`;
  try {
    const docRef = doc(db, BOSSES_COLLECTION, boss.id);
    const cleaned = sanitizeForFirestore(boss);
    await setDoc(docRef, cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Save all bosses (batch) to Firestore (e.g. on initial seed or import)
 */
export async function batchSaveBossesToFirestore(bosses: Boss[]) {
  try {
    // Firestore batch has a 500 operations limit
    const chunkSize = 400;
    for (let i = 0; i < bosses.length; i += chunkSize) {
      const chunk = bosses.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const b of chunk) {
        const docRef = doc(db, BOSSES_COLLECTION, b.id);
        const cleaned = sanitizeForFirestore(b);
        batch.set(docRef, cleaned, { merge: true });
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, BOSSES_COLLECTION);
  }
}

/**
 * Delete boss from Firestore
 */
export async function deleteBossFromFirestore(bossId: string) {
  const path = `${BOSSES_COLLECTION}/${bossId}`;
  try {
    const docRef = doc(db, BOSSES_COLLECTION, bossId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Save / Update Guild User in Firestore
 */
export async function saveUserToFirestore(user: UserAccount) {
  const path = `${USERS_COLLECTION}/${user.id}`;
  try {
    const docRef = doc(db, USERS_COLLECTION, user.id);
    const cleaned = sanitizeForFirestore(user);
    await setDoc(docRef, cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete User from Firestore
 */
export async function deleteUserFromFirestore(userId: string) {
  const path = `${USERS_COLLECTION}/${userId}`;
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Save Settings in Firestore
 */
export async function saveSettingsToFirestore(settings: NotificationSettings) {
  const path = `${SETTINGS_COLLECTION}/global`;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, 'global');
    const cleaned = sanitizeForFirestore(settings);
    await setDoc(docRef, cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Save Sheet Config in Firestore
 */
export async function saveSheetConfigToFirestore(config: SheetConfig) {
  const path = `${SHEET_CONFIG_COLLECTION}/global`;
  try {
    const docRef = doc(db, SHEET_CONFIG_COLLECTION, 'global');
    const cleaned = sanitizeForFirestore(config);
    await setDoc(docRef, cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Seed initial data to Firestore if collection is empty
 */
export async function seedFirestoreIfEmpty(
  defaultBosses: Boss[], 
  defaultUsers: UserAccount[],
  defaultSettings: NotificationSettings,
  defaultSheetConfig: SheetConfig
) {
  try {
    const bossesSnap = await getDocs(collection(db, BOSSES_COLLECTION));
    if (bossesSnap.empty) {
      console.log('Seeding initial bosses to Firestore...');
      await batchSaveBossesToFirestore(defaultBosses);
    }

    const usersSnap = await getDocs(collection(db, USERS_COLLECTION));
    if (usersSnap.empty) {
      console.log('Seeding initial users to Firestore...');
      for (const u of defaultUsers) {
        await saveUserToFirestore(u);
      }
    }

    await saveSettingsToFirestore(defaultSettings);
    await saveSheetConfigToFirestore(defaultSheetConfig);
  } catch (err) {
    console.warn('Firestore seeding notice:', err);
  }
}
