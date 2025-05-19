import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  Keyboard,
  Image
} from 'react-native';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext'; // Import the theme hook
import { Ionicons } from '@expo/vector-icons';

// Import icons from an asset folder (you'll need to add these to your project)
const ICONS = {
  CLOSE: '🔒🔒',
  CHECK: '✔️',
  EDIT: '🖊️',
  ALERT: '💀'
};

const EmergencyContactDisplay = () => {
  const { getPreferences, updatePreferenceSection } = useAuth();
  const { theme } = useTheme(); // Get current theme
  const [loading, setLoading] = useState(true);
  const [contactData, setContactData] = useState({
    name: '',
    relationship: '',
    phone: '',
    alternate: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    relationship: '',
    phone: '',
    alternate: ''
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch existing emergency contact info
  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    setLoading(true);
    try {
      const response = await getPreferences();
      if (response.success && response.data?.emergencyContact) {
        console.log(response)
        const data = response.data.emergencyContact;
        setContactData({
          name: data.name || '',
          relationship: data.relationship || '',
          phone: data.phone || '',
          alternate: data.alternate || ''
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load emergency contact information.');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    // Copy current data to edit form
    setEditFormData({...contactData});
    setIsEditing(true);
    setErrors({});
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setErrors({});
  };

  // Handle form input changes
  const handleChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };
  
  // Field focus handlers
  const handleFieldFocus = (field) => {
    setFocusedField(field);
  };

  const handleFieldBlur = () => {
    setFocusedField(null);
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    if (!editFormData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!editFormData.relationship.trim()) {
      newErrors.relationship = 'Relationship is required';
    }
    
    if (!editFormData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[0-9]{10,15}$/.test(editFormData.phone.replace(/[-\s]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (editFormData.alternate && !/^\+?[0-9]{10,15}$/.test(editFormData.alternate.replace(/[-\s]/g, ''))) {
      newErrors.alternate = 'Please enter a valid alternate phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    Keyboard.dismiss();
    setSaving(true);
    try {
      const response = await updatePreferenceSection('emergencyContact', editFormData);
      if (response.success) {
        setContactData({...editFormData});
        setIsEditing(false);
        setShowSuccess(true);
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      } else {
        Alert.alert('Error', response.error || 'Failed to update emergency contact information.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Create dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      padding: 16,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: theme.background,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 18,
      color: theme.text,
      fontWeight: '500',
    },
    header: {
      padding: 20,
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      marginBottom: 16,
      shadowColor: theme.text,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.primary,
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 18,
      color: theme.subText,
      lineHeight: 24,
    },
    displayContainer: {
      padding: 20,
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      shadowColor: theme.text,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    contactInfo: {
      marginBottom: 24,
    },
    contactRow: {
      flexDirection: 'row',
      marginBottom: 20,
      alignItems: 'flex-start',
    },
    contactLabel: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.subText,
      width: 120,
    },
    contactValue: {
      fontSize: 18,
      color: theme.text,
      flex: 1,
    },
    editButton: {
      backgroundColor: theme.primary,
      borderRadius: 10,
      padding: 18,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      shadowColor: theme.primary,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    editButtonText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginLeft: 12,
    },
    noContactContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    noContactIcon: {
      marginBottom: 20,
      padding: 16,
      backgroundColor: theme.primary + '20', // Add transparency for light background
      borderRadius: 50,
    },
    alertIcon: {
      width: 48,
      height: 48,
      tintColor: theme.primary,
    },
    noContactText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 12,
    },
    noContactSubtext: {
      fontSize: 18,
      color: theme.subText,
      textAlign: 'center',
      marginBottom: 24,
    },
    addButton: {
      backgroundColor: theme.primary,
      borderRadius: 10,
      paddingVertical: 18,
      paddingHorizontal: 24,
      alignItems: 'center',
      width: '100%',
      shadowColor: theme.primary,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    addButtonText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    formContainer: {
      padding: 20,
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      shadowColor: theme.text,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    inputGroup: {
      marginBottom: 24,
    },
    label: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 10,
    },
    required: {
      color: '#E53E3E',
      marginLeft: 4,
    },
    optional: {
      fontSize: 16,
      fontWeight: 'normal',
      color: theme.subText,
    },
    input: {
      backgroundColor: theme.cardBackground,
      borderWidth: 2,
      borderColor: theme.divider,
      borderRadius: 10,
      padding: 16,
      fontSize: 18,
      color: theme.text,
    },
    inputFocused: {
      borderColor: theme.primary,
    },
    inputError: {
      borderColor: '#E53E3E',
    },
    errorText: {
      color: '#E53E3E',
      fontSize: 16,
      marginTop: 8,
      fontWeight: '500',
    },
    buttonGroup: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    saveButton: {
      backgroundColor: theme.primary,
      borderRadius: 10,
      padding: 18,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      flex: 1,
      marginLeft: 10,
    },
    saveButtonText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginLeft: -20,
    },
    cancelButton: {
      backgroundColor: theme.divider,
      borderRadius: 10,
      padding: 18,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      flex: 1,
      marginRight: 10,
    },
    cancelButtonText: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.subText,
      paddingLeft:0,
      alignItems:'center',
      marginLeft:-20,
    },
    buttonIcon: {
      width: 18,
      height: 18,
      resizeMode: 'contain',
    },
    buttonDisabled: {
      backgroundColor: theme.subText,
    },
    successContainer: {
      marginTop: 16,
      padding: 18,
      backgroundColor: '#C6F6D5',
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    successText: {
      color: '#276749',
      fontSize: 18,
      fontWeight: '600',
    }
  });

  if (loading) {
    return (
      <View style={dynamicStyles.centerContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={dynamicStyles.loadingText}>Loading emergency contact information...</Text>
      </View>
    );
  }

  const hasEmergencyContact = contactData.name || contactData.phone;

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.title}>Emergency Contact</Text>
        <Text style={dynamicStyles.subtitle}>
          {hasEmergencyContact 
            ? "Your emergency contact information is shown below."
            : "Please add someone who should be notified in case of an emergency."}
        </Text>
      </View>

      {isEditing ? (
        // Edit Form
        <View style={dynamicStyles.formContainer}>
          <View style={dynamicStyles.inputGroup}>
            <Text style={dynamicStyles.label}>Full Name<Text style={dynamicStyles.required}>*</Text></Text>
            <TextInput
              style={[
                dynamicStyles.input, 
                errors.name && dynamicStyles.inputError,
                focusedField === 'name' && dynamicStyles.inputFocused
              ]}
              value={editFormData.name}
              onChangeText={(text) => handleChange('name', text)}
              placeholder="Enter full name"
              placeholderTextColor={theme.subText}
              onFocus={() => handleFieldFocus('name')}
              onBlur={handleFieldBlur}
            />
            {errors.name && (
              <Text style={dynamicStyles.errorText}>{errors.name}</Text>
            )}
          </View>

          <View style={dynamicStyles.inputGroup}>
            <Text style={dynamicStyles.label}>Relationship<Text style={dynamicStyles.required}>*</Text></Text>
            <TextInput
              style={[
                dynamicStyles.input, 
                errors.relationship && dynamicStyles.inputError,
                focusedField === 'relationship' && dynamicStyles.inputFocused
              ]}
              value={editFormData.relationship}
              onChangeText={(text) => handleChange('relationship', text)}
              placeholder="e.g. Spouse, Child, Friend"
              placeholderTextColor={theme.subText}
              onFocus={() => handleFieldFocus('relationship')}
              onBlur={handleFieldBlur}
            />
            {errors.relationship && (
              <Text style={dynamicStyles.errorText}>{errors.relationship}</Text>
            )}
          </View>

          <View style={dynamicStyles.inputGroup}>
            <Text style={dynamicStyles.label}>Phone Number<Text style={dynamicStyles.required}>*</Text></Text>
            <TextInput
              style={[
                dynamicStyles.input, 
                errors.phone && dynamicStyles.inputError,
                focusedField === 'phone' && dynamicStyles.inputFocused
              ]}
              value={editFormData.phone}
              onChangeText={(text) => handleChange('phone', text)}
              placeholder="e.g. +1 555-123-4567"
              placeholderTextColor={theme.subText}
              keyboardType="phone-pad"
              onFocus={() => handleFieldFocus('phone')}
              onBlur={handleFieldBlur}
            />
            {errors.phone && (
              <Text style={dynamicStyles.errorText}>{errors.phone}</Text>
            )}
          </View>

          <View style={dynamicStyles.inputGroup}>
            <Text style={dynamicStyles.label}>Alternate Phone Number <Text style={dynamicStyles.optional}>(Optional)</Text></Text>
            <TextInput
              style={[
                dynamicStyles.input, 
                errors.alternate && dynamicStyles.inputError,
                focusedField === 'alternate' && dynamicStyles.inputFocused
              ]}
              value={editFormData.alternate}
              onChangeText={(text) => handleChange('alternate', text)}
              placeholder="e.g. +1 555-123-4567"
              placeholderTextColor={theme.subText}
              keyboardType="phone-pad"
              onFocus={() => handleFieldFocus('alternate')}
              onBlur={handleFieldBlur}
            />
            {errors.alternate && (
              <Text style={dynamicStyles.errorText}>{errors.alternate}</Text>
            )}
          </View>

          <View style={dynamicStyles.buttonGroup}>
            <TouchableOpacity
              style={dynamicStyles.cancelButton}
              onPress={cancelEditing}
              disabled={saving}
              activeOpacity={0.7}
            >
              <Image source={ICONS.CLOSE} style={[dynamicStyles.buttonIcon, { tintColor: theme.subText }]} />
              <Text style={dynamicStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[dynamicStyles.saveButton, saving && dynamicStyles.buttonDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.7}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Image source={ICONS.CHECK} style={[dynamicStyles.buttonIcon, { tintColor: '#FFFFFF' }]} />
                  <Text style={dynamicStyles.saveButtonText}>Save</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // Display Mode
        <View style={dynamicStyles.displayContainer}>
          {hasEmergencyContact ? (
            <>
              <View style={dynamicStyles.contactInfo}>
                <View style={dynamicStyles.contactRow}>
                  <Text style={dynamicStyles.contactLabel}>Name:</Text>
                  <Text style={dynamicStyles.contactValue}>{contactData.name}</Text>
                </View>
                
                <View style={dynamicStyles.contactRow}>
                  <Text style={dynamicStyles.contactLabel}>Relationship:</Text>
                  <Text style={dynamicStyles.contactValue}>{contactData.relationship}</Text>
                </View>
                
                <View style={dynamicStyles.contactRow}>
                  <Text style={dynamicStyles.contactLabel}>Phone Number:</Text>
                  <Text style={dynamicStyles.contactValue}>{contactData.phone}</Text>
                </View>
                
                {contactData.alternate && (
                  <View style={dynamicStyles.contactRow}>
                    <Text style={dynamicStyles.contactLabel}>Alt. Phone:</Text>
                    <Text style={dynamicStyles.contactValue}>{contactData.alternate}</Text>
                  </View>
                )}
              </View>
              
              <TouchableOpacity
                style={dynamicStyles.editButton}
                onPress={startEditing}
                activeOpacity={0.7}
              >
                <Image source={ICONS.EDIT} style={[dynamicStyles.buttonIcon, { tintColor: '#FFFFFF' }]} />
                <Text style={dynamicStyles.editButtonText}>Edit Contact</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={dynamicStyles.noContactContainer}>
              <Ionicons name="alert-circle" size={50} color="red" />
              <Text style={dynamicStyles.noContactText}>No emergency contact found</Text>
              <Text style={dynamicStyles.noContactSubtext}>
                Please add an emergency contact for your safety.
              </Text>
              <TouchableOpacity
                style={dynamicStyles.addButton}
                onPress={startEditing}
                activeOpacity={0.7}
              >
                <Text style={dynamicStyles.addButtonText}>Add Emergency Contact</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
      
      {showSuccess && (
        <View style={dynamicStyles.successContainer}>
          <Text style={dynamicStyles.successText}>✓ Emergency contact saved!</Text>
        </View>
      )}
    </View>
  );
};

export default EmergencyContactDisplay;