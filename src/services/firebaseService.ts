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
  return firebaseService.getDb();
}; 