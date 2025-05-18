import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, ScrollView, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Video } from 'expo-av';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useAuth } from './AuthContext';
import {BASE_URL}  from './config'; 
import { useTheme } from './ThemeContext'

const ExercisesScreen = () => {
  const navigation = useNavigation();
  const { currentUser, getAuthHeader } = useAuth(); // Get user and auth header
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [playing, setPlaying] = useState(true);
  const [exercises, setExercises] = useState([]);
  const [favoriteExercises, setFavoriteExercises] = useState([]);
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme(); 

  // Exercise categories
  const categories = [
    'All',
    'Favorites',
    'Stretching',
    'Muscle Training',
    'Warm Ups',
    'Balance',
    'Light Cardio'
  ];

  // Fetch all exercises and user's favorites on component mount
  useEffect(() => {
    fetchExercises();
    if (currentUser?.userId) {
      fetchFavoriteExercises();
    }
  }, [currentUser]);

  // Fetch exercises from the API
  const fetchExercises = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/exercise/all`, {
        headers: getAuthHeader()
      });
      
      if (response.ok) {
        const data = await response.json();
        // Format data to match our expected format with emoji and background color
        const formattedExercises = data.map(exercise => ({
          ...exercise,
          emoji: getExerciseEmoji(exercise.category),
          backgroundColor: getBackgroundColor(exercise.category)
        }));
        setExercises(formattedExercises);
      } else {
        console.error('Failed to fetch exercises');
        // Fallback to local exercises if API fails
        setExercises(localExercises);
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
      // Fallback to local exercises
      setExercises(localExercises);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's favorite exercises
  const fetchFavoriteExercises = async () => {
    try {
      const response = await fetch(`${BASE_URL}/exercise/favorites?userId=${currentUser.userId}`, {
        headers: getAuthHeader()
      });
      
      if (response.ok) {
        const data = await response.json();
        setFavoriteExercises(data);
      } else {
        console.error('Failed to fetch favorite exercises');
      }
    } catch (error) {
      console.error('Error fetching favorite exercises:', error);
    }
  };

  // Toggle favorite status for an exercise
  const toggleFavorite = async (exercise) => {
    if (!currentUser) {
      Alert.alert('Sign In Required', 'Please sign in to save favorites');
      return;
    }

    try {
      const isFavorite = favoriteExercises.some(fav => fav._id === exercise._id);
      const method = isFavorite ? 'DELETE' : 'POST';
      
      const response = await fetch(`${BASE_URL}/exercise/${exercise._id}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ userId: currentUser.userId })
      });

      if (response.ok) {
        if (isFavorite) {
          setFavoriteExercises(favoriteExercises.filter(fav => fav._id !== exercise._id));
        } else {
          setFavoriteExercises([...favoriteExercises, exercise]);
        }
      } else {
        Alert.alert('Error', isFavorite ? 'Failed to remove from favorites' : 'Failed to add to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  // Check if an exercise is in favorites
  const isExerciseFavorite = (exerciseId) => {
    return favoriteExercises.some(fav => fav._id === exerciseId);
  };

  // Assign emoji based on exercise category
  const getExerciseEmoji = (category) => {
    switch(category) {
      case 'Stretching': return '🤸‍♂️';
      case 'Muscle Training': return '💪';
      case 'Warm Ups': return '🔥';
      case 'Balance': return '⚖️';
      case 'Light Cardio': return '🏃';
      default: return '👐';
    }
  };

  // Assign background color based on exercise category
  const getBackgroundColor = (category) => {
    switch(category) {
      case 'Stretching': return '#E6F4EA';
      case 'Muscle Training': return '#FCE8E6';
      case 'Warm Ups': return '#FEF7E0';
      case 'Balance': return '#E6F4EA';
      case 'Light Cardio': return '#FEF7E0';
      default: return '#E6F4EA';
    }
  };

  // Category emoji mapping
  const getCategoryEmoji = (category) => {
    switch(category) {
      case 'All': return '🔍';
      case 'Favorites': return '❤️';
      case 'Stretching': return '🤸‍♂️';
      case 'Muscle Training': return '💪';
      case 'Warm Ups': return '🔥';
      case 'Balance': return '⚖️';
      case 'Light Cardio': return '🏃';
      default: return '';
    }
  };

  // Filter exercises by selected category
  const filteredExercises = () => {
    if (selectedCategory === 'All') {
      return exercises;
    } else if (selectedCategory === 'Favorites') {
      return exercises.filter(exercise => isExerciseFavorite(exercise._id));
    } else {
      return exercises.filter(exercise => exercise.category === selectedCategory);
    }
  };

  // Handle exercise selection to play video
  const handleExerciseSelect = (exercise) => {
    setSelectedVideo(exercise);
    setPlaying(true);
  };
  
  // Handle back button action depending on context
  const handleBackButton = () => {
    if (selectedVideo) {
      // If viewing a video, go back to exercise list
      setSelectedVideo(null);
      setPlaying(false);
    } else {
      // If on exercise list, navigate back to activities page
      navigation.goBack();
    }
  };

  // Handle YouTube player state changes
  const onStateChange = useCallback((state) => {
    if (state === 'ended') {
      setPlaying(false);
    }
  }, []);

  // Render video player when an exercise is selected
  const renderVideoPlayer = () => {
    if (!selectedVideo) return null;
    
    return (
      <View style={styles.videoContainer}>
        <View style={styles.videoHeader}>
          <View style={styles.videoTitleContainer}>
            <Text style={styles.emojiLarge}>{selectedVideo.emoji}</Text>
            <Text style={styles.videoTitle}>{selectedVideo.title}</Text>
          </View>
          {/* Favorite button in video view */}
          <TouchableOpacity onPress={() => toggleFavorite(selectedVideo)} style={styles.favoriteButton}>
            <Ionicons 
              name={isExerciseFavorite(selectedVideo._id) ? "heart" : "heart-outline"} 
              size={28} 
              color={isExerciseFavorite(selectedVideo._id) ? "#FF385C" : "#888"} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Use YouTube player if youtubeId is available, otherwise fallback to Expo Video */}
        {selectedVideo.youtubeId ? (
          <YoutubePlayer
            height={250}
            play={playing}
            videoId={selectedVideo.youtubeId}
            onChangeState={onStateChange}
          />
        ) : (
          <Video
            source={{ uri: selectedVideo.videoUrl }}
            rate={1.0}
            volume={1.0}
            isMuted={false}
            resizeMode="contain"
            shouldPlay
            useNativeControls
            style={styles.video}
          />
        )}
        
        <View style={styles.videoInfo}>
          <Text style={styles.videoDescription}>{selectedVideo.description}</Text>
          <View style={styles.videoMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={18} color="#5F6368" />
              <Text style={styles.metaText}>{selectedVideo.duration}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Fallback local exercises data if API fails
  const localExercises = [
    { 
      _id: '1', 
      title: 'Hand Exercises', 
      duration: '5 min 25 sec',
      category: 'Stretching',
      emoji: '👐',
      backgroundColor: '#E6F4EA',
      youtubeId: '00RV5TCPCIU', 
      description: 'Gentle yoga exercises that can be done while seated in a chair.'
    },
    { 
      _id: '2', 
      title: 'Chest Opener Stretch', 
      duration: '45 sec',
      category: 'Stretching',
      emoji: '🏋️',
      backgroundColor: '#FCE8E6',
      youtubeId: 'MIE5FE99txA',
      description: 'Stretch to open up your chest and shoulders.'
    },
    { 
      _id: '3', 
      title: 'Wall Pushups', 
      duration: '1 min 12 sec',
      category: 'Muscle Training',
      emoji: '💪',
      backgroundColor: '#FEF7E0',
      youtubeId: '5NPvv40gd3Q',
      description: 'Strengthen your upper body with wall pushups.'
    },
    { 
      _id: '4', 
      title: 'Chair Squats', 
      duration: '55 sec',
      category: 'Muscle Training',
      emoji: '🪑',
      backgroundColor: '#FEF7E0',
      youtubeId: 'OViE2ghEop0',
      description: 'Build leg strength and stability with chair squats.'
    },
    { 
      _id: '5', 
      title: 'Wrist Rotation', 
      duration: '36 sec',
      category: 'Warm Ups',
      emoji: '✊',
      backgroundColor: '#E6F4EA',
      youtubeId: '07xRQWfXJgI',
      description: 'Loosen up your wrists with simple rotations.'
    },
    { 
      _id: '6', 
      title: 'High Knees', 
      duration: '28 sec',
      category: 'Warm Ups',
      emoji: '🧎‍♂️‍➡️',
      backgroundColor: '#FEF7E0',
      youtubeId: 'ZZZoCNMU48U',
      description: 'Get your heart pumping with high knees.'
    },
    { 
      _id: '7', 
      title: 'Single Leg Stand', 
      duration: '53 sec',
      category: 'Balance',
      emoji: ' 🦵 ',
      backgroundColor: '#E6F4EA',
      youtubeId: 'hH4aQTBIYo0',
      description: 'Improve your balance with a single leg stand.'
    },
    { 
      _id: '8', 
      title: 'Heel to Toe Walk', 
      duration: '1 min 23 sec',
      category: 'Balance',
      emoji: ' 🚶‍♂️ ',
      backgroundColor: '#FEF7E0',
      youtubeId: 'eghMLTn8tDc',
      description: 'Improve balance by walking heel to toe.'
    },
    { 
      _id: '9', 
      title: 'Side to Side Walk', 
      duration: '28 sec',
      category: 'Light Cardio',
      emoji: '🚶‍♂️‍➡️',
      backgroundColor: '#E6F4EA',
      youtubeId: 'O6qn44N9THg',
      description: 'Get your heart rate up with a side-to-side walk.'
    },
    { 
      _id: '10', 
      title: 'Seated Marching Stretch', 
      duration: '1 min 07 sec',
      category: 'Light Cardio',
      emoji: '🪑',
      backgroundColor: '#E6F4EA',
      youtubeId: 'uoRVJBDEX60',
      description: 'Seated marching to get your body moving gently.'
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackButton} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { color: theme.text }]}>Exercise Videos</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.primary }]}>Loading exercises...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackButton} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: theme.text }]}>
          {selectedVideo ? selectedVideo.title : "Exercise Videos"}
        </Text>
      </View>
      
      {selectedVideo ? (
        <ScrollView contentContainerStyle={styles.videoScrollContainer}>
          {renderVideoPlayer()}
        </ScrollView>
      ) : (
        <>
          <Text style={[styles.subtitle, { color: theme.subText }]}>
            Follow along with these exercises designed especially for seniors 👵👴
          </Text>
          
          {/* Categories horizontal scroll */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContentContainer}
          >
            {categories.map(category => (
              <TouchableOpacity 
                key={category} 
                style={[
                  styles.categoryButton, 
                  selectedCategory === category && styles.selectedCategory,
                  { backgroundColor: theme.cardBackground }
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryText, 
                  selectedCategory === category && styles.selectedCategoryText,
                  { color: theme.subText }
                ]}>
                  {getCategoryEmoji(category)} {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Exercise list */}
          <FlatList
            data={filteredExercises()}
            keyExtractor={item => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.exerciseList}
            renderItem={({item}) => (
              <TouchableOpacity 
                style={[styles.exerciseCard, { backgroundColor: theme.cardBackground }]}
                onPress={() => handleExerciseSelect(item)}
              >
                <View style={[styles.emojiContainer, { backgroundColor: item.backgroundColor }]}>
                  <Text style={styles.emoji}>{item.emoji}</Text>
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={[styles.exerciseTitle, { color: theme.text }]}>{item.title}</Text>
                  <View style={styles.exerciseMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={16} color={theme.subText} />
                      <Text style={[styles.metaText, { color: theme.subText }]}>{item.duration}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.cardRightSection}>
                  <TouchableOpacity 
                    onPress={() => toggleFavorite(item)} 
                    style={styles.favoriteButton}
                  >
                    <Ionicons 
                      name={isExerciseFavorite(item._id) ? "heart" : "heart-outline"} 
                      size={24} 
                      color={isExerciseFavorite(item._id) ? "#FF385C" : theme.subText} 
                    />
                  </TouchableOpacity>
                  <Ionicons name="play-circle" size={36} color={theme.primary} />
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyList}>
                <Text style={[styles.emptyText, { color: theme.subText }]}>
                  {selectedCategory === 'Favorites' 
                    ? "You haven't added any favorites yet."
                    : "No exercises found in this category."}
                </Text>
              </View>
            )}
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 11,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  backButton: {
    marginRight: 15,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
  },
  categoriesContainer: {
    flexGrow: 0,
    marginBottom: 20,
    height: 60,
  },
  categoriesContentContainer: {
    paddingRight: 10,
    alignItems: 'center',
    paddingVertical: 5,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    height: 44,
    marginRight: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
    minWidth: 110,
  },
  selectedCategory: {
    backgroundColor: '#4285F4',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    flexShrink: 1,
  },
  selectedCategoryText: {
    color: 'white',
    fontWeight: '600',
  },
  exerciseList: {
    paddingBottom: 20,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emojiContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  emoji: {
    fontSize: 40,
  },
  emojiLarge: {
    fontSize: 28,
    marginRight: 10,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  metaText: {
    fontSize: 14,
    marginLeft: 5,
  },
  cardRightSection: {
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 70,
  },
  favoriteButton: {
    padding: 5,
  },
  videoScrollContainer: {
    paddingBottom: 20,
  },
  videoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
    backgroundColor: 'white', // Keep white background for video container
  },
  videoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED', // Keep this as it's part of the video UI
  },
  videoTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  videoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  video: {
    width: '100%',
    height: 250,
  },
  videoInfo: {
    padding: 15,
    paddingBottom: 20,
  },
  videoDescription: {
    fontSize: 16,
    lineHeight: 24,
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyList: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ExercisesScreen;
