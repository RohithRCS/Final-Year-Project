import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define our theme colors
export const lightTheme = {
  background: '#F8F9FA',
  cardBackground: '#FFFFFF',
  text: '#202124',
  subText: '#5F6368',
  primary: '#4285F4',
  divider: '#E8EAED',
  statusBar: 'dark-content',
};

export const darkTheme = {
  background: '#121212',
  cardBackground: '#1E1E1E',
  text: '#FFFFFF',
  subText: '#9AA0A6',
  primary: '#8AB4F8',
  divider: '#2D2D2D',
  statusBar: 'light-content',
};

// Create the Theme Context
const ThemeContext = createContext();

// Theme Provider component
export const ThemeProvider = ({ children }) => {
  const deviceTheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  // Load theme preference from storage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const value = await AsyncStorage.getItem('@theme_preference');
        if (value !== null) {
          setIsDarkMode(value === 'dark');
        } else {
          // If no preference is set, use device theme
          setIsDarkMode(deviceTheme === 'dark');
        }
        setIsThemeLoaded(true);
      } catch (error) {
        console.error('Error loading theme preference:', error);
        setIsThemeLoaded(true);
      }
    };

    loadThemePreference();
  }, [deviceTheme]);

  // Toggle theme function
  const toggleTheme = async () => {
    try {
      const newThemeValue = !isDarkMode;
      setIsDarkMode(newThemeValue);
      await AsyncStorage.setItem('@theme_preference', newThemeValue ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Get current theme values
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme, isThemeLoaded }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for using theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};