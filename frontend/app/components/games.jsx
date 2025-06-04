import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Animated, 
  Dimensions, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from './AuthContext';
import { BASE_URL } from './config';
import { useTheme } from './ThemeContext';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - 40 - CARD_MARGIN * 2) / 2;

// Game Card Component
const GameCard = ({ game, onPress, index, isFavorite, onToggleFavorite, isLoading, theme }) => {
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
        style={[styles.gameCard, { backgroundColor: theme.cardBackground }]}
      >
        <View style={[styles.emojiContainer, { backgroundColor: theme.cardBackground }]}>
          <Text style={styles.gameEmoji}>{game.emoji}</Text>
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={() => onToggleFavorite(game)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FF0000" />
            ) : (
              <Icon 
                name={isFavorite ? "favorite" : "favorite-border"} 
                size={24} 
                color={isFavorite ? "#FF0000" : "#888"} 
              />
            )}
          </TouchableOpacity>
        </View>
        <Text style={[styles.gameTitle, { color: theme.text }]}>{game.title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Tab view for All Games and Favorites
const TabView = ({ activeTab, onTabChange, theme }) => {
  return (
    <View style={[styles.tabContainer, { backgroundColor: theme.divider }]}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'all' && styles.activeTab]} 
        onPress={() => onTabChange('all')}
      >
        <Text style={[styles.tabText, activeTab === 'all' && { color: theme.primary }]}>
          All Games
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'favorites' && styles.activeTab]} 
        onPress={() => onTabChange('favorites')}
      >
        <Text style={[styles.tabText, activeTab === 'favorites' && { color: theme.primary }]}>
          Favorites
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const GamesScreen = () => {
  const navigation = useNavigation();
  const { currentUser, getAuthHeader } = useAuth();
  const { theme } = useTheme();
  const [headerAnimation] = useState(new Animated.Value(0));
  const [games, setGames] = useState([]);
  const [favoriteGames, setFavoriteGames] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingFavoriteId, setLoadingFavoriteId] = useState(null);
  
  // Fetch all games from the server
  const fetchGames = async () => {
    try {
      const response = await fetch(`${BASE_URL}/game`, {
        headers: getAuthHeader()
      });

      
      if (response.ok) {
        const data = await response.json();
        setGames(data);
      } else {
        console.error('Failed to fetch games');
        // Fallback to static games if API fails
        setGames(getStaticGames());
      }
    } catch (error) {
      console.error('Error fetching games:', error);
      // Fallback to static games if API fails
      setGames(getStaticGames());
    }
  };

  // Static games as fallback
  const getStaticGames = () => {
    return [
      { _id: '2', title: 'Memory Game', route: 'MemoryGame', emoji: '🧠' },
      { _id: '4', title: 'Tetris', route: 'Tetris', emoji: '🧩' },
      { _id: '5', title: 'Color Tap', route: 'Mole', emoji: '🎨' },
      { _id: '6', title: 'Balloon Pop', route: 'Balloon', emoji: '🎈' },
      { _id: '7', title: 'Falling Stars', route: 'FallingStars', emoji: '⭐' },
      { _id: '8', title: 'Bubble Pop', route: 'Bubble', emoji: '🫧' },
      { _id: '9', title: 'Tap Target', route: 'Tap', emoji: '🎯' },
      { _id: '10', title: 'Find Bomb', route: 'Find', emoji: '💣' },
    ];
  };

  // Fetch user's favorite games
  const fetchFavoriteGames = async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`${BASE_URL}/game/${currentUser.userId}/favoriteGames`, {
        headers: getAuthHeader()
      });
      
      if (response.ok) {
        const data = await response.json();
        setFavoriteGames(data);
      } else {
        console.error('Failed to fetch favorite games');
      }
    } catch (error) {
      console.error('Error fetching favorite games:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle favorite status for a game
  const toggleFavorite = async (game) => {
    if (!currentUser) {
      Alert.alert('Sign In Required', 'Please sign in to save favorite games.');
      return;
    }
    
    setLoadingFavoriteId(game._id);
    
    const isFavorite = favoriteGames.some(favGame => 
      favGame._id === game._id
    );
    
    const endpoint = `${BASE_URL}/game/${currentUser.userId}/favoriteGames/${game._id}`;
    
    try {
      const response = await fetch(endpoint, {
        method: isFavorite ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });
      
      if (response.ok) {
        if (isFavorite) {
          setFavoriteGames(favoriteGames.filter(favGame => favGame._id !== game._id));
        } else {
          setFavoriteGames([...favoriteGames, game]);
        }
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Failed to update favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoadingFavoriteId(null);
    }
  };
  
  // Check if a game is in user's favorites
  const isGameFavorite = (game) => {
    return favoriteGames.some(favGame => favGame._id === game._id);
  };
  
  useEffect(() => {
    // Initialize animations
    Animated.timing(headerAnimation, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    
    // Load data
    setIsLoading(true);
    Promise.all([fetchGames(), fetchFavoriteGames()])
      .finally(() => setIsLoading(false));
  }, [currentUser?.userId]);

  const headerStyle = {
    opacity: headerAnimation,
  };
  
  const handleGameSelect = (game) => {
    navigation.navigate(game.route);
  };
  
  const displayGames = activeTab === 'all' ? games : favoriteGames;
  
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View style={headerStyle}>
          <Text style={[styles.header, { color: theme.text }]}>Games</Text>
        </Animated.View>
        
        <TabView activeTab={activeTab} onTabChange={setActiveTab} theme={theme} />
        
        {activeTab === 'favorites' && favoriteGames.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Icon name="favorite-border" size={64} color={theme.subText} />
            <Text style={[styles.emptyStateText, { color: theme.text }]}>No favorite games yet</Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.subText }]}>
              Add games to your favorites by tapping the heart icon
            </Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            <View style={styles.rowContainer}>
              {displayGames.map((game, index) => (
                <GameCard
                  key={game._id || index.toString()}
                  game={game}
                  index={index}
                  onPress={() => handleGameSelect(game)}
                  isFavorite={isGameFavorite(game)}
                  onToggleFavorite={toggleFavorite}
                  isLoading={loadingFavoriteId === game._id}
                  theme={theme}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'rgba(138, 180, 248, 0.1)',
  },
  tabText: {
    fontWeight: '500',
  },
  gridContainer: {
    // Container for the game grid
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
    borderRadius: 8,
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  emojiContainer: {
    width: CARD_WIDTH - 24,
    height: CARD_WIDTH - 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  gameEmoji: {
    fontSize: 48,
  },
  gameTitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
});

export default GamesScreen;