import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch, 
  TextInput, 
  Platform 
} from 'react-native';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext'; // Import the useTheme hook
import { ActivityIndicator, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

// Helper function to convert HH:MM string to Date object
const timeStringToDate = (timeString) => {
  if (!timeString) return new Date();
  
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);
  return date;
};

// Helper function to format Date as HH:MM string
const formatTimeString = (date) => {
  if (!date) return '';
  
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Component to view user preferences
export const ViewPreferences = ({ navigation }) => {
  const { getPreferences, savePreferences, updatePreferenceById } = useAuth();
  const { theme } = useTheme(); // Get the current theme
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const response = await getPreferences();
      if (response.success) {
        setPreferences(response.data);
        setError(null);
      } else {
        setError(response.error || 'Failed to load preferences');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveComplete = () => {
    setIsEditing(false);
    fetchPreferences();
  };

  const handleEditPress = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  if (loading) {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading preferences...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.primary }]}>{error}</Text>
        <Button 
          mode="contained" 
          onPress={fetchPreferences} 
          style={styles.retryButton}
          color={theme.primary}
        >
          Retry
        </Button>
      </View>
    );
  }

  if (!preferences && !isEditing) {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.messageText, { color: theme.text }]}>No preferences found</Text>
        <Button 
          mode="contained" 
          onPress={() => setIsEditing(true)}
          style={styles.button}
          color={theme.primary}
        >
          Set Up Preferences
        </Button>
      </View>
    );
  }

  // If in editing mode, render the UpdatePreferences component directly
  if (isEditing) {
    return (
      <UpdatePreferences 
        existingPreferences={preferences} 
        onSaveComplete={handleSaveComplete}
        onCancel={handleCancelEdit}
      />
    );
  }

  // Otherwise show the view mode
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Your Preferences</Text>
          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: theme.cardBackground }]}
            onPress={handleEditPress}
          >
            <Icon name="pencil" size={20} color={theme.primary} />
            <Text style={[styles.editButtonText, { color: theme.primary }]}>Edit</Text>
          </TouchableOpacity>
        </View>

        <PreferenceSection 
          title="Medication Preferences"
          data={[
            { label: 'Before Meal Medication Time', value: `${preferences.mealPreferences?.beforeMealMedicationTime || 30} min` },
            { label: 'After Meal Medication Time', value: `${preferences.mealPreferences?.afterMealMedicationTime || 30} min` },
            { label: 'Breakfast Time', value: preferences.mealPreferences?.breakfastTime || '08:00' },
            { label: 'Lunch Time', value: preferences.mealPreferences?.lunchTime || '12:30' },
            { label: 'Dinner Time', value: preferences.mealPreferences?.dinnerTime || '18:00' }
          ]}
          theme={theme}
        />

        <PreferenceSection 
          title="Sleep Preferences"
          data={[
            { label: 'Bed Time', value: preferences.sleepPreferences?.bedTime || '21:00' },
            { label: 'Wake Time', value: preferences.sleepPreferences?.wakeTime || '07:00' },
          ]}
          theme={theme}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

