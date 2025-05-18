import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput,
  StyleSheet,
  ScrollView,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Type definitions
type Coordinates = {
  latitude: number;
  longitude: number;
};

type Location = {
  coords: Coordinates;
  timestamp?: number;
};

type User = {
  userId: string;
  name: string;
};

type DebugMessage = {
  direction: string;
  content: string | object;
  timestamp: Date;
};

type DebugPanelProps = {
  isVisible: boolean;
  onClose: () => void;
  wsConnection: WebSocket | null;
  currentUser: User | null;
  location: Location | null;
  onManualLocationSet: (location: Location) => void;
  debugMessages: DebugMessage[];
};

const DebugPanel: React.FC<DebugPanelProps> = ({ 
  isVisible, 
  onClose, 
  wsConnection, 
  currentUser,
  location,
  onManualLocationSet,
  debugMessages
}) => {
  const [manualLatitude, setManualLatitude] = useState<string>(
    location ? String(location.coords.latitude) : '37.7749'
  );
  const [manualLongitude, setManualLongitude] = useState<string>(
    location ? String(location.coords.longitude) : '-122.4194'
  );
  const [manualUserId, setManualUserId] = useState<string>(
    currentUser ? currentUser.userId : 'test-user-' + Math.floor(Math.random() * 1000)
  );
  const [manualName, setManualName] = useState<string>(
    currentUser ? currentUser.name : 'TestUser'
  );
  const [debugMessage, setDebugMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'chat' | 'ping' | 'custom'>('chat');

  const sendManualMessage = (): void => {
    if (!wsConnection || wsConnection.readyState !== 1 || !debugMessage.trim()) {
      return;
    }

    if (messageType === 'chat') {
      wsConnection.send(JSON.stringify({
        type: 'chat',
        userId: manualUserId,
        name: manualName,
        message: debugMessage.trim(),
        timestamp: new Date().toISOString()
      }));
    } else if (messageType === 'ping') {
      wsConnection.send(JSON.stringify({ type: 'ping' }));
    } else if (messageType === 'custom') {
      try {
        // Allow sending any valid JSON
        const customObj = JSON.parse(debugMessage);
        wsConnection.send(JSON.stringify(customObj));
      } catch (e) {
        console.error('Invalid JSON:', e);
      }
    }
    setDebugMessage('');
  };

  const updateLocation = (): void => {
    const newLocation: Location = {
      coords: {
        latitude: parseFloat(manualLatitude) || 37.7749,
        longitude: parseFloat(manualLongitude) || -122.4194
      }
    };
    onManualLocationSet(newLocation);
  };

  return (
    <Modal 
      visible={isVisible} 
      animationType="slide"
      transparent={false}
    >
      <View style={styles.debugContainer}>
        <View style={styles.debugHeader}>
          <Text style={styles.debugTitle}>Debug Panel</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.debugContent}>
          {/* Location Override */}
          <View style={styles.debugSection}>
            <Text style={styles.debugSectionTitle}>Manual Location</Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Latitude:</Text>
              <TextInput
                style={styles.debugInput}
                value={manualLatitude}
                onChangeText={setManualLatitude}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Longitude:</Text>
              <TextInput
                style={styles.debugInput}
                value={manualLongitude}
                onChangeText={setManualLongitude}
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity style={styles.debugButton} onPress={updateLocation}>
              <Text style={styles.debugButtonText}>Update Location</Text>
            </TouchableOpacity>
          </View>

          {/* User Override */}
          <View style={styles.debugSection}>
            <Text style={styles.debugSectionTitle}>User Override</Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>User ID:</Text>
              <TextInput
                style={styles.debugInput}
                value={manualUserId}
                onChangeText={setManualUserId}
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Name:</Text>
              <TextInput
                style={styles.debugInput}
                value={manualName}
                onChangeText={setManualName}
              />
            </View>
          </View>

          {/* Manual Message */}
          <View style={styles.debugSection}>
            <Text style={styles.debugSectionTitle}>Send Message</Text>
            <View style={styles.messageTypeContainer}>
              <TouchableOpacity 
                style={[
                  styles.messageTypeButton, 
                  messageType === 'chat' && styles.messageTypeSelected
                ]}
                onPress={() => setMessageType('chat')}
              >
                <Text style={messageType === 'chat' ? styles.messageTypeTextSelected : styles.messageTypeText}>Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.messageTypeButton, 
                  messageType === 'ping' && styles.messageTypeSelected
                ]}
                onPress={() => setMessageType('ping')}
              >
                <Text style={messageType === 'ping' ? styles.messageTypeTextSelected : styles.messageTypeText}>Ping</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.messageTypeButton, 
                  messageType === 'custom' && styles.messageTypeSelected
                ]}
                onPress={() => setMessageType('custom')}
              >
                <Text style={messageType === 'custom' ? styles.messageTypeTextSelected : styles.messageTypeText}>Custom</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.debugInput, styles.messageInput]}
              value={debugMessage}
              onChangeText={setDebugMessage}
              multiline
              placeholder={messageType === 'custom' ? 'Enter valid JSON...' : 'Enter message...'}
            />
            <TouchableOpacity 
              style={styles.debugButton} 
              onPress={sendManualMessage}
              disabled={!wsConnection || wsConnection.readyState !== 1}
            >
              <Text style={styles.debugButtonText}>Send</Text>
            </TouchableOpacity>
          </View>

          {/* WebSocket Messages Log */}
          <View style={styles.debugSection}>
            <Text style={styles.debugSectionTitle}>WebSocket Log</Text>
            <View style={styles.logContainer}>
              {debugMessages.map((msg, index) => (
                <View key={index} style={styles.logItem}>
                  <Text style={styles.logDirection}>{msg.direction}</Text>
                  <Text style={styles.logTimestamp}>{new Date(msg.timestamp).toLocaleTimeString()}</Text>
                  <Text style={styles.logContent}>
                    {typeof msg.content === 'object' ? JSON.stringify(msg.content) : msg.content}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  debugContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  debugTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  debugContent: {
    flex: 1,
  },
  debugSection: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  debugSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputLabel: {
    width: 80,
    fontSize: 14,
  },
  debugInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 5,
    padding: 8,
  },
  messageInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  debugButton: {
    backgroundColor: '#4A90E2',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  debugButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  messageTypeContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  messageTypeButton: {
    padding: 8,
    borderRadius: 5,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  messageTypeSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  messageTypeText: {
    color: '#333',
  },
  messageTypeTextSelected: {
    color: '#FFF',
  },
  logContainer: {
    backgroundColor: '#F0F0F0',
    padding: 10,
    borderRadius: 5,
    maxHeight: 200,
  },
  logItem: {
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
    paddingBottom: 5,
  },
  logDirection: {
    fontWeight: 'bold',
    color: '#555',
  },
  logTimestamp: {
    fontSize: 12,
    color: '#888',
  },
  logContent: {
    fontSize: 12,
  },
});

export default DebugPanel;