import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { FirebaseConfig } from './authService';
import { collection, getDocs, getDoc, doc, deleteDoc } from 'firebase/firestore';

class FirebaseService {
  private firebaseApps: Map<string, FirebaseApp> = new Map();
  private firestoreInstances: Map<string, Firestore> = new Map();
  private currentConfig: FirebaseConfig | null = null;

  constructor() {
    // Initialize with the active config if one exists
    this.initializeFromActiveConfig();
  }

  // Initialize using the active config from auth service
  private async initializeFromActiveConfig(): Promise<void> {
    try {
      const user = auth.currentUser;
      if (user) {
        const configsRef = collection(db, 'users', user.uid, 'configs');
        const querySnapshot = await getDocs(configsRef);
        
        if (!querySnapshot.empty) {
          const config = querySnapshot.docs[0].data() as FirebaseConfig;
          this.initializeApp(config);
        }
      }
    } catch (error) {
      console.error('Error initializing from active config:', error);
    }
  }

  // Get the current Firestore instance
  getDb(): Firestore | null {
    if (!this.currentConfig) return null;
    return this.firestoreInstances.get(this.currentConfig.projectId) || null;
  }

  // Set the current active config
  setActiveConfig(config: FirebaseConfig): void {
    if (!this.firestoreInstances.has(config.projectId)) {
      this.initializeApp(config);
    }
    this.currentConfig = config;
  }

  // Initialize a new Firebase app instance with a config
  initializeApp(config: FirebaseConfig): Firestore {
    try {
      // Check if we already have an instance for this project
      if (this.firebaseApps.has(config.projectId)) {
        // Just return the existing instance
        const db = this.firestoreInstances.get(config.projectId)!;
        this.currentConfig = config;
        return db;
      }

      // Create a new Firebase app instance
      const app = initializeApp(
        {
          apiKey: config.apiKey,
          authDomain: config.authDomain,
          projectId: config.projectId,
        },
        config.projectId
      );

      // Initialize Firestore
      const db = getFirestore(app);
      
      // Store references
      this.firebaseApps.set(config.projectId, app);
      this.firestoreInstances.set(config.projectId, db);
      this.currentConfig = config;

      return db;
    } catch (error) {
      console.error('Error initializing Firebase app:', error);
      throw error;
    }
  }

  // Get the current active Firebase configuration
  getCurrentConfig(): FirebaseConfig | null {
    return this.currentConfig;
  }

  // Switch to a different Firebase configuration
  async switchConfig(projectId: string): Promise<Firestore | null> {
    try {
      const user = auth.currentUser;
      if (!user) return null;

      const configsRef = collection(db, 'users', user.uid, 'configs');
      const configDoc = await getDoc(doc(configsRef, projectId));
      
      if (!configDoc.exists()) return null;

      const config = configDoc.data() as FirebaseConfig;
      return this.initializeApp(config);
    } catch (error) {
      console.error('Error switching config:', error);
      return null;
    }
  }

  // Remove a Firebase configuration
  async removeConfig(projectId: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Remove from Firestore
      await deleteDoc(doc(db, 'users', user.uid, 'configs', projectId));

      // Remove from local maps
      this.firebaseApps.delete(projectId);
      this.firestoreInstances.delete(projectId);

      // If this was the current config, update current config
      if (this.currentConfig?.projectId === projectId) {
        this.currentConfig = null;
        await this.initializeFromActiveConfig();
      }
    } catch (error) {
      console.error('Error removing config:', error);
      throw error;
    }
  }

  // Clear all Firebase configurations
  clearAllConfigs(): void {
    this.firebaseApps.clear();
    this.firestoreInstances.clear();
    this.currentConfig = null;
  }
}

// Create and export a singleton instance
export const firebaseService = new FirebaseService();

// Export a function to get the current db instance
export const getDb = (): Firestore | null => {
  return firebaseService.getDb();
}; 