
'use client';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  limit,
  where,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { Campaign } from './types';

// --- GENERIC FIRESTORE HELPERS ---

/**
 * Saves a document to a specified collection with a given ID.
 * @param collectionPath The path to the collection.
 * @param docId The ID of the document to save.
 * @param data The data to save.
 */
async function saveDocument<T>(collectionPath: string[], docId: string, data: T) {
  if (!db) throw new Error('Firestore is not initialized.');
  const collectionRef = collection(db, ...collectionPath);
  await setDoc(doc(collectionRef, docId), data, { merge: true });
}

/**
 * Deletes a document from a specified collection by its ID.
 * @param collectionPath The path to the collection.
 * @param docId The ID of the document to delete.
 */
async function deleteDocument(collectionPath: string[], docId: string) {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, ...collectionPath, docId);
  await deleteDoc(docRef);
}

/**
 * Fetches a single document by its ID from a specified collection.
 * @param collectionPath The path to the collection.
 * @param docId The ID of the document to fetch.
 * @returns The document data or null if not found.
 */
async function getDocument<T>(collectionPath: string[], docId: string): Promise<(T & { id: string }) | null> {
  if (!db) throw new Error('Firestore is not initialized.');
  const docRef = doc(db, ...collectionPath, docId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T & { id: string };
  }
  return null;
}

/**
 * Fetches all documents from a specified collection.
 * @param collectionPath The path to the collection.
 * @returns An array of documents.
 */
async function getCollection<T>(collectionPath: string[]): Promise<(T & { id: string })[]> {
  if (!db) throw new Error('Firestore is not initialized.');
  const collectionRef = collection(db, ...collectionPath);
  const snapshot = await getDocs(collectionRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T & { id: string }));
}

/**
 * Seeds a collection with initial data if it's empty.
 * @param collectionPath Path to the collection.
 * @param initialData Array of initial data objects.
 * @param idField The field in the data object to use as the document ID.
 */
export async function seedCollection(collectionPath: string[], initialData: any[], idField: string) {
    if (!db) throw new Error("Firestore not initialized");
    const collectionRef = collection(db, ...collectionPath);
    const snapshot = await getDocs(query(collectionRef, limit(1)));

    if (snapshot.empty) {
        console.log(`Seeding '${collectionPath.join('/')}'...`);
        const batch = writeBatch(db);
        initialData.forEach(item => {
            const docId = item[idField];
            if (!docId) {
                console.warn(`Item is missing ID field '${idField}', skipping:`, item);
                return;
            }
            const docRef = doc(collectionRef, String(docId));
            batch.set(docRef, item);
        });
        await batch.commit();
    }
}


// --- USER-SPECIFIC DATA HELPERS (uses subcollections under /users/{userId}) ---

function getCurrentUserId(): string {
  const user = auth?.currentUser;
  if (!user) throw new Error('User not authenticated.');
  return user.uid;
}

export const getUserDoc = async <T>(collectionName: string, docId: string) => {
  return getDocument<T>(['users', getCurrentUserId(), collectionName], docId);
}

export const getUserCollection = async <T>(collectionName: string) => {
  return getCollection<T>(['users', getCurrentUserId(), collectionName]);
}

export const saveUserDoc = async <T>(collectionName: string, docId: string, data: T) => {
  return saveDocument<T>(['users', getCurrentUserId(), collectionName], docId, data);
}

export const deleteUserDoc = async (collectionName: string, docId: string) => {
  return deleteDocument(['users', getCurrentUserId(), collectionName], docId);
}

export const seedInitialUserData = async (collectionName: string, initialData: any[], idField: string) => {
  const collectionPath = ['users', getCurrentUserId(), collectionName];
  return seedCollection(collectionPath, initialData, idField);
}


// --- GLOBAL DATA HELPERS (uses top-level collections) ---

export const getGlobalDoc = async <T>(collectionName: string, docId: string) => {
  return getDocument<T>([collectionName], docId);
}

export const getGlobalCollection = async <T>(collectionName: string) => {
  return getCollection<T>([collectionName]);
}

export const saveGlobalDoc = async <T>(collectionName:string, docId: string, data: T) => {
  return saveDocument<T>([collectionName], docId, data);
}

export const deleteGlobalDoc = async (collectionName: string, docId: string) => {
  return deleteDocument([collectionName], docId);
}

export const seedGlobalData = async (collectionName: string, initialData: any[], idField: string) => {
  return seedCollection([collectionName], initialData, idField);
}


// --- QUERY HELPERS ---
/**
 * Fetches documents from a top-level collection where the 'userId' field matches the current user.
 * @param collectionName The name of the top-level collection.
 * @returns An array of documents belonging to the current user.
 */
export async function getCollectionForUser<T>(collectionName: string): Promise<(T & { id: string })[]> {
  if (!db) throw new Error('Firestore not initialized.');
  const userId = getCurrentUserId();
  const collectionRef = collection(db, collectionName);
  const q = query(collectionRef, where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T & { id: string }));
}

/**
 * Fetches a single document from a top-level collection and verifies ownership or collaboration.
 * Currently specific to Campaigns.
 * @param collectionName The name of the collection (e.g., 'campaigns').
 * @param docId The ID of the document to fetch.
 * @returns The document data with ID, or null if not found or no permission.
 */
export async function getDocForUser<T>(collectionName: string, docId: string): Promise<(T & { id: string }) | null> {
  if (!db) throw new Error('Firestore not initialized.');
  
  const docData = await getDocument<T>([collectionName], docId);
  if (!docData) return null;

  if (collectionName === 'campaigns') {
    const campaignData = docData as unknown as Campaign;
    const userId = auth?.currentUser?.uid;
    if (userId && (campaignData.userId === userId || campaignData.collaboratorIds?.includes(userId))) {
      return docData;
    }
    return null; // No access
  }

  // Fallback for other potential collections, assuming a 'userId' field for ownership.
  const record = docData as any;
  if (record.userId && record.userId === auth?.currentUser?.uid) {
    return docData;
  }
  
  // If the logic reaches here for a collection other than 'campaigns' without a userId field,
  // it might indicate a missing security check, but we'll return null to be safe.
  if (!record.userId) return null;

  return null;
}


/**
 * Fetches documents from a top-level collection where the current user is a collaborator.
 * @param collectionName The name of the top-level collection to query.
 * @returns An array of documents shared with the current user.
 */
export async function getSharedCampaignsForUser<T>(collectionName: string): Promise<(T & { id: string })[]> {
  if (!db) throw new Error('Firestore not initialized.');
  const userId = getCurrentUserId();
  const collectionRef = collection(db, collectionName);
  const q = query(collectionRef, where('collaboratorIds', 'array-contains', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T & { id: string }));
}


/**
 * Saves a document to a top-level collection, adding the current user's ID.
 * @param collectionName The name of the top-level collection.
 * @param docId The ID of the document.
 * @param data The data to save.
 */
export async function saveDocForUser<T>(collectionName: string, docId: string, data: T) {
  const userId = getCurrentUserId();
  const dataWithUser = { ...data, userId };
  return saveDocument( [collectionName], docId, dataWithUser);
}
