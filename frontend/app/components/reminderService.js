// reminderService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export const WaterReminderService = {
  /**
   * Schedule water reminders for a single day (non-repeating)
   * @param {string} wakeTimeStr - Wake-up time in "HH:MM" (24-hour format)
   * @returns {Promise<Object>} - Result of the operation
   */
  async scheduleStaticWaterReminders(wakeTimeStr = "08:00") {
    try {
      // Cancel any existing water reminders first
      await this.cancelWaterReminders();

      const [hours, minutes] = wakeTimeStr.split(':').map(Number);
      const reminders = [];
      const waterRemindersCount = 8; // 8 reminders every 2 hours from wake time

      for (let i = 0; i < waterRemindersCount; i++) {
        const now = new Date();
        const reminderTime = new Date();
        reminderTime.setHours(hours + i * 2, minutes, 0, 0);

        // If reminder time has already passed, skip it
        if (reminderTime <= now) continue;

        const title = 'Water Reminder';
        const body = 'Time to drink water! Stay hydrated for better health.';
        const reminderId = `water-reminder-${i}-${Date.now()}`;

        const trigger = reminderTime;

        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            data: { reminderId },
          },
          trigger,
        });

        console.log(`Scheduled water reminder #${i + 1} for: ${reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);

        reminders.push({
          id: reminderId,
          notificationId,
          title,
          description: body,
          time: `${reminderTime.getHours()}:${reminderTime.getMinutes().toString().padStart(2, '0')}`,
          date: reminderTime.toISOString(),
          repeats: false,
          isWaterReminder: true,
        });
      }

      // Save to AsyncStorage
      const existingRemindersJSON = await AsyncStorage.getItem('reminders');
      let existingReminders = existingRemindersJSON ? JSON.parse(existingRemindersJSON) : [];

      existingReminders = existingReminders.filter(r => !r.isWaterReminder);

      const updatedReminders = [...existingReminders, ...reminders];
      await AsyncStorage.setItem('reminders', JSON.stringify(updatedReminders));
      await AsyncStorage.setItem('lastWaterReminderSetup', new Date().toISOString());

      return { success: true, reminders };
    } catch (error) {
      console.error('Error scheduling water reminders:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Cancel all water reminders
   */
  async cancelWaterReminders() {
    try {
      const existingRemindersJSON = await AsyncStorage.getItem('reminders');
      if (!existingRemindersJSON) return { success: true, message: 'No reminders to cancel' };

      const existingReminders = JSON.parse(existingRemindersJSON);

      for (const reminder of existingReminders.filter(r => r.isWaterReminder)) {
        if (reminder.notificationId) {
          try {
            await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
          } catch (e) {
            console.log('Error canceling notification, may have already been removed:', e);
          }
        }
      }

      const updatedReminders = existingReminders.filter(r => !r.isWaterReminder);
      await AsyncStorage.setItem('reminders', JSON.stringify(updatedReminders));

      return { success: true };
    } catch (error) {
      console.error('Error canceling water reminders:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get all scheduled water reminders
   */
  async getWaterReminders() {
    try {
      const existingRemindersJSON = await AsyncStorage.getItem('reminders');
      if (!existingRemindersJSON) return [];

      const existingReminders = JSON.parse(existingRemindersJSON);
      return existingReminders.filter(r => r.isWaterReminder);
    } catch (error) {
      console.error('Error getting water reminders:', error);
      return [];
    }
  }
};


export class ReminderService {
  // Helper method to create a Date object from time string
  static createDateFromTimeString(timeStr, offsetMinutes = 0) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    // Create a Date object for the scheduled time
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    // Apply offset if provided
    if (offsetMinutes !== 0) {
      scheduledTime.setMinutes(scheduledTime.getMinutes() + offsetMinutes);
    }
    
    // Check if time is in the past, if so schedule for tomorrow
    const now = new Date();
    if (scheduledTime < now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    return scheduledTime;
  }

  static async createMealBasedReminders(preferences) {
    try {
      if (!preferences || !preferences.mealPreferences) {
        return { success: false, error: 'No meal preferences found' };
      }

      const { mealPreferences } = preferences;
      const reminders = [];

      // Process meal times for before and after medication reminders
      const mealTimes = [
        { name: 'breakfast', time: mealPreferences.breakfastTime },
        { name: 'lunch', time: mealPreferences.lunchTime },
        { name: 'dinner', time: mealPreferences.dinnerTime }
      ];

      // Get before/after meal medication times (minutes)
      const beforeMealTime = mealPreferences.beforeMealMedicationTime || 30;
      const afterMealTime = mealPreferences.afterMealMedicationTime || 30;

      for (const meal of mealTimes) {
        if (meal.time) {
          // Create before meal reminder
          const beforeMealReminder = await this.scheduleMedicationReminder(
            meal.name,
            meal.time,
            -beforeMealTime,
            'before'
          );
          if (beforeMealReminder) reminders.push(beforeMealReminder);

          // Create after meal reminder
          const afterMealReminder = await this.scheduleMedicationReminder(
            meal.name,
            meal.time,
            afterMealTime,
            'after'
          );
          if (afterMealReminder) reminders.push(afterMealReminder);
        }
      }

      // Save to AsyncStorage
      const existingRemindersJSON = await AsyncStorage.getItem('reminders');
      let existingReminders = existingRemindersJSON ? JSON.parse(existingRemindersJSON) : [];
      
      // Filter out previous medication reminders if they exist
      existingReminders = existingReminders.filter(r => !r.isMedicationReminder);
      
      // Add new medication reminders
      const updatedReminders = [...existingReminders, ...reminders];
      await AsyncStorage.setItem('reminders', JSON.stringify(updatedReminders));
      
      return { success: true, reminders };
    } catch (error) {
      console.error('Error creating meal-based reminders:', error);
      return { success: false, error: error.message };
    }
  }

  static async createSleepReminders(preferences) {
    try {
      if (!preferences || !preferences.sleepPreferences) {
        return { success: false, error: 'No sleep preferences found' };
      }

      const { sleepPreferences } = preferences;
      const reminders = [];

      // Process bedtime reminder (30 minutes before)
      if (sleepPreferences.bedTime) {
        const bedtimeReminder = await this.scheduleSleepReminder(
          'bedtime',
          sleepPreferences.bedTime,
          -30 // 30 minutes before bedtime
        );
        if (bedtimeReminder) reminders.push(bedtimeReminder);
      }

      // Process wake time reminder
      if (sleepPreferences.wakeTime) {
        const wakeTimeReminder = await this.scheduleSleepReminder(
          'wake-up',
          sleepPreferences.wakeTime,
          0
        );
        if (wakeTimeReminder) reminders.push(wakeTimeReminder);
      }

      // Save to AsyncStorage
      const existingRemindersJSON = await AsyncStorage.getItem('reminders');
      let existingReminders = existingRemindersJSON ? JSON.parse(existingRemindersJSON) : [];
      
      // Filter out previous sleep reminders if they exist
      existingReminders = existingReminders.filter(r => !r.isSleepReminder);
      
      // Add new sleep reminders
      const updatedReminders = [...existingReminders, ...reminders];
      await AsyncStorage.setItem('reminders', JSON.stringify(updatedReminders));
      
      return { success: true, reminders };
    } catch (error) {
      console.error('Error creating sleep reminders:', error);
      return { success: false, error: error.message };
    }
  }

  static async scheduleAllReminders(preferences) {
    try {
      // Create reminders for all categories
      const mealResults = await this.createMealBasedReminders(preferences);
      const sleepResults = await this.createSleepReminders(preferences);
      const exerciseResults = await this.createExerciseReminders(preferences);

      // Check if all succeeded
      const allSucceeded = mealResults.success && sleepResults.success && exerciseResults.success;
      
      // Save last updated timestamp for checking future updates
      if (allSucceeded) {
        await AsyncStorage.setItem('lastPreferencesUpdate', new Date().toISOString());
      }
      
      return { 
        success: allSucceeded,
        results: {
          meals: mealResults,
          sleep: sleepResults,
          exercise: exerciseResults
        }
      };
    } catch (error) {
      console.error('Error scheduling all reminders:', error);
      return { success: false, error: error.message };
    }
  }

  static async cancelReminders(type = 'all') {
    try {
      const existingRemindersJSON = await AsyncStorage.getItem('reminders');
      if (!existingRemindersJSON) return { success: true, message: 'No reminders to cancel' };
      
      const existingReminders = JSON.parse(existingRemindersJSON);
      let updatedReminders = [...existingReminders];
      
      switch (type) {
        case 'medication':
          for (const reminder of existingReminders.filter(r => r.isMedicationReminder)) {
            if (reminder.notificationId) {
              await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
            }
          }
          updatedReminders = existingReminders.filter(r => !r.isMedicationReminder);
          break;
          
        case 'sleep':
          for (const reminder of existingReminders.filter(r => r.isSleepReminder)) {
            if (reminder.notificationId) {
              await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
            }
          }
          updatedReminders = existingReminders.filter(r => !r.isSleepReminder);
          break;
          
        case 'exercise':
          for (const reminder of existingReminders.filter(r => r.isExerciseReminder)) {
            if (reminder.notificationId) {
              await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
            }
          }
          updatedReminders = existingReminders.filter(r => !r.isExerciseReminder);
          break;
          
        case 'all':
          // Cancel all notifications
          for (const reminder of existingReminders) {
            if (reminder.notificationId) {
              await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
            }
          }
          updatedReminders = [];
          break;
      }
      
      // Update AsyncStorage
      await AsyncStorage.setItem('reminders', JSON.stringify(updatedReminders));
      
      return { success: true };
    } catch (error) {
      console.error(`Error canceling ${type} reminders:`, error);
      return { success: false, error: error.message };
    }
  }

  static async cancelMedicationReminders() {
    return this.cancelReminders('medication');
  }

  static async cancelSleepReminders() {
    return this.cancelReminders('sleep');
  }

  static async scheduleMedicationReminder(mealName, mealTimeStr, offsetMinutes, timing) {
    try {
      // Create a date object for the scheduled time
      const scheduledTime = this.createDateFromTimeString(mealTimeStr, offsetMinutes);
      
      // Create notification content
      const title = `Medication Reminder`;
      const body = `It's time to take your ${timing} ${mealName} medication.`;
      const reminderId = `medication-${mealName}-${timing}-${Date.now()}`;

      const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { reminderId }, // Add this line
      },
      trigger: scheduledTime,
    });

      console.log(`Scheduled one-time ${timing} ${mealName} medication reminder for: ${scheduledTime.toString()}`);
      
      // Return reminder object
      return {
        id: `medication-${mealName}-${timing}-${Date.now()}`,
        notificationId: notificationId,
        title,
        time: `${scheduledTime.getHours()}:${scheduledTime.getMinutes() < 10 ? '0' + scheduledTime.getMinutes() : scheduledTime.getMinutes()}`,
        body,
        type: 'medication',
        triggerTime: scheduledTime.toISOString(),
        mealName,
        timing,
        isMedicationReminder: true,
        repeats: false,
      };
    } catch (error) {
      console.error('Error scheduling medication reminder:', error);
      return null;
    }
  }

  static async cancelSpecificReminder(reminderId) {
  try {
    const existingRemindersJSON = await AsyncStorage.getItem('reminders');
    if (!existingRemindersJSON) {
      return { success: false, error: 'No reminders found' };
    }

    const existingReminders = JSON.parse(existingRemindersJSON);
    const reminderToCancel = existingReminders.find(r => r.id === reminderId);

    if (!reminderToCancel) {
      return { success: false, error: 'Reminder not found' };
    }

    // Try to cancel the notification if it exists
    if (reminderToCancel.notificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(reminderToCancel.notificationId);
      } catch (error) {
        console.log('Notification already canceled or not found');
      }
    }

    // Remove the reminder from storage
    const updatedReminders = existingReminders.filter(r => r.id !== reminderId);
    await AsyncStorage.setItem('reminders', JSON.stringify(updatedReminders));

    return { success: true };
  } catch (error) {
    console.error('Error canceling specific reminder:', error);
    return { success: false, error: error.message };
  }
}

  static async scheduleSleepReminder(type, timeStr, offsetMinutes) {
    try {
      // Create a date object for the scheduled time
      const scheduledTime = this.createDateFromTimeString(timeStr, offsetMinutes);
      
      // Create title and body text based on sleep type
      let title, body;
      
      if (type === 'bedtime') {
        title = 'Bedtime Reminder';
        body = 'It\'s almost time to get ready for bed. Wind down for better sleep!';
      } else {
        title = 'Wake-up Time';
        body = 'Good morning! It\'s time to start your day.';
      }
      
      const reminderId = `sleep-${type}-${Date.now()}`;
      // Schedule the notification (one-time only)
      const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { reminderId }, // Add this line
      },
      trigger: scheduledTime,
    });

      console.log(`Scheduled one-time ${type} reminder for: ${scheduledTime.toString()}`);
      
      // Return reminder object
      return {
        id: `sleep-${type}-${Date.now()}`,
        notificationId: notificationId,
        title,
        time: `${scheduledTime.getHours()}:${scheduledTime.getMinutes() < 10 ? '0' + scheduledTime.getMinutes() : scheduledTime.getMinutes()}`,
        body,
        type: 'sleep',
        sleepType: type,
        triggerTime: scheduledTime.toISOString(),
        isSleepReminder: true,
        repeats: false,
      };
    } catch (error) {
      console.error('Error scheduling sleep reminder:', error);
      return null;
    }
  }

  static async checkForPreferenceUpdates(preferences) {
    try {
      // Get last update time
      const lastUpdateStr = await AsyncStorage.getItem('lastPreferencesUpdate');
      if (!lastUpdateStr) {
        // First time, set up all reminders
        return await this.scheduleAllReminders(preferences);
      }
      
      // Get last preference hash
      const lastPreferenceHash = await AsyncStorage.getItem('preferencesHash');
      
      // Create a hash of the current preferences
      const currentHash = JSON.stringify({
        meals: preferences.mealPreferences,
        sleep: preferences.sleepPreferences,
        exercise: preferences.exercisePreferences
      });
      
      if (lastPreferenceHash !== currentHash) {
        // Preferences have changed, update all reminders
        console.log('Preferences have changed, updating reminders');
        
        // Cancel all existing reminders
        await this.cancelReminders('all');
        
        // Create new reminders
        const result = await this.scheduleAllReminders(preferences);
        
        // Save new hash
        await AsyncStorage.setItem('preferencesHash', currentHash);
        
        return result;
      }
      
      return { success: true, message: 'No preference updates detected' };
    } catch (error) {
      console.error('Error checking for preference updates:', error);
      return { success: false, error: error.message };
    }
  }
}

export const MedicationReminderService = {
  createMealBasedReminders: ReminderService.createMealBasedReminders.bind(ReminderService),
  cancelMedicationReminders: ReminderService.cancelMedicationReminders.bind(ReminderService)
};