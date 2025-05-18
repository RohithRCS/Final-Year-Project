import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Animated,
  FlatList
} from 'react-native';
import { useTheme } from './ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './AuthContext';
import { ReminderService } from './reminderService';
import { WaterReminderService } from './reminderService';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import CustomReminder from './customReminder'
import * as Notifications from 'expo-notifications';


const HealthRemindersScreen = ({ navigation }) => {
  const { currentUser, getPreferences } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [waterEnabled, setWaterEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState('set'); // 'set' or 'active'
   const { theme } = useTheme();
  
  // Reminder states
  const [medicationEnabled, setMedicationEnabled] = useState(false);
  const [sleepEnabled, setSleepEnabled] = useState(false);
  const [activeReminders, setActiveReminders] = useState([]);
  const [showWaterDetails, setShowWaterDetails] = useState(false);
  // Section visibility states
  const [showMedicationDetails, setShowMedicationDetails] = useState(false);
  const [showSleepDetails, setShowSleepDetails] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [reminders, setReminders] = useState([]);
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop:60,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background,
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: theme.subText,
      fontWeight: '600',
    },
    tabContainer: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 8,
      borderRadius: 10,
      backgroundColor: theme.divider,
      overflow: 'hidden',
    },
    tabButton: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
    },
    activeTab: {
      backgroundColor: theme.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.subText,
    },
    activeTabText: {
      color: theme.cardBackground,
    },
    sectionHeader: {
  backgroundColor: theme.cardBackground,
  padding: 10,
  borderBottomWidth: 1,
  borderBottomColor: theme.divider,
},sectionHeaderText: {
  fontWeight: 'bold',
  color: theme.text,
},
    introCard: {
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      padding: 20,
      margin: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
    },
    introTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 10,
      paddingLeft:20,
    },
    introText: {
      fontSize: 14,
      color: theme.subText,
      marginBottom: 15,
      lineHeight: 20,
    },
    card: {
      marginTop:17,
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      padding: 20,
      marginHorizontal: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
    },
    activeCard: {
      borderLeftWidth: 4,
      borderLeftColor: theme.primary,
    },
    disabledCard: {
      opacity: 0.7,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    icon: {
      marginRight: 10,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
    },
    description: {
      fontSize: 14,
      color: theme.subText,
      marginBottom: 15,
    },
    disabledText: {
      color: theme.subText,
      opacity: 0.6,
    },
    warningContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.isDarkMode ? '#2D2D2D' : '#FFF5E6',
      borderRadius: 8,
      padding: 10,
      marginBottom: 15,
    },
    warningText: {
      fontSize: 13,
      color: '#E07C24',
      marginLeft: 6,
      flex: 1,
    },
    detailsToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: theme.divider,
    },
    activeDetailsToggle: {
      borderTopColor: theme.isDarkMode ? '#2D2D2D' : '#E8EEFF',
    },
    detailsToggleText: {
      fontSize: 14,
      color: theme.subText,
      marginRight: 5,
    },
    activeToggleText: {
      color: theme.primary,
    },
    detailsContainer: {
      marginTop: 15,
      borderTopWidth: 1,
      borderTopColor: theme.divider,
      paddingTop: 15,
    },
    sectionCard: {
      backgroundColor: theme.cardBackground,
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color:theme.text,
    },
    mealRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    mealLabel: {
      fontSize: 14,
      color: theme.text,
    },
    mealTime: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.text,
    },
    editButton: {
      backgroundColor: theme.primary,
      borderRadius: 10,
      padding: 15,
      alignItems: 'center',
      marginTop: 5,
      flexDirection: 'row',
      justifyContent: 'center',
    },
    editButtonText: {
      color: theme.cardBackground,
      fontSize: 16,
      fontWeight: '600',
    },
    emptyStateCard: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      padding: 30,
      margin: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
      marginTop: 15,
      marginBottom: 10,
    },
    emptyStateMessage: {
      fontSize: 14,
      color: theme.subText,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 20,
    },
    setupButton: {
      backgroundColor: theme.primary,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    setupButtonText: {
      color: theme.cardBackground,
      fontSize: 16,
      fontWeight: '600',
    },
    addReminderButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      margin: 16,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.primary,
      backgroundColor: theme.isDarkMode ? '#2D2D2D' : '	#848884',
    },
    addReminderText: {
      marginLeft: 10,
      fontSize: 16,
      fontWeight: '600',
      color: theme.primary,
    },
    remindersList: {
      padding: 16,
    },
    reminderItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 2,
    },
    reminderIcon: {
      marginRight: 16,
    },
    reminderDetails: {
      flex: 1,
    },
    reminderTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    reminderTime: {
      fontSize: 14,
      color: theme.subText,
      marginBottom: 4,
    },
    reminderDescription: {
      fontSize: 13,
      color: theme.subText,
    },
    deleteButton: {
      marginLeft: 16,
      padding: 8,
    },
    emptyActiveReminders: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    emptyActiveText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginTop: 16,
    },
    emptyActiveSubtext: {
      fontSize: 14,
      color: theme.subText,
      marginTop: 8,
      textAlign: 'center',
    },
    fab: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
  });

  useEffect(() => {
  const foregroundSubscription = Notifications.addNotificationReceivedListener(async (notification) => {
    const reminderId = notification.request.content.data?.reminderId;
    if (reminderId) {
      await deleteReminder(reminderId);
    }
  });

  return () => {
    foregroundSubscription.remove();
  };
}, []);

  const addReminder = async (reminderData) => {
  try {
    setLoading(true);

    // Assume the reminder is directly added without checking result.success
    await loadActiveReminders(); // Refresh the reminders list
    Alert.alert('Success', 'Custom reminder has been created');
    
  } catch (error) {
    console.error('Error adding custom reminder:', error);
    Alert.alert('Error', 'An unexpected error occurred');
  } finally {
    setLoading(false);
    setModalVisible(false);
  }
};

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUserPreferences();
      checkExistingReminders();
      loadActiveReminders();
      
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      }).start();
      
      return () => {
        // No cleanup needed for notifications
      };
    }, [])
  );
  
  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserPreferences();
    await checkExistingReminders();
    await loadActiveReminders();
    setRefreshing(false);
  }, []);

  const loadActiveReminders = async () => {
  try {
    const remindersJSON = await AsyncStorage.getItem('reminders');
    if (remindersJSON) {
      const reminders = JSON.parse(remindersJSON);
      
      // Sort reminders by time (soonest first)
      const sortedReminders = reminders.sort((a, b) => {
        const timeA = a.time || '23:59'; // Default to end of day if no time
        const timeB = b.time || '23:59';
        return timeA.localeCompare(timeB);
      });
      
      setActiveReminders(sortedReminders);
    } else {
      setActiveReminders([]);
    }
  } catch (error) {
    console.error('Error loading active reminders:', error);
  }
};
// Add this to your component to listen for AsyncStorage changes
useEffect(() => {
  const subscription = navigation.addListener('focus', () => {
    loadActiveReminders();
  });
  
  return subscription;
}, [navigation]);

