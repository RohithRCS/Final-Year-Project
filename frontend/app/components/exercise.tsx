import React, { useState, useCallback, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  FlatList, 
  ScrollView, 
  SafeAreaView, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import YoutubePlayer from 'react-native-youtube-iframe';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { BASE_URL } from './config';
import { useTheme } from './ThemeContext';

// Define types for navigation
type RootStackParamList = {
  Home: undefined;
  Exercises: undefined;
  // Add other screens as needed
};

type ExercisesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Exercises'>;

// Define interface for exercise data
interface ExerciseType {
  id: string;
  exerciseId: string;
  title: string;
  duration: string;
  category: string;
  emoji: string;
  backgroundColor: string;
  youtubeId: string;
  description: string;
  isFavorite?: boolean;
}

const ExercisesScreen: React.FC = () => {
  const navigation = useNavigation<ExercisesScreenNavigationProp>();
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  
  const [selectedVideo, setSelectedVideo] = useState<ExerciseType | null>(null);
  const [playing, setPlaying] = useState<boolean>(true);
  const [exercises, setExercises] = useState<ExerciseType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all exercises on component mount
  useEffect(() => {
    fetchExercises();
  }, []);

  // Fetch user's favorite exercises when exercises are loaded or user changes
  useEffect(() => {
    if (currentUser?.userId && exercises.length > 0) {
      fetchFavorites(currentUser.userId);
    }
  }, [currentUser, exercises.length]);

  // Regularly update favorites to keep them in sync
  useEffect(() => {
    // Only set up the interval if user is logged in and we have exercises loaded
    if (currentUser?.userId && exercises.length > 0) {
      const intervalId = setInterval(() => {
        fetchFavorites(currentUser.userId);
      }, 1000); // Fetch every second
      
      // Clean up the interval when component unmounts
      return () => clearInterval(intervalId);
    }
  }, [currentUser, exercises.length]);

  // Fetch all exercises from API
  const fetchExercises = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${BASE_URL}/exercise/all`);
      
      // Transform API response to match our component's expected format
      const transformedExercises = response.data.map((item: any) => ({
        id: item.exerciseId || item._id, // Use exerciseId or fallback to _id
        exerciseId: item.exerciseId || item._id, // Keep original exerciseId for API calls
        title: item.title,
        duration: item.duration,
        category: item.category,
        emoji: getExerciseEmoji(item.category),
        backgroundColor: getBackgroundColor(item.category),
        youtubeId: item.youtubeId,
        description: item.description,
        isFavorite: false // Default value, will update after fetching favorites
      }));
      
      setExercises(transformedExercises);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      setError('Failed to load exercises. Please try again later.');
      Alert.alert('Error', 'Could not fetch exercises');
      
      // Fallback to local exercises if API fails
      setExercises(localExercises.map(exercise => ({
        ...exercise,
        id: exercise._id,
        exerciseId: exercise._id,
        isFavorite: false
      })));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFavorites = async (userId: any) => {
    try {
      const response = await axios.get(`${BASE_URL}/exercise/favorites?userId=${userId}`);
      
      // Create a map of favorited exercise IDs for easy lookup
      const favoritedIds = new Set(response.data.map((item: any) => item.exerciseId || item._id));
      
      // Only update state if there's an actual change to prevent unnecessary re-renders
      setExercises(prevExercises => {
        // Check if favorites have changed
        const hasChanges = prevExercises.some(exercise => 
          favoritedIds.has(exercise.exerciseId) !== exercise.isFavorite
        );
        
        // Only update if there are changes
        if (hasChanges) {
          return prevExercises.map(exercise => ({
            ...exercise,
            isFavorite: favoritedIds.has(exercise.exerciseId)
          }));
        }
        
        // Return previous state if no changes
        return prevExercises;
      });
      
      // Also update selected video if it exists and its favorite status has changed
      if (selectedVideo) {
        const newFavoriteStatus = favoritedIds.has(selectedVideo.exerciseId);
        if (selectedVideo.isFavorite !== newFavoriteStatus) {
          setSelectedVideo(prev => prev ? {...prev, isFavorite: newFavoriteStatus} : null);
        }
      }
    } catch (error) {
      // Silently handle error to prevent UI disruption
      console.error('Error fetching favorites:', error);
    }
  };

  const toggleFavorite = async (exerciseId: any) => {
    if (!currentUser?.userId) {
      Alert.alert('Login Required', 'Please log in to add favorites');
      return;
    }

    try {
      // Find the exercise in our state
      const exercise = exercises.find(e => e.exerciseId === exerciseId);
      if (!exercise) return;

      if (exercise.isFavorite) {
        // Remove from favorites
        await axios.delete(`${BASE_URL}/exercise/${exerciseId}`, {
          data: { userId: currentUser.userId }
        });
      } else {
        // Add to favorites
        await axios.post(`${BASE_URL}/exercise/${exerciseId}`, {
          userId: currentUser.userId
        });
      }

      // Update local state
      setExercises(prevExercises => 
        prevExercises.map(e => 
          e.exerciseId === exerciseId 
            ? { ...e, isFavorite: !e.isFavorite } 
            : e
        )
      );

      // Also update selected video if it's the one being toggled
      if (selectedVideo && selectedVideo.exerciseId === exerciseId) {
        setSelectedVideo({
          ...selectedVideo,
          isFavorite: !selectedVideo.isFavorite
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Could not update favorite status');
    }
  };

  // Assign emoji based on exercise category
  const getExerciseEmoji = (category: string) => {
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
  const getBackgroundColor = (category: string) => {
    switch(category) {
      case 'Stretching': return '#E6F4EA';
      case 'Muscle Training': return '#FCE8E6';
      case 'Warm Ups': return '#FEF7E0';
      case 'Balance': return '#E6F4EA';
      case 'Light Cardio': return '#FEF7E0';
      default: return '#E6F4EA';
    }
  };

  // Handle exercise selection to play video
  const handleExerciseSelect = (exercise: ExerciseType) => {
    setSelectedVideo(exercise);
    setPlaying(true);
  };
  
  // Close video player
  const handleCloseVideo = () => {
    setSelectedVideo(null);
    setPlaying(false);
  };

  // Handle YouTube player state changes
  const onStateChange = useCallback((state: string) => {
    if (state === 'ended') {
      setPlaying(false);
    }
  }, []);

  const renderVideoPlayer = () => {
    if (!selectedVideo) return null;
    
    return (
      <View style={[styles.videoContainer, { backgroundColor: theme.cardBackground }]}>
        <View style={[styles.videoHeader, { borderBottomColor: theme.divider }]}>
          <View style={styles.videoTitleContainer}>
            <Text style={styles.emojiLarge}>{selectedVideo.emoji}</Text>
            <Text style={[styles.videoTitle, { color: theme.text }]}>{selectedVideo.title}</Text>
          </View>
          <TouchableOpacity onPress={handleCloseVideo}>
            <Ionicons name="close-circle" size={28} color={theme.primary} />
          </TouchableOpacity>
        </View>
        
        <YoutubePlayer
          height={250}
          play={playing}
          videoId={selectedVideo.youtubeId}
          onChangeState={onStateChange}
        />
        
        <View style={styles.videoInfo}>
          <Text style={[styles.videoDescription, { color: theme.text }]}>{selectedVideo.description}</Text>
          <View style={styles.videoMetaContainer}>
            <View style={styles.videoMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={18} color={theme.subText} />
                <Text style={[styles.metaText, { color: theme.subText }]}>{selectedVideo.duration}</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => toggleFavorite(selectedVideo.exerciseId)}
              style={styles.favoriteButton}
            >
              <Ionicons 
                name={selectedVideo.isFavorite ? "heart" : "heart-outline"} 
                size={28} 
                color={selectedVideo.isFavorite ? "#E94057" : theme.subText} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderExerciseItem = ({ item }: { item: ExerciseType }) => (
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
      <View style={styles.exerciseActions}>
        <TouchableOpacity 
          onPress={() => toggleFavorite(item.exerciseId)}
          style={styles.favoriteButtonSmall}
        >
          <Ionicons 
            name={item.isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color={item.isFavorite ? "#E94057" : theme.subText} 
          />
        </TouchableOpacity>
        <Ionicons name="play-circle" size={36} color={theme.primary} />
      </View>
    </TouchableOpacity>
  );

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

  if (isLoading && exercises.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { color: theme.text }]}>Exercise Videos</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading exercises...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && exercises.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { color: theme.text }]}>Exercise Videos</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#E94057" />
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={fetchExercises}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      
      {selectedVideo ? (
        <ScrollView contentContainerStyle={styles.videoScrollContainer}>
          {renderVideoPlayer()}
        </ScrollView>
      ) : (
        <>
          <Text style={[styles.subtitle, { color: theme.subText }]}>
            Follow along with these exercises designed especially for seniors 👵👴
          </Text>
          
          {/* Exercise list */}
          <FlatList
            data={exercises}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.exerciseList}
            renderItem={renderExerciseItem}
            ListEmptyComponent={() => (
              <View style={styles.emptyList}>
                <Text style={[styles.emptyText, { color: theme.subText }]}>
                  No exercises found. Please check your connection and try again.
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
    paddingTop: 10,
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
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButtonSmall: {
    marginRight: 10,
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
  },
  videoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
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
  videoInfo: {
    padding: 15,
    paddingBottom: 20,
  },
  videoDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 15,
  },
  videoMetaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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