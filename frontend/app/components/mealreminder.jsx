import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './AuthContext'; // Adjust path as needed
import { MedicationReminderService } from './reminderService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MealMedicationReminders = () => {
  const { currentUser, getPreferences } = useAuth();
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState(null);
  const [medicationEnabled, setMedicationEnabled] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  // Fetch user preferences on component mount
  useEffect(() => {
    fetchUserPreferences();
    checkExistingMedicationReminders();
  }, []);
  
  // Fetch user preferences from API
  const fetchUserPreferences = async () => {
    try {
      setLoading(true);
      
      const result = await getPreferences();
      if (result.success) {
        setPreferences(result.data);
        
        // Check if meal times are configured
        const hasMealTimes = checkMealTimesConfigured(result.data);
        if (!hasMealTimes) {
          Alert.alert(
            'Meal Times Not Configured',
            'Please set your meal times in preferences to enable medication reminders.'
          );
        }
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
  
  // Check if meal times are configured
  const checkMealTimesConfigured = (prefs) => {
    if (!prefs || !prefs.mealPreferences) {
      return false;
    }
    
    const { mealPreferences } = prefs;
    return Boolean(
      mealPreferences.breakfastTime || 
      mealPreferences.lunchTime || 
      mealPreferences.dinnerTime
    );
  };
  
  // Check if medication reminders already exist
  const checkExistingMedicationReminders = async () => {
    try {
      const remindersJSON = await AsyncStorage.getItem('reminders');
      if (remindersJSON) {
        const reminders = JSON.parse(remindersJSON);
        const hasMedicationReminders = reminders.some(r => r.isMedicationReminder);
        setMedicationEnabled(hasMedicationReminders);
      }
    } catch (error) {
      console.error('Error checking existing reminders:', error);
    }
  };
  
  // Toggle medication reminders
  const toggleMedicationReminders = async (value) => {
    try {
      if (value) {
        // Create medication reminders
        if (!preferences || !preferences.mealPreferences) {
          Alert.alert(
            'Missing Meal Preferences', 
            'Please configure your meal preferences first'
          );
          return;
        }
        
        setLoading(true);
        const result = await MedicationReminderService.createMealBasedReminders(preferences);
        
        if (result.success) {
          setMedicationEnabled(true);
          Alert.alert('Success', 'Medication reminders have been set based on your meal times');
        } else {
          Alert.alert('Error', result.error || 'Failed to set reminders');
        }
      } else {
        // Cancel medication reminders
        setLoading(true);
        const result = await MedicationReminderService.cancelMedicationReminders();
        
        if (result.success) {
          setMedicationEnabled(false);
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
      return timeString; // Return original if format fails
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A6FE5" />
        <Text style={styles.loadingText}>Setting up your reminders...</Text>
      </View>
    );
  }
  
  // Get meal preferences or empty object if not available
  const mealPrefs = preferences?.mealPreferences || {};
  
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Ionicons name="medkit" size={24} color="#4A6FE5" style={styles.icon} />
            <Text style={styles.title}>Medication Reminders</Text>
          </View>
          <Switch
            value={medicationEnabled}
            onValueChange={toggleMedicationReminders}
            trackColor={{ false: '#DFDFDF', true: '#B8C5F5' }}
            thumbColor={medicationEnabled ? '#4A6FE5' : '#f4f3f4'}
          />
        </View>
        
        <Text style={styles.description}>
          Set up automatic reminders for medications based on your meal times
        </Text>
        
        <TouchableOpacity 
          style={styles.detailsToggle}
          onPress={() => setShowDetails(!showDetails)}
        >
          <Text style={styles.detailsToggleText}>
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Text>
          <Ionicons 
            name={showDetails ? 'chevron-up-outline' : 'chevron-down-outline'} 
            size={20} 
            color="#4A6FE5" 
          />
        </TouchableOpacity>
        
        {showDetails && (
          <ScrollView style={styles.detailsContainer}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Meal Times</Text>
              
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
            
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Medication Timing</Text>
              
              <View style={styles.mealRow}>
                <Text style={styles.mealLabel}>Before meal:</Text>
                <Text style={styles.mealTime}>
                  {mealPrefs.beforeMealMedicationTime ? `${mealPrefs.beforeMealMedicationTime} minutes before` : '30 minutes before'}
                </Text>
              </View>
              
              <View style={styles.mealRow}>
                <Text style={styles.mealLabel}>After meal:</Text>
                <Text style={styles.mealTime}>
                  {mealPrefs.afterMealMedicationTime ? `${mealPrefs.afterMealMedicationTime} minutes after` : '30 minutes after'}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => {
                // Navigate to preferences screen
                // navigation.navigate('Preferences', { section: 'mealPreferences' });
                Alert.alert(
                  'Edit Preferences',
                  'This would navigate to the preferences screen to edit meal times.'
                );
              }}
            >
              <Text style={styles.editButtonText}>Edit Meal Preferences</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f7f8fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f8fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
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
  },
  icon: {
    marginRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detailsToggleText: {
    fontSize: 14,
    color: '#4A6FE5',
    marginRight: 5,
  },
  detailsContainer: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
    maxHeight: 350,
  },
  sectionCard: {
    backgroundColor: '#f5f7fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 10,
  },
  mealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  mealLabel: {
    fontSize: 14,
    color: '#555',
  },
  mealTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  editButton: {
    backgroundColor: '#4A6FE5',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 5,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MealMedicationReminders;