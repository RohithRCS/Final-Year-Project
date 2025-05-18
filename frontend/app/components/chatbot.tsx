import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ChatBot from './chatb';
import { useAuth } from './AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from './ThemeContext'; // Import useTheme

type RootStackParamList = {
  Chat: undefined;
  [key: string]: undefined | object;
};

type ChatScreenProps = {
  navigation: StackNavigationProp<RootStackParamList>;
};

interface UserInfo {
  id?: string;
  name?: string;
  email?: string;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ navigation }) => {
  const { currentUser: userInfo } = useAuth();
  const { theme } = useTheme(); // Get the theme object

  // Define styles using the theme
  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      marginTop: 40,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
      backgroundColor: theme.cardBackground,
    },
    backButton: {
      padding: 4,
    },
    headerTitleContainer: {
      flex: 1,
      marginLeft: 12,
      
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
    },
    headerSubtitle: {
      fontSize: 12,
      color: theme.subText,
    },
    avatarPlaceholder: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Health Assistant</Text>
          <Text style={styles.headerSubtitle}>AI-Powered Support</Text>
        </View>

      </View>
      
      <ChatBot />
    </SafeAreaView>
  );
};

export default ChatScreen;