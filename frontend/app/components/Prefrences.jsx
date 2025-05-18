import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  Alert,
  Platform
} from 'react-native';
import { useAuth } from './AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PreferencesScreen = () => {
  const navigation = useNavigation();
  const { savePreferences, checkFirstTimeUser, currentUser } = useAuth();
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Medication timing preferences
  const [hasMedicationBeforeMeals, setHasMedicationBeforeMeals] = useState(false);
  const [hasMedicationAfterMeals, setHasMedicationAfterMeals] = useState(false);
  
  // Meal times
  const [mealTimings, setMealTimings] = useState({
    breakfastTime: '08:00',
    lunchTime: '12:30',
    dinnerTime: '18:00',
  });
  
  // Which meals require medication
  const [mealsWithMedication, setMealsWithMedication] = useState({
    breakfast: { before: false, after: false },
    lunch: { before: false, after: false },
    dinner: { before: false, after: false },
  });
  
  // Time picker state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentTimePickerFor, setCurrentTimePickerFor] = useState(null);
  
  // Other preferences
  const [dietaryRestrictions, setDietaryRestrictions] = useState(['none']);
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState('medium');
  const [exercisePreferences, setExercisePreferences] = useState({
    preferredExerciseTime: 'morning',
    exerciseDuration: 15,
    exerciseIntensity: 'light'
  });
  const [sleepPreferences, setSleepPreferences] = useState({
    bedTime: '21:00',
    wakeTime: '07:00',
    napTime: true
  });
  
  useEffect(() => {
    const checkUserStatus = async () => {
      const firstTimeUser = await checkFirstTimeUser();
      setIsFirstTimeUser(firstTimeUser);
    };
    
    checkUserStatus();
  }, []);
  
  // Steps in the preference setup process
  const steps = [
    { title: 'Welcome', isComplete: () => true },
    { title: 'Medication Timing', isComplete: () => true },
    { title: 'Meal Times', isComplete: () => hasMealTimesComplete() },
    { title: 'Other Preferences', isComplete: () => true },
    { title: 'Finish', isComplete: () => true },
  ];
  
  const hasMealTimesComplete = () => {
    // Check if user has medication before/after meals and has selected at least one meal
    if (!hasMedicationBeforeMeals && !hasMedicationAfterMeals) return true;
    
    // If they have medication, ensure they've selected at least one meal
    const hasMeals = Object.values(mealsWithMedication).some(meal => 
      (hasMedicationBeforeMeals && meal.before) || 
      (hasMedicationAfterMeals && meal.after)
    );
    
    return hasMeals;
  };
  
  const handleMealTimeChange = (meal, time) => {
    setMealTimings({
      ...mealTimings,
      [meal]: time,
    });
  };
  
  const openTimePicker = (for_meal) => {
    setCurrentTimePickerFor(for_meal);
    setShowTimePicker(true);
  };
  
  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios');
    
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      
      handleMealTimeChange(currentTimePickerFor, timeString);
    }
  };
  
  const toggleMealMedication = (meal, timing) => {
    setMealsWithMedication({
      ...mealsWithMedication,
      [meal]: {
        ...mealsWithMedication[meal],
        [timing]: !mealsWithMedication[meal][timing]
      }
    });
  };
  
  const formatTimeDisplay = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  };
  
  const calculateMedicationTime = (mealTime, isBefore) => {
    const [hours, minutes] = mealTime.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;
    
    // Adjust by 30 minutes before or after
    totalMinutes = isBefore ? totalMinutes - 30 : totalMinutes + 30;
    
    // Handle day boundaries
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    if (totalMinutes >= 24 * 60) totalMinutes -= 24 * 60;
    
    const adjustedHours = Math.floor(totalMinutes / 60);
    const adjustedMinutes = totalMinutes % 60;
    
    return `${adjustedHours.toString().padStart(2, '0')}:${adjustedMinutes.toString().padStart(2, '0')}`;
  };
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // Validate current step
      if (!steps[currentStep].isComplete()) {
        Alert.alert(
          "Incomplete Information",
          "Please complete all required information before proceeding.",
          [{ text: "OK" }]
        );
        return;
      }
      
      setCurrentStep(currentStep + 1);
    } else {
      saveUserPreferences();
    }
  };
  
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSkip = () => {
    if (currentStep === 1 || currentStep === 2) {
      // If skipping medication timing, clear related settings
      setHasMedicationBeforeMeals(false);
      setHasMedicationAfterMeals(false);
      setMealsWithMedication({
        breakfast: { before: false, after: false },
        lunch: { before: false, after: false },
        dinner: { before: false, after: false },
      });
    }
    
    // Skip to other preferences
    setCurrentStep(3);
  };
  
  // Fixed saveUserPreferences function - no hooks inside the function body
  const saveUserPreferences = async () => {
    setLoading(true);

    try {
      const preferencesData = {
        theme,
        fontSize,
        mealPreferences: {
          beforeMealMedicationTime: hasMedicationBeforeMeals ? 30 : 0,
          afterMealMedicationTime: hasMedicationAfterMeals ? 30 : 0,
          breakfastTime: mealTimings.breakfastTime,
          lunchTime: mealTimings.lunchTime,
          dinnerTime: mealTimings.dinnerTime,
          dietaryRestrictions,
          foodAllergies: []
        },
        exercisePreferences,
        sleepPreferences,
        emergencyContact: {
          name: '',
          relationship: '',
          phone: '',
          alternate: ''
        }
      };

      const response = await savePreferences(preferencesData);

      if (response.success) {
        // Mark preferences as completed in AsyncStorage - using currentUser from the hook at component level
        if (currentUser && currentUser.userId) {
          await AsyncStorage.setItem(`preferences_completed_${currentUser.userId}`, 'true');
        }
        
        // Navigate to MainApp and reset the navigation stack
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'MainApp' }],
          })
        );
      } else {
        Alert.alert("Error", response.error || "Failed to save preferences");
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };
  
  const renderWelcome = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.welcomeTitle}>Welcome to Health Companion</Text>
      <Text style={styles.welcomeText}>
        We'll help you set up your preferences so we can provide personalized health recommendations
        and medication reminders tailored to your daily routine.
      </Text>
      <Text style={styles.welcomeText}>
        Let's start by understanding your medication schedule in relation to your meals.
      </Text>
    </View>
  );
  
  const renderMedicationTiming = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Medication Timing</Text>
      <Text style={styles.stepDescription}>
        Do you take any medications in relation to your meals? This helps us set up appropriate reminders.
      </Text>
      
      <View style={styles.optionContainer}>
        <Text style={styles.optionLabel}>I take medication before meals</Text>
        <Switch
          value={hasMedicationBeforeMeals}
          onValueChange={() => setHasMedicationBeforeMeals(!hasMedicationBeforeMeals)}
          trackColor={{ false: "#d1d1d1", true: "#4CAF50" }}
          thumbColor="#f4f3f4"
        />
      </View>
      
      <View style={styles.optionContainer}>
        <Text style={styles.optionLabel}>I take medication after meals</Text>
        <Switch
          value={hasMedicationAfterMeals}
          onValueChange={() => setHasMedicationAfterMeals(!hasMedicationAfterMeals)}
          trackColor={{ false: "#d1d1d1", true: "#4CAF50" }}
          thumbColor="#f4f3f4"
        />
      </View>
    </View>
  );
  
  const renderMealTimes = () => {
    // Skip this step if no medication timing
    if (!hasMedicationBeforeMeals && !hasMedicationAfterMeals) {
      // Automatically move to next step
      setTimeout(() => setCurrentStep(currentStep + 1), 0);
      return <View><Text>Loading next step...</Text></View>;
    }
    
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Meal Times</Text>
        <Text style={styles.stepDescription}>
          Please tell us when you usually have your meals and which meals require medication timing.
        </Text>
        
        {/* Breakfast Settings */}
        <View style={styles.mealSection}>
          <Text style={styles.mealTitle}>Breakfast</Text>
          
          <TouchableOpacity 
            style={styles.timeSelector}
            onPress={() => openTimePicker('breakfastTime')}
          >
            <Text style={styles.timeText}>
              {formatTimeDisplay(mealTimings.breakfastTime)}
            </Text>
            <Ionicons name="time-outline" size={24} color="#666" />
          </TouchableOpacity>
          
          {hasMedicationBeforeMeals && (
            <View style={styles.optionContainer}>
              <Text style={styles.optionLabel}>Take medication before breakfast</Text>
              <Switch
                value={mealsWithMedication.breakfast.before}
                onValueChange={() => toggleMealMedication('breakfast', 'before')}
                trackColor={{ false: "#d1d1d1", true: "#4CAF50" }}
                thumbColor="#f4f3f4"
              />
            </View>
          )}
          
          {mealsWithMedication.breakfast.before && (
            <Text style={styles.medicationTimeText}>
              Medication reminder at {formatTimeDisplay(calculateMedicationTime(mealTimings.breakfastTime, true))}
            </Text>
          )}
          
          {hasMedicationAfterMeals && (
            <View style={styles.optionContainer}>
              <Text style={styles.optionLabel}>Take medication after breakfast</Text>
              <Switch
                value={mealsWithMedication.breakfast.after}
                onValueChange={() => toggleMealMedication('breakfast', 'after')}
                trackColor={{ false: "#d1d1d1", true: "#4CAF50" }}
                thumbColor="#f4f3f4"
              />
            </View>
          )}
          
          {mealsWithMedication.breakfast.after && (
            <Text style={styles.medicationTimeText}>
              Medication reminder at {formatTimeDisplay(calculateMedicationTime(mealTimings.breakfastTime, false))}
            </Text>
          )}
        </View>
        
        {/* Lunch Settings */}
        <View style={styles.mealSection}>
          <Text style={styles.mealTitle}>Lunch</Text>
          
          <TouchableOpacity 
            style={styles.timeSelector}
            onPress={() => openTimePicker('lunchTime')}
          >
            <Text style={styles.timeText}>
              {formatTimeDisplay(mealTimings.lunchTime)}
            </Text>
            <Ionicons name="time-outline" size={24} color="#666" />
          </TouchableOpacity>
          
          {hasMedicationBeforeMeals && (
            <View style={styles.optionContainer}>
              <Text style={styles.optionLabel}>Take medication before lunch</Text>
              <Switch
                value={mealsWithMedication.lunch.before}
                onValueChange={() => toggleMealMedication('lunch', 'before')}
                trackColor={{ false: "#d1d1d1", true: "#4CAF50" }}
                thumbColor="#f4f3f4"
              />
            </View>
          )}
          
          {mealsWithMedication.lunch.before && (
            <Text style={styles.medicationTimeText}>
              Medication reminder at {formatTimeDisplay(calculateMedicationTime(mealTimings.lunchTime, true))}
            </Text>
          )}
          
          {hasMedicationAfterMeals && (
            <View style={styles.optionContainer}>
              <Text style={styles.optionLabel}>Take medication after lunch</Text>
              <Switch
                value={mealsWithMedication.lunch.after}
                onValueChange={() => toggleMealMedication('lunch', 'after')}
                trackColor={{ false: "#d1d1d1", true: "#4CAF50" }}
                thumbColor="#f4f3f4"
              />
            </View>
          )}
          
          {mealsWithMedication.lunch.after && (
            <Text style={styles.medicationTimeText}>
              Medication reminder at {formatTimeDisplay(calculateMedicationTime(mealTimings.lunchTime, false))}
            </Text>
          )}
        </View>
        
        {/* Dinner Settings */}
        <View style={styles.mealSection}>
          <Text style={styles.mealTitle}>Dinner</Text>
          
          <TouchableOpacity 
            style={styles.timeSelector}
            onPress={() => openTimePicker('dinnerTime')}
          >
            <Text style={styles.timeText}>
              {formatTimeDisplay(mealTimings.dinnerTime)}
            </Text>
            <Ionicons name="time-outline" size={24} color="#666" />
          </TouchableOpacity>
          
          {hasMedicationBeforeMeals && (
            <View style={styles.optionContainer}>
              <Text style={styles.optionLabel}>Take medication before dinner</Text>
              <Switch
                value={mealsWithMedication.dinner.before}
                onValueChange={() => toggleMealMedication('dinner', 'before')}
                trackColor={{ false: "#d1d1d1", true: "#4CAF50" }}
                thumbColor="#f4f3f4"
              />
            </View>
          )}
          
          {mealsWithMedication.dinner.before && (
            <Text style={styles.medicationTimeText}>
              Medication reminder at {formatTimeDisplay(calculateMedicationTime(mealTimings.dinnerTime, true))}
            </Text>
          )}
          
          {hasMedicationAfterMeals && (
            <View style={styles.optionContainer}>
              <Text style={styles.optionLabel}>Take medication after dinner</Text>
              <Switch
                value={mealsWithMedication.dinner.after}
                onValueChange={() => toggleMealMedication('dinner', 'after')}
                trackColor={{ false: "#d1d1d1", true: "#4CAF50" }}
                thumbColor="#f4f3f4"
              />
            </View>
          )}
          
          {mealsWithMedication.dinner.after && (
            <Text style={styles.medicationTimeText}>
              Medication reminder at {formatTimeDisplay(calculateMedicationTime(mealTimings.dinnerTime, false))}
            </Text>
          )}
        </View>
        
        {showTimePicker && (
          <DateTimePicker
            value={(() => {
              // Convert string time to Date object
              const [hours, minutes] = mealTimings[currentTimePickerFor].split(':').map(Number);
              const date = new Date();
              date.setHours(hours, minutes, 0);
              return date;
            })()}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={handleTimeChange}
          />
        )}
      </View>
    );
  };
  
  const renderOtherPreferences = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Other Preferences</Text>
      
      {/* Theme Preference */}
      <View style={styles.preferenceSection}>
        <Text style={styles.sectionTitle}>Display Theme</Text>
        <View style={styles.optionsRow}>
          {['light', 'dark', 'high-contrast'].map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                theme === option && styles.selectedOption
              ]}
              onPress={() => setTheme(option)}
            >
              <Text style={[
                styles.optionButtonText,
                theme === option && styles.selectedOptionText
              ]}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Font Size Preference */}
      <View style={styles.preferenceSection}>
        <Text style={styles.sectionTitle}>Font Size</Text>
        <View style={styles.optionsRow}>
          {['small', 'medium', 'large', 'extra-large'].map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                fontSize === option && styles.selectedOption
              ]}
              onPress={() => setFontSize(option)}
            >
              <Text style={[
                styles.optionButtonText,
                fontSize === option && styles.selectedOptionText,
                option === 'small' && { fontSize: 12 },
                option === 'medium' && { fontSize: 14 },
                option === 'large' && { fontSize: 16 },
                option === 'extra-large' && { fontSize: 18 }
              ]}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Exercise Preferences - Simplified for initial setup */}
      <View style={styles.preferenceSection}>
        <Text style={styles.sectionTitle}>Exercise Preferences</Text>
        
        <Text style={styles.fieldLabel}>Preferred Time</Text>
        <View style={styles.optionsRow}>
          {['morning', 'afternoon', 'evening'].map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                exercisePreferences.preferredExerciseTime === option && styles.selectedOption
              ]}
              onPress={() => setExercisePreferences({
                ...exercisePreferences,
                preferredExerciseTime: option
              })}
            >
              <Text style={[
                styles.optionButtonText,
                exercisePreferences.preferredExerciseTime === option && styles.selectedOptionText
              ]}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Dietary Preferences - Simple for now */}
      <View style={styles.preferenceSection}>
        <Text style={styles.sectionTitle}>Special Diet</Text>
        <View style={styles.optionsGrid}>
          {['none', 'vegetarian', 'vegan', 'dairy-free', 'gluten-free', 'low-sodium'].map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                dietaryRestrictions.includes(option) && styles.selectedOption
              ]}
              onPress={() => {
                if (option === 'none') {
                  setDietaryRestrictions(['none']);
                } else {
                  // Remove 'none' if another option is selected
                  const updatedDiet = dietaryRestrictions.filter(item => item !== 'none');
                  
                  // Toggle the selected option
                  if (updatedDiet.includes(option)) {
                    setDietaryRestrictions(updatedDiet.filter(item => item !== option));
                  } else {
                    setDietaryRestrictions([...updatedDiet, option]);
                  }
                }
              }}
            >
              <Text style={[
                styles.optionButtonText,
                dietaryRestrictions.includes(option) && styles.selectedOptionText
              ]}>
                {option === 'none' ? 'No Restrictions' : option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
  
  const renderFinish = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.welcomeTitle}>All Set!</Text>
      <Text style={styles.welcomeText}>
        Thank you for setting up your preferences. We'll use this information to provide you with personalized
        health recommendations and timely medication reminders.
      </Text>
      <Text style={styles.welcomeText}>
        You can always update these preferences later from your profile settings.
      </Text>
    </View>
  );
  
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderWelcome();
      case 1:
        return renderMedicationTiming();
      case 2:
        return renderMealTimes();
      case 3:
        return renderOtherPreferences();
      case 4:
        return renderFinish();
      default:
        return null;
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {steps.map((step, index) => (
          <View key={index} style={styles.progressStepWrapper}>
            <View 
              style={[
                styles.progressStep,
                index <= currentStep && styles.activeStep,
                step.isComplete() && styles.completedStep
              ]}
            >
              <Text style={styles.progressStepText}>{index + 1}</Text>
            </View>
            {index < steps.length - 1 && (
              <View style={[
                styles.progressLine,
                index < currentStep && styles.activeLine
              ]} />
            )}
          </View>
        ))}
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {renderCurrentStep()}
      </ScrollView>
      
      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {currentStep > 0 && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBack}
            disabled={loading}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        {(currentStep === 1 || currentStep === 2) && (
          <TouchableOpacity 
            style={styles.skipButton} 
            onPress={handleSkip}
            disabled={loading}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.nextButton} 
          onPress={handleNext}
          disabled={loading}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
  },
  progressStepWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressStep: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  activeStep: {
    backgroundColor: '#4CAF50',
  },
  completedStep: {
    backgroundColor: '#81C784',
  },
  progressStepText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  progressLine: {
    height: 3,
    width: 40,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 5,
  },
  activeLine: {
    backgroundColor: '#81C784',
  },
  stepContainer: {
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 16,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#424242',
    lineHeight: 24,
    marginBottom: 14,
    textAlign: 'center',
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 16,
    color: '#424242',
    marginBottom: 24,
    lineHeight: 22,
  },
  optionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optionLabel: {
    fontSize: 16,
    color: '#424242',
    flex: 1,
    paddingRight: 10,
  },
  mealSection: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 12,
  },
  timeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  medicationTimeText: {
    fontSize: 14,
    color: '#4CAF50',
    fontStyle: 'italic',
    marginTop: -8,
    marginBottom: 12,
    paddingLeft: 15,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 16,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#757575',
    fontWeight: '500',
    fontSize: 16,
  },
  nextButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  preferenceSection: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f1f1f1',
    borderRadius: 25,
    marginHorizontal: 5,
    marginVertical: 5,
    minWidth: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#4CAF50',
  },
  optionButtonText: {
    color: '#424242',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#fff',
  },
  fieldLabel: {
    fontSize: 16,
    color: '#424242',
    marginBottom: 8,
  },
});

export default PreferencesScreen