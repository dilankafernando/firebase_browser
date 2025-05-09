import { FirebaseApp, initializeApp, deleteApp } from 'firebase/app';
import { Firestore, getFirestore, getDocs, collection } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { FirebaseConfig } from '../types';
import { getDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';

class FirebaseService {
  private firebaseApps: Map<string, FirebaseApp> = new Map();
  private firestoreInstances: Map<string, Firestore> = new Map();
  private currentConfig: FirebaseConfig | null = null;
  private serverUrl = 'http://localhost:3001';
  private isServerRunning = false;

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
          config.project_id = querySnapshot.docs[0].id; // Make sure project_id is set
          await this.initializeApp(config);
        }
      }
    } catch (error) {
      console.error('Error initializing from active config:', error);
    }
  }

  // Get the current Firestore instance
  getDb(): Firestore | null {
    if (!this.currentConfig) return null;
    const db = this.firestoreInstances.get(this.currentConfig.project_id);
    if (!db) {
      console.warn('Database instance not found for current config');
      return null;
    }
    return db;
  }

  // Set the current active config
  setActiveConfig(config: FirebaseConfig): void {
    if (!this.firestoreInstances.has(config.project_id)) {
      this.initializeApp(config);
    }
    this.currentConfig = config;
  }

  // Initialize a new Firebase app instance with a config
  async initializeApp(config: FirebaseConfig): Promise<Firestore> {
    try {
      console.log('Initializing app with config:', config);
      
      // Check if we already have an instance for this project
      if (this.firebaseApps.has(config.project_id)) {
        console.log('Found existing app instance for:', config.project_id);
        // Just return the existing instance
        const db = this.firestoreInstances.get(config.project_id)!;
        this.currentConfig = config;
        return db;
      }

      // Delete any existing app with the same name to avoid conflicts
      try {
        const existingApp = this.firebaseApps.get(config.project_id);
        if (existingApp) {
          console.log('Cleaning up existing app:', config.project_id);
          await deleteApp(existingApp);
          this.firebaseApps.delete(config.project_id);
          this.firestoreInstances.delete(config.project_id);
        }
      } catch (error) {
        console.warn('Error cleaning up existing app:', error);
      }

      // Create a new Firebase app instance
      console.log('Creating new Firebase app instance for:', config.project_id);
      const app = initializeApp({
        apiKey: config.apiKey,
        projectId: config.project_id,
        // Only include optional fields if they exist
        ...(config.authDomain && { authDomain: config.authDomain }),
        ...(config.storageBucket && { storageBucket: config.storageBucket }),
        ...(config.messagingSenderId && { messagingSenderId: config.messagingSenderId }),
        ...(config.appId && { appId: config.appId }),
        ...(config.measurementId && { measurementId: config.measurementId })
      }, config.project_id);

      console.log('Initializing Firestore for app:', config.project_id);
      // Initialize Firestore
      const newDb = getFirestore(app);
      
      // Store references
      this.firebaseApps.set(config.project_id, app);
      this.firestoreInstances.set(config.project_id, newDb);
      this.currentConfig = config;

      console.log('Successfully initialized app and Firestore for:', config.project_id);
      return newDb;
    } catch (error) {
      console.error('Error initializing Firebase app:', error);
      throw error;
    }
  }

  // Get the current config
  getCurrentConfig(): FirebaseConfig | null {
    return this.currentConfig;
  }

  // Switch to a different Firebase configuration
  async switchConfig(projectId: string): Promise<Firestore | null> {
    try {
      console.log('Switching to config:', projectId);
      const user = auth.currentUser;
      if (!user) {
        console.error('No authenticated user');
        return null;
      }

      // Clean up the admin app for the current config if it exists
      if (this.currentConfig) {
        await this.cleanupAdminApp(this.currentConfig.project_id);
      }

      // Get the config from the configs collection in the default database
      console.log('Fetching config document...');
      const configsRef = collection(db, 'users', user.uid, 'configs');
      const configDoc = await getDoc(doc(configsRef, projectId));
      
      if (!configDoc.exists()) {
        console.error('Configuration document not found:', projectId);
        console.log('Available configs:', this.firestoreInstances.keys());
        return null;
      }

      console.log('Config document data:', configDoc.data());
      // Get the config data and ensure project_id is set
      const config = {
        ...configDoc.data(),
        project_id: projectId // Make sure project_id is set from the document ID
      } as FirebaseConfig;

      // Clean up existing app if it exists
      try {
        const existingApp = this.firebaseApps.get(projectId);
        if (existingApp) {
          console.log('Cleaning up existing app:', projectId);
          await deleteApp(existingApp);
          this.firebaseApps.delete(projectId);
          this.firestoreInstances.delete(projectId);
        }
      } catch (error) {
        console.warn('Error cleaning up existing app:', error);
      }

      console.log('Initializing new app with config:', config);
      // Initialize the app with this config
      const newDb = await this.initializeApp(config);

      console.log('Successfully switched to config:', projectId);
      return newDb;
    } catch (error) {
      console.error('Error in switchConfig:', error);
      throw error;
    }
  }

  // Update the selected config in the user's document
  private async updateSelectedConfig(projectId: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const currentDb = this.getDb();
      if (!currentDb) {
        console.error('No active database connection');
        return;
      }

      await updateDoc(doc(currentDb, 'users', user.uid), {
        selectedConfig: projectId
      });
    } catch (error) {
      console.error('Error updating selected config:', error);
    }
  }

  // Remove a Firebase configuration
  async removeConfig(projectId: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Clean up the admin app
      await this.cleanupAdminApp(projectId);

      // Remove from Firestore
      await deleteDoc(doc(db, 'users', user.uid, 'configs', projectId));

      // Clean up the app instance
      try {
        const existingApp = this.firebaseApps.get(projectId);
        if (existingApp) {
          await deleteApp(existingApp);
        }
      } catch (error) {
        console.warn('Error cleaning up app:', error);
      }

      // Remove from local maps
      this.firebaseApps.delete(projectId);
      this.firestoreInstances.delete(projectId);

      // If this was the current config, update current config
      if (this.currentConfig?.project_id === projectId) {
        this.currentConfig = null;
        await this.initializeFromActiveConfig();
      }
    } catch (error) {
      console.error('Error removing config:', error);
      throw error;
    }
  }

  // Clear all Firebase configurations
  async clearAllConfigs(): Promise<void> {
    try {
      // Clean up all app instances
      for (const [projectId, app] of this.firebaseApps) {
        try {
          await deleteApp(app);
        } catch (error) {
          console.warn(`Error cleaning up app ${projectId}:`, error);
        }
      }

      this.firebaseApps.clear();
      this.firestoreInstances.clear();
      this.currentConfig = null;
    } catch (error) {
      console.error('Error clearing configs:', error);
    }
  }

  // Check if the admin server is running
  private async checkServerStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/health`, { method: 'GET' });
      this.isServerRunning = response.ok;
      return this.isServerRunning;
    } catch (error) {
      console.error('Admin server is not running:', error);
      this.isServerRunning = false;
      return false;
    }
  }

  // Get all collections from Firestore using Admin SDK backend
  async getAllCollections(): Promise<string[]> {
    try {
      const db = this.getDb();
      if (!db) {
        console.error('No active database connection');
        return [];
      }

      if (!this.currentConfig) {
        console.error('No active configuration');
        return [];
      }

      // Check if server is running
      const serverRunning = await this.checkServerStatus();
      if (!serverRunning) {
        throw new Error('Admin server is not running. Please start the server with: cd server && npm run dev');
      }

      // Call the backend API to get collections
      const response = await fetch(`${this.serverUrl}/api/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceAccount: {
            type: 'service_account',
            project_id: this.currentConfig.project_id,
            private_key_id: this.currentConfig.private_key_id,
            private_key: this.currentConfig.private_key,
            client_email: this.currentConfig.client_email,
            client_id: this.currentConfig.client_id,
            auth_uri: this.currentConfig.auth_uri,
            token_uri: this.currentConfig.token_uri,
            auth_provider_x509_cert_url: this.currentConfig.auth_provider_x509_cert_url,
            client_x509_cert_url: this.currentConfig.client_x509_cert_url
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch collections from backend: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      return data.collections;
    } catch (error) {
      console.error('Error getting collections:', error);
      throw error; // Re-throw the error so the UI can handle it
    }
  }

  // Clean up Firebase Admin app when switching or removing configurations
  private async cleanupAdminApp(projectId: string): Promise<void> {
    try {
      if (await this.checkServerStatus()) {
        await fetch(`${this.serverUrl}/api/cleanup/${projectId}`, {
          method: 'DELETE'
        });
      }
    } catch (error) {
      console.warn('Error cleaning up admin app:', error);
    }
  }
}

// Create and export a singleton instance
export const firebaseService = new FirebaseService();

// Export a function to get the current db instance
export const getDb = (): Firestore | null => {
  return firebaseService.getDb();
}; 