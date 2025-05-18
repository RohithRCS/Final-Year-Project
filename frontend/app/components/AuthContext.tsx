import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from "./config";

// Define types
interface UserData {
  userId: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  token: string;
  height?: number;
  weight?: number;
  dob?: string;
  chats?: any[];
  preferences?: any;
  expoPushToken?: string; // Add push token for notifications
}

interface PreferenceData {
  _id: string;
  userId: string;
  theme?: 'light' | 'dark' | 'high-contrast';
  fontSize?: 'small' | 'medium' | 'large' | 'extra-large';
  
  mealPreferences?: {
    beforeMealMedicationTime?: number;
    afterMealMedicationTime?: number;
    breakfastTime?: string;
    lunchTime?: string;
    dinnerTime?: string;
    dietaryRestrictions?: Array<'none' | 'vegetarian' | 'vegan' | 'dairy-free' | 'gluten-free' | 'low-sodium' | 'diabetic' | 'other'>;
    foodAllergies?: string[];
  };
  
  exercisePreferences?: {
    preferredExerciseTime?: 'morning' | 'afternoon' | 'evening';
    exerciseDuration?: number;
    exerciseIntensity?: 'very-light' | 'light' | 'moderate' | 'somewhat-vigorous';
  };
  
  sleepPreferences?: {
    bedTime?: string;
    wakeTime?: string;
    napTime?: boolean;
  };
  
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
    alternate?: string;
  };
}

