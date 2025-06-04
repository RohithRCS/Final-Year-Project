import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Linking,
  ActivityIndicator,
  View,
} from 'react-native';
import { useAuth } from './AuthContext';
import { MaterialIcons } from '@expo/vector-icons';

const EmergencySosButton = ({ size = 'normal', onSetupContact }) => {
  const { getPreferences } = useAuth();
  const [emergencyContact, setEmergencyContact] = useState(null);
  const [callInProgress, setCallInProgress] = useState(false);

  // Fetch once immediately
  useEffect(() => {
    fetchEmergencyContact();
  }, []);

  // Fetch in background silently every 1 second
  useEffect(() => {
    let isMounted = true;

    const fetchAndSetContact = async () => {
      try {
        const response = await getPreferences();
        if (isMounted && response.success && response.data?.emergencyContact) {
          setEmergencyContact(response.data.emergencyContact);
        }
      } catch (error) {
        console.error('Error fetching emergency contact:', error);
      }
    };

    fetchAndSetContact(); // initial silent fetch

    const intervalId = setInterval(fetchAndSetContact, 1000); // every 1 second

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // Initial fetch with optional loading state (removed visual use)
  const fetchEmergencyContact = async () => {
    try {
      const response = await getPreferences();
      if (response.success && response.data?.emergencyContact) {
        setEmergencyContact(response.data.emergencyContact);
      }
    } catch (error) {
      console.error('Error fetching emergency contact:', error);
    }
  };

  const makeEmergencyCall = async () => {
    if (!emergencyContact || !emergencyContact.phone) {
      if (onSetupContact) {
        onSetupContact();
      } else {
        Alert.alert(
          'No Emergency Contact',
          'Please set up an emergency contact first.',
          [{ text: 'OK' }]
        );
      }
      return;
    }

    try {
      setCallInProgress(true);

      const phoneNumber = emergencyContact.phone.replace(/[^\d+]/g, '');
      const telUrl = `tel:${phoneNumber}`;

      const canOpenTel = await Linking.canOpenURL(telUrl);
      if (canOpenTel) {
        await Linking.openURL(telUrl);
      } else {
        throw new Error('Device cannot open telephone links');
      }
    } catch (error) {
      console.error('Call error:', error);
      Alert.alert(
        'Unable to Open Dialer',
        `Please manually dial: ${emergencyContact.phone}`,
        [{ text: 'OK' }]
      );
    } finally {
      setCallInProgress(false);
    }
  };

  const handlePress = () => {
    if (!callInProgress) {
      makeEmergencyCall();
    }
  };

  const handleLongPress = () => {
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
          },
        },
      ]
    );
  };

  const renderButtonContent = () => {
    if (callInProgress) {
      return (
        <View style={styles.buttonContent}>
          <Text style={size === 'large' ? styles.largeButtonText : styles.buttonText}>
            CALLING...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.buttonContent}>
        <MaterialIcons
          name="phone-in-talk"
          size={size === 'large' ? 28 : 20}
          color="#fff"
          style={styles.icon}
        />
        <Text style={size === 'large' ? styles.largeButtonText : styles.buttonText}>
          SOS
        </Text>
      </View>
    );
  };

  const buttonStyle = [
    size === 'large' ? styles.largeButton : styles.button,
    !emergencyContact && styles.buttonWarning,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
      delayLongPress={2000}
      accessibilityLabel="Emergency SOS button"
      accessibilityRole="button"
      accessibilityHint="Press to open dialer with emergency contact number"
    >
      {renderButtonContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FF3B30',
    padding: 10,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    minWidth: 70,
    maxWidth: 80,
    height: 40,
  },
  buttonWarning: {
    backgroundColor: '#FF9500',
  },
  largeButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    minWidth: 120,
    minHeight: 60,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  icon: {
    marginRight: 8,
  },
});

export default EmergencySosButton;