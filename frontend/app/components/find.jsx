import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';

const { width } = Dimensions.get('window');

const FindTheBombGame = () => {
  // Game configuration
  const [gridSize, setGridSize] = useState(3); // Start with a smaller grid
  const [timeLeft, setTimeLeft] = useState(45); // Give more time
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [bombPosition, setBombPosition] = useState(null);
  const [revealedCells, setRevealedCells] = useState([]);
  const [hints, setHints] = useState(3);
  const [level, setLevel] = useState(1);
  const [bombFound, setBombFound] = useState(false);
  
  const timerRef = useRef(null);
  const cellSize = (width - 60) / gridSize; // Larger cells
  
  // Start a new game
  const startGame = () => {
    setGameActive(true);
    setTimeLeft(45); // More time for elders
    setRevealedCells([]);
    setHints(3);
    setBombFound(false);
    placeBomb();
    startTimer();
  };
  
  // Place the bomb in a random position
  const placeBomb = () => {
    const position = Math.floor(Math.random() * (gridSize * gridSize));
    setBombPosition(position);
  };
  
  // Start the game timer
  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          gameOver(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  // Handle cell press
  const handleCellPress = (index) => {
    if (!gameActive || revealedCells.includes(index)) return;
    
    const newRevealedCells = [...revealedCells, index];
    setRevealedCells(newRevealedCells);
    
    if (index === bombPosition) {
      // Found the bomb!
      setBombFound(true);
      clearInterval(timerRef.current); // Pause the timer
      
      // Delay level progression to allow seeing the bomb
      setTimeout(() => {
        const newScore = score + (timeLeft * 10) + (level * 50);
        setScore(newScore);
        if (newScore > highScore) {
          setHighScore(newScore);
        }
        
        Alert.alert(
          "You found the bomb!",
          `Great job! +${(timeLeft * 10) + (level * 50)} points!\n\nReady for level ${level + 1}?`,
          [{ text: "Next Level", onPress: () => {
            // Level up - increase grid size and reset
            const newLevel = level + 1;
            setLevel(newLevel);
            // Increase grid size more gradually
            const newGridSize = Math.min(6, 3 + Math.floor(newLevel / 3));
            setGridSize(newGridSize);
            
            // Reset and start next level
            setTimeLeft(45);
            setRevealedCells([]);
            setBombFound(false);
            placeBomb();
            startTimer();
          }}]
        );
      }, 1500); // Give time to see the bomb
      
    } else if (newRevealedCells.length >= (gridSize * gridSize) - 1) {
      // All cells except bomb revealed - can't win without finding bomb
      Alert.alert(
        "Almost there!",
        "There's only one cell left - that must be where the bomb is!",
        [{ text: "Continue", style: "default" }]
      );
    }
  };
  
  // Game over
  const gameOver = (quit = false) => {
    clearInterval(timerRef.current);
    setGameActive(false);
    
    if (!quit) {
      Alert.alert(
        "Time's Up!",
        `Game Over! Your score: ${score}\n\nWould you like to play again?`,
        [{ text: "New Game", onPress: resetGame }]
      );
    }
  };
  
  // Reset the game
  const resetGame = () => {
    setScore(0);
    setLevel(1);
    setGridSize(3);
    startGame();
  };
  
  // Use a hint to reveal the bomb's row or column
  const useHint = () => {
    if (hints <= 0 || !gameActive) return;
    
    setHints(hints - 1);
    
    // Calculate row and column
    const bombRow = Math.floor(bombPosition / gridSize);
    const bombCol = bombPosition % gridSize;
    
    // Randomly choose to reveal row or column
    const revealRow = Math.random() > 0.5;
    
    if (revealRow) {
      Alert.alert(
        "Hint", 
        `The bomb is in row ${bombRow + 1}`,
        [{ text: "Got it", style: "default" }]
      );
    } else {
      Alert.alert(
        "Hint", 
        `The bomb is in column ${bombCol + 1}`,
        [{ text: "Got it", style: "default" }]
      );
    }
  };
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);
  
  // Render the grid
  const renderGrid = () => {
    const cells = [];
    for (let i = 0; i < gridSize * gridSize; i++) {
      const isRevealed = revealedCells.includes(i);
      const isBomb = i === bombPosition;
      
      cells.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.cell,
            { width: cellSize, height: cellSize },
            isRevealed && styles.revealedCell,
            isRevealed && isBomb && styles.bombCell,
          ]}
          onPress={() => handleCellPress(i)}
          disabled={isRevealed}
        >
          {isRevealed && isBomb && bombFound && (
            <Text style={styles.bombText}>💣</Text>
          )}
          {isRevealed && !isBomb && (
            <Text style={styles.cellText}>✓</Text>
          )}
        </TouchableOpacity>
      );
    }
    
    return (
      <View style={[styles.grid, { width: cellSize * gridSize + (4 * gridSize) }]}>
        {cells}
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find The Bomb</Text>
      
      {!gameActive ? (
        <>
          <TouchableOpacity style={styles.startButton} onPress={startGame}>
            <Text style={styles.buttonText}>Start Game</Text>
          </TouchableOpacity>

          <View style={styles.instructionsBox}>
            <Text style={styles.instructions}>
              How to play:
            </Text>
            <Text style={styles.instructionPoints}>
              • Tap on cells to reveal them{"\n"}
              • Find the hidden bomb before time runs out{"\n"}
              • Use hints if you get stuck{"\n"}
              • Each level gets slightly harder
            </Text>
          </View>
        </>
      ) : (
        <>
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Time Left</Text>
              <Text style={styles.infoValue}>{timeLeft}s</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Score</Text>
              <Text style={styles.infoValue}>{score}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Level</Text>
              <Text style={styles.infoValue}>{level}</Text>
            </View>
          </View>
          
          {renderGrid()}
          
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>Hints left: {hints}</Text>
            <Text style={styles.statsText}>High Score: {highScore}</Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, hints <= 0 && styles.disabledButton]} 
              onPress={useHint}
              disabled={hints <= 0}
            >
              <Text style={styles.buttonText}>Use Hint</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quitButton} onPress={() => gameOver(true)}>
              <Text style={styles.buttonText}>End Game</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2c3e50',
    textAlign: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    width: '100%',
    justifyContent: 'space-around',
  },
  infoItem: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    minWidth: 80,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  infoLabel: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  instructionsBox: {
    backgroundColor: '#e8f4f8',
    padding: 15,
    borderRadius: 10,
    marginTop: 25,
    width: '100%',
    alignItems: 'center',
  },
  instructions: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  instructionPoints: {
    fontSize: 16,
    color: '#34495e',
    lineHeight: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 20,
  },
  cell: {
    backgroundColor: '#d5e8f7',
    margin: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a3c6e8',
  },
  revealedCell: {
    backgroundColor: '#fff',
  },
  bombCell: {
    backgroundColor: '#ffebeb',
  },
  bombText: {
    fontSize: 28,
  },
  cellText: {
    fontSize: 22,
    color: '#27ae60',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
    marginBottom: 20,
  },
  statsText: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginHorizontal: 10,
    minWidth: 130,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
    marginTop: 20,
  },
  quitButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginHorizontal: 10,
    minWidth: 130,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#95a5a6',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default FindTheBombGame;