import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, ScrollView, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { BASE_URL } from './config';
import { useTheme } from './ThemeContext';

// Define interface for meditation data
interface MeditationType {
  id: string;
  meditationId: string;
  title: string;
  duration: string;
  category: string;
  emoji: string;
  backgroundColor: string;
  youtubeId: string;
  description: string;
  isFavorite: boolean;
}

const FavoriteTab: React.FC = () => {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  
  const [selectedVideo, setSelectedVideo] = useState<MeditationType | null>(null);
  const [playing, setPlaying] = useState<boolean>(true);
  const [favorites, setFavorites] = useState<MeditationType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);


  // Fetch user's favorite meditations on component mount
  useEffect(() => {
    if (currentUser?.userId) {
      fetchFavorites();
    } else {
      setIsLoading(false);
      setFavorites([]);
    }
  }, [currentUser]);


  const fetchFavoritesQuietly = async () => {
  if (!currentUser?.userId) {
    return;
  }
  
  try {
    // Get the user's favorites without changing loading state
    const response = await axios.get(`${BASE_URL}/meditation/${currentUser.userId}`);
    
    // Transform the data to match our component's structure
    const favoriteMeditations = response.data.map((item: any) => ({
      id: item.meditationId,
      meditationId: item.meditationId,
      title: item.title,
      duration: item.duration,
      category: item.category,
      emoji: item.emoji,
      backgroundColor: item.backgroundColor,
      youtubeId: item.youtubeId,
      description: item.description,
      isFavorite: true
    }));
    
    // Only update if there's a difference to avoid unnecessary re-renders
    if (JSON.stringify(favoriteMeditations) !== JSON.stringify(favorites)) {
      setFavorites(favoriteMeditations);
    }
  } catch (error) {
    // Silently log the error without showing to user
    console.error('Error during quiet fetch of favorites:', error);
  }
};

  useEffect(() => {
  if (currentUser?.userId) {
    // Initial fetch
    fetchFavorites();
    
    // Set up polling every 3 seconds
    const interval = setInterval(() => {
      fetchFavoritesQuietly();
    }, 1000);
    
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
    // Get the user's favorites directly - the backend already handles the population
    const response = await axios.get(`${BASE_URL}/meditation/${currentUser.userId}`);
    
    // Transform the data to match our component's structure
    const favoriteMeditations = response.data.map((item: any) => ({
      id: item.meditationId,
      meditationId: item.meditationId,
      title: item.title,
      duration: item.duration,
      category: item.category,
      emoji: item.emoji,
      backgroundColor: item.backgroundColor,
      youtubeId: item.youtubeId,
      description: item.description,
      isFavorite: true
    }));
    
    setFavorites(favoriteMeditations);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    setError('Failed to load favorite meditations. Please try again later.');
  } finally {
    setIsLoading(false);
  }
};

  const removeFavorite = async (meditationId: string) => {
  if (!currentUser?.userId) {
    Alert.alert('Login Required', 'Please log in to manage favorites');
    return;
  }

  try {
    // Remove from favorites on server
    await axios.delete(`${BASE_URL}/meditation/${currentUser.userId}/${meditationId}`);
    
    // Update local state
    setFavorites(prevFavorites => prevFavorites.filter(fav => fav.meditationId !== meditationId));
    
    // If the selected video is being removed, close it
    if (selectedVideo && selectedVideo.meditationId === meditationId) {
      setSelectedVideo(null);
      setPlaying(false);
    }
  } catch (error) {
    console.error('Error removing favorite:', error);
    Alert.alert('Error', 'Could not remove from favorites');
  }
};




  // Handle meditation selection to play video
  const handleMeditationSelect = (meditation: MeditationType): void => {
    setSelectedVideo(meditation);
    setPlaying(true);
  };
  
  // Close video player
  const handleCloseVideo = (): void => {
    setSelectedVideo(null);
    setPlaying(false);
  };

  // Handle YouTube player state changes
  const onStateChange = useCallback((state: string): void => {
    if (state === 'ended') {
      setPlaying(false);
    }
  }, []);

  // Render the video player for selected meditation
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
              onPress={() => removeFavorite(selectedVideo.id)}
              style={styles.favoriteButton}
            >
              <Ionicons 
                name="heart" 
                size={28} 
                color="#E94057" 
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
          <Ionicons name="alert-circle" size={50} color="#E94057" />
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
            Please log in to view and manage your favorite meditations
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.tabTitle, { color: theme.text }]}>My Favorites</Text>
      
      {selectedVideo ? (
        <ScrollView contentContainerStyle={styles.videoScrollContainer}>
          {renderVideoPlayer()}
        </ScrollView>
      ) : (
        <>
          {favorites.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="heart-outline" size={60} color={theme.subText} />
              <Text style={[styles.emptyStateText, { color: theme.text }]}>No favorites yet</Text>
              <Text style={[styles.emptyStateSubText, { color: theme.subText }]}>
                Tap the heart icon on any meditation to add it to your favorites
              </Text>
            </View>
          ) : (
            <FlatList
              data={favorites}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.meditationList}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.meditationCard, { backgroundColor: theme.cardBackground }]}
                  onPress={() => handleMeditationSelect(item)}
                >
                  <View style={[styles.emojiContainer, { backgroundColor: item.backgroundColor }]}>
                    <Text style={styles.emoji}>{item.emoji}</Text>
                  </View>
                  <View style={styles.meditationInfo}>
                    <Text style={[styles.meditationTitle, { color: theme.text }]}>{item.title}</Text>
                    <View style={styles.meditationMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={16} color={theme.subText} />
                        <Text style={[styles.metaText, { color: theme.subText }]}>{item.duration}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.meditationActions}>
                    <TouchableOpacity 
                      onPress={() => removeFavorite(item.id)}
                      style={styles.favoriteButtonSmall}
                    >
                      <Ionicons 
                        name="heart" 
                        size={24} 
                        color="#E94057" 
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
    backgroundColor: '#F8F9FA',
    padding: 16,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#202124',
    marginBottom: 20,
  },
  meditationList: {
    paddingBottom: 20,
  },
  meditationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
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
  meditationInfo: {
    flex: 1,
  },
  meditationTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#202124',
  },
  meditationMeta: {
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
    color: '#5F6368',
    marginLeft: 5,
  },
  meditationActions: {
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
    backgroundColor: 'white',
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
    borderBottomColor: '#E8EAED',
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
    color: '#202124',
  },
  videoInfo: {
    padding: 15,
    paddingBottom: 20,
  },
  videoDescription: {
    fontSize: 16,
    color: '#202124',
    marginBottom: 15,
    lineHeight: 24,
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
    color: '#5F6368',
    marginTop: 15,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#9AA0A6',
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
    color: '#5F6368',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#5F6368',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4285F4',
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

export default FavoriteTab;