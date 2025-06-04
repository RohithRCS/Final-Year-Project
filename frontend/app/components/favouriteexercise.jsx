import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, ScrollView, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import YoutubePlayer from 'react-native-youtube-iframe';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { BASE_URL } from './config';
import { useTheme } from './ThemeContext';

// Define interface for exercise data
// Note: If using TypeScript, uncomment the interface definition
/*
interface ExerciseType {
  _id: string;
  title: string;
  duration: string;
  category: string;
  emoji: string;
  backgroundColor: string;
  youtubeId: string;
  description: string;
  videoUrl?: string;
}
*/

const FavoriteExercises = () => {
  const { currentUser, getAuthHeader } = useAuth();
  const { theme } = useTheme();
  
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [playing, setPlaying] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);

  // Fetch user's favorite exercises on component mount
  useEffect(() => {
    if (currentUser?.userId) {
      fetchFavorites();
    } else {
      setIsLoading(false);
      setFavorites([]);
    }
  }, [currentUser]);

  // Quietly fetch favorites without showing loading state - for polling updates
  const fetchFavoritesQuietly = async () => {
    if (!currentUser?.userId) {
      return;
    }
    
    try {
      const response = await fetch(`${BASE_URL}/exercise/favorites?userId=${currentUser.userId}`, {
        headers: getAuthHeader()
      });
      
      if (response.ok) {
        const data = await response.json();
        // Format data to match our expected format with emoji and background color
        const favoriteExercises = data.map(exercise => ({
          ...exercise,
          emoji: getExerciseEmoji(exercise.category),
          backgroundColor: getBackgroundColor(exercise.category)
        }));
        
        // Only update if there's a difference to avoid unnecessary re-renders
        if (JSON.stringify(favoriteExercises) !== JSON.stringify(favorites)) {
          setFavorites(favoriteExercises);
        }
      }
    } catch (error) {
      // Silently log the error without showing to user
      console.error('Error during quiet fetch of favorites:', error);
    }
  };

  // Set up polling interval to keep favorites in sync
  useEffect(() => {
    if (currentUser?.userId) {
      // Initial fetch
      fetchFavorites();
      
      // Set up polling every 3 seconds
      const interval = setInterval(() => {
        fetchFavoritesQuietly();
      }, 3000);
      
      setPollingInterval(interval);
      
      // Clean up on unmount
      return () => {
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
      };
    } else {
      setIsLoading(false);
      setFavorites([]);
    }
  }, [currentUser]);

  const fetchFavorites = async () => {
    if (!currentUser?.userId) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BASE_URL}/exercise/favorites?userId=${currentUser.userId}`, {
        headers: getAuthHeader()
      });
      
      if (response.ok) {
        const data = await response.json();
        // Format data to match our expected format with emoji and background color
        const favoriteExercises = data.map(exercise => ({
          ...exercise,
          emoji: getExerciseEmoji(exercise.category),
          backgroundColor: getBackgroundColor(exercise.category)
        }));
        
        setFavorites(favoriteExercises);
      } else {
        setError('Failed to load favorite exercises. Please try again later.');
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setError('Failed to load favorite exercises. Please try again later.');
    } finally {
      setIsLoading(false);
    }
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

  const removeFavorite = async (exercise) => {
    if (!currentUser?.userId) {
      Alert.alert('Login Required', 'Please log in to manage favorites');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/exercise/${exercise._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ userId: currentUser.userId })
      });

      if (response.ok) {
        // Update local state
        setFavorites(prevFavorites => prevFavorites.filter(fav => fav._id !== exercise._id));
        
        // If the selected video is being removed, close it
        if (selectedVideo && selectedVideo._id === exercise._id) {
          setSelectedVideo(null);
          setPlaying(false);
        }
      } else {
        Alert.alert('Error', 'Could not remove from favorites');
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      Alert.alert('Error', 'Could not remove from favorites');
    }
  };

  // Handle exercise selection to play video
  const handleExerciseSelect = (exercise) => {
    setSelectedVideo(exercise);
    setPlaying(true);
  };
  
  // Close video player
  const handleCloseVideo = () => {
    setSelectedVideo(null);
    setPlaying(false);
  };

  // Handle YouTube player state changes
  const onStateChange = useCallback((state) => {
    if (state === 'ended') {
      setPlaying(false);
    }
  }, []);

  // Render the video player for selected exercise
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
          <Text style={[styles.videoDescription, { color: theme.text }]}>{selectedVideo.description}</Text>
          <View style={styles.videoMetaContainer}>
            <View style={styles.videoMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={18} color={theme.subText} />
                <Text style={[styles.metaText, { color: theme.subText }]}>{selectedVideo.duration}</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => removeFavorite(selectedVideo)}
              style={styles.favoriteButton}
            >
              <Ionicons 
                name="heart" 
                size={28} 
                color="#FF0000" 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading favorites...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#FF0000" />
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={fetchFavorites}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!currentUser?.userId) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.emptyStateContainer}>
          <Ionicons name="person-circle-outline" size={60} color={theme.subText} />
          <Text style={[styles.emptyStateText, { color: theme.text }]}>Login Required</Text>
          <Text style={[styles.emptyStateSubText, { color: theme.subText }]}>
            Please log in to view and manage your favorite exercises
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.tabTitle, { color: theme.text }]}>My Favorite Exercises</Text>
      
      {selectedVideo ? (
        <ScrollView contentContainerStyle={styles.videoScrollContainer}>
          {renderVideoPlayer()}
        </ScrollView>
      ) : (
        <>
          {favorites.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="heart-outline" size={60} color={theme.subText} />
              <Text style={[styles.emptyStateText, { color: theme.text }]}>No favorite exercises yet</Text>
              <Text style={[styles.emptyStateSubText, { color: theme.subText }]}>
                Tap the heart icon on any exercise to add it to your favorites
              </Text>
            </View>
          ) : (
            <FlatList
              data={favorites}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.exerciseList}
              renderItem={({ item }) => (
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
                      onPress={() => removeFavorite(item)}
                      style={styles.favoriteButtonSmall}
                    >
                      <Ionicons 
                        name="heart" 
                        size={24} 
                        color="#FF0000" 
                      />
                    </TouchableOpacity>
                    <Ionicons name="play-circle" size={36} color={theme.primary} />
                  </View>
                </TouchableOpacity>
              )}
              refreshing={isLoading}
              onRefresh={fetchFavorites}
            />
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: 'bold',
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
  },
  emojiLarge: {
    fontSize: 28,
    marginRight: 10,
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
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 15,
  },
  emptyStateSubText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: '80%',
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
});

export default FavoriteExercises;