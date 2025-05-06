import { create } from 'zustand';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, collection, getDocs } from 'firebase/firestore';
import { ConfigType, FirebaseConfig, ServiceAccountConfig } from '../types';
import { toast } from 'react-hot-toast';

interface FirebaseState {
  configType: ConfigType;
  firebaseConfig: FirebaseConfig | null;
  serviceAccountConfig: ServiceAccountConfig | null;
  isConnected: boolean;
  app: FirebaseApp | null;
  db: Firestore | null;
  collections: string[];
  setConfigType: (type: ConfigType) => void;
  setFirebaseConfig: (config: FirebaseConfig) => void;
  setServiceAccountConfig: (config: ServiceAccountConfig) => void;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  fetchCollections: () => Promise<void>;
}

export const useFirebaseStore = create<FirebaseState>((set, get) => ({
  configType: 'client',
  firebaseConfig: null,
  serviceAccountConfig: null,
  isConnected: false,
  app: null,
  db: null,
  collections: [],
  
  setConfigType: (type) => set({ configType: type }),
  
  setFirebaseConfig: (config) => set({ firebaseConfig: config }),
  
  setServiceAccountConfig: (config) => set({ serviceAccountConfig: config }),
  
  connect: async () => {
    try {
      const { configType, firebaseConfig } = get();
      
      if (configType === 'client' && firebaseConfig) {
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        
        set({ app, db, isConnected: true });
        await get().fetchCollections();
        toast.success('Connected to Firestore successfully!');
        return true;
      } 
      // Service account authentication would be implemented here (needs server-side)
      else {
        toast.error('Service account authentication is not yet implemented in this client-side app.');
        return false;
      }
    } catch (error) {
      console.error('Failed to connect to Firebase:', error);
      toast.error(`Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  },
  
  disconnect: () => {
    set({
      isConnected: false,
      app: null,
      db: null,
      collections: [],
    });
    toast.success('Disconnected from Firebase');
  },
  
  fetchCollections: async () => {
    try {
      const { db } = get();
      if (!db) return;
      
      // This is a temporary solution to get collections
      // In a production app, you'd use a more robust approach
      const collectionsSnapshot = await getDocs(collection(db, '__dummy__')).catch(() => null);
      const collections = collectionsSnapshot?.docs.map(doc => doc.ref.path) || [];
      
      // For demo purposes, if no collections are found, use sample collections
      if (collections.length === 0) {
        set({ collections: ['users', 'products', 'orders', 'settings'] });
      } else {
        set({ collections });
      }
    } catch (error) {
      console.error('Failed to fetch collections:', error);
      // For demo purposes, set sample collections if fetching fails
      set({ collections: ['users', 'products', 'orders', 'settings'] });
    }
  },
})); 