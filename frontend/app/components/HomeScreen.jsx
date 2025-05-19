import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Dimensions, Alert, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from './AuthContext';
import { BASE_URL } from './config';
import EmergencyContactButton from './Emegencybutton';
import { useTheme } from './ThemeContext';
import YoutubePlayer from 'react-native-youtube-iframe';

const { width } = Dimensions.get('window');

const WEATHER_API_KEY = '6b861f2d844bd2e5942683b942a16a31';

const COVER_IMAGES = {
  'The Beatles': require('../../assets/images/The Beatles - Hey Jude.jpg'),
  'Ilayaraja': require('../../assets/images/Ilayaraja.jpg'),
  'Queen': require('../../assets/images/The Beatles - Hey Jude.jpg'),
  'SPB': require('../../assets/images/SPB.jpeg'),
  'Janaki': require('../../assets/images/Janaki.jpeg'),
  'Hariharan': require('../../assets/images/Hariharan.jpg'),
  'Melody': require('../../assets/images/Melody.jpg'),
  'Yesudas': require('../../assets/images/Yesudas.jpg'),
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const { currentUser, getAuthHeader } = useAuth();
  
  const [weather, setWeather] = useState(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [favoriteSongs, setFavoriteSongs] = useState([]);
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);
  const [favoriteGames, setFavoriteGames] = useState([]);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [favoriteMeditations, setFavoriteMeditations] = useState([]);
  const [isLoadingMeditations, setIsLoadingMeditations] = useState(true);
  const [favoriteExercises, setFavoriteExercises] = useState([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(true);
  const [reminders, setReminders] = useState([]);
  const [isLoadingReminders, setIsLoadingReminders] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { theme, isDarkMode } = useTheme();
  const userId = currentUser?.userId;

  useEffect(() => {
    (async () => {
      setIsLoadingWeather(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'This app needs location permission to show weather for your area.',
          [{ text: 'OK' }]
        );
        setIsLoadingWeather(false);
        return;
      }
      
      try {
        const locationData = await Location.getCurrentPositionAsync({});
        await fetchWeather(locationData.coords.latitude, locationData.coords.longitude);
      } catch (error) {
        console.error('Error getting location or weather data:', error);
        Alert.alert(
          'Weather Information Unavailable',
          'Unable to get current weather information. Please try again later.',
          [{ text: 'OK' }]
        );
        setIsLoadingWeather(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchFavoriteGames();
      fetchFavoriteSongs();
      fetchFavoriteMeditations();
      fetchFavoriteExercises();
      fetchReminders();
    }
  }, [userId]);

  const formatTime = (date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleMoodSelection = (mood) => {
    // Navigate to ChatBot screen with mood parameter
    navigation.navigate('Chatbot', { 
      selectedMood: mood,
      autoMessage: `I'm feeling ${mood.toLowerCase()} today.`,
      key: Date.now()
    });
  };
  const formatTimeForDisplay = (timeString) => {
    if (!timeString) return '';
    
    try {
      const [hours, minutes] = timeString.split(':');
      const time = new Date();
      time.setHours(parseInt(hours, 10));
      time.setMinutes(parseInt(minutes, 10));
      
      return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString;
    }
  };
  
  const formatTimeForOnce = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${formatTime(date)}`;
    } 

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${formatTime(date)}`;
    }

    const options = { month: 'short', day: 'numeric' };
    return `${date.toLocaleDateString(undefined, options)} at ${formatTime(date)}`;
  };
  
  const getWeekDaysString = (weekDayIds) => {
    if (!weekDayIds || weekDayIds.length === 0) return '';
    
    const weekDays = [
      { id: 0, name: 'Sun' },
      { id: 1, name: 'Mon' },
      { id: 2, name: 'Tue' },
      { id: 3, name: 'Wed' },
      { id: 4, name: 'Thu' },
      { id: 5, name: 'Fri' },
      { id: 6, name: 'Sat' },
    ];
    
    return weekDayIds
      .sort((a, b) => a - b)
      .map(id => weekDays.find(day => day.id === id)?.name)
      .join(', ');
  };
const fetchReminders = async () => {
  setIsLoadingReminders(true);
  try {
    const saved = await AsyncStorage.getItem('reminders');

    if (saved) {
      const reminders = JSON.parse(saved);
      const now = new Date();

      const upcomingReminders = reminders
        .map(reminder => {
          const [hours, minutes] = reminder.time.split(':');
          const reminderTime = new Date();
          reminderTime.setHours(+hours, +minutes, 0, 0);
          return { ...reminder, reminderDate: reminderTime };
        })
        .filter(reminder => reminder.reminderDate >= now)
        .sort((a, b) => a.reminderDate - b.reminderDate)
        .slice(0, 3);

      setReminders(upcomingReminders);
      console.log('Upcoming Reminders:', upcomingReminders);
    } else {
      setReminders([]);
    }
  } catch (err) {
    console.error('Failed to load reminders:', err);
    Alert.alert('Error', 'Could not load reminders. Please try again later.', [{ text: 'OK' }]);
    setReminders([]);
  } finally {
    setIsLoadingReminders(false);
    setRefreshing(false);
  }
};

  const fetchFavoriteSongs = async () => {
    if (!userId) return;
    
    setIsLoadingSongs(true);
    try {
      const headers = {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      };
      
      const response = await axios.get(`${BASE_URL}/favorites?userId=${userId}`, { headers });
      setFavoriteSongs(response.data);
    } catch (error) {
      console.error('Error fetching favorite songs:', error);
      Alert.alert(
        'Error',
        'Unable to fetch favorite songs. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingSongs(false);
    }
  };
  
  const removeSongFromFavorites = async (songId) => {
    if (!userId) return;
    
    try {
      const headers = {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      };
      
      await axios.delete(`${BASE_URL}/favorites/${songId}`, {
        headers,
        data: { userId }
      });
      
      setFavoriteSongs(prevSongs => prevSongs.filter(song => song._id !== songId));
      Alert.alert('Success', 'Song removed from favorites');
    } catch (error) {
      console.error('Error removing song from favorites:', error);
      Alert.alert(
        'Error',
        'Unable to remove song from favorites. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  const fetchFavoriteGames = async () => {
    if (!userId) return;
    
    setIsLoadingGames(true);
    try {
      const headers = {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      };
      
      const response = await axios.get(`${BASE_URL}/game/${userId}/favoriteGames`, { headers });
      setFavoriteGames(response.data);
    } catch (error) {
      console.error('Error fetching favorite games:', error);
      setFavoriteGames([]);
    } finally {
      setIsLoadingGames(false);
    }
  };

  const renderGameItem = (game, index) => {
    return (
      <TouchableOpacity 
        key={game._id || index.toString()}
        style={styles.gameCard}
        onPress={() => navigation.navigate('GameStack', { screen: game.route })}
      >
        <View style={styles.emojiContainer}>
          <Text style={styles.gameEmoji}>{game.emoji}</Text>
        </View>
        <Text style={styles.gameTitle} numberOfLines={1}>{game.title}</Text>
      </TouchableOpacity>
    );
  };

  const fetchFavoriteExercises = async () => {
    if (!userId) return;
    
    setIsLoadingExercises(true);
    try {
      const headers = {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      };
      
      const response = await axios.get(`${BASE_URL}/exercise/favorites?userId=${userId}`, { headers });
      setFavoriteExercises(response.data);
    } catch (error) {
      console.error('Error fetching favorite exercises:', error);
      setFavoriteExercises([]);
    } finally {
      setIsLoadingExercises(false);
    }
  };

  const fetchFavoriteMeditations = async () => {
    if (!userId) return;
    
    setIsLoadingMeditations(true);
    try {
      const headers = {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      };
      
      const response = await axios.get(`${BASE_URL}/meditation/${userId}`, { headers });
      setFavoriteMeditations(response.data);
    } catch (error) {
      console.error('Error fetching favorite meditations:', error);
      setFavoriteMeditations([]);
    } finally {
      setIsLoadingMeditations(false);
    }
  };

  const renderMeditationItem = (meditation, index) => {
    return (
      <TouchableOpacity 
        key={meditation.meditationId || index.toString()}
        style={styles.meditationCard}
        onPress={() => navigation.navigate('RelaxStack')}
      >
        <View style={[styles.meditationColorIndicator, { backgroundColor: meditation.backgroundColor || '#4285F4' }]}>
          <Text style={styles.meditationEmoji}>{meditation.emoji || '🧘'}</Text>
        </View>
        <Text style={styles.meditationTitle} numberOfLines={1}>{meditation.title}</Text>
        <Text style={styles.meditationDuration}>{meditation.duration}</Text>
      </TouchableOpacity>
    );
  };

  const renderExerciseItem = (exercise, index) => {
    return (
      <TouchableOpacity 
        key={exercise._id || index.toString()}
        style={styles.exerciseCard}
        onPress={() => navigation.navigate('ExerciseStack')}
      >
        <View style={[styles.exerciseColorIndicator, { backgroundColor: exercise.backgroundColor || '#EA4335' }]}>
          <Text style={styles.exerciseEmoji}>{exercise.emoji || '🏋️'}</Text>
        </View>
        <Text style={styles.exerciseTitle} numberOfLines={1}>{exercise.title}</Text>
        <Text style={styles.exerciseDuration}>{exercise.duration}</Text>
      </TouchableOpacity>
    );
  };

  const renderFavoriteExercisesSection = () => {
    if (isLoadingExercises) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EA4335" />
          <Text style={styles.loadingText}>Loading favorite exercises...</Text>
        </View>
      );
    }
    
    if (favoriteExercises.length === 0) {
      return (
        <View style={styles.emptyFavorites}>
          <Ionicons name="fitness-outline" size={48} color="#DADCE0" />
          <Text style={styles.emptyText}>No favorite exercises yet!</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('ExerciseStack')}
          >
            <Text style={styles.addButtonText}>Browse Exercises</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScrollContent}
      >
        {favoriteExercises.map(renderExerciseItem)}
      </ScrollView>
    );
  };
  
  const renderFavoriteMeditationsSection = () => {
    if (isLoadingMeditations) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.loadingText}>Loading favorite meditations...</Text>
        </View>
      );
    }
    
    if (favoriteMeditations.length === 0) {
      return (
        <View style={styles.emptyFavorites}>
          <Ionicons name="flower-outline" size={48} color="#DADCE0" />
          <Text style={styles.emptyText}>No favorite meditations yet!</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('RelaxStack')}
          >
            <Text style={styles.addButtonText}>Browse Meditations</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScrollContent}
      >
        {favoriteMeditations.map(renderMeditationItem)}
      </ScrollView>
    );
  };

  const renderFavoriteGamesSection = () => {
    if (isLoadingGames) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.loadingText}>Loading favorite games...</Text>
        </View>
      );
    }
    
    if (favoriteGames.length === 0) {
      return (
        <View style={styles.emptyFavorites}>
          <Ionicons name="game-controller-outline" size={48} color="#DADCE0" />
          <Text style={styles.emptyText}>No favorite games yet!</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('GameStack')}
          >
            <Text style={styles.addButtonText}>Browse Games</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScrollContent}
      >
        {favoriteGames.map(renderGameItem)}
      </ScrollView>
    );
  };

  const navigateToPlaylist = () => {
    if (favoriteSongs.length === 0) return;
    
    navigation.navigate('FavoritePlaylist', {
      songs: favoriteSongs
    });
  };

  const fetchWeather = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=imperial&appid=${WEATHER_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Weather API response was not ok');
      }
      
      const data = await response.json();
      
      setWeather({
        temp: ((data.main.temp - 32) * 5) / 9,
        main: data.weather[0].main,
        description: data.weather[0].description,
        city: 'chennai',
        humidity: data.main.humidity,
        wind: data.wind.speed
      });
    } catch (error) {
      console.error('Error fetching weather data:', error);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const speakWeather = () => {
    if (isLoadingWeather) {
      Alert.alert("Weather Information", "Still loading weather data. Please try again in a moment.");
      return;
    }
    
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    
    if (weather) {
      const weatherText = `The current weather in ${weather.city} is ${weather.main} with a temperature of ${Math.round(weather.temp)} degrees Celcius. ${getWeatherTip()}`;
      
      Speech.speak(weatherText, {
        language: 'en',
        pitch: 1.0,
        rate: 0.75,
        onStart: () => setIsSpeaking(true),
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
      });
    }
  };

  const getWeatherIcon = () => {
    if (isLoadingWeather) return 'weather-cloudy';

    const condition = weather?.main?.toLowerCase() || '';

    if (condition.includes('clear')) {
      return 'weather-sunny';
    } else if (condition.includes('rain')) {
      return 'weather-rainy';
    } else if (condition.includes('drizzle')) {
      return 'weather-pouring';
    } else if (condition.includes('cloud')) {
      return 'weather-cloudy';
    } else if (condition.includes('snow')) {
      return 'weather-snowy';
    } else if (condition.includes('thunder')) {
      return 'weather-lightning';
    } else if (condition.includes('fog') || condition.includes('mist')) {
      return 'weather-fog';
    } else {
      return 'weather-partly-cloudy';
    }
  };

  const getBackgroundColors = () => {
  return ['#4A90E2', '#87CEFA']; // Light to medium blue gradient
};


  const getWeatherTip = () => {
    if (isLoadingWeather) return "Loading weather advice...";
    
    const temp = weather?.temp || 0;
    const condition = weather?.main?.toLowerCase() || '';
    const humidity = weather?.humidity || 0;
    const wind = weather?.wind || 0;
    
    if (condition.includes('rain') || condition.includes('drizzle')) {
      return "Tip for today: Consider postponing outdoor trips. If necessary to go out, wear non-slip shoes and use a sturdy umbrella to prevent falls.";
    } else if (condition.includes('snow')) {
      return "Tip for today: Avoid going outside if possible. If necessary, wear warm boots with good traction and take slow, small steps to prevent falls on ice.";
    } else if (condition.includes('thunder')) {
      return "Tip for today: Stay indoors during the storm. If you use electronic medical devices, ensure they're fully charged in case of power outages.";
    } else if (temp > 86) {
      if (humidity > 70) {
        return "Tip for today: High heat and humidity can be dangerous. Stay in air-conditioned areas, drink plenty of water, and watch for signs of heat exhaustion (dizziness, weakness).";
      }
      return "Tip for today: Keep cool and hydrated. Limit outdoor activities to early morning or evening, wear lightweight clothing, and take frequent breaks.";
    } else if (temp < 50) {
      if (wind > 10) {
        return "Tip for today: Cold and windy conditions can increase risk of hypothermia. Wear layers, including a windproof outer layer, and cover your head and hands.";
      }
      return "Tip for today: Keep warm with several layers of clothing. Cold weather can increase joint pain and strain the heart, so avoid overexertion.";
    } else if (condition.includes('fog') || condition.includes('mist')) {
      return "Tip for today: Reduced visibility can make navigation difficult. If driving, use headlights and reduce speed. Consider postponing trips if visibility is very poor.";
    } else if (condition.includes('clear')) {
      const currentHour = new Date().getHours();
      if (currentHour >= 10 && currentHour <= 16) {
        return "Tip for today: Even when it feels comfortable, sun exposure can be strong. Wear a wide-brimmed hat, sunglasses, and sunscreen to protect your skin and eyes.";
      }
      return "Tip for today: Pleasant weather is good for a short walk. Moving around helps joint mobility and circulation, but remember to wear comfortable shoes.";
    } else if (condition.includes('cloud')) {
      return "Tip for today: Moderate weather is suitable for outdoor activities. If going for a walk, take your phone and ID, and let someone know where you're going.";
    } else {
      return "Tip for today: Before heading out, check if the weather might change. Keep emergency contacts and medications with you when leaving home.";
    }
  };

  const getAlbumCover = (artist) => {
    const artistKey = Object.keys(COVER_IMAGES).find(key => artist.includes(key));
    return artistKey ? COVER_IMAGES[artistKey] : null;
  };


  const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  backgroundGradient: {
    flex: 1,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  weatherSpeakButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.isDarkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.isDarkMode ? '#000' : '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.isDarkMode ? 0.2 : 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weatherBanner: {
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme.isDarkMode ? 0.3 : 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  weatherContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
  },
  weatherInfo: {
    marginLeft: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherTemp: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  weatherCondition: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  weatherLocation: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  weatherLoading: {
    fontSize: 18,
    color: 'white',
    marginLeft: 16,
  },
  weatherTipContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'flex-start',
  },
  weatherTip: {
    color: 'white',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  emergencyButtonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sectionContainer: {
    marginBottom:10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    marginHorizontal: 20,
    marginTop: 16,
    paddingLeft:0,
    marginBottom: 12,
    marginLeft:0,
  },
  section_Title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  moodItem: {
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    width: width / 5 - 12,
    height:75,
    shadowColor: theme.isDarkMode ? '#000' : '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.isDarkMode ? 0.2 : 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  moodText: {
    marginTop: 8,
    fontSize: 12,
    color: theme.subText,
    fontWeight: '500',
  },
  favoritesSection: {
    marginTop: 5,
    marginBottom: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  horizontalScrollContent: {
    paddingHorizontal: 20,
  },
  horizontalFavoriteCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    marginBottom: 4,
    width: width * 0.7,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.isDarkMode ? 0.2 : 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  songImageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    width: 56,
    height: 56,
    marginRight: 14,
  },
  horizontalSongImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  placeholderImage: {
    backgroundColor: theme.isDarkMode ? '#2D2D2D' : '#F1F3F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  songDetails: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  songArtist: {
    fontSize: 14,
    color: theme.subText,
    marginBottom: 2,
  },
  songDuration: {
    fontSize: 12,
    color: theme.subText,
  },
  removeButton: {
    padding: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    backgroundColor: theme.isDarkMode ? 'rgba(30, 30, 30, 0.5)' : 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 20,
    borderRadius: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.subText,
  },
  emptyFavorites: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.cardBackground,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    height: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.isDarkMode ? 0.2 : 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyText: {
    fontSize: 16,
    color: theme.subText,
    marginTop: 12,
    marginBottom: 16,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: theme.isDarkMode ? '#2D2D2D' : '#F1F3F4',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  addButtonText: {
    color: theme.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  viewAllButtonText: {
    color: theme.primary,
    fontWeight: '600',
    fontSize: 14,
    marginRight: 6,
  },
  gameCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: width / 3 - 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'grey',
  borderWidth: 0.75, 
    shadowColor: '#000',
    shadowOpacity: theme.isDarkMode ? 0.2 : 0.06,
    shadowRadius:0,
    elevation: 2,
  },
  emojiContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.isDarkMode ? '#2D2D2D' : '#F1F3F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameEmoji: {
    fontSize: 24,
  },
  gameTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
  },
  meditationCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: width / 2.4,
    borderColor: 'grey',
  borderWidth: 0.75, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.isDarkMode ? 0.2 : 0.06,
    shadowRadius: 6,
    elevation: 0,
  },
  meditationColorIndicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  meditationEmoji: {
    fontSize: 24,
    color: 'white',
  },
  meditationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 6,
  },
  meditationDuration: {
    fontSize: 14,
    color: theme.subText,
  },
  exerciseCard: {
  backgroundColor: theme.cardBackground,
  borderRadius: 16,
  padding: 16,
  marginRight: 12,
  width: width / 2.4,
  borderColor: 'grey',
  borderWidth: 0.75, // Add this line to make the blue border visible
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
},

  exerciseColorIndicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseEmoji: {
    fontSize: 24,
    color: 'white',
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 6,
  },
  exerciseDuration: {
    fontSize: 14,
    color: theme.subText,
  },
  reminderSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  reminderCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.isDarkMode ? 0.2 : 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  reminderTimeIndicator: {
    width: 50,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  reminderTimeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  reminderDetails: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  reminderSubtitle: {
    fontSize: 14,
    color: theme.subText,
  },
  reminderAction: {
    padding: 8,
  },
});

  const renderSongItem = (song, index) => {
    const albumCover = getAlbumCover(song.artist);
    
    return (
      <View key={index} style={styles.horizontalFavoriteCard}>
        <View style={styles.songImageContainer}>
          {albumCover ? (
            <Image
              source={albumCover}
              style={styles.horizontalSongImage}
              resizeMode="cover"
            />
          ) : song.albumCover ? (
            <Image
              source={{ uri: song.albumCover }}
              style={styles.horizontalSongImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.horizontalSongImage, styles.placeholderImage]}>
              <FontAwesome name="music" size={24} color="#DADCE0" />
            </View>
          )}
        </View>
        <View style={styles.songDetails}>
          <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
          <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeSongFromFavorites(song._id)}
        >
          <Ionicons name="heart" size={24} color="#EA4335" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderFavoritesSection = () => {
    if (isLoadingSongs) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.loadingText}>Loading favorite songs...</Text>
        </View>
      );
    }
    
    if (favoriteSongs.length === 0) {
      return (
        <View style={styles.emptyFavorites}>
          <Ionicons name="musical-notes" size={48} color="#DADCE0" />
          <Text style={styles.emptyText}>No favorite songs yet!</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('MusicStack')}
          >
            <Text style={styles.addButtonText}>Browse Songs</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContent}
        >
          {favoriteSongs.slice(0, 5).map(renderSongItem)}
        </ScrollView>
      </>
    );
  };

  return (
  <View style={{ flex: 1 }}>
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchReminders();
            fetchFavoriteSongs();
            fetchFavoriteGames();
            fetchFavoriteMeditations();
            fetchFavoriteExercises();
          }}
        />
      }
    >
      <View style={styles.container}>
        
        <TouchableOpacity activeOpacity={0.9} onPress={speakWeather}>
          <LinearGradient
            colors={getBackgroundColors()}
            style={styles.weatherBanner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.weatherContent}>
              <MaterialCommunityIcons 
                name={getWeatherIcon()} 
                size={48} 
                color="white" 
              />
              
              {isLoadingWeather ? (
                <Text style={styles.weatherLoading}>Loading weather...</Text>
              ) : (
                <View style={styles.weatherInfo}>
                  <Text style={styles.weatherTemp}>{Math.round(weather?.temp || 0)}°C</Text>
                  <View>
                    <Text style={styles.weatherCondition}>{weather?.main}</Text>
                    <Text style={styles.weatherLocation}>{weather?.city}</Text>
                  </View>
                </View>
              )}
            </View>
            
            <View style={styles.weatherTipContainer}>
              <MaterialCommunityIcons name="shield-plus-outline" size={22} color="white" />
              <Text style={styles.weatherTip}>{getWeatherTip()}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
        
        <Text style={styles.section_Title}>How’s the mood today?</Text>
        <View style={styles.moodContainer}>
          <TouchableOpacity 
            style={[styles.moodItem, { backgroundColor: theme.cardBackground }]} 
            onPress={() => handleMoodSelection('Happy')}
          >
            <Ionicons name="happy-outline" size={32} color="#34A853" />
            <Text style={[styles.moodText, { color: theme.text }]}>Happy</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.moodItem, { backgroundColor: theme.cardBackground }]}
            onPress={() => handleMoodSelection('Sad')}
          >
            <Ionicons name="sad-outline" size={32} color="#4285F4" />
            <Text style={[styles.moodText, { color: theme.text }]}>Sad</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.moodItem, { backgroundColor: theme.cardBackground }]}
            onPress={() => handleMoodSelection('Angry')}
          >
            <Ionicons name="flash-outline" size={32} color="#FBBC05" />
            <Text style={[styles.moodText, { color: theme.text }]}>Angry</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.moodItem, { backgroundColor: theme.cardBackground }]}
            onPress={() => handleMoodSelection('Tired')}
          >
            <Ionicons name="bed-outline" size={32} color="#EA4335" />
            <Text style={[styles.moodText, { color: theme.text }]}>Tired</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.moodItem, { backgroundColor: theme.cardBackground }]}
            onPress={() => handleMoodSelection('Anxious')}
          >
            <Ionicons name="heart-dislike-outline" size={32} color="#FBBC05" />
            <Text style={[styles.moodText, { color: theme.text }]}>Anxious</Text>
          </TouchableOpacity>
        </View>

        
