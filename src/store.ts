import { create } from 'zustand';
import { User, FirebaseConfig, authService } from './services/authService';
import { firebaseService } from './services/firebaseService';

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
  
  // Authentication state
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  signup: (email: string, password: string, displayName: string, firebaseConfig?: FirebaseConfig) => Promise<User | null>;
  logout: () => void;
  
  // Firebase configurations
  activeConfig: FirebaseConfig | null;
  addFirebaseConfig: (config: FirebaseConfig) => Promise<User | null>;
  switchFirebaseConfig: (projectId: string) => Promise<boolean>;
  removeFirebaseConfig: (projectId: string) => Promise<boolean>;
};

// Create the store
export const useStore = create<StoreState>((set, get) => ({
  selectedCollection: '',
  setSelectedCollection: (collection) => set({ selectedCollection: collection }),
  collections: [],
  setCollections: (collections) => set({ collections }),
  loading: false,
  setLoading: (loading) => set({ loading }),
  error: null,
  setError: (error) => set({ error }),
  
  // Authentication state with initial values
  user: authService.getUser(),
  isAuthenticated: !!authService.getUser(),
  activeConfig: authService.getActiveConfig(),
  
  // Authentication actions
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const user = authService.login(email, password);
      if (user) {
        // Initialize Firebase with the active config
        firebaseService.initializeFromActiveConfig();
        
        set({ 
          user, 
          isAuthenticated: true, 
          activeConfig: authService.getActiveConfig(),
          selectedCollection: '',
          collections: []
        });
        return user;
      } else {
        set({ error: 'Invalid email or password' });
        return null;
      }
    } catch (error) {
      set({ error: (error as Error).message });
      return null;
    } finally {
      set({ loading: false });
    }
  },
  
  signup: async (email, password, displayName, firebaseConfig) => {
    set({ loading: true, error: null });
    try {
      const user = authService.signup(email, password, displayName, firebaseConfig);
      
      // Initialize Firebase with the new config if provided
      if (firebaseConfig) {
        firebaseService.initializeApp(firebaseConfig);
      }
      
      set({ 
        user, 
        isAuthenticated: true, 
        activeConfig: authService.getActiveConfig(),
        selectedCollection: '',
        collections: []
      });
      return user;
    } catch (error) {
      set({ error: (error as Error).message });
      return null;
    } finally {
      set({ loading: false });
    }
  },
  
  logout: () => {
    authService.logout();
    firebaseService.clearAllConfigs();
    set({ 
      user: null, 
      isAuthenticated: false, 
      activeConfig: null,
      selectedCollection: '',
      collections: []
    });
  },
  
  // Firebase configuration actions
  addFirebaseConfig: async (config) => {
    set({ loading: true, error: null });
    try {
      const user = authService.addFirebaseConfig(config);
      if (user) {
        // Initialize Firebase with the new config
        firebaseService.initializeApp(config);
        
        set({ 
          user,
          activeConfig: authService.getActiveConfig(),
          selectedCollection: '',
          collections: []
        });
        return user;
      }
      return null;
    } catch (error) {
      set({ error: (error as Error).message });
      return null;
    } finally {
      set({ loading: false });
    }
  },
  
  switchFirebaseConfig: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const db = firebaseService.switchConfig(projectId);
      if (db) {
        set({ 
          activeConfig: authService.getActiveConfig(),
          selectedCollection: '',
          collections: []
        });
        return true;
      }
      set({ error: 'Failed to switch Firebase configuration' });
      return false;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    } finally {
      set({ loading: false });
    }
  },
  
  removeFirebaseConfig: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const user = authService.removeFirebaseConfig(projectId);
      if (user) {
        // Remove the config from the service
        firebaseService.removeConfig(projectId);
        
        set({ 
          user,
          activeConfig: authService.getActiveConfig(),
          selectedCollection: '',
          collections: []
        });
        return true;
      }
      set({ error: 'Failed to remove Firebase configuration' });
      return false;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    } finally {
      set({ loading: false });
    }
  },
})); 