// Define Reminder type based on server model
interface Reminder {
  _id?: string;
  title: string;
  description?: string;
  time: string;
  date: string | Date;
  repeat: boolean;
  repeatDays: string[];
  user: string;
  isActive?: boolean;
  expoPushToken?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  currentUser: UserData | null;
  token: string | null;
  loading: boolean;
  login: (phoneNumber: string, password: string) => Promise<{ success: boolean; userData?: UserData; error?: string }>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  updateProfile: (updatedData: Partial<UserData>) => Promise<{ success: boolean; data?: UserData; error?: string }>;
  savePreferences: (preferencesData: Partial<PreferenceData>) => Promise<{ success: boolean; data?: PreferenceData; error?: string }>;
  updatePreferenceSection: (
    section: 'mealPreferences' | 'exercisePreferences' | 'sleepPreferences' | 'emergencyContact' | string, 
    sectionData: any
  ) => Promise<{ success: boolean; data?: any; error?: string }>;
  getPreferences: () => Promise<{ success: boolean; data?: PreferenceData; error?: string }>;
  getPreferenceById: (preferenceId: string) => Promise<{ success: boolean; data?: PreferenceData; error?: string }>;
  updatePreferenceById: (preferenceId: string, updatedData: Partial<PreferenceData>) => 
    Promise<{ success: boolean; data?: PreferenceData; error?: string }>;
  validateReminder: (reminderData: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  syncReminders: () => Promise<{ success: boolean; data?: any; error?: string }>;
  getAuthHeader: () => Record<string, string>;
  checkFirstTimeUser: () => Promise<boolean>;
  
  // New reminder functions
  createReminder: (reminderData: Omit<Reminder, 'user'>) => 
    Promise<{ success: boolean; data?: Reminder; error?: string }>;
  getReminders: () => Promise<{ success: boolean; data?: Reminder[]; error?: string }>;
  getReminderById: (reminderId: string) => 
    Promise<{ success: boolean; data?: Reminder; error?: string }>;
  updateReminder: (reminderId: string, updatedData: Partial<Reminder>) => 
    Promise<{ success: boolean; data?: Reminder; error?: string }>;
  deleteReminder: (reminderId: string) => 
    Promise<{ success: boolean; message?: string; error?: string }>;
  toggleReminderStatus: (reminderId: string) => 
    Promise<{ success: boolean; data?: Reminder; error?: string }>;
  getTodayReminders: () => Promise<{ success: boolean; data?: Reminder[]; error?: string }>;
  updateExpoPushToken: (token: string) => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(null);

  // Function to store user data in AsyncStorage
  const storeUserData = async (userData: UserData): Promise<void> => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
      console.error('Error storing user data:', error);
    }
  };

  // Function to retrieve user data from AsyncStorage
  const getUserData = async (): Promise<UserData | null> => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  };

  // Check if there's a logged-in user when the app loads
  useEffect(() => {
    const loadStoredUser = async () => {
      const userData = await getUserData();
      if (userData) {
        setCurrentUser(userData);
        setToken(userData.token);
      }
      setLoading(false);
    };

    loadStoredUser();
  }, []);

  // Login function
  const login = async (phoneNumber: string, password: string) => {
    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ PhoneNumber: phoneNumber.trim(), password: password.trim() }),
      });

      const data = await response.json();
      
      if (response.ok) {
        const userData: UserData = {
          userId: data.userId,
          phoneNumber: data.PhoneNumber,
          firstName: data.Firstname,
          lastName: data.lastname,
          token: data.token,
          height: data.Height,
          weight: data.weight,
          dob: data.DOB,
          chats: data.chats,
          preferences: data.preferences,
          expoPushToken: data.expoPushToken
        };
        
        setCurrentUser(userData);
        setToken(data.token);
        await storeUserData(userData);
        return { success: true, userData };
      } else {
        return { success: false, error: data.error || 'Invalid credentials' };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: 'Unable to connect. Check your network and try again.' };
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('userData');
      setCurrentUser(null);
      setToken(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Register function
  const register = async (userData: any) => {
    try {
      const response = await fetch(`${BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      
      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: 'Unable to connect. Check your network and try again.' };
    }
  };

  // Function to check if user is logging in for the first time
  const checkFirstTimeUser = async (): Promise<boolean> => {
    if (!currentUser) return false;
    
    try {
      const hasCompletedPreferences = await AsyncStorage.getItem(`preferences_completed_${currentUser.userId}`);
      return !hasCompletedPreferences;
    } catch (error) {
      console.error('Error checking first-time user status:', error);
      return false;
    }
  };

  // Function to get auth header for API calls
  const getAuthHeader = (): Record<string, string> => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const updateProfile = async (updatedData: Partial<UserData>) => {
    try {
      if (!currentUser || !token) {
        return { success: false, error: 'Not authenticated' };
      }

      // Ensure field names match what the user object expects
      const normalizedData = {
        // Convert from camelCase to the format the API expects
        Firstname: updatedData.firstName || updatedData.firstName,
        lastname: updatedData.lastName || updatedData.lastName,
        Height: updatedData.height !== undefined ? Number(updatedData.height) : 
                updatedData.height !== undefined ? Number(updatedData.height) : undefined,
        weight: updatedData.weight !== undefined ? Number(updatedData.weight) : undefined,
      };

      console.log("Sending profile update:", normalizedData);

      const response = await fetch(`${BASE_URL}/edit/${currentUser.userId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()  // Make sure to include the auth token
        },
        body: JSON.stringify(normalizedData),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Normalize the response data to match our UserData structure
        const updatedUserData = { 
          ...currentUser,
          // Map the API response fields to our UserData structure
          firstName: data.Firstname || currentUser.firstName,
          lastName: data.lastname || currentUser.lastName,
          height: data.Height || currentUser.height,
          weight: data.weight || currentUser.weight
        };
        
        console.log("Updated user data:", updatedUserData);
        
        // Update the current user in state and storage
        setCurrentUser(updatedUserData);
        await storeUserData(updatedUserData);
        
        return { success: true, data: updatedUserData };
      } else {
        console.error("API error:", data);
        return { success: false, error: data.error || 'Update failed' };
      }
    } catch (error) {
      console.error("Profile update error:", error);
      return { success: false, error: 'Unable to connect. Check your network and try again.' };
    }
  };

  // Function to get user preferences
  const getPreferences = async () => {
    try {
      if (!currentUser || !token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${BASE_URL}/userPreference?userId=${currentUser.userId}`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.message || 'No preferences found for this user' };
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
      return { success: false, error: 'Unable to connect. Check your network and try again.' };
    }
  };


  // Update preference by ID
  const updatePreferenceById = async (preferenceId: string, updatedData: Partial<PreferenceData>) => {
    try {
      if (!token || !currentUser) {
        return { success: false, error: 'Not authenticated' };
      }

      // First check if this is the user's preference ID
      const prefResponse = await getPreferences();
      if (!prefResponse.success || prefResponse.data?._id !== preferenceId) {
        return { success: false, error: 'Preference not found or unauthorized' };
      }

      const response = await fetch(`${BASE_URL}/userPreference/user/${currentUser.userId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(updatedData),
      });

      const data = await response.json();
      
      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.error || 'Failed to update preference' };
      }
    } catch (error) {
      console.error("Error updating preference by ID:", error);
      return { success: false, error: 'Unable to connect. Check your network and try again.' };
    }
  };

  // Function for saving all preferences
  const savePreferences = async (preferencesData: Partial<PreferenceData>) => {
    try {
      if (!currentUser || !token) {
        return { success: false, error: 'Not authenticated' };
      }

      // Add userId to preferences data
      const dataWithUserId = { 
        ...preferencesData, 
        userId: currentUser.userId 
      };

      const response = await fetch(`${BASE_URL}/userPreference`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(dataWithUserId),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Update current user with preferences ID
        const updatedUserData = { 
          ...currentUser, 
          preferences: data._id
        };
        
        setCurrentUser(updatedUserData);
        await storeUserData(updatedUserData);
        
        // Mark preferences as completed
        await AsyncStorage.setItem(`preferences_completed_${currentUser.userId}`, 'true');
        
        return { success: true, data };
      } else {
        return { success: false, error: data.message || 'Failed to save preferences' };
      }
    } catch (error) {
      console.error("Preferences update error:", error);
      return { success: false, error: 'Unable to connect. Check your network and try again.' };
    }
  };

  // Function to update specific preference section
  const updatePreferenceSection = async (
    section: 'mealPreferences' | 'exercisePreferences' | 'sleepPreferences' | 'emergencyContact' | string, 
    sectionData: any
  ) => {
    try {
      if (!currentUser || !token) {
        return { success: false, error: 'Not authenticated' };
      }

      // Get current preferences
      const prefResponse = await getPreferences();
      if (!prefResponse.success) {
        return { success: false, error: 'No existing preferences found' };
      }

      // Add userId to section data
      const dataWithUserId = { 
        ...sectionData, 
        userId: currentUser.userId 
      };

      // For consistency with the router, we'll patch the user's full preferences with the updated section
      const updatedData = {
        ...prefResponse.data,
        [section]: sectionData
      };

      const response = await fetch(`${BASE_URL}/userPreference/user/${currentUser.userId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(updatedData),
      });

      const data = await response.json();
      
      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.message || `Failed to update ${section} preferences` };
      }
    } catch (error) {
      console.error(`Error updating ${section} preferences:`, error);
      return { success: false, error: 'Unable to connect. Check your network and try again.' };
    }
  };


  // Update Expo Push Token
  const updateExpoPushToken = async (newToken: string): Promise<void> => {
    try {
      if (currentUser) {
        const updatedUserData = {
          ...currentUser,
          expoPushToken: newToken
        };
        setCurrentUser(updatedUserData);
        await storeUserData(updatedUserData);
      }
    } catch (error) {
      console.error("Error updating push token:", error);
    }
  };

  const value: AuthContextType = {
    currentUser,
    token,
    loading,
    login,
    logout,
    register,
    updateProfile,
    savePreferences,
    updatePreferenceSection,
    getPreferences,
    updatePreferenceById,
    getAuthHeader,
    checkFirstTimeUser,
    updateExpoPushToken
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};