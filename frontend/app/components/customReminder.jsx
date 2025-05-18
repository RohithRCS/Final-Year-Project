import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ScrollView,
  Platform,
  Alert
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useTheme } from './ThemeContext';

const CustomReminder = ({ visible, onClose, onSave }) => {
  // State variables
  const [title, setTitle] = useState('');
  const { theme } = useTheme();
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [repeats, setRepeats] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Reset form when modal is closed
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate(new Date());
    setTime(new Date());
    setRepeats(false);
    setShowDatePicker(false);
    setShowTimePicker(false);
  };

  // Handle date changes
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  // Handle time changes
  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (time) => {
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get time string in "HH:MM" format for storage
  const getTimeString = (dateObj) => {
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Schedule a notification for the reminder
  const scheduleNotification = async () => {
    try {
      // Combine date and time into a single Date object
      const scheduledTime = new Date(date);
      scheduledTime.setHours(time.getHours(), time.getMinutes(), 0);

      // Check if time is in the past
      const now = new Date();
      if (scheduledTime < now && !repeats) {
        Alert.alert('Invalid Time', 'Please select a future time for your reminder.');
        return null;
      }

      // Content for the notification
      const notificationContent = {
        title: title || 'Reminder',
        body: description || 'It\'s time for your reminder!',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      };

      // Trigger configuration based on repeat preference
      let trigger;
      
      if (repeats) {
        // Daily repeating notification at specific time
        trigger = {
          hour: scheduledTime.getHours(),
          minute: scheduledTime.getMinutes(),
          repeats: true,
        };
      } else {
        // One-time notification at specific date and time
        trigger = scheduledTime;
      }

      // Schedule the notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger,
      });

      return {
        id: `custom-${Date.now()}`,
        notificationId,
        title: title || 'Reminder',
        description,
        time: getTimeString(time),
        date: scheduledTime.toISOString(),
        repeats,
        isCustomReminder: true,
      };
    } catch (error) {
      console.error('Error scheduling notification:', error);
      Alert.alert('Error', 'Failed to schedule notification. Please try again.');
      return null;
    }
  };

  // Save the reminder
  const saveReminder = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Validate input
      if (!title.trim()) {
        Alert.alert('Missing Title', 'Please enter a title for your reminder.');
        return;
      }

      // Schedule the notification
      const reminderData = await scheduleNotification();
      if (!reminderData) return;

      // Save to AsyncStorage
      const existingRemindersJSON = await AsyncStorage.getItem('reminders');
      const existingReminders = existingRemindersJSON ? JSON.parse(existingRemindersJSON) : [];
      
      const updatedReminders = [...existingReminders, reminderData];
      await AsyncStorage.setItem('reminders', JSON.stringify(updatedReminders));

      // Pass the reminder to parent component if needed
      if (onSave) {
        onSave(reminderData);
      }

      // Reset form and close modal
      resetForm();
      onClose();
      
      Alert.alert('Success', 'Your reminder has been set successfully!');
    } catch (error) {
      console.error('Error saving reminder:', error);
      Alert.alert('Error', 'Failed to save reminder. Please try again.');
    }
  };

  // Close modal handler
  const handleClose = () => {
    resetForm();
    onClose();
  };

  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: theme.isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: theme.cardBackground,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 16,
      paddingBottom: Platform.OS === 'ios' ? 34 : 16,
      maxHeight: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
    },
    formContainer: {
      maxHeight: '70%',
      paddingVertical: 16,
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.text,
      marginTop: 16,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.divider,
      borderRadius: 10,
      padding: 12,
      fontSize: 16,
      backgroundColor: theme.cardBackground,
      color: theme.text,
    },
    textArea: {
      height: 100,
      textAlignVertical: 'top',
      backgroundColor:theme.cardBackground,
    },
    dateTimePicker: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.divider,
      borderRadius: 10,
      padding: 12,
      backgroundColor: theme.cardBackground,
    },
    dateTimeText: {
      fontSize: 16,
      color: theme.text,
    },
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 24,
      marginBottom: 16,
    },
    toggleText: {
      fontSize: 16,
      color: theme.text,
    },
    helperText: {
      fontSize: 12,
      color: theme.subText,
      marginTop: 2,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: theme.divider,
      paddingTop: 16,
      marginTop: 8,
    },
    saveButton: {
      backgroundColor: theme.primary,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 20,
      flex: 1,
      marginLeft: 10,
      alignItems: 'center',
    },
    saveButtonText: {
      color: theme.cardBackground,
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButton: {
      borderWidth: 1,
      borderColor: theme.divider,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 20,
      flex: 1,
      marginRight: 10,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Custom Reminder</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons 
                name="close-outline" 
                size={24} 
                color={theme.text} 
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            {/* Title Input */}
            <Text style={styles.label}>Title*</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter reminder title"
              placeholderTextColor={theme.subText}
              value={title}
              onChangeText={setTitle}
              maxLength={50}
            />

            {/* Description Input */}
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter reminder description (optional)"
              placeholderTextColor={theme.subText}
              value={description}
              onChangeText={setDescription}
              multiline={true}
              maxLength={200}
            />

            {/* Date Picker */}
            {!repeats && (
              <>
  
                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    minimumDate={new Date()}
                    themeVariant={theme.isDarkMode ? 'dark' : 'light'}
                  />
                )}
              </>
            )}

            {/* Time Picker */}
            <Text style={styles.label}>Time</Text>
            <TouchableOpacity
              style={styles.dateTimePicker}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.dateTimeText}>{formatTime(time)}</Text>
              <Ionicons 
                name="time-outline" 
                size={20} 
                color={theme.primary} 
              />
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
                themeVariant={theme.isDarkMode ? 'dark' : 'light'}
              />
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={saveReminder}>
              <Text style={styles.saveButtonText}>Save Reminder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CustomReminder;