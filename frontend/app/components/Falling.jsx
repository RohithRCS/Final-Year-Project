import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity,
  TouchableWithoutFeedback
} from 'react-native';
import { useTheme } from './ThemeContext'; // Adjust the import path as needed

const { width, height } = Dimensions.get('window');

const GAME_WIDTH = width;
const GAME_HEIGHT = height * 0.8;
const BUCKET_WIDTH = 70;
const BUCKET_HEIGHT = 60;
const STAR_SIZE = 30;
const GAME_DURATION = 30; // Game duration in seconds

const CatchFallingStars = () => {
  const { theme } = useTheme();
  
  // Game state
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [bucketPosition, setBucketPosition] = useState(width / 2 - BUCKET_WIDTH / 2);
  const [stars, setStars] = useState([]);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isDragging, setIsDragging] = useState(false);
  
  // Timer reference
  const timerRef = useRef(null);
  
  // Start game function
  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setStars([]);
    setTimeLeft(GAME_DURATION);
    setBucketPosition(width / 2 - BUCKET_WIDTH / 2);
  };

  // Game over function
  const gameOver = () => {
    setIsPlaying(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  // Create a new star
  const createStar = () => {
    return {
      id: Date.now() + Math.random(),
      x: Math.random() * (GAME_WIDTH - STAR_SIZE),
      y: -STAR_SIZE,
      speed: Math.random() * 3 + 2,
      value: Math.floor(Math.random() * 3) + 1, // Stars worth 1-3 points
      rotation: Math.random() * 360,
    };
  };

  // Handle touch to move bucket - improved version
  const handleTouchStart = (event) => {
    if (!isPlaying) return;
    
    const touchX = event.nativeEvent.pageX;
    moveBucketToPosition(touchX);
    setIsDragging(true);
  };

  const handleTouchMove = (event) => {
    if (!isPlaying || !isDragging) return;
    
    const touchX = event.nativeEvent.pageX;
    moveBucketToPosition(touchX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Helper function to move the bucket to the touch position
  const moveBucketToPosition = (touchX) => {
    let newPosition = touchX - BUCKET_WIDTH / 2;
    
    // Keep bucket within bounds
    if (newPosition < 0) newPosition = 0;
    if (newPosition > GAME_WIDTH - BUCKET_WIDTH) newPosition = GAME_WIDTH - BUCKET_WIDTH;
    
    setBucketPosition(newPosition);
  };

  // Timer effect
  useEffect(() => {
    if (!isPlaying) return;
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          gameOver();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Main game logic - runs on interval
  useEffect(() => {
    if (!isPlaying) return;

    // Star spawning logic
    const spawnInterval = setInterval(() => {
      setStars(currentStars => [...currentStars, createStar()]);
    }, 1200);

    // Game update logic - update star positions, check collisions
    const gameInterval = setInterval(() => {
      setStars(currentStars => {
        // Move stars down
        let updatedStars = currentStars.map(star => ({
          ...star,
          y: star.y + star.speed,
          rotation: star.rotation + 2,
        }));

        // Check for collisions or off-screen stars
        let remainingStars = [];
        let scoreToAdd = 0;

        updatedStars.forEach(star => {
          const starBottom = star.y + STAR_SIZE;
          
          // Check if star hits bucket
          if (
            starBottom >= GAME_HEIGHT - BUCKET_HEIGHT &&
            starBottom <= GAME_HEIGHT &&
            star.x + STAR_SIZE >= bucketPosition &&
            star.x <= bucketPosition + BUCKET_WIDTH
          ) {
            // Star caught!
            scoreToAdd += star.value;
          } 
          // Check if star is off-screen (missed)
          else if (star.y > GAME_HEIGHT) {
            // Star missed, but no penalty
          }
          // Keep the star in play
          else {
            remainingStars.push(star);
          }
        });

        // Update score
        if (scoreToAdd > 0) {
          setScore(prevScore => prevScore + scoreToAdd);
        }

        return remainingStars;
      });
    }, 16); // ~60fps

    // Cleanup
    return () => {
      clearInterval(spawnInterval);
      clearInterval(gameInterval);
    };
  }, [isPlaying, bucketPosition]);

  // Styles with theme support
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    gameHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 15,
      backgroundColor: theme.cardBackground,
    },
    scoreText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text,
    },
    timerText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.primary,
    },
    gameArea: {
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: theme.background,
      position: 'relative',
    },
    bucketContainer: {
      position: 'absolute',
      bottom: 0,
      width: BUCKET_WIDTH,
      height: BUCKET_HEIGHT + 10, // Extra height for handle
      alignItems: 'center',
    },
    bucketHandle: {
      width: BUCKET_WIDTH * 0.7,
      height: BUCKET_WIDTH * 0.4,
      borderTopWidth: 4,
      borderTopColor: theme.subText,
      borderLeftWidth: 4,
      borderLeftColor: theme.subText,
      borderRightWidth: 4,
      borderRightColor: theme.subText,
      borderTopLeftRadius: BUCKET_WIDTH * 0.35,
      borderTopRightRadius: BUCKET_WIDTH * 0.35,
    },
    bucket: {
      width: BUCKET_WIDTH,
      height: BUCKET_HEIGHT,
      backgroundColor: theme.subText,
      borderRadius: 5,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: theme.divider,
    },
    bucketRim: {
      width: BUCKET_WIDTH,
      height: 6,
      backgroundColor: theme.divider,
      position: 'absolute',
      top: 0,
    },
    bucketShine: {
      width: BUCKET_WIDTH * 0.3,
      height: BUCKET_HEIGHT * 0.7,
      backgroundColor: theme.primary + '40', // Add opacity
      position: 'absolute',
      top: 10,
      left: 10,
      borderRadius: 10,
    },
    star: {
      width: STAR_SIZE,
      height: STAR_SIZE,
      backgroundColor: theme.primary,
      position: 'absolute',
      borderRadius: STAR_SIZE / 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    starValue: {
      color: theme.cardBackground,
      fontWeight: 'bold',
      fontSize: 16,
    },
    timeBarContainer: {
      position: 'absolute',
      bottom: BUCKET_HEIGHT + 20,
      left: 10,
      right: 10,
      height: 8,
      backgroundColor: theme.divider,
      borderRadius: 4,
    },
    timeBar: {
      height: '100%',
      backgroundColor: theme.primary,
      borderRadius: 4,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.cardBackground + 'CC', // Add opacity
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    gameTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 20,
    },
    gameOverText: {
      fontSize: 22,
      color: theme.primary,
      marginBottom: 20,
    },
    startButton: {
      backgroundColor: theme.primary,
      paddingVertical: 12,
      paddingHorizontal: 30,
      borderRadius: 8,
      marginBottom: 20,
    },
    startButtonText: {
      color: theme.cardBackground,
      fontSize: 18,
      fontWeight: 'bold',
    },
    instructions: {
      color: theme.text,
      textAlign: 'center',
      paddingHorizontal: 40,
      lineHeight: 22,
    }
  });

  return (
    <View style={styles.container}>
      <View style={styles.gameHeader}>
        <Text style={styles.scoreText}>Score: {score}</Text>
        <Text style={styles.timerText}>Time: {formatTime(timeLeft)}</Text>
      </View>

      <View 
        style={styles.gameArea}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleTouchStart}
        onResponderMove={handleTouchMove}
        onResponderRelease={handleTouchEnd}
      >
        {/* Stars */}
        {stars.map(star => (
          <View
            key={star.id}
            style={[
              styles.star,
              { 
                left: star.x, 
                top: star.y,
                transform: [{ rotate: `${star.rotation}deg` }] 
              }
            ]}
          >
            <Text style={styles.starValue}>{star.value}</Text>
          </View>
        ))}

        {/* Bucket */}
        <View style={[styles.bucketContainer, { left: bucketPosition }]}>
          {/* Bucket handle */}
          <View style={styles.bucketHandle} />
          
          {/* Bucket body */}
          <View style={styles.bucket}>
            {/* Bucket rim */}
            <View style={styles.bucketRim} />
            
            {/* Bucket shine */}
            <View style={styles.bucketShine} />
          </View>
        </View>

        {/* Time indicator bar */}
        <View style={styles.timeBarContainer}>
          <View 
            style={[
              styles.timeBar, 
              { width: `${(timeLeft / GAME_DURATION) * 100}%` }
            ]}
          />
        </View>
      </View>

      {!isPlaying && (
        <View style={styles.overlay}>
          <Text style={styles.gameTitle}>Catch Falling Stars</Text>
          {score > 0 && <Text style={styles.gameOverText}>Game Over! Score: {score}</Text>}
          <TouchableOpacity style={styles.startButton} onPress={startGame}>
            <Text style={styles.startButtonText}>{score > 0 ? 'Play Again' : 'Start Game'}</Text>
          </TouchableOpacity>
          <Text style={styles.instructions}>
            Tap or drag to move the bucket.{'\n'}
            Each star has different point values.{'\n'}
            You have {GAME_DURATION} seconds to catch as many stars as possible!
          </Text>
        </View>
      )}
    </View>
  );
};

export default CatchFallingStars;