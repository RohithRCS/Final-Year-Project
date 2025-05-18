import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { ThemeProvider, useTheme, lightTheme, darkTheme } from './ThemeContext';

const { width } = Dimensions.get('window');

const SeniorBirdWatchingGame = () => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  
  // Game state
  const [birdCollection, setBirdCollection] = useState([]);
  const [currentBird, setCurrentBird] = useState(null);
  const [feedAvailable, setFeedAvailable] = useState(true);
  const [gameActive, setGameActive] = useState(false);
  const [message, setMessage] = useState('Welcome to Bird Watching!');
  const [gameMode, setGameMode] = useState('relaxed'); // 'relaxed' or 'timed'
  const [timer, setTimer] = useState(0);
  const TIME_LIMIT = 60; // 60 seconds time limit for timed mode

  // All possible birds - with multiple facts per bird
  const allBirds = [
    { 
      id: 1, 
      name: 'Robin', 
      emoji: '🐦', 
      rarity: 'common', 
      points: 1,
      facts: [
        'The American Robin is known for its cheery "cheerily, cheer up" song and is often considered a sign of spring.',
        'Robins can produce three successful broods in one year, with 3-5 eggs per clutch.',
        'Unlike many birds, robins forage primarily on lawns for earthworms, using visual cues to find them.',
        'The robin\'s distinctive red breast is caused by carotenoid pigments in its diet.'
      ]
    },
    { 
      id: 2, 
      name: 'Blue Jay', 
      emoji: '🐦', 
      rarity: 'common', 
      points: 1,
      facts: [
        'Blue Jays are excellent mimics and can imitate hawk calls to scare away other birds.',
        'They are known to store acorns and help spread oak trees by forgetting some of their buried caches.',
        'Blue Jays are intelligent birds that can use tools and will sometimes use strips of newspaper to rake in food.',
        'These birds mate for life and can live up to 7 years in the wild.'
      ]
    },
    { 
      id: 3, 
      name: 'Cardinal', 
      emoji: '🐦', 
      rarity: 'uncommon', 
      points: 2,
      facts: [
        'Male Cardinals are known for their bright red plumage, while females are a more subtle tan-olive color with red accents.',
        'Cardinals don\'t migrate and stay in their territory year-round, bringing color to winter landscapes.',
        'Unlike many birds, female cardinals also sing, often while sitting on the nest.',
        'Cardinals were named after the red robes worn by Roman Catholic cardinals.'
      ]
    },
    { 
      id: 4, 
      name: 'Barn Owl', 
      emoji: '🦉', 
      rarity: 'uncommon', 
      points: 2,
      facts: [
        'Barn Owls have heart-shaped faces and excellent hearing to locate prey in total darkness.',
        'They can eat up to 1,000 mice each year, making them valuable for pest control.',
        'Barn Owls don\'t hoot like other owls - they make a distinctive screeching sound.',
        'Their flight is nearly silent due to specialized feathers, allowing them to hunt by surprise.'
      ]
    },
    { 
      id: 5, 
      name: 'Bald Eagle', 
      emoji: '🦅', 
      rarity: 'rare', 
      points: 3,
      facts: [
        'The Bald Eagle has been the national emblem of the United States since 1782.',
        'Despite their name, Bald Eagles aren\'t bald - they have white feathers on their head that look bald from a distance.',
        'Their nests are the largest of any North American bird, sometimes weighing up to 1 ton.',
        'Bald Eagles can live up to 30 years in the wild and mate for life.'
      ]
    },
    { 
      id: 6, 
      name: 'Hummingbird', 
      emoji: '🐦', 
      rarity: 'rare', 
      points: 3,
      facts: [
        'Hummingbirds can fly backwards and hover in mid-air, beating their wings up to 80 times per second.',
        'They have the highest metabolism of any animal except insects, with heart rates up to 1,260 beats per minute.',
        'Hummingbirds can consume half their body weight in sugar daily.',
        'Some hummingbirds migrate over 500 miles across the Gulf of Mexico in a single flight.'
      ]
    },
    { 
      id: 7, 
      name: 'Flamingo', 
      emoji: '🦩', 
      rarity: 'very rare', 
      points: 5,
      facts: [
        'Flamingos get their pink color from the beta-carotene in their diet of shrimp and algae.',
        'They sleep standing on one leg, which helps conserve body heat.',
        'Flamingos filter-feed by turning their heads upside down and using their specialized beaks.',
        'Some flamingos can live up to 50 years in the wild.'
      ]
    },
    { 
      id: 8, 
      name: 'Sparrow', 
      emoji: '🐦', 
      rarity: 'common', 
      points: 1,
      facts: [
        'House Sparrows were introduced to North America in the 1850s and have been constant companions ever since.',
        'They are incredibly adaptable and have spread to nearly every continent.',
        'House Sparrows form lifelong bonds with their mates and return to the same nesting sites year after year.',
        'They take dust baths to keep their feathers clean and free of parasites.'
      ]
    },
    { 
      id: 9, 
      name: 'Mallard Duck', 
      emoji: '🦆', 
      rarity: 'common', 
      points: 1,
      facts: [
        'Male Mallards have a green head, while females are mottled brown for camouflage when nesting.',
        'They can fly at speeds up to 55 mph during migration.',
        'Mallards are dabbling ducks, meaning they feed by tipping forward to graze on underwater plants.',
        'Their familiar "quack" sound is actually made only by the females; males make a softer rasping sound.'
      ]
    },
    { 
      id: 10, 
      name: 'Swan', 
      emoji: '🦢', 
      rarity: 'uncommon', 
      points: 2,
      facts: [
        'Swans mate for life and can live up to 30 years in the wild.',
        'The "swan song" myth comes from the ancient belief that swans sing beautifully before they die.',
        'A male swan is called a cob, a female is a pen, and babies are cygnets.',
        'The Trumpeter Swan is North America\'s largest native waterfowl, with a wingspan up to 8 feet.'
      ]
    },
    { 
      id: 11, 
      name: 'Bluebird', 
      emoji: '🐦‍⬛', 
      rarity: 'uncommon', 
      points: 2,
      facts: [
        'Eastern Bluebirds were once declining but recovered thanks to birdhouse programs across America.',
        'They can spot caterpillars and insects from 60 feet away.',
        'Bluebirds may raise 2-3 broods each season, with the young from the first brood often helping to feed the next.',
        'Their vivid blue color comes from light refraction in the structure of their feathers, not from pigment.'
      ]
    },
    { 
      id: 12, 
      name: 'Red-tailed Hawk', 
      emoji: '🦅', 
      rarity: 'rare', 
      points: 3,
      facts: [
        'The red-tailed hawk cry is often used in movies as the sound for any bird of prey, including eagles.',
        'They can spot a mouse from 100 feet up in the air.',
        'Red-tailed hawks mate for life and perform spectacular aerial courtship displays.',
        'They have specialized foot pads that help them grip their prey during flight.'
      ]
    },
  ];

  // Start a new game
  const startGame = () => {
    setBirdCollection([]);
    setCurrentBird(null);
    setFeedAvailable(true);
    setTimer(0);
    setGameActive(true);
    setMessage('Tap "Put Out Bird Feed" to attract birds!');
  };

  // Put out bird feed to attract birds
  const putOutFeed = () => {
    if (!feedAvailable) return;
    
    setFeedAvailable(false);
    setMessage('You put out some bird feed...');
    
    // Wait for a bird to show up (longer time for relaxed pace)
    setTimeout(() => {
      const randomBird = allBirds[Math.floor(Math.random() * allBirds.length)];
      setCurrentBird(randomBird);
      setMessage(`A ${randomBird.name} has appeared!`);
    }, 2000 + Math.random() * 2000);
    
    // Replenish feed after some time
    setTimeout(() => {
      setFeedAvailable(true);
    }, 6000);
  };

  // Get a random fact for a bird
  const getRandomFact = (bird) => {
    const randomIndex = Math.floor(Math.random() * bird.facts.length);
    return bird.facts[randomIndex];
  };

  // Take a photo of the bird
  const takeBirdPhoto = () => {
    if (!currentBird) return;
    
    // Get a random fact for this bird
    const randomFact = getRandomFact(currentBird);
    
    // Add bird to collection if not already there
    if (!birdCollection.some(bird => bird.id === currentBird.id)) {
      setBirdCollection([...birdCollection, currentBird]);
      setMessage(`New bird added: ${currentBird.name}!`);
      
      // Show bird fact
      setTimeout(() => {
        setMessage(`Bird Fact: ${randomFact}`);
      }, 2000);
    } else {
      setMessage(`You already have a ${currentBird.name} in your collection.`);
      
      // Show bird fact anyway for repeated birds
      setTimeout(() => {
        setMessage(`Bird Fact: ${randomFact}`);
      }, 2000);
    }
    
    // Bird stays longer before flying away in senior mode
    setTimeout(() => {
      setCurrentBird(null);
      setMessage('The bird flew away. Try putting out more feed!');
    }, 8000);
  };

  // End the game
  const endGame = () => {
    setGameActive(false);
    
    // Calculate score
    const totalPoints = birdCollection.reduce((sum, bird) => sum + bird.points, 0);
    const uniqueBirds = birdCollection.length;
    
    Alert.alert(
      "Bird Watching Complete!",
      `Congratulations!\n\nYou spotted ${uniqueBirds} different birds!\n\nTotal points: ${totalPoints}`,
      [
        { 
          text: "Change Mode", 
          onPress: () => {
            // Just return to the main menu where they can select mode
            // No additional action needed as gameActive is already false
          } 
        },
        { 
          text: "Play Again", 
          onPress: startGame 
        }
      ],
      { cancelable: false }
    );
  };

  // Timer effect - now handling the time limit for timed mode
  useEffect(() => {
    let interval;
    if (gameActive && gameMode === 'timed') {
      interval = setInterval(() => {
        setTimer(prevTimer => {
          const newTimer = prevTimer + 1;
          // Check if time limit is reached
          if (newTimer >= TIME_LIMIT) {
            clearInterval(interval);
            // End the game when time runs out
            setTimeout(() => endGame(), 500);
            return TIME_LIMIT;
          }
          return newTimer;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameActive, gameMode]);

  // Color for rarity
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return '#4CAF50';
      case 'uncommon': return '#2196F3';
      case 'rare': return '#FF9800';
      case 'very rare': return '#F44336';
      default: return theme.primary;
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Get remaining time for timed mode
  const getTimeDisplay = () => {
    if (gameMode === 'timed') {
      const remaining = TIME_LIMIT - timer;
      return `Time: ${formatTime(remaining)}`;
    }
    return `Time: ${formatTime(timer)}`;
  };

  // Theme-aware styles
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    title: {
      fontSize: 42,
      fontWeight: 'bold',
      textAlign: 'center',
      color: theme.primary,
      marginVertical: 20,
    },
    infoContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 15,
    },
    timerText: {
      fontSize: 25,
      fontWeight: 'bold',
      color: theme.primary,
    },
    timerWarning: {
      color: '#D32F2F', // Red color for time warning
    },
    collectionText: {
      fontSize: 25,
      fontWeight: 'bold',
      color: theme.primary,
    },
    messageContainer: {
      backgroundColor: isDarkMode ? '#2D3748' : '#BBDEFB',
      padding: 20,
      borderRadius: 20,
      alignItems: 'center',
      marginBottom: 25,
      borderWidth: 3,
      borderColor: isDarkMode ? '#4A5568' : '#64B5F6',
    },
    messageText: {
      fontSize: 28,
      color: isDarkMode ? '#E2E8F0' : '#0D47A1',
      textAlign: 'center',
      lineHeight: 36,
    },
    birdArea: {
      height: 320,
      backgroundColor: isDarkMode ? '#2D3748' : '#E1F5FE',
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 4,
      borderColor: isDarkMode ? '#4A5568' : '#4FC3F7',
      marginBottom: 25,
      padding: 10,
      overflow: 'hidden',
    },
    birdScrollContainer: {
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      flexGrow: 1,
    },
    birdContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    birdEmoji: {
      fontSize: 70,
      marginBottom: 10,
    },
    birdName: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.text,
    },
    birdRarity: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 15,
    },
    photoButton: {
      backgroundColor: '#4CAF50',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 18,
      borderWidth: 3,
      borderColor: '#2E7D32',
    },
    photoButtonText: {
      fontSize: 26,
      fontWeight: 'bold',
      color: 'white',
    },
    emptyBirdArea: {
      alignItems: 'center',
      padding: 20,
    },
    emptyAreaText: {
      fontSize: 32,
      color: theme.subText,
      textAlign: 'center',
      lineHeight: 42,
    },
    feedContainer: {
      alignItems: 'center',
      marginBottom: 25,
    },
    feedButton: {
      backgroundColor: '#FF9800',
      paddingVertical: 18,
      paddingHorizontal: 35,
      borderRadius: 18,
      borderWidth: 3,
      borderColor: '#EF6C00',
    },
    feedButtonDisabled: {
      backgroundColor: isDarkMode ? '#4A5568' : '#BDBDBD',
      borderColor: isDarkMode ? '#2D3748' : '#757575',
    },
    feedButtonText: {
      fontSize: 30,
      fontWeight: 'bold',
      color: 'white',
    },
    collectionWrapper: {
      marginBottom: 25,
    },
    collectionHeader: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 15,
    },
    collectionContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      backgroundColor: isDarkMode ? '#2D3748' : '#E1F5FE',
      borderRadius: 20,
      padding: 15,
      borderWidth: 3,
      borderColor: isDarkMode ? '#4A5568' : '#81D4FA',
      minHeight: 120,
      justifyContent: 'center',
    },
    collectionItem: {
      alignItems: 'center',
      justifyContent: 'center',
      margin: 8,
      padding: 12,
      backgroundColor: isDarkMode ? '#4A5568' : '#BBDEFB',
      borderRadius: 15,
      borderWidth: 2,
      borderColor: isDarkMode ? '#718096' : '#64B5F6',
      width: width / 2 - 30,
      height: 120,
    },
    collectionEmoji: {
      fontSize: 40,
      marginBottom: 5,
    },
    collectionItemText: {
      fontSize: 26,
      textAlign: 'center',
      fontWeight: 'bold',
      color: theme.text,
    },
    emptyCollectionText: {
      fontSize: 30,
      color: theme.subText,
      textAlign: 'center',
      padding: 20,
      alignSelf: 'center',
    },
    endButton: {
      backgroundColor: '#7986CB',
      paddingVertical: 15,
      paddingHorizontal: 30,
      borderRadius: 18,
      borderWidth: 3,
      borderColor: '#3949AB',
      alignSelf: 'center',
    },
    endButtonText: {
      fontSize: 30,
      fontWeight: 'bold',
      color: 'white',
    },
    startContainer: {
      paddingTop: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    instructionText: {
      fontSize: 36,
      fontWeight: 'bold',
      textAlign: 'center',
      color: theme.text,
      marginBottom: 20,
    },
    subInstructionText: {
      fontSize: 30,
      textAlign: 'center',
      color: theme.text,
      marginBottom: 30,
      lineHeight: 42,
    },
    gameModeContainer: {
      width: '100%',
      marginBottom: 30,
      alignItems: 'center',
    },
    gameModeTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 15,
    },
    gameModeButton: {
      backgroundColor: isDarkMode ? '#4A5568' : '#E3F2FD',
      borderWidth: 3,
      borderColor: isDarkMode ? '#718096' : '#90CAF9',
      borderRadius: 15,
      padding: 15,
      width: '90%',
      alignItems: 'center',
      marginBottom: 15,
    },
    selectedModeButton: {
      backgroundColor: isDarkMode ? '#718096' : '#BBDEFB',
      borderColor: isDarkMode ? '#90CAF9' : '#42A5F5',
      borderWidth: 4,
    },
    gameModeButtonText: {
      fontSize: 30,
      fontWeight: 'bold',
      color: theme.primary,
      marginBottom: 5,
    },
    gameModeDescription: {
      fontSize: 22,
      color: theme.subText,
      textAlign: 'center',
    },
    startButton: {
      backgroundColor: theme.primary,
      paddingVertical: 18,
      paddingHorizontal: 36,
      borderRadius: 18,
      borderWidth: 3,
      borderColor: isDarkMode ? '#90CAF9' : '#0D47A1',
      marginTop: 20,
    },
    startButtonText: {
      fontSize: 34,
      fontWeight: 'bold',
      color: 'white',
    },
    themeToggle: {
      position: 'absolute',
      top: 20,
      right: 20,
      padding: 10,
      backgroundColor: theme.cardBackground,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.divider,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity 
          style={styles.themeToggle}
          onPress={toggleTheme}
        >
          <Text style={{ fontSize: 24 }}>{isDarkMode ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>Bird Watching</Text>
        
        {gameActive ? (
          <>
            <View style={styles.infoContainer}>
              {gameMode === 'timed' && (
                <Text style={[
                  styles.timerText,
                  TIME_LIMIT - timer < 10 && styles.timerWarning
                ]}>
                  {getTimeDisplay()}
                </Text>
              )}
              <Text style={styles.collectionText}>
                Birds Found: {birdCollection.length}/{allBirds.length}
              </Text>
            </View>
            
            <View style={styles.messageContainer}>
              <Text style={styles.messageText}>{message}</Text>
            </View>
            
            <View style={styles.birdArea}>
              {currentBird ? (
                <ScrollView contentContainerStyle={styles.birdScrollContainer}>
                  <View style={styles.birdContainer}>
                    <Text style={styles.birdEmoji}>{currentBird.emoji}</Text>
                    <Text style={styles.birdName}>{currentBird.name}</Text>
                    <Text style={[
                      styles.birdRarity,
                      { color: getRarityColor(currentBird.rarity) }
                    ]}>
                      {currentBird.rarity.toUpperCase()}
                    </Text>
                    
                    <TouchableOpacity
                      style={styles.photoButton}
                      onPress={takeBirdPhoto}
                    >
                      <Text style={styles.photoButtonText}>📸 Take Photo</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              ) : (
                <View style={styles.emptyBirdArea}>
                  <Text style={styles.emptyAreaText}>
                    {feedAvailable ? 'Put out feed to attract birds' : 'Waiting for birds to arrive...'}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.feedContainer}>
              <TouchableOpacity
                style={[
                  styles.feedButton,
                  !feedAvailable && styles.feedButtonDisabled
                ]}
                onPress={putOutFeed}
                disabled={!feedAvailable}
              >
                <Text style={styles.feedButtonText}>
                  {feedAvailable ? '🌾 Put Out Bird Feed' : '⏳ Wait for birds...'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.collectionWrapper}>
              <Text style={styles.collectionHeader}>Your Bird Collection:</Text>
              <View style={styles.collectionContainer}>
                {birdCollection.length > 0 ? (
                  birdCollection.map((bird) => (
                    <View key={bird.id} style={styles.collectionItem}>
                      <Text style={styles.collectionEmoji}>{bird.emoji}</Text>
                      <Text style={styles.collectionItemText}>{bird.name}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyCollectionText}>No birds photographed yet</Text>
                )}
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.endButton}
              onPress={endGame}
            >
              <Text style={styles.endButtonText}>Finish Bird Watching</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.startContainer}>
            <Text style={styles.instructionText}>
              Welcome to Bird Watching!
            </Text>
            
            <Text style={styles.subInstructionText}>
              Attract beautiful birds by putting out feed, then take photos to add them to your collection. Learn interesting facts about each bird you photograph!
            </Text>

            <View style={styles.gameModeContainer}>
              <Text style={styles.gameModeTitle}>Select Game Mode:</Text>
              
              <TouchableOpacity 
                style={[
                  styles.gameModeButton, 
                  gameMode === 'relaxed' && styles.selectedModeButton
                ]}
                onPress={() => setGameMode('relaxed')}
              >
                <Text style={styles.gameModeButtonText}>Relaxed Mode</Text>
                <Text style={styles.gameModeDescription}>No time pressure, enjoy at your own pace</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.gameModeButton, 
                  gameMode === 'timed' && styles.selectedModeButton
                ]}
                onPress={() => setGameMode('timed')}
              >
                <Text style={styles.gameModeButtonText}>Timed Mode</Text>
                <Text style={styles.gameModeDescription}>60 seconds to find as many birds as you can</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.startButton}
              onPress={startGame}
            >
              <Text style={styles.startButtonText}>Start Bird Watching</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
export default SeniorBirdWatchingGame