// Also listen for changes when the app is in the foreground
useEffect(() => {
  const interval = setInterval(() => {
    loadActiveReminders();
  }, 30000); // Check every 30 seconds
  
  return () => clearInterval(interval);
}, []);
  
const checkExistingReminders = async () => {
  try {
    const remindersJSON = await AsyncStorage.getItem('reminders');
    if (remindersJSON) {
      const reminders = JSON.parse(remindersJSON);
      
      // Check for each type of reminder
      const hasMedicationReminders = reminders.some(r => r.isMedicationReminder);
      const hasSleepReminders = reminders.some(r => r.isSleepReminder);
      const hasWaterReminders = reminders.some(r => r.isWaterReminder);
      
      setMedicationEnabled(hasMedicationReminders);
      setSleepEnabled(hasSleepReminders);
      setWaterEnabled(hasWaterReminders);
    }
  } catch (error) {
    console.error('Error checking existing reminders:', error);
  }
};
  
  // Fetch user preferences from API
  const fetchUserPreferences = async () => {
    try {
      setLoading(true);
      
      const result = await getPreferences();
      if (result.success) {
        setPreferences(result.data);
      } else {
        Alert.alert('Error', result.error || 'Failed to fetch preferences');
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Format time string for display
  const formatTimeString = (timeString) => {
    if (!timeString) return 'Not set';
    
    try {
      const [hours, minutes] = timeString.split(':');
      const time = new Date();
      time.setHours(parseInt(hours, 10));
      time.setMinutes(parseInt(minutes, 10));
      
      return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString;
    }
  };
  
  // Toggle medication reminders with haptic feedback
  const toggleMedicationReminders = async (value) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      if (value) {
        if (!preferences || !preferences.mealPreferences) {
          Alert.alert(
            'Missing Meal Preferences', 
            'Please configure your meal preferences first',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Configure Now', 
                onPress: () => navigateToPreferences('mealPreferences') 
              }
            ]
          );
          return;
        }
        
        setLoading(true);
        const result = await ReminderService.createMealBasedReminders(preferences);
        
        if (result.success) {
          setMedicationEnabled(true);
          await loadActiveReminders();
          Alert.alert('Success', 'Medication reminders have been set based on your meal times');
        } else {
          Alert.alert('Error', result.error || 'Failed to set reminders');
        }
      } else {
        setLoading(true);
        const result = await ReminderService.cancelMedicationReminders();
        
        if (result.success) {
          setMedicationEnabled(false);
          await loadActiveReminders();
          Alert.alert('Success', 'Medication reminders have been canceled');
        } else {
          Alert.alert('Error', result.error || 'Failed to cancel reminders');
        }
      }
    } catch (error) {
      console.error('Error toggling medication reminders:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle sleep reminders with haptic feedback
  const toggleSleepReminders = async (value) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      if (value) {
        if (!preferences || !preferences.sleepPreferences) {
          Alert.alert(
            'Missing Sleep Preferences', 
            'Please configure your sleep preferences first',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Configure Now', 
                onPress: () => navigateToPreferences('sleepPreferences') 
              }
            ]
          );
          return;
        }
        
        setLoading(true);
        const result = await ReminderService.createSleepReminders(preferences);
        
        if (result.success) {
          setSleepEnabled(true);
          await loadActiveReminders();
          Alert.alert('Success', 'Sleep reminders have been set based on your preferences');
        } else {
          Alert.alert('Error', result.error || 'Failed to set reminders');
        }
      } else {
        setLoading(true);
        const result = await ReminderService.cancelSleepReminders();
        
        if (result.success) {
          setSleepEnabled(false);
          await loadActiveReminders();
          Alert.alert('Success', 'Sleep reminders have been canceled');
        } else {
          Alert.alert('Error', result.error || 'Failed to cancel reminders');
        }
      }
    } catch (error) {
      console.error('Error toggling sleep reminders:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleWaterReminders = async (value) => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (value) {
      setLoading(true);
      // Default wake time is 8:00 AM, but you can change this or make it configurable
      const result = await WaterReminderService.scheduleStaticWaterReminders("08:00"); 
      
      if (result.success) {
        setWaterEnabled(true);
        await loadActiveReminders();
        Alert.alert('Success', 'Water reminders have been set to remind you every 2 hours');
      } else {
        Alert.alert('Error', result.error || 'Failed to set reminders');
      }
    } else {
      setLoading(true);
      const result = await WaterReminderService.cancelWaterReminders();
      
      if (result.success) {
        setWaterEnabled(false);
        await loadActiveReminders();
        Alert.alert('Success', 'Water reminders have been canceled');
      } else {
        Alert.alert('Error', result.error || 'Failed to cancel reminders');
      }
    }
  } catch (error) {
    console.error('Error toggling water reminders:', error);
    Alert.alert('Error', 'An unexpected error occurred');
  } finally {
    setLoading(false);
  }
};
  
  const deleteReminder = async (reminderId) => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setLoading(true);
    const result = await ReminderService.cancelSpecificReminder(reminderId);
    
    if (result.success) {
      // Remove the reminder from AsyncStorage
      const remindersJSON = await AsyncStorage.getItem('reminders');
      if (remindersJSON) {
        const reminders = JSON.parse(remindersJSON);
        const updatedReminders = reminders.filter(r => r.id !== reminderId);
        await AsyncStorage.setItem('reminders', JSON.stringify(updatedReminders));
        setActiveReminders(updatedReminders);
      }
    } else {
      console.log('Error deleting reminder:', result.error);
    }
  } catch (error) {
    console.error('Error deleting reminder:', error);
  } finally {
    setLoading(false);
  }
};
  
 const toggleDetails = (section) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  
  switch (section) {
    case 'medication':
      setShowMedicationDetails(!showMedicationDetails);
      break;
    case 'sleep':
      setShowSleepDetails(!showSleepDetails);
      break;
    case 'water':
      setShowWaterDetails(!showWaterDetails);
      break;
  }
};
  
  // Navigate to preferences section
  const navigateToPreferences = (section) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('UpdatePreference', { section: section });
  };
  
  const navigateToCustomReminder = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  setModalVisible(true); // This shows the modal
};

