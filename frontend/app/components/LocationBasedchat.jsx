import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  TextInput, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  AppState,
  Modal,
  Animated,
} from 'react-native';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './AuthContext'; 
import { BASE_URL } from './config';
import { useTheme } from './ThemeContext'

const LocationBasedChat = () => {
  const { currentUser, getAuthHeader } = useAuth();
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [chatInitialized, setChatInitialized] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [appState, setAppState] = useState(AppState.currentState);
  const [serverIp, setServerIp] = useState('');
  const [showUsersList, setShowUsersList] = useState(false);
  const { theme } = useTheme();
  
  // Voice message states
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [playingMessageId, setPlayingMessageId] = useState(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  
  const [showIntroModal, setShowIntroModal] = useState(true);
  const introAnimation = useRef(new Animated.Value(0)).current;
  // Animation values
  const recordingAnimation = useRef(new Animated.Value(1)).current;
  
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttempts = 10;
  const ws = useRef(null);
  const flatListRef = useRef(null);
  const recordingTimerRef = useRef(null);

  useEffect(() => {
    try {
      const url = new URL(BASE_URL);
      setServerIp(url.hostname);
    } catch (e) {
      setServerIp(BASE_URL.replace(/^https?:\/\//, '').split(':')[0]);
    }
  }, []);

  useEffect(() => {
  return () => {
    stopPlayingVoiceMessage();
  };
}, []);

useEffect(() => {
  if (showIntroModal) {
    Animated.timing(introAnimation, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }
}, [showIntroModal]);

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant microphone permissions to use voice messaging.');
      }
    })();
    
    return () => {
      stopRecording();
      if (playingAudio) {
        playingAudio.unloadAsync();
      }
    };
  }, []);

  const getWebSocketUrl = () => {
    if (__DEV__) {
      return 'wss://final-year-project-5wgk.onrender.com/ws/localchat'; // Change this to your local IP
    }
    return BASE_URL.replace('http', 'ws') + '/ws/localchat';
  };

  const handleJoinFromIntro = () => {
  setShowIntroModal(false);
  initializeChat();
};

  const fetchWithTimeout = async (url, options, timeout = 10000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  };
  
  const fetchWithRetry = async (url, options, maxRetries = 3) => {
    let lastError = new Error('Unknown error');
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fetch(url, options);
      } catch (error) {
        lastError = error;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
    
    throw lastError;
  };

  // Monitor app state changes (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState);
      
      // When app comes back to foreground, check WebSocket connection
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        if (chatInitialized && (!ws.current || ws.current.readyState !== WebSocket.OPEN)) {
          initializeChat(true);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [appState, chatInitialized]);

  useEffect(() => {
  (async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      setLoading(false);
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      await saveUserLocation(location.coords);
      await fetchNearbyUsers(location.coords);
      setLoading(false);
      // Remove any auto-initialization of chat that might be here
    } catch (error) {
      setErrorMsg('Could not fetch location data');
      setLoading(false);
    }
  })();

  return () => {
    if (ws.current) {
      ws.current.close();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  };
}, []);


  const saveUserLocation = async (coords) => {
    try {
      const response = await fetchWithTimeout(`${BASE_URL}/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          userId: currentUser.userId,
          latitude: coords.latitude,
          longitude: coords.longitude
        })
      }, 15000);
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save location');
      }
    } catch (error) {
      Alert.alert("Error", "Failed to save your location");
    }
  };

  const fetchNearbyUsers = async (coords) => {
    try {
      const response = await fetchWithRetry(
        `${BASE_URL}/nearby?latitude=${coords.latitude}&longitude=${coords.longitude}&radius=1000`,
        {
          headers: getAuthHeader()
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch nearby users');
      }

      const data = await response.json();
      
      // Format nearby users from response
      const formattedUsers = data.map((user) => ({
        userId: user.userId,
        name: user.name || `User ${String(user.userId).slice(-4)}`,
        location: user.location
      }));
      
      setNearbyUsers(formattedUsers.filter((user) => user.userId !== currentUser.userId));
      return formattedUsers;
    } catch (error) {
      Alert.alert("Error", "Failed to find nearby users");
      return [];
    }
  };

  const initializeChat = (isReconnect = false) => {
    if (!location) {
      Alert.alert("Error", "Location data is not available");
      return;
    }

    try {
      // Close existing connection if any
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
      
      const wsUrl = getWebSocketUrl();
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        // Reset reconnect attempts on successful connection
        setReconnectAttempts(0);
        
        // Send user info and location to join the local chat group
        const joinMessage = {
          type: 'join',
          userId: currentUser.userId,
          name: currentUser.firstName && currentUser.lastName 
            ? `${currentUser.firstName} ${currentUser.lastName}`
            : `User ${String(currentUser.userId).slice(-4)}`,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          radius: 1000, // 1km radius
          reconnect: isReconnect // Tell server if this is a reconnection
        };
        
        ws.current?.send(JSON.stringify(joinMessage));
        setChatInitialized(true);
      };

     ws.current.onmessage = (e) => {
  try {
    const data = JSON.parse(e.data);
    
    if (data.type === 'pong') {
      return; // Ignore pong messages
    }
    
    if (data.type === 'error') {
      return; // Ignore error messages
    }
    
    // Only add messages that are chat or voice type (filter out system)
    if (data.type === 'chat' || data.type === 'voice') {
      setMessages(prev => [...prev, data]);
    }
  } catch (error) {
    // Silent error handling
  }
};

    ws.current.onerror = (e) => {
  // Silent error handling, don't show alerts
  console.error("WebSocket error:", e);
};
      ws.current.onclose = (e) => {
  // Attempt to reconnect without showing error dialogs
  if (!e.wasClean && reconnectAttempts < maxReconnectAttempts) {
    const nextAttempt = reconnectAttempts + 1;
    setReconnectAttempts(nextAttempt);
    
    // Exponential backoff for reconnection attempts
    const timeout = Math.min(1000 * Math.pow(2, nextAttempt), 30000);
    
    // Clear any existing timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    // Set new timeout for reconnection
    reconnectTimeoutRef.current = setTimeout(() => {
      initializeChat(true); // Pass true to indicate this is a reconnection
    }, timeout);
  } else if (reconnectAttempts >= maxReconnectAttempts) {
    // Just reset chat initiation state without showing alert
    setChatInitialized(false);
  }
};
      // Implement a ping/pong mechanism to keep the connection alive
      const pingInterval = setInterval(() => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ type: 'ping' }));
        }
      }, 20000); // Send ping every 20 seconds

      // Return cleanup function
      return () => clearInterval(pingInterval);
    } catch (error) {
      Alert.alert("Error", "Failed to initialize chat");
    }
  };


  // Add this to useEffect to clean up reconnect timeout
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []); 

  const sendMessage = () => {
  if (!messageText.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) {
    if (ws.current?.readyState !== WebSocket.OPEN) {
      // Silently try to reconnect instead of showing an error
      setChatInitialized(false);
      initializeChat(true);
    }
    return;
  }

  try {
    const userName = currentUser.firstName && currentUser.lastName 
      ? `${currentUser.firstName} ${currentUser.lastName}`
      : `User ${String(currentUser.userId).slice(-4)}`;
    
    const chatMessage = {
      type: 'chat',
      userId: currentUser.userId,
      name: userName,
      message: messageText.trim(),
      timestamp: new Date().toISOString()
    };
    
    ws.current.send(JSON.stringify(chatMessage));
    setMessageText('');
    Keyboard.dismiss();
  } catch (error) {
    // Silent error handling instead of showing Alert
    console.error("Failed to send message:", error);
  }
};

  // Voice recording functions
  const startRecording = async () => {
    try {
      // Set up audio recording session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      // Create recording object
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
      setShowVoiceModal(true);
      
      // Start recording duration timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      // Start animation
      startRecordingAnimation();
      
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording');
    }
  };
  
  const stopRecording = async () => {
    if (!recording) return;
    
    try {
      await recording.stopAndUnloadAsync();
      clearInterval(recordingTimerRef.current);
      
      // Stop animation
      Animated.timing(recordingAnimation).stop();
      
      setIsRecording(false);
      
      // Get the recording URI
      const uri = recording.getURI();
      
      setRecording(null);
      setRecordingDuration(0);
      setShowVoiceModal(false);
      
      return uri;
    } catch (error) {
      Alert.alert('Error', 'Failed to stop recording');
      setIsRecording(false);
      setRecording(null);
      setRecordingDuration(0);
      setShowVoiceModal(false);
    }
  };
  
  const cancelRecording = async () => {
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        clearInterval(recordingTimerRef.current);
        // Stop animation
        Animated.timing(recordingAnimation).stop();
      } catch (error) {
        // Silent error handling
      }
    }
    
    setIsRecording(false);
    setRecording(null);
    setRecordingDuration(0);
    setShowVoiceModal(false);
  };
  
  const sendVoiceMessage = async () => {
    try {
      const uri = await stopRecording();
      if (!uri) return;
      
      // Show a loading indicator
      setIsRecording(false);
      setShowVoiceModal(false);
      
      // Convert audio file to base64
      const response = await fetch(uri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          try {
            const base64data = reader.result.split(',')[1];
            
            // Send voice message through WebSocket
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
              const userName = currentUser.firstName && currentUser.lastName 
                ? `${currentUser.firstName} ${currentUser.lastName}`
                : `User ${String(currentUser.userId).slice(-4)}`;
              
              const voiceMessage = {
                type: 'voice',
                userId: currentUser.userId,
                name: userName,
                audioData: base64data,
                duration: recordingDuration,
                timestamp: new Date().toISOString(),
                mimeType: 'audio/webm' // Specify we're sending webm that will be converted to mp3
              };
              
              ws.current.send(JSON.stringify(voiceMessage));
              resolve();
            } else {
              Alert.alert("Connection Error", "Chat connection lost. Please reconnect.");
              setChatInitialized(false);
              reject(new Error('WebSocket not connected'));
            }
          } catch (error) {
            Alert.alert("Error", "Failed to process voice message");
            reject(error);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to send voice message');
    }
  };

  const playVoiceMessage = async (message, messageId) => {
  try {
    // Stop any currently playing audio
    if (playingAudio) {
      await playingAudio.stopAsync();
      await playingAudio.unloadAsync();
      setPlayingAudio(null);
      setPlayingMessageId(null);
    }
    
    // If we're clicking on the same message that's already playing, just stop
    if (messageId === playingMessageId) {
      return;
    }
    
    // Create a sound object
    const sound = new Audio.Sound();
    
    console.log("Playing voice message:", message); // Add this for debugging
    
    // Determine source based on what the server sent
    let audioSource;
    if (message.voiceUrl) {
      // Get base server URL (remove WebSocket path)
      const serverUrl = BASE_URL;
      
      // Clean up the voiceUrl path if needed
      const voicePath = message.voiceUrl.startsWith('/') ? message.voiceUrl : `/${message.voiceUrl}`;
      
      // Construct the full URL
      const fullUrl = `${serverUrl}${voicePath}`;
      
      console.log("Playing from URL:", fullUrl); // Add this for debugging
      
      // Check file extension to use correct MIME type
      const fileExtension = fullUrl.split('.').pop().toLowerCase();
      let contentType = 'audio/webm'; // Default
      
      if (fileExtension === 'mp3') {
        contentType = 'audio/mp3';
      } else if (fileExtension === 'm4a') {
        contentType = 'audio/m4a';
      }
      
      // For React Native, we just need the URI, but we're logging the content type for debugging
      console.log("Content type detected:", contentType);
      
      audioSource = { uri: fullUrl };
    } else if (message.audioData) {
      console.log("Playing from base64 data"); // Add this for debugging
      
      // Use the message's MIME type if available, otherwise default to webm
      const mimeType = message.mimeType || 'audio/webm';
      audioSource = { uri: `data:${mimeType};base64,${message.audioData}` };
    } else {
      throw new Error('No playable audio source found');
    }
    
    // Load and play audio
    await sound.loadAsync(audioSource);
    await sound.playAsync();
    
    // Set as currently playing
    setPlayingAudio(sound);
    setPlayingMessageId(messageId);
    
    // When finished, reset playing state
    sound.setOnPlaybackStatusUpdate(status => {
      if (status.didJustFinish) {
        sound.unloadAsync();
        setPlayingAudio(null);
        setPlayingMessageId(null);
      }
    });
  } catch (error) {
    console.error('Failed to play voice message:', error);
    Alert.alert('Error', `Failed to play voice message: [${error.message}]`);
    setPlayingAudio(null);
    setPlayingMessageId(null);
  }
};
  
  const stopPlayingVoiceMessage = async () => {
    if (playingAudio) {
      try {
        await playingAudio.stopAsync();
        await playingAudio.unloadAsync();
        setPlayingAudio(null);
        setPlayingMessageId(null);
      } catch (error) {
        // Silent error handling
      }
    }
  };
  
  const formatAudioDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const startRecordingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(recordingAnimation, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(recordingAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (location) {
        await fetchNearbyUsers(location.coords);
      } else {
        const location = await Location.getCurrentPositionAsync({});
        setLocation(location);
        await saveUserLocation(location.coords);
        await fetchNearbyUsers(location.coords);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return "Invalid time";
    }
  };

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.userId === currentUser.userId;
    const isVoice = item.type === 'voice';
    const isPlaying = playingMessageId === `${item.timestamp}-${item.userId}`;
    
    if (item.type === 'system') {
      return null;
    }
    
    if (isVoice) {
      return (
        <View style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
        ]}>
          {!isOwnMessage && <Text style={[styles.messageSender, { color: theme.subText }]}>{item.name}</Text>}
          <View style={[
            styles.messageBubble,
            styles.voiceMessageBubble,
            isOwnMessage ? [styles.ownMessageBubble, { backgroundColor: theme.primary }] 
                        : [styles.otherMessageBubble, { backgroundColor: theme.cardBackground }]
          ]}>
            <TouchableOpacity 
              style={styles.voiceMessageContent}
              onPress={() => {
                if (isPlaying) {
                  stopPlayingVoiceMessage();
                } else {
                  playVoiceMessage(item, `${item.timestamp}-${item.userId}`);
                }
              }}
            >
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={20} 
                color={isOwnMessage ? "#FFF" : theme.primary} 
              />
              <View style={styles.voiceWaveform}>
                {[...Array(8)].map((_, i) => (
                  <View 
                    key={i} 
                    style={[
                      styles.waveformBar,
                      { 
                        height: 4 + Math.random() * 12,
                        backgroundColor: isOwnMessage ? "#FFF" : theme.primary 
                      }
                    ]} 
                  />
                ))}
              </View>
              <Text style={[
                styles.voiceDuration,
                isOwnMessage ? { color: '#FFF' } : { color: theme.text }
              ]}>{formatAudioDuration(item.duration || 0)}</Text>
            </TouchableOpacity>
            <Text style={[
              styles.messageTime,
              isOwnMessage ? { color: 'rgba(255,255,255,0.7)' } : { color: theme.subText }
            ]}>{formatTime(item.timestamp)}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        {!isOwnMessage && <Text style={[styles.messageSender, { color: theme.subText }]}>{item.name}</Text>}
        <View style={[
          styles.messageBubble,
          isOwnMessage ? [styles.ownMessageBubble, { backgroundColor: theme.primary }] 
                      : [styles.otherMessageBubble, { backgroundColor: theme.cardBackground }]
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? { color: '#FFF' } : { color: theme.text }
          ]}>{item.message}</Text>
          <Text style={[
            styles.messageTime,
            isOwnMessage ? { color: 'rgba(255,255,255,0.7)' } : { color: theme.subText }
          ]}>{formatTime(item.timestamp)}</Text>
        </View>
      </View>
    );
  };

  const renderNearbyUser = ({ item }) => (
    <View style={styles.userItem}>
      <Ionicons name="person-circle-outline" size={36} color="#4A90E2" />
      <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
        {item.name || `User ${String(item.userId).slice(-4)}`}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Finding nearby users...</Text>
        <Text style={[styles.serverInfo, { color: theme.subText }]}>Connected to: {serverIp}</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <Ionicons name="alert-circle" size={50} color="#E74C3C" />
        <Text style={[styles.errorText, { color: theme.text }]}>{errorMsg}</Text>
        <Text style={[styles.serverInfo, { color: theme.subText }]}>Server: {serverIp}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={() => {
            setLoading(true);
            setErrorMsg(null);
            (async () => {
              try {
                const location = await Location.getCurrentPositionAsync({});
                setLocation(location);
                await saveUserLocation(location.coords);
                await fetchNearbyUsers(location.coords);
                setLoading(false);
              } catch (error) {
                setErrorMsg('Could not fetch location data');
                setLoading(false);
              }
            })();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {/* Status bar with connection info */}
      <View style={[styles.statusBar, { backgroundColor: theme.cardBackground, borderBottomColor: theme.divider }]}>
        <Text style={[styles.statusText, { color: theme.text }]}>
          {chatInitialized ? 'Connected' : 'Disconnected'} • {serverIp}
        </Text>
      </View>
      
      {/* Main content */}
      {chatInitialized ? (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => `${item.timestamp}-${index}`}
          contentContainerStyle={[styles.messagesList, { backgroundColor: theme.background }]}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <>
              {/* Header with nearby users */}
              <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.divider }]}>
  <View style={styles.headerContent}>
    <Ionicons name="people" size={20} color={theme.primary} />
    <Text style={[styles.headerTitle, { color: theme.text }]}>
      Nearby Users ({nearbyUsers.length})
    </Text>
  </View>
  <View style={styles.headerButtons}>
    <TouchableOpacity 
      onPress={() => setShowUsersList(!showUsersList)}
      style={styles.toggleButton}
    >
      <Ionicons 
        name={showUsersList ? "chevron-up" : "chevron-down"} 
        size={24} 
        color={theme.primary} 
      />
    </TouchableOpacity>
  </View>
</View>
{showUsersList && (
  nearbyUsers.length > 0 ? (
    <FlatList
      data={nearbyUsers}
      renderItem={({ item }) => (
        <View style={styles.userItem}>
          <Ionicons name="person-circle-outline" size={36} color={theme.primary} />
          <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">
            {item.name || `User ${String(item.userId).slice(-4)}`}
          </Text>
        </View>
      )}
      keyExtractor={item => item.userId}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.userList, { backgroundColor: theme.cardBackground }]}
    />
  ) : (
    <View style={[styles.emptyUserList, { backgroundColor: theme.cardBackground }]}>
      <Ionicons name="people-outline" size={48} color={theme.subText} />
      <Text style={[styles.emptyUserListText, { color: theme.text }]}>No nearby users found</Text>
      <Text style={[styles.emptyUserListSubtext, { color: theme.subText }]}>
        Move around to discover people near you
      </Text>
    </View>
  )
)}
            </>
          }
          ListEmptyComponent={() => (
            <View style={[styles.emptyChat, { backgroundColor: theme.background }]}>
              <Ionicons name="chatbubbles-outline" size={48} color={theme.subText} />
              <Text style={[styles.emptyChatText, { color: theme.text }]}>
                Say hello to start the conversation!
              </Text>
            </View>
          )}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      ) : (
      <Modal
  visible={showIntroModal && !chatInitialized}
  transparent
  animationType="fade"
  onRequestClose={() => setShowIntroModal(false)}
>
  <View style={styles.modalOverlay}>
    <Animated.View 
      style={[
        styles.introModalContent, 
        { 
          backgroundColor: theme.cardBackground,
          opacity: introAnimation,
          transform: [
            { 
              translateY: introAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0]
              })
            }
          ]
        }
      ]}
    >
      <View style={styles.introIconContainer}>
        <Ionicons name="people-circle" size={60} color={theme.primary} />
        <View style={styles.introMapMarker}>
          <Ionicons name="location" size={24} color="#E74C3C" />
        </View>
      </View>
      
      <Text style={[styles.introTitle, { color: theme.text }]}>Welcome to LocalChat</Text>
      
      <Text style={[styles.introDescription, { color: theme.subText }]}>
        Connect with {nearbyUsers.length} people nearby in real-time. Chat, share voice messages, and meet new friends in your area.
      </Text>
      
      <View style={styles.introFeatures}>
        <View style={styles.featureItem}>
          <Ionicons name="wifi" size={24} color={theme.primary} />
          <Text style={[styles.featureText, { color: theme.text }]}>Real-time chat</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="mic" size={24} color={theme.primary} />
          <Text style={[styles.featureText, { color: theme.text }]}>Voice messages</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="shield-checkmark" size={24} color={theme.primary} />
          <Text style={[styles.featureText, { color: theme.text }]}>Privacy focused</Text>
        </View>
      </View>
      
      <View style={styles.introButtons}>

        <TouchableOpacity 
          style={[styles.introPrimaryButton, { backgroundColor: theme.primary }]}
          onPress={handleJoinFromIntro}
        >
          <Text style={styles.introPrimaryButtonText}>Join Chat Now</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" style={styles.buttonIcon} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  </View>
</Modal>

      )}

      {chatInitialized && (
        <View style={[styles.inputContainer, { backgroundColor: theme.cardBackground, borderTopColor: theme.divider }]}>
          <TouchableOpacity 
            style={styles.voiceButton}
            onPress={isRecording ? cancelRecording : startRecording}
          >
            <Ionicons 
              name={isRecording ? "close-circle" : "mic"} 
              size={24} 
              color={isRecording ? "#E74C3C" : theme.primary} 
            />
          </TouchableOpacity>
          
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.background,
              color: theme.text,
              borderColor: theme.divider
            }]}
            placeholder="Type a message..."
            placeholderTextColor={theme.subText}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={500}
          />
          
          <TouchableOpacity 
            style={[
              styles.sendButton,
              !messageText.trim() ? styles.sendButtonDisabled : {}
            ]}
            onPress={sendMessage}
            disabled={!messageText.trim()}
          >
            <Ionicons 
              name="send" 
              size={24} 
              color={!messageText.trim() ? theme.subText : theme.primary} 
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Voice recording modal */}
      <Modal
        visible={showVoiceModal}
        transparent
        animationType="fade"
        onRequestClose={cancelRecording}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={cancelRecording}
        >
          <View style={[styles.voiceModalContent, { backgroundColor: theme.cardBackground }]}>
            <Animated.View style={[
              styles.recordingAnimation,
              { transform: [{ scale: recordingAnimation }] }
            ]}>
              <Ionicons name="mic" size={48} color="#E74C3C" />
            </Animated.View>
            
            <Text style={[styles.voiceModalTitle, { color: theme.text }]}>Recording...</Text>
            <Text style={[styles.voiceModalDuration, { color: '#E74C3C' }]}>{formatAudioDuration(recordingDuration)}</Text>
            
            <View style={styles.voiceModalButtons}>
              <TouchableOpacity 
                style={[styles.voiceModalButton, { backgroundColor: theme.background }]}
                onPress={cancelRecording}
              >
                <Text style={[styles.voiceModalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.voiceModalButton, { backgroundColor: theme.primary }]}
                onPress={sendVoiceMessage}
              >
                <Text style={[styles.voiceModalButtonText, { color: '#FFF' }]}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop:-25,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 10,
  },
  serverInfo: {
    fontSize: 12,
    marginTop: 5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusBar: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  statusText: {
    fontSize: 12,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginTop:35,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  refreshButton: {
    padding: 4,
  },
  userList: {
    padding: 12,
  },
  userItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 60,
  },
  userName: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 60,
  },
  emptyUserList: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyUserListText: {
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  emptyUserListSubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chatHeaderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  startChatSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  startChatText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  startChatButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  startChatButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  messagesList: {
    paddingBottom: 12,
  },
  messageContainer: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageSender: {
    fontSize: 12,
    marginBottom: 2,
    marginLeft: 4,
  },
  messageBubble: {
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    maxWidth: '80%',
  },
  ownMessageBubble: {},
  otherMessageBubble: {},
  voiceMessageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  emptyChat: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 200,
  },
  emptyChatText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  voiceButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
    marginHorizontal: 8,
    borderWidth: 1,
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  voiceMessageContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    height: 20,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
    marginHorizontal: 1,
  },
  voiceDuration: {
    fontSize: 12,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceModalContent: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    width: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  recordingAnimation: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  voiceModalDuration: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 24,
  },
  voiceModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  voiceModalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    width: '45%',
    alignItems: 'center',
  },
  voiceModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  introModalContent: {
  borderRadius: 16,
  padding: 24,
  width: '90%',
  maxWidth: 400,
  elevation: 5,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 8,
},
introIconContainer: {
  alignSelf: 'center',
  marginBottom: 20,
  position: 'relative',
},
introMapMarker: {
  position: 'absolute',
  bottom: -4,
  right: -10,
  backgroundColor: 'white',
  borderRadius: 15,
  padding: 4,
  borderWidth: 2,
  borderColor: '#E74C3C'
},
introTitle: {
  fontSize: 24,
  fontWeight: 'bold',
  textAlign: 'center',
  marginBottom: 12,
},
introDescription: {
  fontSize: 16,
  textAlign: 'center',
  marginBottom: 24,
  lineHeight: 22,
},
introFeatures: {
  marginBottom: 30,
},
featureItem: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 12,
},
featureText: {
  fontSize: 16,
  marginLeft: 12,
},
introButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
},
introPrimaryButton: {
  paddingVertical: 14,
  paddingHorizontal: 20,
  borderRadius: 25,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  marginLeft: 8,
},
introPrimaryButtonText: {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '600',
},
introSecondaryButton: {
  paddingVertical: 14,
  paddingHorizontal: 20,
  borderRadius: 25,
  borderWidth: 1,
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  marginRight: 8,
},
introSecondaryButtonText: {
  fontSize: 16,
  fontWeight: '500',
},
buttonIcon: {
  marginLeft: 8,
},
});

export default LocationBasedChat;