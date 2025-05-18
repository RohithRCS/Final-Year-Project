import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

// Game constants - REDUCED GRID SIZE
const NUM_ROWS = 12; 
const NUM_COLS = 8;  
const CELL_SIZE = 35; 
const TICK_SPEED = 800; 
const COLORS = ['#FF5252', '#FF4081', '#E040FB', '#7C4DFF', '#536DFE', '#448AFF', '#40C4FF'];

// Block shapes (tetrominos)
const SHAPES = [
  // I shape
  [
    [1, 1, 1, 1]
  ],
  // O shape
  [
    [1, 1],
    [1, 1]
  ],
  // T shape
  [
    [0, 1, 0],
    [1, 1, 1]
  ],
  // L shape
  [
    [1, 0],
    [1, 0],
    [1, 1]
  ],
  // J shape
  [
    [0, 1],
    [0, 1],
    [1, 1]
  ],
  // S shape
  [
    [0, 1, 1],
    [1, 1, 0]
  ],
  // Z shape
  [
    [1, 1, 0],
    [0, 1, 1]
  ]
];

const Tetris = () => {
  // Game board state - 2D array of cells
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentBlock, setCurrentBlock] = useState(null);
  const [currentPosition, setCurrentPosition] = useState({ row: 0, col: 0 });
  const [currentColor, setCurrentColor] = useState('');
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [gameSpeed, setGameSpeed] = useState(TICK_SPEED);
  const [level, setLevel] = useState(1);
  const [shouldSpawnBlock, setShouldSpawnBlock] = useState(false);
  
  const gameTickRef = useRef(null);
  
  // Create empty game board
  function createEmptyBoard() {
    return Array(NUM_ROWS).fill().map(() => Array(NUM_COLS).fill(null));
  }
  
  // Initialize game
  const initGame = () => {
    setBoard(createEmptyBoard());
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false); // Auto-start the game
    setGameSpeed(TICK_SPEED);
    setLevel(1);
    setShouldSpawnBlock(true); // Flag to spawn a new block after state updates
  };
  
  // Effect to handle spawning a new block after board state is updated
  useEffect(() => {
    if (shouldSpawnBlock) {
      spawnNewBlock();
      setShouldSpawnBlock(false);
    }
  }, [shouldSpawnBlock, board]);
  
  // Generate a new random block
  const spawnNewBlock = () => {
    const shapeIndex = Math.floor(Math.random() * SHAPES.length);
    const shape = SHAPES[shapeIndex];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const startCol = Math.floor((NUM_COLS - shape[0].length) / 2);
    
    setCurrentBlock(shape);
    setCurrentPosition({ row: 0, col: startCol });
    setCurrentColor(color);
    
    // Check if new block overlaps with existing blocks (game over condition)
    if (!canMoveTo(0, startCol, shape)) {
      setIsGameOver(true);
      if (onGameOver) onGameOver(score);
    }
  };
  
  // Check if block can move to specified position
  const canMoveTo = (newRow, newCol, shape = currentBlock) => {
    if (!shape) return false;
    
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] === 0) continue;
        
        const boardRow = newRow + r;
        const boardCol = newCol + c;
        
        // Check boundaries
        if (
          boardRow < 0 || boardRow >= NUM_ROWS ||
          boardCol < 0 || boardCol >= NUM_COLS
        ) {
          return false;
        }
        
        // Check for collision with existing blocks
        if (board[boardRow][boardCol] !== null) {
          return false;
        }
      }
    }
    return true;
  };
  
  // Move block down one position
  const moveDown = () => {
    if (!currentBlock || isPaused || isGameOver) return false;
    
    const newRow = currentPosition.row + 1;
    if (canMoveTo(newRow, currentPosition.col)) {
      setCurrentPosition({ ...currentPosition, row: newRow });
      return true;
    }
    
    // If we can't move down, lock the block in place
    lockBlock();
    return false;
  };
  
  // Move block left
  const moveLeft = () => {
    if (!currentBlock || isPaused || isGameOver) return;
    
    const newCol = currentPosition.col - 1;
    if (canMoveTo(currentPosition.row, newCol)) {
      setCurrentPosition({ ...currentPosition, col: newCol });
    }
  };
  
  // Move block right
  const moveRight = () => {
    if (!currentBlock || isPaused || isGameOver) return;
    
    const newCol = currentPosition.col + 1;
    if (canMoveTo(currentPosition.row, newCol)) {
      setCurrentPosition({ ...currentPosition, col: newCol });
    }
  };
  
  // Rotate block (90 degrees clockwise)
  const rotateBlock = () => {
    if (!currentBlock || isPaused || isGameOver) return;
    
    const rotated = [];
    const rows = currentBlock.length;
    const cols = currentBlock[0].length;
    
    // Create a new 2D array with rows/cols swapped
    for (let c = 0; c < cols; c++) {
      rotated[c] = [];
      for (let r = 0; r < rows; r++) {
        rotated[c][rows - 1 - r] = currentBlock[r][c];
      }
    }
    
    if (canMoveTo(currentPosition.row, currentPosition.col, rotated)) {
      setCurrentBlock(rotated);
    }
  };
  
  // Lock current block in place and check for cleared rows
  const lockBlock = () => {
    if (!currentBlock) return;
    
    const newBoard = [...board];
    
    // Add current block to the board
    for (let r = 0; r < currentBlock.length; r++) {
      for (let c = 0; c < currentBlock[r].length; c++) {
        if (currentBlock[r][c] === 1) {
          const boardRow = currentPosition.row + r;
          const boardCol = currentPosition.col + c;
          
          if (boardRow >= 0 && boardRow < NUM_ROWS) {
            newBoard[boardRow][boardCol] = currentColor;
          }
        }
      }
    }
    
    setBoard(newBoard);
    
    // Check for completed rows
    const completedRows = [];
    for (let r = 0; r < NUM_ROWS; r++) {
      if (newBoard[r].every(cell => cell !== null)) {
        completedRows.push(r);
      }
    }
    
    if (completedRows.length > 0) {
      clearRows(completedRows);
    }
    
    // Spawn a new block
    spawnNewBlock();
  };
  
  // Clear completed rows and add points
  const clearRows = (rowsToClear) => {
    const newBoard = [...board];
    
    // Clear rows
    rowsToClear.forEach(rowIndex => {
      // Move all rows above down
      for (let r = rowIndex; r > 0; r--) {
        newBoard[r] = [...newBoard[r - 1]];
      }
      // Add empty row at top
      newBoard[0] = Array(NUM_COLS).fill(null);
    });
    
    setBoard(newBoard);
    
    // Update score - more points for clearing multiple rows at once
    let pointsEarned = 0;
    switch (rowsToClear.length) {
      case 1: pointsEarned = 40 * level; break;
      case 2: pointsEarned = 100 * level; break;
      case 3: pointsEarned = 300 * level; break;
      case 4: pointsEarned = 1200 * level; break;
    }
    
    const newScore = score + pointsEarned;
    setScore(newScore);
    
    // Level up every 400 points
    const newLevel = Math.floor(newScore / 400) + 1;
    if (newLevel > level) {
      setLevel(newLevel);
      // Limit minimum speed to ensure it doesn't get too fast
      const newSpeed = Math.max(TICK_SPEED - (newLevel - 1) * 40, 300);
      setGameSpeed(newSpeed);
    }
  };
  
  // Start game
  const startGame = () => {
    if (isGameOver) {
      initGame();
    } else {
      setIsPaused(false);
    }
  };
  
  // Pause game
  const pauseGame = () => {
    setIsPaused(true);
  };
  
  // Game loop
  useEffect(() => {
    if (isGameOver || isPaused || !currentBlock) {
      clearInterval(gameTickRef.current);
      return;
    }
    
    gameTickRef.current = setInterval(() => {
      if (!moveDown()) {
        // Block is locked automatically in moveDown when it can't move further
      }
    }, gameSpeed);
    
    return () => clearInterval(gameTickRef.current);
  }, [isPaused, isGameOver, currentBlock, currentPosition, gameSpeed, board]);
  
  // Initialize game on mount
  useEffect(() => {
    initGame();
    return () => clearInterval(gameTickRef.current);
  }, []);
  
  // Render the game grid with current block
  const renderGrid = () => {
    const grid = board.map(row => [...row]);
    
    // Add current block to the grid for rendering
    if (currentBlock && !isGameOver) {
      for (let r = 0; r < currentBlock.length; r++) {
        for (let c = 0; c < currentBlock[r].length; c++) {
          if (currentBlock[r][c] === 1) {
            const boardRow = currentPosition.row + r;
            const boardCol = currentPosition.col + c;
            
            if (boardRow >= 0 && boardRow < NUM_ROWS && boardCol >= 0 && boardCol < NUM_COLS) {
              grid[boardRow][boardCol] = currentColor;
            }
          }
        }
      }
    }
    
    return (
      <View style={styles.grid}>
        {grid.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {row.map((cell, colIndex) => (
              <View 
                key={`cell-${rowIndex}-${colIndex}`} 
                style={[
                  styles.cell,
                  cell && { backgroundColor: cell }
                ]}
              />
            ))}
          </View>
        ))}
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Falling Blocks</Text>
      
      {renderGrid()}
      
      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={rotateBlock}
          disabled={isPaused || isGameOver}
        >
          <Text style={styles.buttonText}>Rotate</Text>
        </TouchableOpacity>
        
        <View style={styles.directionButtons}>
          <TouchableOpacity 
            style={styles.arrowButton} 
            onPress={moveLeft}
            disabled={isPaused || isGameOver}
          >
            <Text style={styles.arrowText}>←</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.arrowButton} 
            onPress={moveRight}
            disabled={isPaused || isGameOver}
          >
            <Text style={styles.arrowText}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.gameControls}>
        {isPaused ? (
          <TouchableOpacity 
            style={[styles.controlButton, styles.startButton]} 
            onPress={startGame}
          >
            <Text style={styles.controlButtonText}>
              {isGameOver ? 'New Game' : 'Start'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.controlButton, styles.pauseButton]} 
            onPress={pauseGame}
          >
            <Text style={styles.controlButtonText}>Pause</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {isGameOver && (
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverText}>Game Over</Text>
          <TouchableOpacity 
            style={styles.playAgainButton} 
            onPress={initGame}
          >
            <Text style={styles.playAgainText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#f0f6ff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2c3e50',
  },
  grid: {
    borderWidth: 3,
    borderColor: '#34495e',
    backgroundColor: '#ecf0f1',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 1,
    borderColor: '#bdc3c7',
    backgroundColor: '#f9f9f9',
  },
  controls: {
    marginTop: 25,
    alignItems: 'center',
    width: NUM_COLS * CELL_SIZE,
  },
  button: {
    backgroundColor: '#9b59b6',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  directionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
  },
  arrowButton: {
    backgroundColor: '#3498db',
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 35,
  },
  arrowText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  gameControls: {
    marginTop: 25,
  },
  controlButton: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  startButton: {
    backgroundColor: '#2ecc71',
  },
  pauseButton: {
    backgroundColor: '#e74c3c',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  gameOverContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  gameOverText: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  playAgainButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  playAgainText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default Tetris;