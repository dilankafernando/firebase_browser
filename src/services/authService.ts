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

// Types
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  displayName: string; // User-friendly name for this connection
}

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

  constructor() {
    // Listen for auth state changes
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await this.syncUserData(firebaseUser);
      } else {
        this.currentUser = null;
      }
    });
  }

  // Get the current user
  getCurrentUser(): User | null {
    return this.currentUser;
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

  // Log in a user
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
      
      return this.currentUser!;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  // Log out the current user
  async logout(): Promise<void> {
    try {
      await signOut(auth);
      this.currentUser = null;
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }

  // Sync user data from Firestore
  private async syncUserData(firebaseUser: FirebaseUser): Promise<void> {
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
        // Create user document if it doesn't exist
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

        this.currentUser = userData;
      }
    } catch (error) {
      console.error('Error syncing user data:', error);
      throw error;
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

  // Add Firebase configuration
  async addFirebaseConfig(config: FirebaseConfig): Promise<void> {
    if (!this.currentUser) throw new Error('No user logged in');

    try {
      const configRef = doc(db, 'users', this.currentUser.uid, 'configs', config.projectId);
      await setDoc(configRef, {
        ...config,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding Firebase config:', error);
      throw error;
    }
  }

  // Get user's Firebase configurations
  async getFirebaseConfigs(): Promise<FirebaseConfig[]> {
    if (!this.currentUser) throw new Error('No user logged in');

    try {
      const configsRef = collection(db, 'users', this.currentUser.uid, 'configs');
      const querySnapshot = await getDocs(configsRef);
      
      return querySnapshot.docs.map(doc => ({
        ...doc.data() as FirebaseConfig,
        projectId: doc.id
      }));
    } catch (error) {
      console.error('Error getting Firebase configs:', error);
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
}

// Create and export a singleton instance
export const authService = new AuthService(); 