useEffect(() => {
  // Handle notifications received while the app is in the foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener(async (notification) => {
    const reminderId = notification.request.content.data?.reminderId;
    if (reminderId) {
      await deleteReminder(reminderId);
      // Cancel the notification
      await Notifications.dismissNotificationAsync(notification.request.identifier);
    }
  });

  // Handle notifications interacted with (tapped) while the app is in background/quit
  const backgroundSubscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
    const reminderId = response.notification.request.content.data?.reminderId;
    if (reminderId) {
      await deleteReminder(reminderId);
      // Cancel the notification
      await Notifications.dismissNotificationAsync(response.notification.request.identifier);
    }
  });

  return () => {
    foregroundSubscription.remove();
    backgroundSubscription.remove();
  };
}, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A6FE5" />
        <Text style={styles.loadingText}>Loading your reminders...</Text>
      </View>
    );
  }
  
  // Extract preferences or default to empty objects
  const mealPrefs = preferences?.mealPreferences || {};
  const sleepPrefs = preferences?.sleepPreferences || {};
  
  // Check if any preferences are configured
  const hasAnyPreferences = (mealPrefs.breakfastTime || mealPrefs.lunchTime || mealPrefs.dinnerTime) ||
                          (sleepPrefs.bedTime || sleepPrefs.wakeTime);

  const renderActiveReminders = () => {
  if (activeReminders.length > 0) {
    // Group reminders by today vs future
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const upcomingReminders = activeReminders.filter(reminder => {
      if (!reminder.time) return false;
      const [hours, minutes] = reminder.time.split(':').map(Number);
      return hours > currentHour || (hours === currentHour && minutes > currentMinute);
    });
    
    const pastReminders = activeReminders.filter(reminder => {
      if (!reminder.time) return true;
      const [hours, minutes] = reminder.time.split(':').map(Number);
      return hours < currentHour || (hours === currentHour && minutes <= currentMinute);
    });

    // Combine with upcoming first, then past
    const sortedReminders = [...upcomingReminders, ...pastReminders];

    return (
      <FlatList
        data={sortedReminders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const [hours, minutes] = item.time ? item.time.split(':').map(Number) : [23, 59];
          const isUpcoming = hours > currentHour || (hours === currentHour && minutes > currentMinute);
          
          return (
            <View style={[
              styles.reminderItem,
              !isUpcoming && { opacity: 0.6 }
            ]}>
              <View style={styles.reminderIcon}>
                <Ionicons 
                  name={item.isMedicationReminder ? 'medkit' : 
                        item.isSleepReminder ? 'moon' : 'notifications'} 
                  size={24} 
                  color={isUpcoming ? "#4A6FE5" : "#888"} 
                />
              </View>
              
              <View style={styles.reminderDetails}>
                <Text style={styles.reminderTitle}>{item.title}</Text>
                <Text style={[
                  styles.reminderTime,
                  { color: isUpcoming ? theme.text : theme.subText }
                ]}>
                  {formatTimeString(item.time)} 
                  {item.repeats ? ' (Repeating)' : ''}
                  {!isUpcoming ? ' (Passed)' : ''}
                </Text>
                {item.description && (
                  <Text style={styles.reminderDescription}>{item.description}</Text>
                )}
              </View>
              
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => deleteReminder(item.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          );
        }}
        contentContainerStyle={styles.remindersList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4A6FE5']}
          />
        }
      />
    );
  } else {
    return (
      <View style={styles.emptyActiveReminders}>
        <Ionicons name="notifications-off-outline" size={48} color="#AAA" />
        <Text style={styles.emptyActiveText}>No Active Reminders</Text>
        <Text style={styles.emptyActiveSubtext}>
          Set up reminders in the "Set Reminders" tab
        </Text>
      </View>
    );
  }
};
  return (
    <View style={styles.container}>
    <Text style={styles.introTitle}>Reminders</Text>
           
        
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'set' && styles.activeTab]}
          onPress={() => setActiveTab('set')}
        >
          <Text style={[styles.tabText, activeTab === 'set' && styles.activeTabText]}>Set Reminders</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>Active Reminders</Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'set' ? (
        <ScrollView 
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4A6FE5']}
            />
          }
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Introduction Card */}
            
            
            {/* Empty State for No Preferences */}
            {!hasAnyPreferences && (
              <View style={styles.emptyStateCard}>
                <Ionicons name="settings-outline" size={48} color="#AAA" />
                <Text style={styles.emptyStateTitle}>No Preferences Found</Text>
                <Text style={styles.emptyStateMessage}>
                  You need to set up your preferences before enabling reminders
                </Text>
                <TouchableOpacity 
                  style={styles.setupButton}
                  onPress={() => navigation.navigate('Preferences')}
                >
                  <Text style={styles.setupButtonText}>Go to Preferences</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Medication Reminders Card */}
            <View style={[
              styles.card, 
              hasAnyPreferences ? null : styles.disabledCard,
              medicationEnabled ? styles.activeCard : null
            ]}>
              <View style={styles.headerRow}>
                <View style={styles.titleContainer}>
                  <Ionicons name="medkit" size={24} color={medicationEnabled ? "#4A6FE5" : "#888"} style={styles.icon} />
                  <Text style={[styles.title, medicationEnabled ? null : styles.disabledText]}>Medication Reminders</Text>
                </View>
                
                <Switch
                  value={medicationEnabled}
                  onValueChange={toggleMedicationReminders}
                  trackColor={{ false: theme.divider, true: theme.primary + '80' }} // 80 is for 50% opacity
                  thumbColor={medicationEnabled ? '#4A6FE5' : '#f4f3f4'}
                  disabled={!hasAnyPreferences}
                  ios_backgroundColor="#DFDFDF"
                />
              </View>
              
              <Text style={[styles.description, medicationEnabled ? null : styles.disabledText]}>
                Set up automatic reminders for medications based on your meal times
              </Text>
              
              {!hasAnyPreferences && (
                <View style={styles.warningContainer}>
                  <Ionicons name="warning-outline" size={16} color="#E07C24" />
                  <Text style={styles.warningText}>
                    Please set your meal times in preferences first
                  </Text>
                </View>
              )}
              
              <TouchableOpacity 
                style={[
                  styles.detailsToggle,
                  medicationEnabled ? styles.activeDetailsToggle : null
                ]}
                onPress={() => toggleDetails('medication')}
              >
                <Text style={[styles.detailsToggleText, medicationEnabled ? styles.activeToggleText : null]}>
                  {showMedicationDetails ? 'Hide Details' : 'Show Details'}
                </Text>
                <Ionicons 
                  name={showMedicationDetails ? 'chevron-up-outline' : 'chevron-down-outline'} 
                  size={20} 
                  color={medicationEnabled ? "#4A6FE5" : "#888"} 
                />
              </TouchableOpacity>
              
              {showMedicationDetails && (
                <View style={styles.detailsContainer}>
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionTitleRow}>
                      <Ionicons name="time-outline" size={18} color="#4A6FE5" style={{marginRight: 8}} />
                      <Text style={styles.sectionTitle}>Meal Times</Text>
                    </View>
                    
                    <View style={styles.mealRow}>
                      <Text style={styles.mealLabel}>Breakfast:</Text>
                      <Text style={styles.mealTime}>
                        {mealPrefs.breakfastTime ? formatTimeString(mealPrefs.breakfastTime) : 'Not set'}
                      </Text>
                    </View>
                    
                    <View style={styles.mealRow}>
                      <Text style={styles.mealLabel}>Lunch:</Text>
                      <Text style={styles.mealTime}>
                        {mealPrefs.lunchTime ? formatTimeString(mealPrefs.lunchTime) : 'Not set'}
                      </Text>
                    </View>
                    
                    <View style={styles.mealRow}>
                      <Text style={styles.mealLabel}>Dinner:</Text>
                      <Text style={styles.mealTime}>
                        {mealPrefs.dinnerTime ? formatTimeString(mealPrefs.dinnerTime) : 'Not set'}
                      </Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => navigateToPreferences('mealPreferences')}
                  >
                    <Ionicons name="settings-outline" size={18} color="#FFF" style={{marginRight: 8}} />
                    <Text style={styles.editButtonText}>View and edit Medication Preferences</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Sleep Reminders Card */}
            <View style={[
              styles.card, 
              hasAnyPreferences ? { marginTop: 20 } : { marginTop: 20, ...styles.disabledCard },
              sleepEnabled ? styles.activeCard : null
            ]}>
              <View style={styles.headerRow}>
                <View style={styles.titleContainer}>
                  <Ionicons name="moon" size={24} color={sleepEnabled ? "#4A6FE5" : "#888"} style={styles.icon} />
                  <Text style={[styles.title, sleepEnabled ? null : styles.disabledText]}>Sleep Reminders</Text>
                </View>
                
                <Switch
                  value={sleepEnabled}
                  onValueChange={toggleSleepReminders}
                  trackColor={{ false: theme.divider, true: theme.primary + '80' }} 
                  thumbColor={sleepEnabled ? '#4A6FE5' : '#f4f3f4'}
                  disabled={!hasAnyPreferences}
                  ios_backgroundColor="#DFDFDF"
                />
              </View>
              
              <Text style={[styles.description, sleepEnabled ? null : styles.disabledText]}>
                Get reminders for bedtime and wake-up time for better sleep habits
              </Text>
              
              {!hasAnyPreferences && (
                <View style={styles.warningContainer}>
                  <Ionicons name="warning-outline" size={16} color="#E07C24" />
                  <Text style={styles.warningText}>
                    Please set your sleep schedule in preferences first
                  </Text>
                </View>
              )}
              
              <TouchableOpacity 
                style={[
                  styles.detailsToggle,
                  sleepEnabled ? styles.activeDetailsToggle : null
                ]}
                onPress={() => toggleDetails('sleep')}
              >
                <Text style={[styles.detailsToggleText, sleepEnabled ? styles.activeToggleText : null]}>
                  {showSleepDetails ? 'Hide Details' : 'Show Details'}
                </Text>
                <Ionicons 
                  name={showSleepDetails ? 'chevron-up-outline' : 'chevron-down-outline'} 
                  size={20} 
                  color={sleepEnabled ? "#4A6FE5" : "#888"} 
                />
              </TouchableOpacity>
              
              {showSleepDetails && (
                <View style={styles.detailsContainer}>
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionTitleRow}>
                      <Ionicons name="bed-outline" size={18} color="#4A6FE5" style={{marginRight: 8}} />
                      <Text style={styles.sectionTitle}>Sleep Schedule</Text>
                    </View>
                    
                    <View style={styles.mealRow}>
                      <Text style={styles.mealLabel}>Bedtime:</Text>
                      <Text style={styles.mealTime}>
                        {sleepPrefs.bedTime ? formatTimeString(sleepPrefs.bedTime) : 'Not set'}
                      </Text>
                    </View>
                    
                    <View style={styles.mealRow}>
                      <Text style={styles.mealLabel}>Wake-up time:</Text>
                      <Text style={styles.mealTime}>
                        {sleepPrefs.wakeTime ? formatTimeString(sleepPrefs.wakeTime) : 'Not set'}
                      </Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => navigateToPreferences('sleepPreferences')}
                  >
                    <Ionicons name="settings-outline" size={18} color="#FFF" style={{marginRight: 8}} />
                    <Text style={styles.editButtonText}>View and edit Sleep Preferences</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Water Reminders Card */}
