export interface FirebaseConfig {
  displayName: string;
  apiKey: string;
  projectId: string;
  authDomain: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export interface FirestoreData {
  id: string;
  [key: string]: any;
} 