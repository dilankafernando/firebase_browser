export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface ServiceAccountConfig {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

export type ConfigType = 'client' | 'serviceAccount';

export interface QueryFilter {
  fieldPath: string;
  operator: FilterOperator;
  value: string | number | boolean;
}

export type FilterOperator = 
  | '==' 
  | '!=' 
  | '<' 
  | '<=' 
  | '>' 
  | '>=' 
  | 'array-contains' 
  | 'array-contains-any' 
  | 'in' 
  | 'not-in';

export interface OrderBy {
  fieldPath: string;
  direction: 'asc' | 'desc';
}

export interface QueryConfig {
  collection: string;
  filters: QueryFilter[];
  orderBy: OrderBy[];
  limit: number;
}

export interface FirestoreDocument {
  id: string;
  path: string;
  data: Record<string, any>;
}

export interface SavedQuery {
  id: string;
  name: string;
  query: QueryConfig;
} 