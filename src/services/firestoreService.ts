import { collection, getDocs, getDoc, doc, listCollections } from 'firebase/firestore';
import { db } from '../firebase';
import { FirestoreData } from '../store';

// Get all collections from Firestore
export const getCollections = async (): Promise<string[]> => {
  try {
    // Unfortunately, Firebase client SDK doesn't provide a direct way to list all collections
    // One approach is to use a Firestore Admin SDK on the backend
    // However, for a client-side solution, we can use a workaround with a special metadata collection
    
    // Method 1: Use a metadata document that stores collection names
    try {
      const metadataDoc = await getDoc(doc(db, 'metadata', 'collections'));
      if (metadataDoc.exists() && metadataDoc.data().collections) {
        return metadataDoc.data().collections;
      }
    } catch (metadataError) {
      console.log('No metadata document found, trying alternative method');
    }
    
    // Method 2: Query a few known root collections to explore what's available
    const collectionsSet = new Set<string>();
    
    // List of potential root collections to check
    const potentialCollections = ['users', 'products', 'orders', 'customers', 'categories', 'items', 'transactions', 'settings'];
    
    // Check each potential collection
    for (const collName of potentialCollections) {
      try {
        const querySnapshot = await getDocs(collection(db, collName));
        if (!querySnapshot.empty) {
          collectionsSet.add(collName);
        }
      } catch (error) {
        // Ignore errors for collections that don't exist
      }
    }
    
    // If no collections found, return a set of default collections for testing
    if (collectionsSet.size === 0) {
      return ['users', 'products', 'orders'];
    }
    
    return Array.from(collectionsSet);
  } catch (error) {
    console.error('Error getting collections:', error);
    throw error;
  }
};

// Get documents from a specific collection
export const getDocuments = async (collectionName: string): Promise<FirestoreData[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
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
    const docRef = doc(db, collectionName, documentId);
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