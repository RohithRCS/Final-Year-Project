import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Linking
} from 'react-native';
import { useTheme } from './ThemeContext'; // Adjust the import path as needed

const HelpSupportScreen = () => {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Company support email
  const SUPPORT_EMAIL = 'sgmbargavi@gmail.com';

  // Common support topics that elderly users might need help with
  const commonTopics = [
    "How to use the app",
    "Medication reminders",
    "Emergency contacts",
    "Account settings",
    "App navigation help"
  ];

  // Function to handle selecting a common topic
  const handleSelectTopic = (topic) => {
    setSubject(topic);
  };

  // Function to validate the form
  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert("Missing Information", "Please enter your name.");
      return false;
    }
    if (!email.trim()) {
      Alert.alert("Missing Information", "Please enter your email address.");
      return false;
    }
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return false;
    }
    if (!subject.trim()) {
      Alert.alert("Missing Information", "Please select or enter a subject.");
      return false;
    }
    if (!message.trim()) {
      Alert.alert("Missing Information", "Please enter your message.");
      return false;
    }
    return true;
  };

  // Function to handle sending the support request via email
  const handleSendRequest = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Format the email body with the form information
      const formattedMessage = `
Name: ${name}
Email: ${email}

${message}
      `;
      
      // Create the mailto URL with all parameters
      const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(formattedMessage)}}`;
      
      // Check if the device can handle the mailto URL
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      
      if (!canOpen) {
        throw new Error('No email app available');
      }
      
      // Open the mail app with the prepared email
      await Linking.openURL(mailtoUrl);
      
      Alert.alert(
        "Email App Opened",
        "Your message has been prepared in your email app. Please review and send it.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error opening email client:", error);
      Alert.alert(
        "Email App Error",
        "We couldn't open your email app. Please try again or manually send an email to support@elderassistapp.com."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Function to reset the form
  const resetForm = () => {
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={[styles.title, { color: theme.text }]}>Help & Support</Text>
        <Text style={[styles.subtitle, { color: theme.subText }]}>
          We're here to help! Please fill out the form below and we'll open your email app with your message.
        </Text>

        <View style={[styles.formSection, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.label, { color: theme.text }]}>Your Name</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.background, 
              color: theme.text,
              borderColor: theme.divider 
            }]}
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            placeholderTextColor={theme.subText}
            autoCapitalize="words"
          />

          <Text style={[styles.label, { color: theme.text }]}>Your Email</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.background, 
              color: theme.text,
              borderColor: theme.divider 
            }]}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email address"
            placeholderTextColor={theme.subText}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={[styles.label, { color: theme.text }]}>Subject</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.background, 
              color: theme.text,
              borderColor: theme.divider 
            }]}
            value={subject}
            onChangeText={setSubject}
            placeholder="What do you need help with?"
            placeholderTextColor={theme.subText}
          />

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Common Topics</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicsContainer}>
            {commonTopics.map((topic, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.topicButton,
                  { 
                    backgroundColor: subject === topic ? theme.primary : theme.background,
                    borderColor: theme.primary
                  }
                ]}
                onPress={() => handleSelectTopic(topic)}
              >
                <Text 
                  style={[
                    styles.topicText, 
                    { color: subject === topic ? '#FFFFFF' : theme.primary }
                  ]}
                >
                  {topic}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.label, { color: theme.text }]}>Your Message</Text>
          <TextInput
            style={[
              styles.input, 
              styles.messageInput, 
              { 
                backgroundColor: theme.background, 
                color: theme.text,
                borderColor: theme.divider 
              }
            ]}
            value={message}
            onChangeText={setMessage}
            placeholder="Please describe your issue or question in detail"
            placeholderTextColor={theme.subText}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: theme.primary }]}
            onPress={handleSendRequest}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.sendButtonText}>Open Email App</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetButton} onPress={resetForm}>
            <Text style={[styles.resetButtonText, { color: theme.primary }]}>Clear Form</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.contactInfo, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.contactTitle, { color: theme.text }]}>Other Ways to Reach Us</Text>
          <Text style={[styles.contactDetail, { color: theme.text }]}>
            <Text style={{ fontWeight: 'bold' }}>Phone:</Text> 1-800-ELDER-HELP
          </Text>
          <TouchableOpacity onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
            <Text style={[styles.contactDetail, { color: theme.text }]}>
              <Text style={{ fontWeight: 'bold' }}>Email:</Text>{' '}
              <Text style={{ color: theme.primary, textDecorationLine: 'underline' }}>
                support@elderassistapp.com
              </Text>
            </Text>
          </TouchableOpacity>
          <Text style={[styles.contactDetail, { color: theme.text }]}>
            <Text style={{ fontWeight: 'bold' }}>Hours:</Text> Monday-Friday, 8am-8pm
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formSection: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  messageInput: {
    height: 150,
    paddingTop: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  topicsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  topicButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 1,
  },
  topicText: {
    fontSize: 16,
    fontWeight: '500',
  },
  sendButton: {
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  resetButton: {
    alignItems: 'center',
    padding: 15,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  contactInfo: {
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  contactDetail: {
    fontSize: 16,
    marginBottom: 10,
  },
});

export default HelpSupportScreen;