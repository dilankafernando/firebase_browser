import { create } from 'zustand';

// Define the type for our Firestore data
// This is a generic type that you'll need to replace with your actual data structure
export type FirestoreData = {
  id: string;
  [key: string]: any;
};

// Define our store state
type StoreState = {
  selectedCollection: string;
  setSelectedCollection: (collection: string) => void;
  collections: string[];
  setCollections: (collections: string[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
};

// Create the store
export const useStore = create<StoreState>((set) => ({
  selectedCollection: '',
  setSelectedCollection: (collection) => set({ selectedCollection: collection }),
  collections: [],
  setCollections: (collections) => set({ collections }),
  loading: false,
  setLoading: (loading) => set({ loading }),
  error: null,
  setError: (error) => set({ error }),
})); 