// Time picker component
const TimePickerField = ({ label, value, onChange, theme }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [time, setTime] = useState(timeStringToDate(value));

  const handleTimeChange = (event, selectedTime) => {
    if (selectedTime === undefined) {
      setShowPicker(Platform.OS === 'ios');
      return;
    }
    
    setShowPicker(Platform.OS === 'ios');
    setTime(selectedTime);
    onChange(formatTimeString(selectedTime));
  };

  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      
      <TouchableOpacity 
        style={[styles.timePickerButton, { 
          backgroundColor: theme.cardBackground,
          borderColor: theme.divider 
        }]}
        onPress={() => setShowPicker(true)}
      >
        <Text style={[styles.timePickerButtonText, { color: theme.text }]}>
          {value || 'Select Time'}
        </Text>
        <Icon name="clock-outline" size={20} color={theme.primary} />
      </TouchableOpacity>
      
      {showPicker && (
        <DateTimePicker
          value={time}
          mode="time"
          is12Hour={true}
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
};

// Component to update user preferences
const UpdatePreferences = ({ existingPreferences, onSaveComplete, onCancel }) => {
  const { savePreferences, updatePreferenceById } = useAuth();
  const { theme } = useTheme(); // Get the current theme
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Initialize preferences with existingPreferences or default values
  const initialPreferences = existingPreferences || {
    theme: 'light',
    fontSize: 'medium',
    mealPreferences: {
      beforeMealMedicationTime: 30,
      afterMealMedicationTime: 30,
      breakfastTime: '08:00',
      lunchTime: '12:30',
      dinnerTime: '18:00',
    },
    exercisePreferences: {
      preferredExerciseTime: 'morning',
      exerciseDuration: 15,
      exerciseIntensity: 'light'
    },
    sleepPreferences: {
      bedTime: '21:00',
      wakeTime: '07:00',
      napTime: true
    },
  };

  const [preferences, setPreferences] = useState(initialPreferences);
  const [activeSection, setActiveSection] = useState('mealPreferences');
  const isUpdate = existingPreferences?._id;

  // Helper function to update preferences
  const updatePreference = (section, field, value) => {
    setPreferences(prev => {
      if (section) {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value
          }
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
  };
  
  // Save preferences to server
  const handleSavePreferences = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      
      if (isUpdate) {
        response = await updatePreferenceById(preferences._id, preferences);
      } else {
        response = await savePreferences(preferences);
      }
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          if (onSaveComplete) {
            onSaveComplete();
          }
        }, 1500);
      } else {
        setError(response.error || 'Failed to save preferences');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.text }]}>
          {isUpdate ? 'Update' : 'Set Up'} Your Preferences
        </Text>
        
        {/* Navigation tabs for different sections */}
        <View style={[styles.tabs, { backgroundColor: theme.divider }]}>
          <TouchableOpacity
            style={[
              styles.tab, 
              activeSection === 'mealPreferences' && [
                styles.activeTab, 
                { backgroundColor: theme.cardBackground }
              ]
            ]}
            onPress={() => setActiveSection('mealPreferences')}
          >
            <Text style={[
              activeSection === 'mealPreferences' ? styles.activeTabText : styles.tabText,
              { 
                color: activeSection === 'mealPreferences' ? theme.primary : theme.subText 
              }
            ]}>
              Medications
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab, 
              activeSection === 'sleepPreferences' && [
                styles.activeTab, 
                { backgroundColor: theme.cardBackground }
              ]
            ]}
            onPress={() => setActiveSection('sleepPreferences')}
          >
            <Text style={[
              activeSection === 'sleepPreferences' ? styles.activeTabText : styles.tabText,
              { 
                color: activeSection === 'sleepPreferences' ? theme.primary : theme.subText 
              }
            ]}>
              Sleep
            </Text>
          </TouchableOpacity>
        </View>

        {/* Meal Preferences Section */}
        {activeSection === 'mealPreferences' && (
          <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Medication Preferences</Text>

            <TimePickerField
              label="Breakfast Time"
              value={preferences.mealPreferences?.breakfastTime}
              onChange={(value) => updatePreference('mealPreferences', 'breakfastTime', value)}
              theme={theme}
            />
            
            <TimePickerField
              label="Lunch Time"
              value={preferences.mealPreferences?.lunchTime}
              onChange={(value) => updatePreference('mealPreferences', 'lunchTime', value)}
              theme={theme}
            />
            
            <TimePickerField
              label="Dinner Time"
              value={preferences.mealPreferences?.dinnerTime}
              onChange={(value) => updatePreference('mealPreferences', 'dinnerTime', value)}
              theme={theme}
            />
          </View>
        )}

        {/* Sleep Preferences Section */}
        {activeSection === 'sleepPreferences' && (
          <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Sleep Preferences</Text>
            
            <TimePickerField
              label="Bed Time"
              value={preferences.sleepPreferences?.bedTime}
              onChange={(value) => updatePreference('sleepPreferences', 'bedTime', value)}
              theme={theme}
            />
            
            <TimePickerField
              label="Wake Time"
              value={preferences.sleepPreferences?.wakeTime}
              onChange={(value) => updatePreference('sleepPreferences', 'wakeTime', value)}
              theme={theme}
            />
          </View>
        )}

        {error && <Text style={[styles.errorText, { color: theme.primary }]}>{error}</Text>}
        {success && <Text style={[styles.successText, { color: theme.primary }]}>
          Preferences saved successfully!
        </Text>}
        
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={onCancel}
            style={styles.cancelButton}
            labelStyle={styles.cancelButtonLabel} 
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSavePreferences}
            style={styles.saveButton}
            loading={loading}
            labelStyle={styles.saveButtonLabel}
            disabled={loading}
            buttonColor='#4285F4'
          >
            Save Preferences
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper component for displaying preference sections in view mode
const PreferenceSection = ({ title, data, theme }) => {
  return (
    <View style={[styles.preferencesSection, { backgroundColor: theme.cardBackground }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {data.map((item, index) => (
        <View key={index} style={[
          styles.preferenceItem, 
          index !== data.length  && { borderBottomColor: theme.divider }
        ]}>
          <Text style={[styles.preferenceLabel, { color: theme.subText }]}>{item.label}</Text>
          <Text style={[styles.preferenceValue, { color: theme.text }]}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
};

// Helper functions
const formatArrayValue = (array) => {
  if (!array || array.length === 0) return 'None';
  return array.join(', ');
};

const formatEnumValue = (value) => {
  if (!value) return '';
  return value
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  
  // Section styles
  section: {
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  preferencesSection: {
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  
  // Tab navigation styles
  tabs: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontWeight: '500',
    fontSize: 13,
  },
  activeTabText: {
    fontWeight: '600',
    fontSize: 13,
  },
  
  // Form input styles
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  
  // Time picker styles
  timePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  timePickerButtonText: {
    fontSize: 16,
  },
  
  // Button styles
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  saveButton: {
     borderColor: '#4285F4',
  borderWidth: 1,
  borderRadius: 20,
    flex: 1,
    marginLeft: 8,
  },
  saveButtonLabel: {
  color: '#FFFFFF',
  fontWeight: 'bold',
},
  cancelButton: {
    borderColor: '#4285F4',
  borderWidth: 1,
  borderRadius: 20,
    flex: 1,
    marginRight: 8,
  },
  cancelButtonLabel: {
  color: '#4285F4',
},

  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editButtonText: {
    marginLeft: 4,
    fontWeight: '500',
  },
  
  // Item styles for preference display
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  preferenceLabel: {
    flex: 1,
    fontSize: 15,
  },
  preferenceValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'right',
  },
  
  // Status text styles
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default ViewPreferences;