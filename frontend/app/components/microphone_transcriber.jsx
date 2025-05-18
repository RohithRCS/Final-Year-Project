import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  Platform,
  PermissionsAndroid
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { BASE_URL } from "./config";
import axios from 'axios';

const MicrophoneTranscriber = ({ onTranscriptionComplete }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recording, setRecording] = useState(null);

  useEffect(() => {
    // Clean up when component unmounts
    return () => {
      if (recording) {
        stopRecording();
      }
    };
  }, []);

  const requestMicrophonePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone for transcription.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Microphone permission is required for transcription.');
        }
      } catch (err) {
        console.error('Failed to request permission:', err);
      }
    }
  };

  const startRecording = async () => {
    try {
      // Configure audio recording
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      console.log('Starting recording...');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsListening(true);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('Recording Error', `Failed to start recording: ${err.message}`);
    }
  };

  const stopRecording = async () => {
    console.log('Stopping recording...');
    if (!recording) return;
    
    setIsListening(false);
    setIsProcessing(true);
    
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log('Recording stopped and stored at', uri);
      setRecording(null);
      
      await sendAudioToServer(uri);
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setIsProcessing(false);
      Alert.alert('Recording Error', `Failed to stop recording: ${err.message}`);
    }
  };

  const sendAudioToServer = async (audioUri) => {
    try {
      console.log('Sending audio to server...');
      
      // Create form data to send the audio file
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a', // Adjust based on the actual file type
        name: 'recording.m4a',
      });
      
      // Send the audio file to your server - direct API endpoint with no polling
      const response = await axios.post(`${BASE_URL}/transcribe`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Server response:', response.data);
      
      if (response.data.success) {
        // Get the transcription directly from the response
        const newTranscript = response.data.transcription;
        setTranscript(newTranscript);
        setIsProcessing(false);
        
        // Pass transcription to parent component if callback exists
        if (onTranscriptionComplete) {
          onTranscriptionComplete(newTranscript);
        }
      } else {
        Alert.alert('Transcription Error', response.data.message || 'Failed to transcribe audio.');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Transcription request failed:', err);
      Alert.alert('Error', `Transcription failed: ${err.message}`);
      setIsProcessing(false);
    }
  };

  const toggleRecording = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <View style={styles.container}>
      {/* Recording button */}
      <TouchableOpacity
        style={[
          styles.recordButton,
          isListening ? styles.listening : null,
          isProcessing ? styles.processing : null
        ]}
        onPress={isProcessing ? null : toggleRecording}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator size="large" color="#FFFFFF" />
        ) : (
          <FontAwesome
            name="microphone"
            size={32}
            color="#FFFFFF"
          />
        )}
      </TouchableOpacity>

      {/* Status text */}
      <Text style={styles.statusText}>
        {isProcessing ? 'Processing audio...' : 
         isListening ? 'Listening... Tap to stop' : 
         'Tap microphone to start listening'}
      </Text>

      {/* Transcript display area */}
      {transcript ? (
        <View style={styles.transcriptContainer}>
          <Text style={styles.transcriptLabel}>Transcript:</Text>
          <Text style={styles.transcriptText}>{transcript}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  listening: {
    backgroundColor: '#DB4437',
  },
  processing: {
    backgroundColor: '#F4B400',
  },
  statusText: {
    marginTop: 16,
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  transcriptContainer: {
    marginTop: 24,
    width: '100%',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  transcriptLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  transcriptText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
});

export default MicrophoneTranscriber;