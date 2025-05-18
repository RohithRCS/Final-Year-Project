import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useAuth } from './AuthContext'; 
import { useTheme } from './ThemeContext'; // Import the useTheme hook
import { Ionicons } from '@expo/vector-icons'; 

const Profile = ({ navigation }) => {
  const { currentUser, updateProfile, logout } = useAuth();
  const { theme } = useTheme(); // Get the current theme
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Form state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    height: '',
    weight: '',
    dob: ''
  });

  // Initial load of user data
  useEffect(() => {
    if (currentUser) {
      setProfileData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        phoneNumber: currentUser.phoneNumber || '',
        height: currentUser.height ? currentUser.height.toString() : '',
        weight: currentUser.weight ? currentUser.weight.toString() : '',
        dob: currentUser.dob ? formatDateForDisplay(currentUser.dob) : ''
      });
    }
  }, [currentUser]);

  // Format date from ISO to readable format
  const formatDateForDisplay = (isoDate) => {
    if (!isoDate) return '';
    try {
      const date = new Date(isoDate);
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    } catch (e) {
      return isoDate;
    }
  };

  // Handle form input changes
  const handleChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    
    const updatedData = {
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      height: profileData.height ? profileData.height : undefined,
      weight: profileData.weight ? profileData.weight : undefined
    };

    try {
      const result = await updateProfile(updatedData);
      
      if (result.success) {
        if (result.data) {
          setProfileData({
            firstName: result.data.firstName || '',
            lastName: result.data.lastName || '',
            phoneNumber: result.data.phoneNumber || '',
            height: result.data.height ? result.data.height.toString() : '',
            weight: result.data.weight ? result.data.weight.toString() : '',
            dob: result.data.dob ? formatDateForDisplay(result.data.dob) : ''
          });
        }
        
        Alert.alert('Success', 'Profile updated successfully');
        setEditMode(false);
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Render a field row based on edit mode
  const renderField = (label, value, field) => {
    return (
      <View style={[styles.fieldContainer, { borderBottomColor: theme.divider }]}>
        <Text style={[styles.fieldLabel, { color: theme.subText }]}>{label}</Text>
        {editMode && field !== 'phoneNumber' && field !== 'dob' ? (
          <TextInput
            style={[styles.input, { 
              color: theme.text, 
              borderColor: theme.divider,
              backgroundColor: theme.cardBackground
            }]}
            value={value}
            onChangeText={(text) => handleChange(field, text)}
            keyboardType={field === 'height' || field === 'weight' ? 'numeric' : 'default'}
            placeholderTextColor={theme.subText}
          />
        ) : (
          <Text style={[styles.fieldValue, { color: theme.text }]}>{value || 'Not set'}</Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <View style={[styles.profileImageContainer, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.profileInitials, { color: theme.primary }]}>
              {profileData.firstName.charAt(0) || ''}
              {profileData.lastName.charAt(0) || ''}
            </Text>
          </View>
          <Text style={[styles.profileName, { color: theme.cardBackground }]}>
            {profileData.firstName} {profileData.lastName}
          </Text>
          
          <View style={styles.actionsContainer}>
            {editMode ? (
              <View style={styles.editActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.saveButton, { backgroundColor: '#4caf50' }]} 
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Save</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.cancelButton, { backgroundColor: '#f44336' }]} 
                  onPress={() => setEditMode(false)}
                  disabled={saving}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={[styles.actionButton, styles.editButton, { backgroundColor: theme.primary }]} 
                onPress={() => setEditMode(true)}
              >
                <Ionicons name="pencil" size={16} color="#fff" />
                <Text style={styles.buttonText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={[styles.section, { 
          backgroundColor: theme.cardBackground,
          shadowColor: theme.text,
        }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Personal Information</Text>
          {renderField('First Name', profileData.firstName, 'firstName')}
          {renderField('Last Name', profileData.lastName, 'lastName')}
          {renderField('Phone Number', profileData.phoneNumber, 'phoneNumber')}
          {renderField('Date of Birth', profileData.dob, 'dob')}
          {renderField('Height (cm)', profileData.height, 'height')}
          {renderField('Weight (kg)', profileData.weight, 'weight')}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Update styles to use theme where needed
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    paddingTop: 10,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileInitials: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  editButton: {},
  saveButton: {},
  cancelButton: {},
  buttonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: '500',
  },
  section: {
    margin: 10,
    borderRadius: 10,
    padding: 15,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  fieldContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  fieldLabel: {
    fontSize: 16,
    flex: 1,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  input: {
    fontSize: 16,
    flex: 1,
    textAlign: 'right',
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderWidth: 1,
    borderRadius: 5,
  },
});

export default Profile;