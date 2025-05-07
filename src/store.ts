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
  initSession: () => void;
  
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
export const useStore = create<StoreState>((set) => {
  // Initialize session immediately when store is created
  const storedUser = authService.getUser();
  const isAuthenticated = !!storedUser;
  let activeConfig = null;
  
  // If user is authenticated, initialize Firebase with active config
  if (isAuthenticated && storedUser) {
    activeConfig = authService.getActiveConfig();
    if (activeConfig) {
      try {
        firebaseService.initializeApp(activeConfig);
      } catch (error) {
        console.error('Error initializing Firebase:', error);
      }
    }
  }
  
  return {
    // Auth state initialized from local storage
    user: storedUser,
    isAuthenticated,
    loading: false,
    error: null,
    
    // Firebase configurations
    configs: storedUser?.firebaseConfigs || [],
    activeConfig,
    testing: false,
    
    // Data Browser state
    selectedCollection: '',
    collections: [],
    viewMode: 'table',
    
    setSelectedCollection: (collection) => set({ selectedCollection: collection }),
    setCollections: (collections) => set({ collections }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    
    // Initialize session from localStorage
    initSession: () => {
      const user = authService.getUser();
      if (user) {
        const activeConfig = authService.getActiveConfig();
        if (activeConfig) {
          try {
            firebaseService.initializeApp(activeConfig);
          } catch (error) {
            console.error('Error initializing Firebase:', error);
          }
        }
        
        set({
          user,
          isAuthenticated: true,
          activeConfig,
          configs: user.firebaseConfigs || []
        });
      }
    },
    
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
            configs: user.firebaseConfigs || [],
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
          configs: user.firebaseConfigs || [],
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
        configs: [],
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
            configs: user.firebaseConfigs,
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
            configs: user.firebaseConfigs,
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