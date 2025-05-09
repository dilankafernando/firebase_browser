import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserPreferences } from './authService';

class UserPreferencesService {
  // Get user preferences
  async getPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.preferences || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      throw error;
    }
  }

  // Update user preferences
  async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const currentPreferences = userDoc.data().preferences || {};
        await updateDoc(userRef, {
          preferences: {
            ...currentPreferences,
            ...preferences
          }
        });
      }
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  // Reset user preferences to default
  async resetPreferences(userId: string): Promise<void> {
    try {
      const defaultPreferences: UserPreferences = {
        theme: 'light',
        language: 'en',
        notifications: true
      };

      await this.updatePreferences(userId, defaultPreferences);
    } catch (error) {
      console.error('Error resetting user preferences:', error);
      throw error;
    }
  }
}

export const userPreferencesService = new UserPreferencesService(); 