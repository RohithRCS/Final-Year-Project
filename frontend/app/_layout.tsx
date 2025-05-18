import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, PermissionsAndroid, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-gesture-handler';

// Import screens
import RemindersScreen from './components/Reminderscreen';
import ChatbotScreen from './components/chatbot';
import ActivitiesScreen from './components/activities';
import CommunityScreen from './components/LocationBasedchat';
import LoginScreen from './components/login';
import RegisterScreen from './components/register';
import SettingsScreen from './components/settings';
import MusicPlayer from './components/songs';
import GamesScreen from './components/games';
import TipsScreen from './components/tip';
import ExerciseScreen from './components/exercise';
import RelaxScreen from './components/relaxation';
import FavoritePlaylist from './components/favouritePlaylist';
import BalloonPopGame from './components/baloon';
import BubblePopGame from './components/Bubble';
import CatchFallingStars from './components/Falling';
import FlappyBird from './components/Flappy';
import Garden from './components/Garden';
import MemoryGame from './components/memory';
import MoleGame from './components/mole';
import SnakeGame from './components/snake';
import TapTheTargetGame from './components/Tap';
import Tetris from './components/tetris';
import FindBomb from './components/find';
import Index from './index';
import Profile from './components/Profile';
import UpdatePreference from './components/updatePreference'
import GetPreferences from './components/Prefrences';
import Emergency from './components/Emergency'
import support from './components/support'
import { AuthProvider, useAuth } from './components/AuthContext';
import { ThemeProvider, useTheme } from './components/ThemeContext';

// Define stack parameter list
export type RootStackParamList = {
  MainApp: undefined;
  Settings: undefined;
  Profile: undefined;
  UpdatePreference:undefined;
  MusicStack: undefined;
  GameStack: undefined;
  TipsStack: undefined;
  ExerciseStack: undefined;
  RelaxStack: undefined;
  LocalChat: undefined;
  Auth: undefined;
  Login: undefined;
  Register: undefined;
  GetPrefrences: undefined;
  FlappyBird: undefined;
  Memorygame: undefined;
  Snakegame: undefined;
  tetris: undefined;
  mole: undefined;
  baloon: undefined;
  'Falling Stars': undefined;
  Bubble: undefined;
  Tap: undefined;
  find: undefined;
  Garden: undefined;
  Emergency:undefined;
  Support:undefined;
  FavoritePlaylist: { 
    songs: any[];
    onPlaySong: (song: any, index: number) => void;
    onTogglePlayPause: () => void;
    onPlayNext: () => void;
    onPlayPrevious: () => void;
    currentSongIndex: number;
    isPlaying: boolean;
  };
};

const requestNotificationPermission = async (): Promise<void> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Notification permission granted');
      } else {
        console.log('Notification permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  }
};

const Tab = createBottomTabNavigator();
const AuthStack = createStackNavigator();
const MainStack = createStackNavigator<RootStackParamList>();
const GameStack = createStackNavigator<RootStackParamList>();

const AuthStackScreen: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ 
          headerShown: true, 
          title: 'Login',
          headerStyle: { backgroundColor: theme.primary },
          headerTintColor: '#fff'
        }} 
      />
      <AuthStack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{ 
          headerShown: true, 
          title: 'Register',
          headerStyle: { backgroundColor: theme.primary },
          headerTintColor: '#fff'
        }} 
      />
    </AuthStack.Navigator>
  );
};

const GameStackScreen: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <GameStack.Navigator 
      screenOptions={{ 
        headerStyle: { backgroundColor: theme.cardBackground },
        headerTintColor: theme.text
      }}
    >
      <GameStack.Screen name="GameStack" component={GamesScreen} options={{ title: 'Games' }} />
      <GameStack.Screen name="FlappyBird" component={FlappyBird} options={{ title: 'Flappy Bird' }} />
      <GameStack.Screen name="Memorygame" component={MemoryGame} options={{ title: 'Memory Game' }} />
      <GameStack.Screen name="Snakegame" component={SnakeGame} options={{ title: 'Snake Game' }} />
      <GameStack.Screen name="tetris" component={Tetris} options={{ title: 'Tetris' }} />
      <GameStack.Screen name="mole" component={MoleGame} options={{ title: 'Color Tap' }} />
      <GameStack.Screen name="baloon" component={BalloonPopGame} options={{ title: 'Balloon Pop' }} />
      <GameStack.Screen name="Falling Stars" component={CatchFallingStars} options={{ title: 'Falling Stars' }} />
      <GameStack.Screen name="Bubble" component={BubblePopGame} options={{ title: 'Bubble Pop' }} />
      <GameStack.Screen name="Tap" component={TapTheTargetGame} options={{ title: 'Tap Target' }} />
      <GameStack.Screen name="find" component={FindBomb} options={{ title: 'Find Bomb' }} />
      <GameStack.Screen name="Garden" component={Garden} options={{ title: 'Garden' }} />
    </GameStack.Navigator>
  );
};

