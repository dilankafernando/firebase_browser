import CryptoJS from 'crypto-js';

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
  id: string;
  email: string;
  displayName: string;
  firebaseConfigs: FirebaseConfig[];
  activeConfigId: string; // projectId of the active config
  sessionExpiry?: number; // Optional expiry timestamp for the session
}

// Service for storing and retrieving user data securely
class AuthService {
  private readonly STORAGE_KEY = 'firebase_browser_auth';
  private readonly ENCRYPTION_KEY = 'firebase_browser_secure_key';
  private readonly SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

  // Get user from localStorage with decryption
  getUser(): User | null {
    const encryptedData = localStorage.getItem(this.STORAGE_KEY);
    if (!encryptedData) return null;
    
    try {
      const decryptedData = CryptoJS.AES.decrypt(encryptedData, this.ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
      const user = JSON.parse(decryptedData) as User;
      
      // Check if session has expired
      if (user.sessionExpiry && user.sessionExpiry < Date.now()) {
        // Session expired, clear it
        localStorage.removeItem(this.STORAGE_KEY);
        return null;
      }
      
      // Session is valid, extend it and save
      this.extendSession(user);
      
      return user;
    } catch (error) {
      console.error('Failed to decrypt user data:', error);
      localStorage.removeItem(this.STORAGE_KEY); // Clear invalid data
      return null;
    }
  }

  // Save user to localStorage with encryption
  saveUser(user: User): void {
    // Set or extend session expiry
    this.extendSession(user);
    
    const encryptedData = CryptoJS.AES.encrypt(
      JSON.stringify(user),
      this.ENCRYPTION_KEY
    ).toString();
    
    localStorage.setItem(this.STORAGE_KEY, encryptedData);
  }
  
  // Extend the session expiry time
  private extendSession(user: User): void {
    user.sessionExpiry = Date.now() + this.SESSION_DURATION;
  }

  // Login user
  login(email: string, password: string): User | null {
    // Get all users
    const users = this.getAllUsers();
    
    // Find user with matching email and password
    const user = users.find(u => 
      u.email === email && 
      this.verifyPassword(password, u.id)
    );
    
    if (user) {
      // Update local storage with the current user
      this.saveUser(user);
      return user;
    }
    
    return null;
  }

  // Sign up new user
  signup(email: string, password: string, displayName: string, firebaseConfig?: FirebaseConfig): User {
    // Generate unique id
    const userId = CryptoJS.SHA256(email + Date.now().toString()).toString();
    
    // Store password securely
    this.storePassword(password, userId);
    
    // Initialize configs array
    const configs: FirebaseConfig[] = [];
    
    // Add initial config if provided
    if (firebaseConfig) {
      configs.push(firebaseConfig);
    }
    
    // Create new user with session expiry
    const newUser: User = {
      id: userId,
      email,
      displayName,
      firebaseConfigs: configs,
      activeConfigId: firebaseConfig?.projectId || '',
      sessionExpiry: Date.now() + this.SESSION_DURATION
    };
    
    // Add to users collection
    this.addUser(newUser);
    
    // Set as current user
    this.saveUser(newUser);
    
    return newUser;
  }

  // Logout user
  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Add Firebase config to user
  addFirebaseConfig(config: FirebaseConfig): User | null {
    const user = this.getUser();
    if (!user) return null;
    
    // Check if config with same projectId already exists
    const existingConfigIndex = user.firebaseConfigs.findIndex(c => c.projectId === config.projectId);
    
    if (existingConfigIndex >= 0) {
      // Update existing config
      user.firebaseConfigs[existingConfigIndex] = config;
    } else {
      // Add new config
      user.firebaseConfigs.push(config);
    }
    
    // Set as active config if user has no active config
    if (!user.activeConfigId) {
      user.activeConfigId = config.projectId;
    }
    
    // Update user in storage
    this.saveUser(user);
    this.updateUserInCollection(user);
    
    return user;
  }

  // Set active Firebase config
  setActiveConfig(projectId: string): User | null {
    const user = this.getUser();
    if (!user) return null;
    
    // Make sure the config exists
    const configExists = user.firebaseConfigs.some(c => c.projectId === projectId);
    if (!configExists) return null;
    
    // Update active config
    user.activeConfigId = projectId;
    
    // Update user in storage
    this.saveUser(user);
    this.updateUserInCollection(user);
    
    return user;
  }

  // Get active Firebase config
  getActiveConfig(): FirebaseConfig | null {
    const user = this.getUser();
    if (!user || !user.activeConfigId) return null;
    
    return user.firebaseConfigs.find(c => c.projectId === user.activeConfigId) || null;
  }

  // Remove a Firebase config
  removeFirebaseConfig(projectId: string): User | null {
    const user = this.getUser();
    if (!user) return null;
    
    // Remove config
    user.firebaseConfigs = user.firebaseConfigs.filter(c => c.projectId !== projectId);
    
    // If active config was removed, set a new one
    if (user.activeConfigId === projectId) {
      user.activeConfigId = user.firebaseConfigs.length > 0 ? user.firebaseConfigs[0].projectId : '';
    }
    
    // Update user in storage
    this.saveUser(user);
    this.updateUserInCollection(user);
    
    return user;
  }

  // Private methods for managing users collection
  private readonly USERS_KEY = 'firebase_browser_users';

  private getAllUsers(): User[] {
    try {
      const encryptedData = localStorage.getItem(this.USERS_KEY);
      if (!encryptedData) return [];
      
      const decryptedData = CryptoJS.AES.decrypt(encryptedData, this.ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('Failed to get users:', error);
      return [];
    }
  }

  private addUser(user: User): void {
    const users = this.getAllUsers();
    
    // Check if user already exists
    const existingIndex = users.findIndex(u => u.email === user.email);
    if (existingIndex >= 0) {
      throw new Error('User with this email already exists');
    }
    
    // Add new user
    users.push(user);
    
    // Save users collection
    this.saveUsers(users);
  }

  private updateUserInCollection(user: User): void {
    const users = this.getAllUsers();
    
    // Find user index
    const userIndex = users.findIndex(u => u.id === user.id);
    
    if (userIndex >= 0) {
      // Update user
      users[userIndex] = user;
      
      // Save users collection
      this.saveUsers(users);
    }
  }

  private saveUsers(users: User[]): void {
    const encryptedData = CryptoJS.AES.encrypt(
      JSON.stringify(users),
      this.ENCRYPTION_KEY
    ).toString();
    
    localStorage.setItem(this.USERS_KEY, encryptedData);
  }

  // Password handling
  private readonly PASSWORDS_KEY = 'firebase_browser_passwords';

  private storePassword(password: string, userId: string): void {
    // Get existing passwords
    let passwords: Record<string, string>;
    try {
      const encryptedData = localStorage.getItem(this.PASSWORDS_KEY);
      if (encryptedData) {
        const decryptedData = CryptoJS.AES.decrypt(encryptedData, this.ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
        passwords = JSON.parse(decryptedData);
      } else {
        passwords = {};
      }
    } catch (error) {
      console.error('Failed to get passwords:', error);
      passwords = {};
    }
    
    // Hash the password with the user id as salt
    const hashedPassword = CryptoJS.SHA256(password + userId).toString();
    
    // Store the hashed password
    passwords[userId] = hashedPassword;
    
    // Save passwords
    const encryptedData = CryptoJS.AES.encrypt(
      JSON.stringify(passwords),
      this.ENCRYPTION_KEY
    ).toString();
    
    localStorage.setItem(this.PASSWORDS_KEY, encryptedData);
  }

  private verifyPassword(password: string, userId: string): boolean {
    try {
      // Get stored passwords
      const encryptedData = localStorage.getItem(this.PASSWORDS_KEY);
      if (!encryptedData) return false;
      
      const decryptedData = CryptoJS.AES.decrypt(encryptedData, this.ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
      const passwords = JSON.parse(decryptedData);
      
      // Get stored hash for user
      const storedHash = passwords[userId];
      if (!storedHash) return false;
      
      // Hash the provided password
      const hashedPassword = CryptoJS.SHA256(password + userId).toString();
      
      // Compare hashes
      return storedHash === hashedPassword;
    } catch (error) {
      console.error('Failed to verify password:', error);
      return false;
    }
  }
}

export const authService = new AuthService(); 