import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from './AuthContext';
import { CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Define the navigation param list type
type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainApp: undefined;
};

// Define the navigation prop type for this screen
type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

// Define the props type for the LoginScreen component
interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

// Define the login result type
interface LoginResult {
  success: boolean;
  userData?: {
    firstName?: string;
    [key: string]: any;
  };
  error?: string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { login } = useAuth();

  const handleLogin = async (): Promise<void> => {
    if (!phoneNumber.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both phone number and password.');
      return;
    }
  
    setIsLoading(true);
    
    try {
      const result: LoginResult = await login(phoneNumber, password);
      
      if (result.success) {
        Alert.alert('Login Successful', `Welcome, ${result.userData?.firstName || 'User'}!`);
        
        // Navigate to MainApp
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'MainApp' }],
          })
        );
      } else {
        Alert.alert('Login Failed', result.error || 'Invalid credentials');
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert('Error', 'Unable to connect. Check your network and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        keyboardType="phone-pad"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        editable={!isLoading}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        editable={!isLoading}
      />
      
      {isLoading ? (
        <View style={styles.button}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity 
        onPress={() => navigation.navigate('Register')}
        disabled={isLoading}
      >
        <Text style={[styles.link, isLoading && styles.disabledLink]}>
          Don't have an account? Register
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20, 
    paddingTop:10,
    backgroundColor: '#f9f9f9' 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 20 
  },
  input: { 
    width: '100%', 
    padding: 12, 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 8, 
    marginBottom: 10, 
    backgroundColor: '#fff' 
  },
  button: { 
    backgroundColor: '#4285F4', 
    padding: 12, 
    borderRadius: 8, 
    width: '100%', 
    alignItems: 'center',
    justifyContent: 'center',
    height: 48
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  link: { 
    marginTop: 10, 
    color: '#4285F4' 
  },
  disabledLink: {
    opacity: 0.6
  }
});

export default LoginScreen;