import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from './components/AuthContext';
import { useTheme } from './components/ThemeContext';
import HomeScreen from './components/HomeScreen';
import * as Notifications from 'expo-notifications';

// Set up notification handler
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    };
  },
});



export default function Index() {
  const [greeting, setGreeting] = useState('Good Morning');
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const { currentUser } = useAuth();
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();

  // Set greeting based on time of day
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setGreeting('Good Morning');
    else if (hours < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // Destructure firstName from currentUser for cleaner JSX
  const firstName = currentUser?.firstName || 'User';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.headerContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.greeting, { color: theme.text }]}>
          {greeting}, {firstName}!
        </Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings" size={27} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Assuming HomeScreen is part of the layout */}
      <HomeScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor is now applied dynamically
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
    // backgroundColor is now applied dynamically
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    // color is now applied dynamically
  },
  settingsButton: {
    padding: 5,
    height:55,
  },
});