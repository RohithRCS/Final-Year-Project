import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Keyboard,
  ListRenderItem,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as Speech from 'expo-speech';
import { useAuth } from './AuthContext';
import { BASE_URL } from "./config";
import MicrophoneTranscriber from './microphone_transcriber';
import { useTheme } from './ThemeContext';
import { useRoute } from '@react-navigation/native';

// Define types for the chat messages
type ChatMessage = {
  id: string;
  role: 'user' | 'bot';
  content: string;
};

// Define the shape of the user object from your auth context
type User = {
  userId: string;
  // Add other user properties if needed
};

// Define the shape of your auth context
type AuthContextType = {
  currentUser: User | null;
  getAuthHeader: () => Record<string, string>;
};

const ChatBot: React.FC = () => {
  const [message, setMessage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const { currentUser, getAuthHeader } = useAuth() as AuthContextType;
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const [showVoiceInput, setShowVoiceInput] = useState<boolean>(false);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(true);
  const { theme, isDarkMode } = useTheme();
  
  // Get route params for mood selection
  const route = useRoute();
  const autoMessage = (route.params as any)?.autoMessage || null;

  const selectedMood = (route.params as any)?.selectedMood || null;
  
  // Auto-send message flag to prevent multiple sends
  const autoSendComplete = useRef(false);

  const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  chatListContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: theme.background,
  },
  chatContainer: {
    padding: 16,
    paddingTop: 10,
    backgroundColor: theme.background,
  },
  messageBubble: {
    maxWidth: width * 0.75,
    padding: 14,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: isDarkMode ? theme.cardBackground : '#F0F7FF',
    borderBottomLeftRadius: 5,
    marginRight: 40,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
    marginLeft: 40,
    backgroundColor: theme.primary,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  botMessage: {
    color: theme.text,
    paddingRight: 24, // Space for speak button
  },
  userMessage: {
    color: '#FFFFFF',
  },
  typingIndicator: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: isDarkMode ? theme.cardBackground : '#F0F7FF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderBottomLeftRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  typingIndicatorText: {
    fontSize: 14,
    color: theme.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: theme.divider,
    backgroundColor: theme.cardBackground,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 45,
    fontSize: 16,
    maxHeight: 120,
    marginRight: 10,
    backgroundColor: isDarkMode ? theme.divider : '#F8F8F8',
    color: theme.text,
  },
  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: theme.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: theme.divider,
    opacity: 0.7,
  },
  micButton: {
    position: 'absolute',
    right: 65,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakButton: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollButtonsContainer: {
    position: 'absolute',
    right: 10,
    bottom: 80,
    flexDirection: 'column',
  },
  scrollButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  voiceInputContainer: {
    backgroundColor: theme.cardBackground,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.divider,
    alignItems: 'center',
    height: 150,
  },
  closeVoiceButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: theme.divider,
  },
  closeVoiceButtonText: {
    color: theme.subText,
    fontWeight: '500',
  },
  timeStamp: {
    fontSize: 11,
    color: theme.subText,
    alignSelf: 'center',
    marginBottom: 10,
    marginTop: 5,
  },
  dayDivider: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dayDividerLine: {
    height: 1,
    backgroundColor: theme.divider,
    width: '100%',
    position: 'absolute',
  },
  dayDividerText: {
    backgroundColor: theme.background,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    color: theme.subText,
    fontSize: 12,
  },
  messageBubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  avatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: 8,
    backgroundColor: theme.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.text,
  },
  avatarImage: {
    width: 28,
    height: 28,
  },
  readReceipt: {
    fontSize: 10,
    color: theme.subText,
    alignSelf: 'flex-end',
    marginRight: 8,
    marginBottom: 4,
  },
  emojiSelector: {
    height: 250,
    borderTopWidth: 1,
    borderTopColor: theme.divider,
  },
  emojiButton: {
    position: 'absolute',
    right: 110,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDarkMode ? theme.cardBackground : '#F0F7FF',
  },
  attachmentButton: {
    position: 'absolute',
    right: 155,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  autoSpeakSwitch: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  autoSpeakText: {
    fontSize: 12,
    marginRight: 8,
    color: theme.subText,
  }
});

  useEffect(() => {
  // Reset the autoSendComplete flag whenever new route params arrive
  if (route.params?.selectedMood) {
    autoSendComplete.current = false;
  }
}, [route.params]);

  const TypingIndicator = () => {
    const [dots, setDots] = useState<string>('.');
    
    useEffect(() => {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '.' : prev + '.');
      }, 500);
      
      return () => clearInterval(interval);
    }, []);
    
    return (
      <View style={styles.typingIndicator}>
        <Text style={styles.typingIndicatorText}>Typing{dots}</Text>
      </View>
    );
  };

  useEffect(() => {
    // Load chat history when component mounts
    loadChatHistory();
    
    // Keyboard listeners
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    
    // Cleanup
    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
      Speech.stop();
    };
  }, []);
  
  // Handle auto-message from mood selection
  useEffect(() => {
    if (autoMessage && !autoSendComplete.current && chatHistory.length > 0) {
      // Set a slight delay to ensure chat is loaded first
      const timer = setTimeout(() => {
        setMessage(autoMessage);
        // Send the message after setting it
        const autoSendTimer = setTimeout(() => {
          if (!autoSendComplete.current) {
            sendMessage(autoMessage);
            autoSendComplete.current = true;
          }
        }, 300);
        
        return () => clearTimeout(autoSendTimer);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [autoMessage, chatHistory]);

  // Scroll to bottom whenever chat history changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      // Auto speak the last bot message if auto-speak is enabled
      const lastMessage = chatHistory[chatHistory.length - 1];
      if (autoSpeak && lastMessage.role === 'bot') {
        speakMessage(lastMessage);
      }
    }
  }, [chatHistory, autoSpeak]);

  const scrollUp = () => {
    if (flatListRef.current && chatHistory.length > 0) {
      flatListRef.current.scrollToOffset({ 
        offset: Math.max(0, (flatListRef.current.props.contentOffset?.y || 0) - 200),
        animated: true 
      });
    }
  };

  const scrollDown = () => {
    if (flatListRef.current && chatHistory.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const loadChatHistory = async () => {
    setIsLoading(true);
    try {
      // Try to fetch chat history from the server
      if (currentUser && currentUser.userId) {
        const response = await axios.get<ChatMessage[]>(
          `${BASE_URL}/chat/${currentUser.userId}`,
          { headers: getAuthHeader() }
        );
        
        if (response.data && response.data.length > 0) {
          setChatHistory(response.data);
        } else {
          // Set default welcome message if no history
          let welcomeMessage = 'Hello! I\'m your health companion. How can I help you today?';
          
          // Customize welcome message if mood was selected
          if (selectedMood) {
            welcomeMessage = `Hello! I see you're feeling ${selectedMood.toLowerCase()} today. I'm here to chat about it.`;
          }
          
          setChatHistory([
            { id: '0', role: 'bot', content: welcomeMessage }
          ]);
        }
      } else {
        // If no user is logged in or userId is missing, set default message
        setChatHistory([
          { id: '0', role: 'bot', content: 'Hello! I\'m your health companion. How can I help you today?' }
        ]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      // Set default message on error
      setChatHistory([
        { id: '0', role: 'bot', content: 'Hello! I\'m your health companion. How can I help you today?' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (messageToSend = null) => {
    const messageText = messageToSend || message;
    
    if (!messageText.trim()) return;
    
    if (!currentUser || !currentUser.userId) {
      Alert.alert('Error', 'You need to be logged in to use the chat.');
      return;
    }
    
    const userMessage: ChatMessage = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: messageText 
    };
    const updatedChat = [...chatHistory, userMessage];
    setChatHistory(updatedChat);
    
    // Clear input field
    setMessage('');
    setIsLoading(true);

    try {
      // Send message to your backend API with auth header
      const response = await axios.post<{ message: string }>(
        `${BASE_URL}/chat`, 
        {
          message: messageText.trim(),
          userId: currentUser.userId,
          // Include mood data if available
          mood: selectedMood || null
        },
        { headers: getAuthHeader() }
      );

      // Add bot response to chat
      const botMessage: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'bot', 
        content: response.data.message 
      };
      
      const newChatHistory = [...updatedChat, botMessage];
      setChatHistory(newChatHistory);
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Handle different types of errors
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      
      if (error.response) {
        // Server responded with error status
        if (error.response.status === 401) {
          errorMessage = 'Your session has expired. Please log in again.';
        } else if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.request) {
        // Request made but no response received
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      }
      
      // Add error message to chat
      const botErrorMessage: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'bot', 
        content: errorMessage
      };
      
      setChatHistory([...updatedChat, botErrorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const speakMessage = async (message: ChatMessage) => {
    // Stop any currently speaking message first
    if (isSpeaking) {
      await Speech.stop();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }

    // Only speak bot messages
    if (message.role !== 'bot') return;
    
    setIsSpeaking(true);
    setSpeakingMessageId(message.id);
    
    try {
      await Speech.speak(message.content, {
        language: 'en',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => {
          setIsSpeaking(false);
          setSpeakingMessageId(null);
        },
        onError: (error) => {
          console.error('Speech error:', error);
          setIsSpeaking(false);
          setSpeakingMessageId(null);
        },
      });
    } catch (error) {
      console.error('Text-to-speech error:', error);
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }
  };

  const stopSpeaking = async () => {
    if (isSpeaking) {
      await Speech.stop();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }
  };

  const toggleAutoSpeak = () => {
    setAutoSpeak(!autoSpeak);
  };

  const handleTranscriptionComplete = (transcript: string) => {
    setMessage(transcript);
    setShowVoiceInput(false);
  };

  const toggleVoiceInput = () => {
    setShowVoiceInput(!showVoiceInput);
  };

  const renderChatBubble: ListRenderItem<ChatMessage> = ({ item }) => {
    const isBot = item.role === 'bot';
    const isCurrentlySpeaking = isSpeaking && item.id === speakingMessageId;
    
    return (
      <View style={[
        styles.messageBubble,
        isBot ? styles.botBubble : [styles.userBubble, { backgroundColor: theme.primary }]
      ]}>
        <Text style={[
          styles.messageText,
          isBot ? styles.botMessage : styles.userMessage
        ]}>
          {item.content}
        </Text>
        
        {isBot && (
          <TouchableOpacity 
            style={styles.speakButton} 
            onPress={() => isCurrentlySpeaking ? stopSpeaking() : speakMessage(item)}
          >
            <Ionicons 
              name={isCurrentlySpeaking ? "stop-circle" : "volume-medium"} 
              size={20} 
              color={theme.primary} 
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.cardBackground} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.chatListContainer}>
          <FlatList
            ref={flatListRef}
            data={chatHistory}
            renderItem={renderChatBubble}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.chatContainer,
              { paddingBottom: keyboardHeight > 0 ? keyboardHeight : showVoiceInput ? 200 : 90 }
            ]}
            showsVerticalScrollIndicator={false}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={15}
            removeClippedSubviews={Platform.OS === 'android'}
            keyboardShouldPersistTaps="handled"
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 10
            }}
          />

          {isLoading && (
            <TypingIndicator />
          )}

          <View style={styles.scrollButtonsContainer}>
            <TouchableOpacity 
              style={styles.scrollButton} 
              onPress={scrollUp}
            >
              <Ionicons name="chevron-up" size={24} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.scrollButton} 
              onPress={scrollDown}
            >
              <Ionicons name="chevron-down" size={24} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>
        
        {showVoiceInput ? (
          <View style={styles.voiceInputContainer}>
            <MicrophoneTranscriber onTranscriptionComplete={handleTranscriptionComplete} />
            <TouchableOpacity 
              style={styles.closeVoiceButton} 
              onPress={toggleVoiceInput}
            >
              <Text style={styles.closeVoiceButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? theme.divider : '#F8F8F8', color: theme.text }]}
              value={message}
              onChangeText={setMessage}
              placeholder="Type your message..."
              placeholderTextColor={theme.subText}
              multiline
              maxLength={500}
              blurOnSubmit={false}
            />
            
            <TouchableOpacity 
              style={styles.micButton} 
              onPress={toggleVoiceInput}
            >
              <Ionicons name="mic" size={24} color={theme.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                !message.trim() || isLoading ? styles.sendButtonDisabled : [styles.sendButtonActive, { backgroundColor: theme.primary }]
              ]} 
              onPress={() => sendMessage()}
              disabled={!message.trim() || isLoading}
            >
              <Ionicons 
                name="send" 
                size={24} 
                color={!message.trim() || isLoading ? theme.subText : "#FFFFFF"} 
              />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');


export default ChatBot;