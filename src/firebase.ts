import { Firestore } from 'firebase/firestore';
import { getDb } from './services/firebaseService';

// Export a function to get the current db instance
export const getFirestore = (): Firestore | null => {
  return getDb();
};

// For backward compatibility with existing code
export const db = getDb(); 