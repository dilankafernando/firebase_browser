export interface FirebaseConfig {
  displayName: string;
  apiKey: string;
  project_id: string;
  authDomain?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
  type?: 'service_account';
  private_key_id?: string;
  private_key?: string;
  client_email?: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
  auth_provider_x509_cert_url?: string;
  client_x509_cert_url?: string;
}

export interface FirestoreData {
  id: string;
  [key: string]: any;
} 