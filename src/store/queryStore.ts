import { create } from 'zustand';
import { 
  collection, 
  query, 
  where, 
  orderBy as firestoreOrderBy, 
  limit as firestoreLimit, 
  getDocs,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { useFirebaseStore } from './firebaseStore';
import { 
  QueryConfig, 
  FirestoreDocument, 
  QueryFilter, 
  OrderBy, 
  SavedQuery 
} from '../types';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

// Helper function to convert value string to the appropriate type
const convertValue = (value: string): string | number | boolean | null => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  
  // Check if it's a number
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== '') return num;
  
  // Otherwise, it's a string
  return value;
};

interface QueryState {
  currentQuery: QueryConfig;
  isLoading: boolean;
  results: FirestoreDocument[];
  savedQueries: SavedQuery[];
  error: string | null;
  setCurrentQuery: (query: Partial<QueryConfig>) => void;
  addFilter: (filter: QueryFilter) => void;
  removeFilter: (index: number) => void;
  addOrderBy: (orderBy: OrderBy) => void;
  removeOrderBy: (index: number) => void;
  runQuery: () => Promise<void>;
  saveQuery: (name: string) => void;
  loadSavedQuery: (id: string) => void;
  deleteSavedQuery: (id: string) => void;
}

export const useQueryStore = create<QueryState>((set, get) => ({
  currentQuery: {
    collection: '',
    filters: [],
    orderBy: [],
    limit: 50
  },
  isLoading: false,
  results: [],
  savedQueries: JSON.parse(localStorage.getItem('savedQueries') || '[]'),
  error: null,
  
  setCurrentQuery: (queryConfig) => {
    set({ 
      currentQuery: { 
        ...get().currentQuery, 
        ...queryConfig 
      } 
    });
  },
  
  addFilter: (filter) => {
    set({
      currentQuery: {
        ...get().currentQuery,
        filters: [...get().currentQuery.filters, filter]
      }
    });
  },
  
  removeFilter: (index) => {
    const filters = [...get().currentQuery.filters];
    filters.splice(index, 1);
    set({
      currentQuery: {
        ...get().currentQuery,
        filters
      }
    });
  },
  
  addOrderBy: (orderBy) => {
    set({
      currentQuery: {
        ...get().currentQuery,
        orderBy: [...get().currentQuery.orderBy, orderBy]
      }
    });
  },
  
  removeOrderBy: (index) => {
    const orderBy = [...get().currentQuery.orderBy];
    orderBy.splice(index, 1);
    set({
      currentQuery: {
        ...get().currentQuery,
        orderBy
      }
    });
  },
  
  runQuery: async () => {
    const { currentQuery } = get();
    const { db } = useFirebaseStore.getState();
    
    if (!db) {
      toast.error('Not connected to Firestore');
      return;
    }
    
    if (!currentQuery.collection) {
      toast.error('Please select a collection');
      return;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const collectionRef = collection(db, currentQuery.collection);
      
      // Build query with filters, orderBy and limit
      let queryConstraints = [];
      
      // Add filters
      for (const filter of currentQuery.filters) {
        queryConstraints.push(where(
          filter.fieldPath, 
          filter.operator, 
          typeof filter.value === 'string' ? convertValue(filter.value as string) : filter.value
        ));
      }
      
      // Add orderBy
      for (const order of currentQuery.orderBy) {
        queryConstraints.push(firestoreOrderBy(order.fieldPath, order.direction));
      }
      
      // Add limit
      if (currentQuery.limit > 0) {
        queryConstraints.push(firestoreLimit(currentQuery.limit));
      }
      
      // Execute query
      const q = query(collectionRef, ...queryConstraints);
      const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
      
      // Process results
      const documents: FirestoreDocument[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        path: doc.ref.path,
        data: doc.data()
      }));
      
      set({ results: documents, isLoading: false });
      toast.success(`Found ${documents.length} documents`);
    } catch (error) {
      console.error('Query error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred', 
        isLoading: false 
      });
      toast.error(`Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  
  saveQuery: (name) => {
    const query = get().currentQuery;
    const savedQueries = [...get().savedQueries];
    const newQuery: SavedQuery = {
      id: uuidv4(),
      name,
      query
    };
    
    const updatedQueries = [...savedQueries, newQuery];
    localStorage.setItem('savedQueries', JSON.stringify(updatedQueries));
    
    set({ savedQueries: updatedQueries });
    toast.success(`Query "${name}" saved successfully`);
  },
  
  loadSavedQuery: (id) => {
    const savedQuery = get().savedQueries.find(q => q.id === id);
    if (savedQuery) {
      set({ currentQuery: savedQuery.query });
      toast.success(`Loaded query: ${savedQuery.name}`);
    }
  },
  
  deleteSavedQuery: (id) => {
    const savedQueries = get().savedQueries.filter(q => q.id !== id);
    localStorage.setItem('savedQueries', JSON.stringify(savedQueries));
    set({ savedQueries });
    toast.success('Query deleted');
  }
})); 