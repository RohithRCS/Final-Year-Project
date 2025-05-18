import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
} from 'react-native';

const { width, height } = Dimensions.get('window');
const BIRD_WIDTH = 40;
const BIRD_HEIGHT = 40;
const PIPE_WIDTH = 80;
const PIPE_GAP = 200;

const FlappyBird = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [pipes, setPipes] = useState([]);

  const birdY = useRef(new Animated.Value(height / 2)).current;
  const birdX = width / 4;
  const birdYSpeed = useRef(0);
  const gravity = 1;

  const gameTimer = useRef(null);
  const pipeTimer = useRef(null);
  const collisionDetectedRef = useRef(false);

  // Reset game state
  const resetGame = () => {
    if (gameTimer.current) clearInterval(gameTimer.current);
    if (pipeTimer.current) clearInterval(pipeTimer.current);
    birdY.setValue(height / 2);
    birdYSpeed.current = 0;
    setPipes([]);
    setScore(0);
    collisionDetectedRef.current = false;
    setGameOver(false);
    setGameStarted(false);
  };

  // Start game
  const startGame = () => {
    resetGame();
    setGameStarted(true);

    pipeTimer.current = setInterval(createPipe, 2000);
    gameTimer.current = setInterval(updateGame, 16);
  };

  const createPipe = () => {
    const topHeight = Math.random() * (height - PIPE_GAP - 100) + 50;
    const bottomHeight = height - PIPE_GAP - topHeight;

    setPipes((prev) => [
      ...prev,
      {
        id: Date.now(),
        x: width,
        topHeight,
        bottomHeight,
        passed: false,
      },
    ]);
  };

  const updateGame = () => {
    // Apply gravity
    birdYSpeed.current += gravity;
    const newY = birdY.__getValue() + birdYSpeed.current;
    birdY.setValue(newY);

    // Check top/bottom bounds
    if (newY < 0 || newY + BIRD_HEIGHT > height) {
      endGame();
      return;
    }

    setPipes((prevPipes) => {
      return prevPipes
        .map((pipe) => {
          const newX = pipe.x - 5;
          const updatedPipe = { ...pipe, x: newX };

          // Scoring
          if (!pipe.passed && newX + PIPE_WIDTH < birdX) {
            updatedPipe.passed = true;
            setScore((s) => s + 1);
          }

          // Collision detection
          const birdTop = newY;
          const birdBottom = newY + BIRD_HEIGHT;
          const birdLeft = birdX;
          const birdRight = birdX + BIRD_WIDTH;

          const pipeLeft = newX;
          const pipeRight = newX + PIPE_WIDTH;

          const hitPipe =
            birdRight > pipeLeft &&
            birdLeft < pipeRight &&
            (birdTop < pipe.topHeight ||
              birdBottom > height - pipe.bottomHeight);

          if (hitPipe && !collisionDetectedRef.current) {
            collisionDetectedRef.current = true;
            endGame();
          }

          return updatedPipe;
        })
        .filter((pipe) => pipe.x + PIPE_WIDTH > 0); // remove off-screen pipes
    });
  };

  const jump = () => {
    if (!gameStarted && !gameOver) {
      startGame();
    }
    if (gameStarted && !gameOver) {
      birdYSpeed.current = -12;
    }
  };

  const endGame = () => {
    if (gameTimer.current) clearInterval(gameTimer.current);
    if (pipeTimer.current) clearInterval(pipeTimer.current);
    setGameOver(true);
    setGameStarted(false);
  };

  const handleRestart = () => {
    resetGame();
    setTimeout(() => {
      startGame();
    }, 100); // slight delay ensures clean reset
  };

  useEffect(() => {
    return () => {
      if (gameTimer.current) clearInterval(gameTimer.current);
      if (pipeTimer.current) clearInterval(pipeTimer.current);
    };
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.gameArea} onPress={jump} activeOpacity={1}>
        {/* Background */}
        <View style={styles.background} />

        {/* Bird */}
        <Animated.View
          style={[
            styles.bird,
            {
              top: birdY,
              left: birdX,
              transform: [
                {
                  rotate: `${Math.min(Math.max(birdYSpeed.current * 3, -20), 70)}deg`,
                },
              ],
            },
          ]}
        >
          <Text style={styles.birdText}>🐤</Text>
        </Animated.View>

        {/* Pipes */}
        {pipes.map((pipe) => (
          <React.Fragment key={pipe.id}>
            <View
              style={[
                styles.pipe,
                {
                  height: pipe.topHeight,
                  left: pipe.x,
                  top: 0,
                },
              ]}
            />
            <View
              style={[
                styles.pipe,
                {
                  height: pipe.bottomHeight,
                  left: pipe.x,
                  bottom: 0,
                },
              ]}
            />
          </React.Fragment>
        ))}

        {/* Score */}
        {(gameStarted || gameOver) && (
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>{score}</Text>
          </View>
        )}

        {/* Start Screen */}
        {!gameStarted && !gameOver && (
          <View style={styles.overlay}>
            <Text style={styles.title}>Flappy Bird</Text>
            <Text style={styles.instruction}>Tap to Start</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Game Over Overlay */}
      {gameOver && (
        <View style={styles.overlay}>
          <Text style={styles.gameOver}>Game Over</Text>
          <Text style={styles.scoreLabel}>Score: {score}</Text>
          <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
            <Text style={styles.restartText}>Restart</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gameArea: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    backgroundColor: '#87CEEB',
    width: '100%',
    height: '100%',
  },
  bird: {
    position: 'absolute',
    width: BIRD_WIDTH,
    height: BIRD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  birdText: {
    fontSize: 32,
  },
  pipe: {
    position: 'absolute',
    width: PIPE_WIDTH,
    backgroundColor: '#4CAF50',
    borderColor: '#2E7D32',
    borderWidth: 3,
  },
  scoreContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 20,
  },
  instruction: {
    fontSize: 24,
    color: '#fff',
  },
  gameOver: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'red',
    marginBottom: 20,
  },
  scoreLabel: {
    fontSize: 36,
    color: '#fff',
    marginBottom: 30,
  },
  restartButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 15,
  },
  restartText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default FlappyBird;
