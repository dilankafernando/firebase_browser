import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { authService, FirebaseConfig } from './authService';

class FirebaseService {
  private firebaseApps: Map<string, FirebaseApp> = new Map();
  private firestoreInstances: Map<string, Firestore> = new Map();
  private currentConfig: FirebaseConfig | null = null;

  constructor() {
    // Initialize with the active config if one exists
    this.initializeFromActiveConfig();
  }

  // Initialize using the active config from auth service
  initializeFromActiveConfig(): void {
    const config = authService.getActiveConfig();
    if (config) {
      this.initializeApp(config);
    }
  }

  // Initialize a new Firebase app instance with a config
  initializeApp(config: FirebaseConfig): Firestore {
    try {
      // Check if we already have an instance for this project
      if (this.firebaseApps.has(config.projectId)) {
        const app = this.firebaseApps.get(config.projectId)!;
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
          storageBucket: config.storageBucket,
          messagingSenderId: config.messagingSenderId,
          appId: config.appId,
        },
        config.projectId // Use projectId as the app name to avoid conflicts
      );

      // Get Firestore instance
      const db = getFirestore(app);

      // Store in our maps
      this.firebaseApps.set(config.projectId, app);
      this.firestoreInstances.set(config.projectId, db);
      this.currentConfig = config;

      return db;
    } catch (error) {
      console.error('Error initializing Firebase app:', error);
      throw error;
    }
  }

  // Get Firestore instance for the active config
  getFirestore(): Firestore | null {
    const config = authService.getActiveConfig();
    if (!config) return null;

    // Initialize if not already done
    if (!this.firestoreInstances.has(config.projectId)) {
      return this.initializeApp(config);
    }

    return this.firestoreInstances.get(config.projectId) || null;
  }

  // Get the current active Firebase configuration
  getCurrentConfig(): FirebaseConfig | null {
    return this.currentConfig;
  }

  // Switch to a different Firebase configuration
  switchConfig(projectId: string): Firestore | null {
    // Update active config in auth service
    const user = authService.setActiveConfig(projectId);
    if (!user) return null;

    // Get the config
    const config = user.firebaseConfigs.find(c => c.projectId === projectId);
    if (!config) return null;

    // Initialize if not already done
    if (!this.firestoreInstances.has(projectId)) {
      return this.initializeApp(config);
    }

    // Update current config
    this.currentConfig = config;
    return this.firestoreInstances.get(projectId) || null;
  }

  // Remove a Firebase configuration
  removeConfig(projectId: string): void {
    this.firebaseApps.delete(projectId);
    this.firestoreInstances.delete(projectId);

    // If this was the current config, update current config
    if (this.currentConfig?.projectId === projectId) {
      this.currentConfig = null;
      this.initializeFromActiveConfig();
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
  return firebaseService.getFirestore();
}; 