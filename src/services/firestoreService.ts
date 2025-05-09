import { collection, getDocs, getDoc, doc, query, limit } from 'firebase/firestore';
import { getDb, firebaseService } from './firebaseService';
import { FirestoreData } from '../store';

// Get all collections from Firestore
export const getCollections = async (): Promise<string[]> => {
  try {
    const db = getDb();
    if (!db) throw new Error('No active Firebase connection');
    
    // Use the Admin SDK through firebaseService to get collections
    return await firebaseService.getAllCollections();
  } catch (error) {
    console.error('Error getting collections:', error);
    throw error; // Let the UI handle the error
  }
};

// Get documents from a specific collection
export const getDocuments = async (collectionName: string): Promise<FirestoreData[]> => {
  try {
    const db = getDb();
    if (!db) throw new Error('No active Firebase connection');
    
    // Handle subcollection paths (format: "parentColl/docId/subcoll")
    const pathSegments = collectionName.split('/');
    let querySnapshot;
    
    if (pathSegments.length === 1) {
      // Regular top-level collection
      querySnapshot = await getDocs(collection(db, collectionName));
    } else if (pathSegments.length === 3) {
      // Subcollection (parent/docId/subcollection)
      const [parentColl, docId, subcoll] = pathSegments;
      querySnapshot = await getDocs(collection(db, parentColl, docId, subcoll));
    } else {
      throw new Error(`Invalid collection path format: ${collectionName}`);
    }
    
    const documents: FirestoreData[] = [];
    
    querySnapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return documents;
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
};

// Get a specific document by ID
export const getDocumentById = async (collectionName: string, documentId: string): Promise<FirestoreData | null> => {
  try {
    const db = getDb();
    if (!db) throw new Error('No active Firebase connection');
    
    // Handle subcollection paths
    const pathSegments = collectionName.split('/');
    let docRef;
    
    if (pathSegments.length === 1) {
      // Regular top-level collection
      docRef = doc(db, collectionName, documentId);
    } else if (pathSegments.length === 3) {
      // Subcollection (parent/docId/subcollection)
      const [parentColl, parentDocId, subcoll] = pathSegments;
      docRef = doc(db, parentColl, parentDocId, subcoll, documentId);
    } else {
      throw new Error(`Invalid collection path format: ${collectionName}`);
    }
    
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error getting document ${documentId} from ${collectionName}:`, error);
    throw error;
  }
}; 