const MainAppTabNavigator: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Reminders') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Chatbot') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Activities') {
            iconName = focused ? 'game-controller' : 'game-controller-outline';
          } else if (route.name === 'Community') {
            iconName = focused ? 'people' : 'people-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.subText,
        headerShown: false,
        tabBarStyle: {
          paddingTop: 10,
          height: 70,
          backgroundColor: theme.cardBackground,
          borderTopWidth: 1,
          borderTopColor: theme.divider,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 8,
        },
      })}
    >
      <Tab.Screen name="Reminders" component={RemindersScreen} />
      <Tab.Screen name="Chatbot" component={ChatbotScreen} />
      <Tab.Screen name="Home" component={Index} />
      <Tab.Screen 
        name="Activities" 
        component={ActivitiesScreen}
      />
      <Tab.Screen name="Community" component={CommunityScreen} />
    </Tab.Navigator>
  );
};

// Root navigation container that handles authentication flow
const AppContent: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const { theme, isThemeLoaded, isDarkMode } = useTheme();
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    const checkFirstLogin = async () => {
      try {
        if (currentUser) {
          const hasCompletedPreferences = await AsyncStorage.getItem(`preferences_completed_${currentUser.userId}`);
          setIsFirstLogin(hasCompletedPreferences === null);
        }
      } catch (error) {
        console.error('Error checking first login status:', error);
      }
    };

    if (currentUser) {
      checkFirstLogin();
    }
  }, [currentUser]);

  if (loading || !isThemeLoaded) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style={theme.statusBar} />
        <MainStack.Navigator screenOptions={{
          headerStyle: { backgroundColor: theme.cardBackground },
          headerTintColor: theme.text,
        }}>
          {!currentUser ? (
            // Not logged in - show auth stack
            <MainStack.Screen 
              name="Auth" 
              component={AuthStackScreen} 
              options={{ headerShown: false }} 
            />
          ) : isFirstLogin ? (
            // First time login - show preferences
            <MainStack.Screen 
              name="GetPrefrences" 
              component={GetPreferences} 
              options={{ 
                title: 'Set Your Preferences',
                headerLeft: () => null // Prevent going back
              }} 
            />
          ) : (
            // Regular logged-in user - show main app
            <>
              <MainStack.Screen 
                name="MainApp" 
                component={MainAppTabNavigator} 
                options={{ headerShown: false }} 
              />
              <MainStack.Screen 
                name="Settings" 
                component={SettingsScreen} 
                options={{ title: 'Settings' }} 
              />
              <MainStack.Screen 
                name="Profile" 
                component={Profile} 
                options={{ title: 'Profile' }} 
              />
              <MainStack.Screen 
                name="UpdatePreference" 
                component={UpdatePreference} 
                options={{ title: 'Update Your Preference' }} 
              />
              <MainStack.Screen 
                name="MusicStack" 
                component={MusicPlayer} 
                options={{ 
                  title: 'Music Player', 
                  headerStyle: { backgroundColor: theme.cardBackground }, 
                  headerTintColor: theme.text 
                }} 
              />
              <MainStack.Screen 
                name="GameStack" 
                component={GameStackScreen} 
                options={{ headerShown: false }} 
              />
              <MainStack.Screen 
                name="TipsStack" 
                component={TipsScreen} 
                options={{ 
                  title: 'Tips', 
                  headerStyle: { backgroundColor: theme.cardBackground }, 
                  headerTintColor: theme.text 
                }} 
              />
              <MainStack.Screen 
                name="ExerciseStack" 
                component={ExerciseScreen} 
                options={{ 
                  title: 'Exercise', 
                  headerStyle: { backgroundColor: theme.cardBackground }, 
                  headerTintColor: theme.text 
                }} 
              />
              <MainStack.Screen 
                name="RelaxStack" 
                component={RelaxScreen} 
                options={{ 
                  title: 'Relaxation', 
                  headerStyle: { backgroundColor: theme.cardBackground }, 
                  headerTintColor: theme.text 
                }} 
              />
              <MainStack.Screen 
                name="LocalChat" 
                component={CommunityScreen} 
                options={{ title: 'Local Chat' }} 
              />
              <MainStack.Screen 
                name="Emergency" 
                component={Emergency} 
                options={{ title: 'Emergency Contact' }} 
              />
              <MainStack.Screen 
                name="Support" 
                component={support} 
                options={{ title: 'Emergency Contact' }} 
              />
              
              <MainStack.Screen 
                name="FavoritePlaylist" 
                component={FavoritePlaylist} 
                options={{ 
                  title: 'Favorite Playlist',
                  headerStyle: { backgroundColor: theme.cardBackground },
                  headerTintColor: theme.text
                }} 
              />
            </>
          )}
        </MainStack.Navigator>
    </>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;