<View style={[
  styles.card, 
  { marginTop: 20 },
  waterEnabled ? styles.activeCard : null
]}>
  <View style={styles.headerRow}>
    <View style={styles.titleContainer}>
      <Ionicons name="water" size={24} color={waterEnabled ? "#4A6FE5" : "#888"} style={styles.icon} />
      <Text style={[styles.title, waterEnabled ? null : styles.disabledText]}>Water Reminders</Text>
    </View>
    
    <Switch
      value={waterEnabled}
      onValueChange={toggleWaterReminders}
      trackColor={{ false: theme.divider, true: theme.primary + '80' }} 
      thumbColor={waterEnabled ? '#4A6FE5' : '#f4f3f4'}
      ios_backgroundColor="#DFDFDF"
    />
  </View>
  
  <Text style={[styles.description, waterEnabled ? null : styles.disabledText]}>
    Get reminders every 2 hours to stay hydrated throughout the day
  </Text>
  
  <TouchableOpacity 
    style={[
      styles.detailsToggle,
      waterEnabled ? styles.activeDetailsToggle : null
    ]}
    onPress={() => toggleDetails('water')}
  >
    <Text style={[styles.detailsToggleText, waterEnabled ? styles.activeToggleText : null]}>
      {showWaterDetails ? 'Hide Details' : 'Show Details'}
    </Text>
    <Ionicons 
      name={showWaterDetails ? 'chevron-up-outline' : 'chevron-down-outline'} 
      size={20} 
      color={waterEnabled ? "#4A6FE5" : "#888"} 
    />
  </TouchableOpacity>
  
  {showWaterDetails && (
    <View style={styles.detailsContainer}>
      <View style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="water-outline" size={18} color="#4A6FE5" style={{marginRight: 8}} />
          <Text style={styles.sectionTitle}>Hydration Schedule</Text>
        </View>
        
        <View style={styles.mealRow}>
          <Text style={styles.mealLabel}>Start time:</Text>
          <Text style={styles.mealTime}>8:00 AM</Text>
        </View>
        
        <View style={styles.mealRow}>
          <Text style={styles.mealLabel}>Frequency:</Text>
          <Text style={styles.mealTime}>Every 2 hours</Text>
        </View>
        
        <View style={styles.mealRow}>
          <Text style={styles.mealLabel}>Total reminders:</Text>
          <Text style={styles.mealTime}>8 per day</Text>
        </View>
      </View>
      
      <Text style={{padding: 10, color: theme.subText, fontSize: 13, fontStyle: 'italic'}}>
        Water reminders will automatically repeat every day
      </Text>
    </View>
  )}
</View>
            
            {/* Add Custom Reminder Button */}
            <TouchableOpacity 
            style={styles.addReminderButton}
            onPress={navigateToCustomReminder}
             >
             <Ionicons name="add-circle-outline" size={24} color="#4A6FE5" />
            <Text style={styles.addReminderText}>Add Custom Reminder</Text>
            </TouchableOpacity>

            {/* Render this outside of the button */}
            <CustomReminder
             visible={modalVisible}
             onClose={() => setModalVisible(false)}
             onSave={addReminder}
             />

          </Animated.View>
        </ScrollView>
      ) : (
        <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
          {/* Active Reminders List */}
          {renderActiveReminders()}
        </Animated.View>
      )}
    </View>
  );
};


export default HealthRemindersScreen;