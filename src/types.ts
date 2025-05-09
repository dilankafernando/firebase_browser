export interface FirebaseConfig {
  displayName: string;
  apiKey: string;
  project_id: string;
  authDomain?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

export interface FirestoreData {
  id: string;
  [key: string]: any;
} 