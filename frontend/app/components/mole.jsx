import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

const ColorTapGame = () => {
  const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
  const colorNames = {
    red: 'Red',
    blue: 'Blue', 
    green: 'Green',
    yellow: 'Yellow',
    purple: 'Purple',
    orange: 'Orange'
  };
  
  const [score, setScore] = useState(0);
  const [targetColor, setTargetColor] = useState('');
  const [gameGrid, setGameGrid] = useState([]);
  const [gameActive, setGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  
  // Start a new game
  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameActive(true);
    generateRound();
  };
  
  // End the current game
  const endGame = () => {
    setGameActive(false);
    Alert.alert('Game Over!', `Your final score: ${score}`);
    if (onScoreChange) {
      onScoreChange(score);
    }
  };
  
  // Generate a new round with random colors
  const generateRound = () => {
    // Pick a random target color
    const newTargetColor = colors[Math.floor(Math.random() * colors.length)];
    setTargetColor(newTargetColor);
    
    // Generate grid with 6 squares, 2-4 of which are the target color
    const numberOfTargets = Math.floor(Math.random() * 3) + 2; // 2-4 targets
    const newGrid = [];
    
    // Add target colors
    for (let i = 0; i < numberOfTargets; i++) {
      newGrid.push(newTargetColor);
    }
    
    // Fill the rest with other random colors
    while (newGrid.length < 6) {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      if (randomColor !== newTargetColor) {
        newGrid.push(randomColor);
      }
    }
    
    // Shuffle the grid
    for (let i = newGrid.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newGrid[i], newGrid[j]] = [newGrid[j], newGrid[i]];
    }
    
    setGameGrid(newGrid);
  };
  
  // Handle tapping on a color square
  const handleColorTap = (color, index) => {
    if (!gameActive) return;
    
    if (color === targetColor) {
      // Correct tap
      setScore(score + 1);
      
      // Create a copy of the game grid to modify it
      const updatedGrid = [...gameGrid];
      // Remove the tapped color from the grid
      updatedGrid[index] = null;
      setGameGrid(updatedGrid);
      
      // Check if all target colors have been tapped
      const remainingTargets = updatedGrid.filter(c => c === targetColor).length;
      if (remainingTargets === 0) {
        generateRound();
      }
    } else {
      // Incorrect tap
      setScore(Math.max(0, score - 1)); // Subtract 1 point, but not below 0
    }
  };
  
  // Timer effect
  useEffect(() => {
    let interval;
    if (gameActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameActive) {
      endGame();
    }
    
    return () => clearInterval(interval);
  }, [gameActive, timeLeft]);
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.score}>Score: {score}</Text>
        <Text style={styles.timer}>Time: {timeLeft}s</Text>
      </View>
      
      {gameActive ? (
        <>
          <Text style={styles.instructions}>
            Tap all the <Text style={{color: targetColor, fontWeight: 'bold'}}>{colorNames[targetColor]}</Text> squares!
          </Text>
          
          <View style={styles.grid}>
            {gameGrid.map((color, index) => (
              color && (
                <TouchableOpacity
                  key={index}
                  style={[styles.colorSquare, { backgroundColor: color }]}
                  onPress={() => handleColorTap(color, index)}
                />
              )
            ))}
          </View>
        </>
      ) : (
        <View style={styles.startContainer}>
          <Text style={styles.gameTitle}>Color Tap</Text>
          <Text style={styles.gameDescription}>
            Tap all squares of the target color as quickly as you can!
          </Text>
          <TouchableOpacity 
            style={styles.startButton} 
            onPress={startGame}
          >
            <Text style={styles.startButtonText}>Start Game</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  timer: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructions: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  colorSquare: {
    width: 80,
    height: 80,
    margin: 10,
    borderRadius: 8,
  },
  startContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  gameTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  gameDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
    elevation: 3,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ColorTapGame;