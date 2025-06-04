import React, { useState, useEffect, useRef } from 'react';
import { 
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Alert
} from 'react-native';
import { useTheme } from './ThemeContext';

const { width, height } = Dimensions.get('window');

const TapTheTargetGame = () => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameActive, setGameActive] = useState(false);
  const [highScore, setHighScore] = useState(0);
  
  const { theme, isDarkMode } = useTheme();
  
  const targetPosition = useRef(new Animated.ValueXY({ 
    x: Math.random() * (width - 70), 
    y: Math.random() * (height - 270) + 100 
  })).current;
  
  const targetSize = useRef(new Animated.Value(50)).current;
  
  // Move target to random position
  const moveTarget = () => {
    Animated.timing(targetPosition, {
      toValue: { 
        x: Math.random() * (width - 70), 
        y: Math.random() * (height - 270) + 100
      },
      duration: 800,
      useNativeDriver: false,
    }).start();
    
    // Randomly change size between 30 and 60
    Animated.timing(targetSize, {
      toValue: Math.random() * 30 + 30,
      duration: 800,
      useNativeDriver: false,
    }).start();
  };

  // Handle tap on target
  const handleTargetPress = () => {
    if (gameActive) {
      setScore(score + 1);
      moveTarget();
    }
  };

  // Start game
  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameActive(true);
    moveTarget();
  };

  // Game timer
  useEffect(() => {
    let interval;
    if (gameActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setGameActive(false);
      if (score > highScore) {
        setHighScore(score);
      }
      Alert.alert('Game Over!', `Your score: ${score}`, [
        { text: 'Play Again', onPress: startGame }
      ]);
    }
    return () => clearInterval(interval);
  }, [gameActive, timeLeft]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={[styles.title, { color: theme.text }]}>Tap the Target!</Text>
        
        {/* Stats row with three equal columns */}
        <View style={styles.statsRow}>
          <Text style={[styles.statText, { color: theme.text }]}>Score: {score}</Text>
          <Text style={[styles.statText, { color: theme.text }]}>Time: {timeLeft}s</Text>
          <Text style={[styles.statText, { color: theme.text }]}>High Score: {highScore}</Text>
        </View>
      </View>
      
      {!gameActive && timeLeft === 30 ? (
        <TouchableWithoutFeedback onPress={startGame}>
          <View style={[styles.startButton, { backgroundColor: theme.primary }]}>
            <Text style={[styles.startButtonText, { color: theme.text }]}>Start Game</Text>
          </View>
        </TouchableWithoutFeedback>
      ) : null}
      
      {gameActive && (
        <TouchableWithoutFeedback onPress={handleTargetPress}>
          <Animated.View
            style={[
              styles.target,
              {
                left: targetPosition.x,
                top: targetPosition.y,
                width: targetSize,
                height: targetSize,
                borderRadius: Animated.divide(targetSize, 2),
                backgroundColor: isDarkMode ? '#FF5252' : '#FF0000',
                borderColor: theme.text,
              },
            ]}
          />
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: -30,
    marginBottom: 10,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    marginTop: 5,
    marginLeft: -20,
  },
  statText: {
    flex: 1,
    fontSize: 18,
    textAlign: 'center',
  },
  target: {
    position: 'absolute',
    borderWidth: 3,
  },
  startButton: {
    marginTop: 100,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignSelf: 'center',
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default TapTheTargetGame;