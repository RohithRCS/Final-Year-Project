import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { useAuth } from './AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';

// Define the navigation param list type
type RootStackParamList = {
  Signup: undefined;
  Login: undefined;
  MainApp: undefined;
};

// Define the navigation prop type for this screen
type SignupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Signup'>;

// Define the props type for the SignupScreen component
interface SignupScreenProps {
  navigation: SignupScreenNavigationProp;
}

// Define user data interface
interface UserData {
  Firstname: string;
  lastname: string;
  PhoneNumber: string;
  password: string;
  Height: string;
  weight: string;
  DOB: string;
}

// Define register result interface
interface RegisterResult {
  success: boolean;
  error?: string;
}

const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [dob, setDob] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();

  const validateInputs = (): boolean => {
    if (!firstname.trim() || !lastname.trim() || !phoneNumber.trim() || !password.trim() || !height.trim() || !weight.trim() || !dob.trim()) {
      Alert.alert('Error', 'All fields are required');
      return false;
    }

    if (isNaN(Number(phoneNumber)) || phoneNumber.length < 10) {
      Alert.alert('Error', 'Enter a valid phone number');
      return false;
    }

    if (isNaN(Number(height)) || Number(height) <= 0) {
      Alert.alert('Error', 'Enter a valid height in cm');
      return false;
    }

    if (isNaN(Number(weight)) || Number(weight) <= 0) {
      Alert.alert('Error', 'Enter a valid weight in kg');
      return false;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      Alert.alert('Error', 'Enter a valid date of birth (YYYY-MM-DD)');
      return false;
    }

    return true;
  };

  const handleSignup = async (): Promise<void> => {
    if (!validateInputs()) return;

    setIsLoading(true);

    try {
      const userData: UserData = {
        Firstname: firstname.trim(),
        lastname: lastname.trim(),
        PhoneNumber: phoneNumber.trim(),
        password: password.trim(),
        Height: height.trim(),
        weight: weight.trim(),
        DOB: dob.trim(),
      };

      const result: RegisterResult = await register(userData);

      if (result.success) {
        Alert.alert('Success', 'Account created successfully! Please login.');
        navigation.navigate('Login');
      } else {
        Alert.alert('Error', result.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error("Signup error:", error);
      Alert.alert('Error', 'Something went wrong. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const onDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formatted = selectedDate.toISOString().split('T')[0];
      setDob(formatted);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
      <TextInput style={styles.input} placeholder="First Name" value={firstname} onChangeText={setFirstname} />
      <TextInput style={styles.input} placeholder="Last Name" value={lastname} onChangeText={setLastname} />
      <TextInput style={styles.input} placeholder="Phone Number" keyboardType="numeric" value={phoneNumber} onChangeText={setPhoneNumber} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <TextInput style={styles.input} placeholder="Height (cm)" keyboardType="numeric" value={height} onChangeText={setHeight} />
      <TextInput style={styles.input} placeholder="Weight (kg)" keyboardType="numeric" value={weight} onChangeText={setWeight} />

      <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
        <Text style={{ color: dob ? '#000' : '#888' }}>
          {dob || 'Date of Birth (YYYY-MM-DD)'}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={dob ? new Date(dob) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          maximumDate={new Date()}
          minimumDate={new Date('1900-01-01')}
        />
      )}

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSignup}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>{isLoading ? 'Signing Up...' : 'Sign Up'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={isLoading}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f9f9f9' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { width: '100%', padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 10, backgroundColor: '#fff' },
  button: { backgroundColor: '#4285F4', padding: 12, borderRadius: 8, width: '100%', alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#A9A9A9' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  linkText: { color: '#4285F4', marginTop: 10 },
});

export default SignupScreen;