<View style={styles.reminderSection}>
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>Upcoming Reminders</Text>
    <TouchableOpacity onPress={() => navigation.navigate('MainApp', { screen: 'Reminders' })}>
      <Ionicons name="add-circle-outline" size={24} color="#4285F4" style={{ marginTop: 4 }} />
    </TouchableOpacity>
  </View>

  {isLoadingReminders ? (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4285F4" />
      <Text style={styles.loadingText}>Loading reminders...</Text>
    </View>
  ) : reminders.length === 0 ? (
    <View style={styles.emptyFavorites}>
      <Ionicons name="notifications-outline" size={48} color="#DADCE0" />
      <Text style={styles.emptyText}>No reminders set</Text>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => navigation.navigate('MainApp', { screen: 'Reminders' })}
      >
        <Text style={styles.addButtonText}>Add Reminders</Text>
      </TouchableOpacity>
    </View>
  ) : (
    reminders.map((reminder, index) => (
      <View key={reminder.id} style={styles.reminderCard}>
        <View style={[styles.reminderTimeIndicator, { 
          backgroundColor: ['#4285F4', '#34A853', '#FBBC05'][index % 3] 
        }]}>
          <Text style={styles.reminderTimeText}>
            {reminder.time}
          </Text>
        </View>
        <View style={styles.reminderDetails}>
          <Text style={styles.reminderTitle}>{reminder.title}</Text>
          <Text style={styles.reminderSubtitle}>
            {reminder.body}
          </Text>
        </View>
  
      </View>
    ))
  )}
</View>
        <View style={styles.favoritesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Favorite Songs</Text>
            {favoriteSongs.length > 0 && (
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={navigateToPlaylist}
          >
            <Text style={styles.viewAllButtonText}>
              View All >>
            </Text>
          </TouchableOpacity>
        )}
          </View>
          
          {renderFavoritesSection()}
        </View>
          
        <View style={styles.favoritesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Favorite Games</Text>
          </View>
  
          {renderFavoriteGamesSection()}
        </View>

        <View style={styles.favoritesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Favorite Meditations</Text>
          </View>

          {renderFavoriteMeditationsSection()}
        </View>

        <View style={styles.favoritesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Favorite Exercises</Text>
          </View>
          
          {renderFavoriteExercisesSection()}
        </View>
        
      </View>
    </ScrollView>
    <View style={styles.emergencyButtonContainer}>
        <EmergencyContactButton />
      </View>
    </View>
  );
};




export default HomeScreen