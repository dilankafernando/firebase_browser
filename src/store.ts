import { create } from 'zustand';
import { User, FirebaseConfig, authService } from './services/authService';
import { firebaseService } from './services/firebaseService';
import { auth } from './config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Define the type for our Firestore data
// This is a generic type that you'll need to replace with your actual data structure
export type FirestoreData = {
  id: string;
  [key: string]: any;
};

// Define our store state
export interface StoreState {
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
  initSession: () => Promise<void>;
  
  // Firebase configurations
  configs: FirebaseConfig[];
  activeConfig: FirebaseConfig | null;
  addFirebaseConfig: (config: FirebaseConfig) => Promise<User | null>;
  switchFirebaseConfig: (projectId: string) => Promise<boolean>;
  removeFirebaseConfig: (projectId: string) => Promise<boolean>;
  
  // Data Browser state
  viewMode: 'table' | 'json' | 'form';
  setViewMode: (mode: 'table' | 'json' | 'form') => void;
  
  // Test a Firebase configuration
  testing: boolean;
  testConfig: (config: FirebaseConfig) => Promise<boolean>;
}

// Create the store with zustand
export const useStore = create<StoreState>((set, get) => {
  // Set up auth state listener
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        set({ loading: true, error: null });
        
        // Wait for auth service to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // First get the user data
        const user = await authService.getCurrentUser();
        if (!user) {
          // If no user data, try to sync it first
          await authService.syncUserData(firebaseUser);
          const updatedUser = await authService.getCurrentUser();
          if (!updatedUser) {
            throw new Error('Failed to get user data');
          }
          // Then try to get configs
          let configs: FirebaseConfig[] = [];
          let activeConfig = null;
          try {
            configs = await authService.getFirebaseConfigs();
            activeConfig = firebaseService.getCurrentConfig();
          } catch (error) {
            console.warn('No Firebase configs found:', error);
          }
          
          set({
            user: updatedUser,
            isAuthenticated: true,
            activeConfig,
            configs,
            loading: false,
            error: null
          });
        } else {
          // Then try to get configs
          let configs: FirebaseConfig[] = [];
          let activeConfig = null;
          try {
            configs = await authService.getFirebaseConfigs();
            activeConfig = firebaseService.getCurrentConfig();
          } catch (error) {
            console.warn('No Firebase configs found:', error);
          }
          
          set({
            user,
            isAuthenticated: true,
            activeConfig,
            configs,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        set({
          user: null,
          isAuthenticated: false,
          activeConfig: null,
          configs: [],
          loading: false,
          error: (error as Error).message
        });
      }
    } else {
      set({
        user: null,
        isAuthenticated: false,
        activeConfig: null,
        configs: [],
        loading: false,
        error: null
      });
    }
  });

  return {
    // Initial state
    user: null,
    isAuthenticated: false,
    activeConfig: null,
    configs: [],
    loading: false,
    error: null,
    selectedCollection: '',
    collections: [],
    viewMode: 'table',
    
    setSelectedCollection: (collection) => set({ selectedCollection: collection }),
    setCollections: (collections) => set({ collections }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    
    // Initialize session from Firebase Auth
    initSession: async () => {
      try {
        set({ loading: true, error: null });
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('No authenticated user');
        }

        // Wait for auth service to initialize
        await new Promise(resolve => setTimeout(resolve, 100));

        await authService.syncUserData(currentUser);
        const user = await authService.getCurrentUser();
        if (!user) {
          throw new Error('Failed to get user data');
        }

        let configs: FirebaseConfig[] = [];
        let activeConfig = null;
        try {
          configs = await authService.getFirebaseConfigs();
          activeConfig = firebaseService.getCurrentConfig();
        } catch (error) {
          console.warn('No Firebase configs found:', error);
        }
        
        set({
          user,
          isAuthenticated: true,
          activeConfig,
          configs,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error initializing session:', error);
        set({ 
          error: (error as Error).message,
          user: null,
          isAuthenticated: false,
          activeConfig: null,
          configs: [],
          loading: false
        });
      }
    },
    
    // Authentication actions
    login: async (email, password) => {
      set({ loading: true, error: null });
      try {
        const user = await authService.login(email, password);
        let configs: FirebaseConfig[] = [];
        let activeConfig = null;
        try {
          configs = await authService.getFirebaseConfigs();
          activeConfig = firebaseService.getCurrentConfig();
        } catch (error) {
          console.warn('No Firebase configs found:', error);
        }
        
        const newState = { 
          user, 
          isAuthenticated: true, 
          activeConfig,
          configs,
          selectedCollection: '',
          collections: []
        };
        
        set(newState);
        localStorage.setItem('firebase-browser-state', JSON.stringify(newState));
        return user;
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
        const user = await authService.signup(email, password, displayName);
        
        if (firebaseConfig) {
          await authService.addFirebaseConfig(firebaseConfig);
          firebaseService.initializeApp(firebaseConfig);
        }
        
        let configs: FirebaseConfig[] = [];
        let activeConfig = null;
        try {
          configs = await authService.getFirebaseConfigs();
          activeConfig = firebaseService.getCurrentConfig();
        } catch (error) {
          console.warn('No Firebase configs found:', error);
        }
        
        set({ 
          user, 
          isAuthenticated: true, 
          activeConfig,
          configs,
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
    
    logout: async () => {
      try {
        await authService.logout();
        firebaseService.clearAllConfigs();
        set({ 
          user: null, 
          isAuthenticated: false, 
          activeConfig: null,
          configs: [],
          selectedCollection: '',
          collections: []
        });
        localStorage.removeItem('firebase-browser-state');
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },
    
    // Firebase configuration actions
    addFirebaseConfig: async (config) => {
      set({ loading: true, error: null });
      try {
        await authService.addFirebaseConfig(config);
        firebaseService.initializeApp(config);
        
        const configs = await authService.getFirebaseConfigs();
        const activeConfig = firebaseService.getCurrentConfig();
        
        set({ 
          configs,
          activeConfig,
          selectedCollection: '',
          collections: []
        });
        return authService.getCurrentUser();
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
        const db = await firebaseService.switchConfig(projectId);
        if (db) {
          set({ 
            activeConfig: firebaseService.getCurrentConfig(),
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
        await firebaseService.removeConfig(projectId);
        const configs = await authService.getFirebaseConfigs();
        
        set({ 
          configs,
          activeConfig: firebaseService.getCurrentConfig(),
          selectedCollection: '',
          collections: []
        });
        return true;
      } catch (error) {
        set({ error: (error as Error).message });
        return false;
      } finally {
        set({ loading: false });
      }
    },
    
    // Data Browser state
    setViewMode: (mode) => set({ viewMode: mode }),
    
    // Test a Firebase configuration
    testConfig: async (config) => {
      set({ testing: true, error: null });
      try {
        firebaseService.initializeApp(config);
        set({ testing: false, error: null });
        return true;
      } catch (error) {
        set({ 
          testing: false, 
          error: error instanceof Error ? error.message : String(error) 
        });
        return false;
      }
    }
  };
}); 