import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useTheme } from './ThemeContext'; // Import the useTheme hook

const BalloonPopGame = ({ gameTime = 20 }) => {
  const { theme } = useTheme(); // Get current theme
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(gameTime);
  const [isPlaying, setIsPlaying] = useState(false);
  const [balloonSize] = useState(new Animated.Value(1));
  const [balloonPosition, setBalloonPosition] = useState({ x: 0, y: 0 });
  const balloonColors = ['#FF5252', '#FFD740', '#40C4FF', '#69F0AE', '#FF4081', '#8C9EFF'];
  const [currentColor, setCurrentColor] = useState(balloonColors[0]);

  // Start game
  const startGame = () => {
    setScore(0);
    setTimeLeft(gameTime);
    setIsPlaying(true);
    moveBalloon();
  };

  // End game
  const endGame = () => {
    setIsPlaying(false);
    if (onGameComplete) {
      onGameComplete(score);
    }
  };

  // Timer countdown
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            endGame();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Move balloon to random position
  const moveBalloon = () => {
    if (!isPlaying) return;
    
    const randomX = Math.floor(Math.random() * 200);
    const randomY = Math.floor(Math.random() * 300);
    setBalloonPosition({ x: randomX, y: randomY });
    
    // Pick a random balloon color
    const randomColor = balloonColors[Math.floor(Math.random() * balloonColors.length)];
    setCurrentColor(randomColor);

    // Animate balloon growing slightly
    Animated.sequence([
      Animated.timing(balloonSize, {
        toValue: 1.1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(balloonSize, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      })
    ]).start();
  };

  // Handle balloon pop
  const handleBalloonPop = () => {
    if (!isPlaying) return;
    
    setScore(score + 1);
    
    // Play a quick pop animation
    Animated.timing(balloonSize, {
      toValue: 1.5,
      duration: 100,
      useNativeDriver: true
    }).start(() => {
      balloonSize.setValue(1);
      moveBalloon();
    });
  };

  // Create dynamic styles using the current theme
  const dynamicStyles = {
    container: {
      width: '100%',
      height: 600,
      backgroundColor: theme.background,
      borderRadius: 12,
      padding: 16,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    score: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
    },
    timer: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
    },
    gameArea: {
      flex: 1,
      position: 'relative',
      backgroundColor: theme.cardBackground,
      borderRadius: 8,
    },
    startScreen: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    gameTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      marginBottom: 16,
      color: theme.text,
    },
    instruction: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 32,
      color: theme.subText,
    },
    startButton: {
      backgroundColor: theme.primary,
      paddingVertical: 12,
      paddingHorizontal: 36,
      borderRadius: 24,
    },
    startButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
    },
    finalScore: {
      marginTop: 24,
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
    }
  };

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.score}>Score: {score}</Text>
        <Text style={dynamicStyles.timer}>Time: {timeLeft}s</Text>
      </View>

      {isPlaying ? (
        <View style={dynamicStyles.gameArea}>
          <Animated.View 
            style={[
              styles.balloonContainer,
              {
                transform: [{ scale: balloonSize }],
                left: balloonPosition.x,
                top: balloonPosition.y
              }
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleBalloonPop}
              style={[styles.balloon, { backgroundColor: currentColor }]}
            >
              <Text style={styles.balloonText}>🎈</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      ) : (
        <View style={dynamicStyles.startScreen}>
          <Text style={dynamicStyles.gameTitle}>Balloon Pop</Text>
          <Text style={dynamicStyles.instruction}>
            Pop as many balloons as you can in {gameTime} seconds!
          </Text>
          <TouchableOpacity 
            style={dynamicStyles.startButton}
            onPress={startGame}
          >
            <Text style={dynamicStyles.startButtonText}>
              {score > 0 ? 'Play Again' : 'Start Game'}
            </Text>
          </TouchableOpacity>
          
          {score > 0 && (
            <Text style={dynamicStyles.finalScore}>
              Your score: {score}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

// Static styles that don't depend on theme
const styles = StyleSheet.create({
  balloonContainer: {
    position: 'absolute',
    width: 80,
    height: 100,
  },
  balloon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balloonText: {
    fontSize: 40,
  },
});

export default BalloonPopGame;