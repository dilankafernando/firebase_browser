import { collection, getDocs, getDoc, doc, query, limit, startAfter, orderBy, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { getDb } from './firebaseService';
import { FirestoreData } from '../store';

// Get all collections from Firestore
export const getCollections = async (): Promise<string[]> => {
  // Return hardcoded collection names
  return [
    'user_reviews',
    'user_verifications',
    'users',
    'vendor_attributes',
    'vendor_categories',
    'vendor_filters',
    'vendor_products',
    'vendors',
    'wallet',
    'notifications',
    'order_transactions',
    'payouts',
    'pos_customer',
    'pos_dept',
    'pos_product',
    'pos_sales_summary',
    'pos_transaction_details',
    'rating',
    'referral',
    'requests',
    'restaurant_orders',
    'review_attributes',
    'settings',
    'story',
    'user_groups',
    'availabilities',
    'booked_table',
    'channel_participation',
    'channels',
    'chat_restaurant',
    'chat_users',
    'cms_pages',
    'coupons',
    'currencies',
    'favorite_friends',
    'favorite_item',
    'favorite_restaurant',
    'foods_review',
    'logs',
    'menu_items',
  ];
};

// Get documents from a specific collection with pagination
export const getDocuments = async (
  collectionName: string,
  pageSize: number = 100,
  lastDocSnapshot?: QueryDocumentSnapshot<DocumentData>
): Promise<{ documents: FirestoreData[], lastDoc: QueryDocumentSnapshot<DocumentData> | null }> => {
  try {
    const db = getDb();
    if (!db) throw new Error('No active Firebase connection');
    
    // Handle subcollection paths (format: "parentColl/docId/subcoll")
    const pathSegments = collectionName.split('/');
    let querySnapshot;
    
    if (pathSegments.length === 1) {
      // Regular top-level collection
      const collectionRef = collection(db, collectionName);
      let q;
      
      if (lastDocSnapshot) {
        // If we have a last document snapshot, start after it
        q = query(
          collectionRef,
          orderBy('__name__'), // Order by document ID if no other field is specified
          startAfter(lastDocSnapshot),
          limit(pageSize)
        );
      } else {
        // First page
        q = query(
          collectionRef,
          orderBy('__name__'),
          limit(pageSize)
        );
      }
      
      querySnapshot = await getDocs(q);
    } else if (pathSegments.length === 3) {
      // Subcollection (parent/docId/subcollection)
      const [parentColl, docId, subcoll] = pathSegments;
      const subcollectionRef = collection(db, parentColl, docId, subcoll);
      let q;
      
      if (lastDocSnapshot) {
        q = query(
          subcollectionRef,
          orderBy('__name__'),
          startAfter(lastDocSnapshot),
          limit(pageSize)
        );
      } else {
        q = query(
          subcollectionRef,
          orderBy('__name__'),
          limit(pageSize)
        );
      }
      
      querySnapshot = await getDocs(q);
    } else {
      throw new Error(`Invalid collection path format: ${collectionName}`);
    }
    
    const documents: FirestoreData[] = [];
    let lastDocument: QueryDocumentSnapshot<DocumentData> | null = null;
    
    querySnapshot.forEach((doc) => {
      const documentData = {
        id: doc.id,
        ...doc.data()
      };
      documents.push(documentData);
      lastDocument = doc;
    });
    
    return {
      documents,
      lastDoc: lastDocument
    };
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