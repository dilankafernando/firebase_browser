import { collection, getDocs, getDoc, doc, query, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { FirestoreData } from '../store';

// Get all collections from Firestore
export const getCollections = async (): Promise<string[]> => {
  try {
    const collectionsSet = new Set<string>();
    
    // Set a timeout for the collection discovery process
    const timeoutPromise = new Promise<string[]>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Collection discovery timed out. Using available collections."));
      }, 10000); // 10-second timeout
    });
    
    const discoveryPromise = (async () => {
      // Method 1: Use a metadata document that stores collection names (fastest approach)
      try {
        const metadataDoc = await getDoc(doc(db, 'metadata', 'collections'));
        if (metadataDoc.exists() && metadataDoc.data().collections) {
          const metadataCollections = metadataDoc.data().collections;
          metadataCollections.forEach((collName: string) => collectionsSet.add(collName));
          
          // If we found collections in metadata, we can just return them without checking everything else
          if (collectionsSet.size > 0) {
            return Array.from(collectionsSet).sort();
          }
        }
      } catch (metadataError) {
        console.log('No metadata document found, trying alternative methods');
      }
      
      // Method 2: Check specific collection names directly
      // Focus first on the user-provided ones since they're the most important
      const primaryCollections = [
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
      
      // Check primary collections in parallel to speed up the process
      await Promise.all(
        primaryCollections.map(async (collName) => {
          try {
            const q = query(collection(db, collName), limit(1));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              collectionsSet.add(collName);
            }
          } catch (error) {
            // Ignore errors for collections that don't exist
          }
        })
      );
      
      // Return early if we've already found a good number of collections
      if (collectionsSet.size >= 10) {
        return Array.from(collectionsSet).sort();
      }
      
      // Only if we haven't found many collections, check the secondary collections
      const secondaryCollections = [
        // Common user-related collections
        'profiles', 'accounts', 'members', 'customers', 'clients', 'staff', 'admins', 'roles', 'permissions',
        
        // Common content-related collections
        'products', 'items', 'articles', 'posts', 'comments', 'messages', 'events',
        
        // Common business-related collections
        'orders', 'invoices', 'transactions', 'payments', 'subscriptions', 'plans',
        
        // Common categories and metadata
        'categories', 'tags', 'types', 'configurations', 'metadata',
      ];
      
      // Check secondary collections in batches of 5 to avoid overwhelming Firestore
      const batchSize = 5;
      for (let i = 0; i < secondaryCollections.length; i += batchSize) {
        const batch = secondaryCollections.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (collName) => {
            try {
              const q = query(collection(db, collName), limit(1));
              const querySnapshot = await getDocs(q);
              if (!querySnapshot.empty) {
                collectionsSet.add(collName);
              }
            } catch (error) {
              // Ignore errors for collections that don't exist
            }
          })
        );
      }
      
      // Skip subcollection checking for now as it can be very time-consuming
      // We can add a separate button/function to check for subcollections if needed
      
      if (collectionsSet.size === 0) {
        return ['users', 'products', 'orders']; // Default collections if nothing found
      }
      
      return Array.from(collectionsSet).sort();
    })();
    
    // Race between discovery and timeout
    try {
      return await Promise.race([discoveryPromise, timeoutPromise]);
    } catch (e) {
      // If timeout occurs, return whatever collections we've found so far
      if (collectionsSet.size > 0) {
        return Array.from(collectionsSet).sort();
      }
      return ['users', 'products', 'orders']; // Default fallback
    }
  } catch (error) {
    console.error('Error getting collections:', error);
    return ['users', 'products', 'orders']; // Return defaults on error instead of throwing
  }
};

// Get documents from a specific collection
export const getDocuments = async (collectionName: string): Promise<FirestoreData[]> => {
  try {
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