import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Animated, 
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import axios from 'axios';

// Import context
import { AuthContext } from './AuthContext';
import API_URL from './config';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - 40 - CARD_MARGIN * 2) / 2;

// Game Card Component (similar to the one in GamesScreen)
const GameCard = ({ game, onPress, index, onToggleFavorite, isLoading }) => {
  const [animation] = useState(new Animated.Value(0));
  
  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 400,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);

  const cardStyle = {
    opacity: animation,
    transform: [{ 
      translateY: animation.interpolate({
        inputRange: [0, 1],
        outputRange: [20, 0]
      })
    }]
  };

  return (
    <Animated.View style={[styles.cardContainer, cardStyle]}>
      <TouchableOpacity 
        activeOpacity={0.8} 
        onPress={onPress}
        style={styles.gameCard}
      >
        <View style={styles.emojiContainer}>
          <Text style={styles.gameEmoji}>{game.emoji}</Text>
          <TouchableOpacity 
            style={styles.likeButton} 
            onPress={() => onToggleFavorite(game._id)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#1DB954" />
            ) : (
              <AntDesign 
                name="heart" 
                size={24} 
                color="#1DB954" 
              />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.gameTitle}>{game.title}</Text>
        {game.likes > 0 && (
          <Text style={styles.likesCount}>{game.likes} {game.likes === 1 ? 'like' : 'likes'}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// FavoriteGames main component
const FavoriteGames = () => {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const [favoriteGames, setFavoriteGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likeLoading, setLikeLoading] = useState(false);
  const [headerAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(headerAnimation, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    
    fetchFavoriteGames();
  }, []);

  // Fetch favorite games from the API
  const fetchFavoriteGames = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/games/favorites/${user._id}`);
      setFavoriteGames(response.data);
    } catch (error) {
      console.error('Error fetching favorite games:', error);
      // Handle error - maybe show an error message
    } finally {
      setLoading(false);
    }
  };

  // Handle game selection
  const handleGameSelect = (game) => {
    navigation.navigate(game.route);
  };

  // Handle removing from favorites
  const handleToggleFavorite = async (gameId) => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    
    try {
      setLikeLoading(true);
      
      // Make API call to toggle favorite
      const response = await axios.post(`${API_URL}/games/favorite/${gameId}`, {
        userId: user._id
      });
      
      if (response.data.status === 'removed') {
        // Remove from favorites list
        setFavoriteGames(prev => prev.filter(g => g._id !== gameId));
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
      // Handle error
    } finally {
      setLikeLoading(false);
    }
  };

  const headerStyle = {
    opacity: headerAnimation,
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  // If user is not logged in
  if (!user) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.messageText}>Please log in to view your favorite games</Text>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // If no favorite games
  if (favoriteGames.length === 0) {
    return (
      <View style={styles.container}>
        <Animated.View style={headerStyle}>
          <Text style={styles.header}>My Favorites</Text>
        </Animated.View>
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>You haven't added any games to your favorites yet.</Text>
          <TouchableOpacity 
            style={styles.emptyStateButton}
            onPress={() => navigation.navigate('GamesGrid')}
          >
            <Text style={styles.emptyStateButtonText}>Explore Games</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={headerStyle}>
        <Text style={styles.header}>My Favorites</Text>
      </Animated.View>
      
      <ScrollView contentContainerStyle={styles.gridContainer}>
        <View style={styles.rowContainer}>
          {favoriteGames.map((game, index) => (
            <GameCard
              key={game._id}
              game={game}
              index={index}
              onToggleFavorite={handleToggleFavorite}
              onPress={() => handleGameSelect(game)}
              isLoading={likeLoading}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#121212', // Spotify-like dark background
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  gridContainer: {
    paddingBottom: 20,
  },
  rowContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardContainer: {
    width: CARD_WIDTH,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gameCard: {
    alignItems: 'center',
    padding: 12,
  },
  emojiContainer: {
    width: CARD_WIDTH - 24,
    height: CARD_WIDTH - 24,
    borderRadius: 8,
    backgroundColor: '#2A2A2A', // Spotify-like card background
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  gameEmoji: {
    fontSize: 48,
  },
  gameTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  likesCount: {
    fontSize: 12,
    color: '#B3B3B3',
    marginTop: 4,
  },
  likeButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyStateText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  emptyStateButtonText: {
    color: '#000000',
    fontWeight: '600',
  },
  messageText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  loginButtonText: {
    color: '#000000',
    fontWeight: '600',
  },
});

export default FavoriteGames;