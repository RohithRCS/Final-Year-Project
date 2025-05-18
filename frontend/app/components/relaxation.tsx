import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, ScrollView, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { StackNavigationProp } from '@react-navigation/stack';
import axios from 'axios';
import { useAuth } from './AuthContext'; // Import the auth context
import {BASE_URL} from './config';
import { useTheme } from './ThemeContext'

// Define types for navigation
type RootStackParamList = {
  Home: undefined;
  Meditation: undefined;
  // Add other screens as needed
};

type MeditationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Meditation'>;

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
  isFavorite?: boolean;
}

const MeditationScreen: React.FC = () => {
  const navigation = useNavigation<MeditationScreenNavigationProp>();
  // Use the auth context instead of AsyncStorage
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  
  const [selectedVideo, setSelectedVideo] = useState<MeditationType | null>(null);
  const [playing, setPlaying] = useState<boolean>(true);
  const [meditations, setMeditations] = useState<MeditationType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all meditations on component mount
  useEffect(() => {
    fetchMeditations();
  }, []);

  // Fetch user's favorite meditations when meditations are loaded or user changes
  useEffect(() => {
    if (currentUser?.userId && meditations.length > 0) {
      fetchFavorites(currentUser.userId);
    }
  }, [currentUser, meditations.length]);

  // Fetch all meditations from API
  const fetchMeditations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${BASE_URL}/meditation`);
      
      // Transform API response to match our component's expected format
      const transformedMeditations = response.data.map((item: any) => ({
        id: item.meditationId, // Using meditationId from API as our id
        meditationId: item.meditationId, // Keep original meditationId for API calls
        title: item.title,
        duration: item.duration,
        category: item.category,
        emoji: item.emoji,
        backgroundColor: item.backgroundColor,
        youtubeId: item.youtubeId,
        description: item.description,
        isFavorite: false // Default value, will update after fetching favorites
      }));
      
      setMeditations(transformedMeditations);
    } catch (error) {
      console.error('Error fetching meditations:', error);
      setError('Failed to load meditations. Please try again later.');
      Alert.alert('Error', 'Could not fetch meditations');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user's favorite meditations
  const fetchFavorites = async (userId: string) => {
    try {
      const response = await axios.get(`${BASE_URL}/meditation/${userId}`);
      
      // Create a map of favorited meditation IDs for easy lookup
      const favoritedIds = new Set(response.data.map((item: any) => item.meditationId));
      
      // Update meditation list with favorite status
      setMeditations(prevMeditations => 
        prevMeditations.map(meditation => ({
          ...meditation,
          isFavorite: favoritedIds.has(meditation.id)
        }))
      );
    } catch (error) {
      console.error('Error fetching favorites:', error);
      // Don't show alert here as it's not a critical failure
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (meditationId: string) => {
    if (!currentUser?.userId) {
      Alert.alert('Login Required', 'Please log in to add favorites');
      return;
    }

    try {
      // Find the meditation in our state
      const meditation = meditations.find(m => m.id === meditationId);
      if (!meditation) return;

      if (meditation.isFavorite) {
        // Remove from favorites
        await axios.delete(`${BASE_URL}/meditation/${currentUser.userId}/${meditationId}`);
      } else {
        // Add to favorites
        await axios.post(`${BASE_URL}/meditation/${currentUser.userId}/${meditationId}`);
      }

      // Update local state
      setMeditations(prevMeditations => 
        prevMeditations.map(m => 
          m.id === meditationId 
            ? { ...m, isFavorite: !m.isFavorite } 
            : m
        )
      );

      // Also update selected video if it's the one being toggled
      if (selectedVideo && selectedVideo.id === meditationId) {
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
            onPress={() => toggleFavorite(selectedVideo.id)}
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

  // Render an item in the meditation list
  const renderMeditationItem = ({ item }: { item: MeditationType }) => (
    <TouchableOpacity 
      style={styles.meditationCard}
      onPress={() => handleMeditationSelect(item)}
    >
      <View style={[styles.emojiContainer, { backgroundColor: item.backgroundColor }]}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>
      <View style={styles.meditationInfo}>
        <Text style={styles.meditationTitle}>{item.title}</Text>
        <View style={styles.meditationMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color="#5F6368" />
            <Text style={styles.metaText}>{item.duration}</Text>
          </View>
        </View>
      </View>
      <View style={styles.meditationActions}>
        <TouchableOpacity 
          onPress={() => toggleFavorite(item.id)}
          style={styles.favoriteButtonSmall}
        >
          <Ionicons 
            name={item.isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color={item.isFavorite ? "#E94057" : "#5F6368"} 
          />
        </TouchableOpacity>
        <Ionicons name="play-circle" size={36} color="#4285F4" />
      </View>
    </TouchableOpacity>
  );

  // Filter to show favorites only
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const filteredMeditations = showFavoritesOnly 
    ? meditations.filter(item => item.isFavorite) 
    : meditations;

  if (isLoading && meditations.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { color: theme.text }]}>Meditation</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading meditations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && meditations.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { color: theme.text }]}>Meditation</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#E94057" />
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={fetchMeditations}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Meditation</Text>
      </View>
      
      {selectedVideo ? (
        <ScrollView contentContainerStyle={styles.videoScrollContainer}>
          {renderVideoPlayer()}
        </ScrollView>
      ) : (
        <>
          <Text style={[styles.subtitle, { color: theme.subText }]}>
            Calm your mind with these gentle meditations designed for seniors 🧘‍♀️🧘‍♂️
          </Text>
          
          {/* Favorites filter */}
          <View style={styles.filterContainer}>
            <TouchableOpacity 
              style={[
                styles.filterButton, 
                showFavoritesOnly && styles.filterButtonActive,
                { backgroundColor: theme.cardBackground }
              ]}
              onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              <Ionicons 
                name="heart" 
                size={18} 
                color={showFavoritesOnly ? "#FFFFFF" : "#E94057"} 
              />
              <Text style={[
                styles.filterButtonText,
                showFavoritesOnly && styles.filterButtonTextActive,
                { color: theme.subText }
              ]}>
                {showFavoritesOnly ? 'Show All' : 'Favorites Only'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Meditation list */}
          {filteredMeditations.length === 0 && showFavoritesOnly ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="heart-outline" size={60} color={theme.subText} />
              <Text style={[styles.emptyStateText, { color: theme.text }]}>No favorites yet</Text>
              <Text style={[styles.emptyStateSubText, { color: theme.subText }]}>
                Tap the heart icon on any meditation to add it to your favorites
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredMeditations}
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
                      onPress={() => toggleFavorite(item.id)}
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
              )}
              refreshing={isLoading}
              onRefresh={fetchMeditations}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    color: '#202124',
  },
  subtitle: {
    fontSize: 16,
    color: '#5F6368',
    marginBottom: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F3F4',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: '#E94057',
  },
  filterButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#5F6368',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
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

export default MeditationScreen;