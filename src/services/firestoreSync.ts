import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Boss, UserAccount, NotificationSettings, SheetConfig } from '../types/boss';
import { deduplicateBossList } from '../utils/bossDeduplication';

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
        const rawBosses: Boss[] = [];
        snapshot.forEach((docSnap) => {
          rawBosses.push(docSnap.data() as Boss);
        });

        // Deduplicate bosses to guarantee no duplicate names on screen
        const { uniqueBosses, duplicatesToRemove } = deduplicateBossList(rawBosses);

        // Permanently delete duplicate documents from Firestore in the background
        if (duplicatesToRemove.length > 0) {
          for (const dup of duplicatesToRemove) {
            if (dup.id && !uniqueBosses.some(u => u.id === dup.id)) {
              deleteBossFromFirestore(dup.id).catch(() => {});
            }
          }
        }

        onUpdate(uniqueBosses);
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
          const u = docSnap.data() as UserAccount;
          // If any user is in 'pending' status, automatically activate them in Firestore
          if (u && (u.status === 'pending' || !u.active)) {
            const activeUser: UserAccount = { ...u, status: 'active', active: true };
            saveUserToFirestore(activeUser).catch(() => {});
            users.push(activeUser);
          } else {
            users.push(u);
          }
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
    const { uniqueBosses } = deduplicateBossList(bosses);
    // Firestore batch has a 500 operations limit
    const chunkSize = 400;
    for (let i = 0; i < uniqueBosses.length; i += chunkSize) {
      const chunk = uniqueBosses.slice(i, i + chunkSize);
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

    // Only seed settings if document does NOT already exist!
    const settingsDoc = await getDoc(doc(db, SETTINGS_COLLECTION, 'global'));
    if (!settingsDoc.exists()) {
      console.log('Seeding initial settings to Firestore...');
      await saveSettingsToFirestore(defaultSettings);
    }

    // Only seed sheetConfig if document does NOT already exist!
    const sheetDoc = await getDoc(doc(db, SHEET_CONFIG_COLLECTION, 'global'));
    if (!sheetDoc.exists()) {
      console.log('Seeding initial sheetConfig to Firestore...');
      await saveSheetConfigToFirestore(defaultSheetConfig);
    }
  } catch (err) {
    console.warn('Firestore seeding notice:', err);
  }
}
