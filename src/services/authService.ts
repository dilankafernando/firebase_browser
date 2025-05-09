import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { FirebaseConfig } from '../types';

// Types
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  lastLogin: Date;
  preferences?: {
    theme?: 'light' | 'dark';
    language?: string;
    [key: string]: any;
  };
}

class AuthService {
  private currentUser: User | null = null;
  private sessionTimeout: number = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private refreshTokenInterval: NodeJS.Timeout | null = null;
  private initialized: boolean = false;

  constructor() {
    // Listen for auth state changes
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          await this.syncUserData(firebaseUser);
          this.setupSessionManagement(firebaseUser);
          this.initialized = true;
        } catch (error) {
          console.error('Error in auth state change:', error);
          this.currentUser = null;
          this.clearSessionManagement();
        }
      } else {
        this.currentUser = null;
        this.clearSessionManagement();
      }
    });
  }

  private setupSessionManagement(firebaseUser: FirebaseUser) {
    // Clear any existing interval
    this.clearSessionManagement();

    // Set up token refresh interval (every 30 minutes)
    this.refreshTokenInterval = setInterval(async () => {
      try {
        await firebaseUser.getIdToken(true); // Force refresh
        console.log('Token refreshed successfully');
      } catch (error) {
        console.error('Error refreshing token:', error);
      }
    }, 30 * 60 * 1000); // 30 minutes

    // Set up session timeout
    const lastActivity = new Date().getTime();
    const checkSession = () => {
      const now = new Date().getTime();
      if (now - lastActivity > this.sessionTimeout) {
        this.logout();
      }
    };

    // Check session every minute
    setInterval(checkSession, 60 * 1000);
  }

  private clearSessionManagement() {
    if (this.refreshTokenInterval) {
      clearInterval(this.refreshTokenInterval);
      this.refreshTokenInterval = null;
    }
  }

  // Get the current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Check if service is initialized
  isInitialized(): boolean {
    return this.initialized;
  }

  // Sign up a new user
  async signup(email: string, password: string, displayName: string): Promise<User> {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update profile with display name
      await updateProfile(firebaseUser, { displayName });

      // Create user document in Firestore
      const userData: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        createdAt: new Date(),
        lastLogin: new Date(),
        preferences: {
          theme: 'light',
          language: 'en'
        }
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...userData,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });

      // Update current user
      this.currentUser = userData;
      return userData;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }

  // Enhanced login method with session management
  async login(email: string, password: string): Promise<User> {
    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update last login time
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastLogin: serverTimestamp()
      });

      // Sync user data
      await this.syncUserData(firebaseUser);
      
      // Set up session management
      this.setupSessionManagement(firebaseUser);
      
      return this.currentUser!;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  // Enhanced logout method
  async logout(): Promise<void> {
    try {
      this.clearSessionManagement();
      await signOut(auth);
      this.currentUser = null;
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }

  // Sync user data from Firestore
  async syncUserData(firebaseUser: FirebaseUser): Promise<void> {
    if (!firebaseUser) {
      throw new Error('No Firebase user provided');
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.currentUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          createdAt: userData.createdAt?.toDate() || new Date(),
          lastLogin: userData.lastLogin?.toDate() || new Date(),
          preferences: userData.preferences || {
            theme: 'light',
            language: 'en'
          }
        };
      } else {
        // Create a new user document if it doesn't exist
        const newUserData: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          createdAt: new Date(),
          lastLogin: new Date(),
          preferences: {
            theme: 'light',
            language: 'en'
          }
        };

        // Save to Firestore
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          ...newUserData,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });

        this.currentUser = newUserData;
      }
    } catch (error) {
      console.error('Error syncing user data:', error);
      // Set a basic user object instead of throwing
      this.currentUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        createdAt: new Date(),
        lastLogin: new Date(),
        preferences: {
          theme: 'light',
          language: 'en'
        }
      };
    }
  }

  // Update user preferences
  async updatePreferences(preferences: Partial<User['preferences']>): Promise<void> {
    if (!this.currentUser) throw new Error('No user logged in');

    try {
      await updateDoc(doc(db, 'users', this.currentUser.uid), {
        preferences: {
          ...this.currentUser.preferences,
          ...preferences
        }
      });

      // Update local user data
      this.currentUser = {
        ...this.currentUser,
        preferences: {
          ...this.currentUser.preferences,
          ...preferences
        }
      };
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }

  // Get user's Firebase configurations
  async getFirebaseConfigs(): Promise<FirebaseConfig[]> {
    if (!this.currentUser) {
      console.warn('No user logged in when fetching configs');
      return [];
    }

    try {
      console.log('Fetching configs for user:', this.currentUser.uid);
      const configsRef = collection(db, 'users', this.currentUser.uid, 'configs');
      const querySnapshot = await getDocs(configsRef);
      
      console.log('Found config documents:', querySnapshot.docs.map(doc => doc.id));
      const configs = querySnapshot.docs.map(doc => {
        const data = doc.data() as FirebaseConfig;
        console.log('Config data for', doc.id, ':', data);
        return {
          ...data,
          project_id: doc.id
        };
      });

      console.log('Processed configs:', configs);
      return configs;
    } catch (error) {
      console.error('Error getting Firebase configs:', error);
      return [];
    }
  }

  // Add Firebase configuration
  async addFirebaseConfig(config: FirebaseConfig): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    try {
      const configRef = doc(db, 'users', this.currentUser.uid, 'configs', config.project_id);
      await setDoc(configRef, {
        ...config,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding Firebase config:', error);
      throw error;
    }
  }

  // Remove a Firebase configuration
  async removeFirebaseConfig(projectId: string): Promise<void> {
    if (!this.currentUser) throw new Error('No user logged in');

    try {
      await deleteDoc(doc(db, 'users', this.currentUser.uid, 'configs', projectId));
    } catch (error) {
      console.error('Error removing Firebase config:', error);
      throw error;
    }
  }

  // Get the selected Firebase config from the user's document
  async getSelectedConfig(): Promise<string | null> {
    if (!this.currentUser) return null;

    try {
      const userDoc = await getDoc(doc(db, 'users', this.currentUser.uid));
      if (userDoc.exists()) {
        return userDoc.data().selectedConfig || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting selected config:', error);
      return null;
    }
  }

  // Set the selected Firebase config in the user's document
  async setSelectedConfig(projectId: string): Promise<void> {
    if (!this.currentUser) return;

    try {
      await updateDoc(doc(db, 'users', this.currentUser.uid), {
        selectedConfig: projectId
      });
    } catch (error) {
      console.error('Error setting selected config:', error);
    }
  }

  // Clear the selected config when removing a configuration
  async clearSelectedConfig(): Promise<void> {
    if (!this.currentUser) return;

    try {
      await updateDoc(doc(db, 'users', this.currentUser.uid), {
        selectedConfig: null
      });
    } catch (error) {
      console.error('Error clearing selected config:', error);
    }
  }
}

// Create and export a singleton instance
export const authService = new AuthService(); 