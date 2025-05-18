import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useTheme } from './ThemeContext'; // Import the useTheme hook

const { width, height } = Dimensions.get('window');

const BubblePopGame = () => {
  const { theme, isThemeLoaded } = useTheme(); // Get theme from context
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bubbles, setBubbles] = useState([]);
  const [difficulty, setDifficulty] = useState(1);
  const timerRef = useRef(null);
  const gameLoopRef = useRef(null);
  const highScoreRef = useRef(0);

  // Start the game
  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setBubbles([]);
    setIsPlaying(true);
    setDifficulty(1);
    
    // Clear any existing timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    
    // Start game timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Start spawning bubbles
    gameLoopRef.current = setInterval(spawnBubble, 1000);
  };
  
  // End the game
  const endGame = () => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    
    // Update high score if needed
    if (score > highScoreRef.current) {
      highScoreRef.current = score;
    }
  };
  
  // Spawn a new bubble
  const spawnBubble = () => {
    const size = Math.floor(Math.random() * 30) + 30; // Random size between 30-60
    const newBubble = {
      id: Date.now(),
      x: Math.random() * (width - size),
      y: Math.random() * (height * 0.6) + height * 0.1,
      size: size,
      color: getRandomColor(),
      timeToLive: 2000 - (difficulty * 200), // Bubbles exist for shorter time as difficulty increases
      createdAt: Date.now(),
    };
    
    setBubbles(prev => [...prev, newBubble]);
    
    // Increase difficulty every 5 seconds
    if (timeLeft % 5 === 0 && timeLeft < 30) {
      setDifficulty(prev => Math.min(prev + 1, 8));
      
      // Spawn bubbles faster as difficulty increases
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        const interval = Math.max(300, 1000 - (difficulty * 100));
        gameLoopRef.current = setInterval(spawnBubble, interval);
      }
    }
  };
  
  // Get a random color for the bubble
  const getRandomColor = () => {
    const colors = ['#FF5252', '#FF4081', '#E040FB', '#7C4DFF', '#536DFE', '#448AFF', '#40C4FF', '#18FFFF', '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41', '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  // Pop a bubble when tapped
  const popBubble = (id) => {
    setBubbles(prev => prev.filter(bubble => bubble.id !== id));
    setScore(prev => prev + 1);
  };
  
  // Clean up bubbles that have expired
  useEffect(() => {
    if (!isPlaying) return;
    
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setBubbles(prev => prev.filter(bubble => 
        now - bubble.createdAt < bubble.timeToLive
      ));
    }, 100);
    
    return () => clearInterval(cleanupInterval);
  }, [isPlaying]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, []);

  if (!isThemeLoaded) {
    return null; // or a loading spinner
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {!isPlaying ? (
        <View style={styles.menuContainer}>
          <Text style={[styles.title, { color: theme.text }]}>Bubble Pop</Text>
          {score > 0 && <Text style={[styles.scoreText, { color: theme.text }]}>Last Score: {score}</Text>}
          {highScoreRef.current > 0 && (
            <Text style={[styles.highScoreText, { color: theme.primary }]}>
              High Score: {highScoreRef.current}
            </Text>
          )}
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.primary }]} 
            onPress={startGame}
          >
            <Text style={styles.buttonText}>Start Game</Text>
          </TouchableOpacity>
          <Text style={[styles.instructions, { color: theme.subText }]}>
            Tap the bubbles before they disappear!
          </Text>
        </View>
      ) : (
        <>
          <View style={[styles.gameHeader, { 
            backgroundColor: theme.cardBackground,
            borderBottomColor: theme.divider 
          }]}>
            <Text style={[styles.scoreText, { color: theme.text }]}>Score: {score}</Text>
            <Text style={[styles.timeText, { color: theme.text }]}>Time: {timeLeft}</Text>
          </View>
          <View style={[styles.gameArea, { backgroundColor: theme.background }]}>
            {bubbles.map(bubble => (
              <TouchableOpacity
                key={bubble.id}
                style={[
                  styles.bubble,
                  {
                    left: bubble.x,
                    top: bubble.y,
                    width: bubble.size,
                    height: bubble.size,
                    borderRadius: bubble.size / 2,
                    backgroundColor: bubble.color,
                  },
                ]}
                onPress={() => popBubble(bubble.id)}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  highScoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginVertical: 20,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructions: {
    textAlign: 'center',
    marginHorizontal: 20,
    fontSize: 16,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  timeText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  bubble: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
});

export default BubblePopGame;