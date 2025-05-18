import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  Switch,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './ThemeContext';

const SettingItem = ({ 
  iconName, 
  iconColor, 
  title, 
  onPress,
  showBorder = true,
  rightElement
}) => {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity 
      style={[
        styles.settingsItem, 
        { borderBottomColor: showBorder ? theme.divider : 'transparent' },
        showBorder ? styles.withBorder : null
      ]} 
      onPress={onPress}
    >
      <View style={styles.settingIconContainer}>
        <View style={[styles.iconBackground, { backgroundColor: `${iconColor}20` }]}>
          <Ionicons name={iconName} size={22} color={iconColor} />
        </View>
      </View>
      <Text style={[styles.settingsItemText, { color: theme.text }]}>{title}</Text>
      {rightElement || (
        <Ionicons name="chevron-forward" size={20} color={theme.subText} />
      )}
    </TouchableOpacity>
  );
};

const SettingSection = ({ title, children }) => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.settingsSection, { backgroundColor: theme.cardBackground }]}>
      <Text style={[styles.settingsSectionTitle, { color: theme.text }]}>{title}</Text>
      {children}
    </View>
  );
};

const SettingsScreen = () => {
  const { currentUser, logout, loading } = useAuth();
  const navigation = useNavigation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { isDarkMode, toggleTheme, theme } = useTheme();

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Calculate age from DOB
  const calculateAge = (dob) => {
    if (!dob) return 'Not set';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleLogout = async () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out",
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
            } catch (error) {
              Alert.alert("Logout Error", "There was a problem logging out.");
            } finally {
              setIsLoggingOut(false);
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  // Navigation helpers
  const navigateTo = (screen) => {
    navigation.navigate(screen);
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(previous => !previous);
    // Here you would normally save this preference to your backend
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const initials = `${currentUser?.firstName?.charAt(0) || ''}${currentUser?.lastName?.charAt(0) || ''}`.toUpperCase();

  return (
    <>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.background }]} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.screenTitle, { color: theme.text }]}>Settings</Text>
        </View>
        
        {/* Profile Overview */}
        <View style={[styles.profileCard, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.text }]}>
              {currentUser?.firstName || ''} {currentUser?.lastName || ''}
            </Text>
            <Text style={[styles.profileDetail, { color: theme.subText }]}>
              {currentUser?.phoneNumber || 'No phone number'}
            </Text>

            <View style={styles.healthStatRow}>
              <View style={styles.healthStat}>
                <Text style={[styles.healthStatValue, { color: theme.primary }]}>
                  {currentUser?.height ? `${currentUser.height} cm` : 'Not set'}
                </Text>
                <Text style={[styles.healthStatLabel, { color: theme.subText }]}>Height</Text>
              </View>
              <View style={styles.healthStat}>
                <Text style={[styles.healthStatValue, { color: theme.primary }]}>
                  {currentUser?.weight ? `${currentUser.weight} kg` : 'Not set'}
                </Text>
                <Text style={[styles.healthStatLabel, { color: theme.subText }]}>Weight</Text>
              </View>
              <View style={styles.healthStat}>
                <Text style={[styles.healthStatValue, { color: theme.primary }]}>
                  {calculateAge(currentUser?.dob)}
                </Text>
                <Text style={[styles.healthStatLabel, { color: theme.subText }]}>Age</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* General Settings */}
        <SettingSection title="General">
          <SettingItem 
            iconName="moon-outline" 
            iconColor="#673AB7" 
            title="Dark Mode" 
            onPress={toggleTheme}
            showBorder={false}
            rightElement={
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: "#D1D1D6", true: "#673AB750" }}
                thumbColor={isDarkMode ? "#673AB7" : "#F4F3F4"}
              />
            }
          />
        </SettingSection>
        
        {/* Account Settings */}
        <SettingSection title="Account">
          <SettingItem 
            iconName="person-outline" 
            iconColor="#4285F4" 
            title="Personal Information" 
            onPress={() => navigateTo('Profile')}
          />
          <SettingItem 
            iconName="notifications-outline" 
            iconColor="#FBBC05" 
            title="Your Preferences" 
            onPress={() => navigateTo('UpdatePreference')}
            
          />
          <SettingItem 
            iconName="person-outline" 
            iconColor="pink" 
            title="Emergency Contact" 
            onPress={() => navigateTo('Emergency')}
            showBorder={false}
          />
        </SettingSection>
        
        {/* Support and More */}
        <SettingSection title="Support & More">
          <SettingItem 
            iconName="help-circle-outline" 
            iconColor="#4285F4" 
            title="Help & Support" 
            onPress={() => navigateTo('Support')}
          />
          <SettingItem 
            iconName="information-circle-outline" 
            iconColor="#34A853" 
            title="About App" 
            onPress={() => navigateTo('AboutApp')}
            showBorder={false}
          />
        </SettingSection>
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color="white" style={styles.logoutIcon} />
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </>
          )}
        </TouchableOpacity>
        
        <Text style={[styles.versionText, { color: theme.subText }]}>Version 1.0.0</Text>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileCard: {
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
    margin: 16,
  },
  avatarContainer: {
    backgroundColor: '#6c5ce7',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileDetail: {
    fontSize: 14,
    marginBottom: 4,
  },
  healthStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  editProfileButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F1F3F4',
    alignSelf: 'flex-start',
  },
  editProfileText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4285F4',
  },
  settingsSection: {
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    height:50,
  },
  settingIconContainer: {
    marginRight: 12,
  },
  iconBackground: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  withBorder: {
    borderBottomWidth: 1,
  },
  settingsItemText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 5,
  },
  healthStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  healthStat: {
    alignItems: 'center',
    flex: 1,
  },
  healthStatValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  healthStatDivider: {
    width: 1,
    height: 40,
  },
  healthStatLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  updateHealthButton: {
    backgroundColor: '#F1F3F4',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  updateHealthText: {
    color: '#4285F4',
    fontWeight: '600',
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#EA4335',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    shadowColor: '#EA4335',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 10,
    marginBottom: 40,
  },
});

export default SettingsScreen;