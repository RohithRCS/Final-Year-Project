import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Platform,
  Linking,
  ActivityIndicator,
  View,
  PermissionsAndroid,
  Vibration,
  Animated,
} from 'react-native';
import { useAuth } from './AuthContext';
import { MaterialIcons } from '@expo/vector-icons';

// Check if expo-haptics is available, import if it is
let Haptics;
try {
  Haptics = require('expo-haptics');
} catch (e) {
  console.log('expo-haptics not available, using fallback vibration');
}

const EmergencySosButton = ({ size = 'normal', onSetupContact }) => {
  const { getPreferences } = useAuth();
  const [emergencyContact, setEmergencyContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [callInProgress, setCallInProgress] = useState(false);
  
  // Animation values
  const pulseAnim = new Animated.Value(1);
  
  // Start pulsing animation for SOS button
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  useEffect(() => {
    fetchEmergencyContact();
    startPulseAnimation();
    
    // Pre-request permissions on component mount
    if (Platform.OS === 'android') {
      // Request immediately when component mounts
      requestCallPhonePermission();
      
      // Also request again after a short delay to ensure UI is visible
      const permTimer = setTimeout(() => {
        console.log('Requesting permissions again after delay...');
        requestCallPhonePermission();
      }, 1000);
      
      return () => clearTimeout(permTimer);
    }
  }, []);
  
  const requestCallPhonePermission = async () => {
    try {
      if (Platform.OS === 'android') {
        console.log('Requesting CALL_PHONE permission on mount...');
        // Force permission request every time regardless of current status
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CALL_PHONE,
          {
            title: "Emergency Call Permission",
            message: "Permission needed for emergency calls",
            buttonPositive: "Grant",
            buttonNegative: "Deny",
          }
        );
        
        console.log('Permission request result:', granted);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn('Call permission denied by user');
          // Alert user permission is needed for full functionality
          Alert.alert(
            'Permission Required',
            'Emergency call functionality requires phone permissions',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (err) {
      console.warn('Permission request error:', err);
      // Show a visual notification of the error to help debugging
      Alert.alert(
        'Permission Error',
        'Could not request phone permissions. Please enable manually in settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const fetchEmergencyContact = async () => {
    try {
      setLoading(true);
      const response = await getPreferences();
      
      if (response.success && response.data?.emergencyContact) {
        setEmergencyContact(response.data.emergencyContact);
      }
    } catch (error) {
      console.error('Error fetching emergency contact:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerHapticFeedback = async () => {
    try {
      // Use expo-haptics if available
      if (Haptics && Platform.OS === 'ios') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else {
        // Fallback to basic vibration pattern for emergency
        if (Platform.OS === 'android') {
          // Simple vibration for Android
          Vibration.vibrate(200);
        } else {
          // Simple vibration for iOS when Haptics not available
          Vibration.vibrate(400);
        }
      }
    } catch (error) {
      console.log('Haptic feedback error:', error);
      // Ultimate fallback
      try {
        Vibration.vibrate(300);
      } catch (e) {
        console.log('Even basic vibration failed:', e);
      }
    }
  };

  const makeEmergencyCall = async () => {
    if (!emergencyContact || !emergencyContact.phone) {
      // No contact set - go directly to setup
      if (onSetupContact && typeof onSetupContact === 'function') {
        onSetupContact();
      }
      return;
    }

    try {
      setCallInProgress(true);
      triggerHapticFeedback();
      
      // Format phone number - ensure it has no spaces or special characters
      let phoneNumber = emergencyContact.phone.replace(/[^\d+]/g, '');
      
      // Check for permissions again at call time to ensure we have them
      if (Platform.OS === 'android') {
        try {
          // Always check permission
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CALL_PHONE,
            {
              title: "Emergency Call Permission",
              message: "Permission needed for emergency calls",
              buttonPositive: "Grant",
              buttonNegative: "Deny",
            }
          );
          
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            // Permission granted
            await Linking.openURL(`tel:${phoneNumber}`);
          } else {
            // Permission denied, but still try to open dialer without direct call
            await Linking.openURL(`tel:${phoneNumber}`);
          }
        } catch (permError) {
          console.error('Permission check failed:', permError);
          // Try anyway
          await Linking.openURL(`tel:${phoneNumber}`);
        }
      } else {
        // iOS doesn't need permission checks
        await Linking.openURL(`tel:${phoneNumber}`);
      }
      
    } catch (error) {
      console.error('Call error:', error);
      
      // Simple fallback - try basic tel: scheme
      try {
        const phoneNumber = emergencyContact.phone.replace(/[^\d+]/g, '');
        await Linking.openURL(`tel:${phoneNumber}`);
      } catch (fallbackError) {
        console.error('Fallback call failed:', fallbackError);
        
        // Last resort - just tell them the number
        Alert.alert(
          'Call Failed',
          `Please manually dial ${emergencyContact.phone}`,
          [{ text: 'OK' }]
        );
      }
    } finally {
      setCallInProgress(false);
    }
  };

  // Single tap immediately activates call
  const handlePress = () => {
    if (!callInProgress && !loading) {
      makeEmergencyCall();
    }
  };

  // Configuration still available on long press
  const handleLongPress = () => {
    // Provide configuration options
    Alert.alert(
      'Emergency Contact Settings',
      emergencyContact 
        ? `Current: ${emergencyContact.name} (${emergencyContact.phone})`
        : 'No emergency contact set',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: emergencyContact ? 'Change Contact' : 'Set Up Contact', 
          onPress: () => {
            if (onSetupContact) onSetupContact();
          } 
        },
      ]
    );
  };

  const renderButtonContent = () => {
    if (loading) {
      return <ActivityIndicator color="#fff" size={size === 'large' ? 'large' : 'small'} />;
    }

    if (callInProgress) {
      return (
        <View style={size === 'large' ? styles.largeButtonContent : styles.normalButtonContent}>
          <ActivityIndicator color="#fff" size={size === 'large' ? 'small' : 'small'} style={styles.callIcon} />
          <Text style={size === 'large' ? styles.largeButtonText : styles.buttonText}>
            CALLING
          </Text>
        </View>
      );
    }

    return (
      <View style={size === 'large' ? styles.largeButtonContent : styles.normalButtonContent}>
        <MaterialIcons name="phone-in-talk" size={size === 'large' ? 28 : 20} color="#fff" style={styles.callIcon} />
        <Text style={size === 'large' ? styles.largeButtonText : styles.buttonText}>
          {size === 'large' ? 'SOS' : 'SOS'}
        </Text>
      </View>
    );
  };

  // Define button style based on state and size
  const buttonStyle = [
    size === 'large' ? styles.largeButton : styles.button,
    !emergencyContact && styles.buttonWarning,
    callInProgress && styles.buttonPressed
  ];

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <TouchableOpacity
        style={buttonStyle}
        onPress={handlePress}
        onLongPress={handleLongPress}
        activeOpacity={0.7}
        delayLongPress={2000}
        accessibilityLabel="Emergency SOS button"
        accessibilityRole="button"
        accessibilityHint="Press to call emergency contact immediately"
      >
        {renderButtonContent()}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FF3B30',
    padding: 10, // Reduced padding
    borderRadius: 40, // More round button for SOS look
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    minWidth: 70, // Smaller width
    maxWidth: 80, // Added max width
    height: 40, // Fixed height
  },
  buttonWarning: {
    backgroundColor: '#FF9500', // Orange to indicate no contact is set
  },
  buttonPressed: {
    backgroundColor: '#CC2B25', // Darker when pressed
    transform: [{ scale: 0.95 }], // Slightly smaller when pressed
  },
  largeButton: {
    backgroundColor: '#FF3B30',
    padding: 12, // Reduced padding
    borderRadius: 50, // More round button for SOS look
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    minWidth: 120, // Reduced width
    minHeight: 60, // Reduced height
  },
  normalButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  largeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
  },
  callIcon: {
    marginRight: 8,
  },
});

export default EmergencySosButton;