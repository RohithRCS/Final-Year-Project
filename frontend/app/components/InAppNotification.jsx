import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const InAppNotification = ({ message, type = 'success', onClose }) => {
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    // Slide in animation
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(onClose);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Determine icon and color based on notification type
  const getNotificationStyles = () => {
    switch (type) {
      case 'error':
        return {
          backgroundColor: '#FF3B30',
          icon: 'close-circle',
          textColor: 'white',
        };
      case 'warning':
        return {
          backgroundColor: '#FF9500',
          icon: 'warning',
          textColor: 'white',
        };
      case 'info':
        return {
          backgroundColor: '#5E5CE6',
          icon: 'information-circle',
          textColor: 'white',
        };
      default: // success
        return {
          backgroundColor: '#4A6FE5',
          icon: 'checkmark-circle',
          textColor: 'white',
        };
    }
  };

  const notificationStyles = getNotificationStyles();

  // Interpolate the animated value for translation
  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: notificationStyles.backgroundColor,
          transform: [{ translateY }],
        }
      ]}
    >
      <View style={styles.contentContainer}>
        <Ionicons 
          name={notificationStyles.icon} 
          size={24} 
          color={notificationStyles.textColor} 
        />
        <Text 
          style={[
            styles.messageText, 
            { color: notificationStyles.textColor }
          ]}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 40,
    paddingBottom: 15,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default InAppNotification;