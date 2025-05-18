import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from './ThemeContext'; // Adjust the import path as needed

const CARD_PAIRS = 8; // Total pairs of cards
const CARD_SYMBOLS = ['🍎', '🍌', '🍒', '🍓', '🍊', '🍋', '🍍', '🥑', '🥭', '🍇', '🍉', '🍐'];

const MemoryGame = () => {
  const { theme } = useTheme();
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Initialize game
  const initializeGame = () => {
    // Select random symbols for our pairs
    const selectedSymbols = [...CARD_SYMBOLS]
      .sort(() => 0.5 - Math.random())
      .slice(0, CARD_PAIRS);
    
    // Create pairs and shuffle
    const cardDeck = [...selectedSymbols, ...selectedSymbols]
      .sort(() => 0.5 - Math.random())
      .map((symbol, index) => ({
        id: index,
        symbol,
        flipped: false,
        matched: false
      }));
    
    setCards(cardDeck);
    setFlippedIndices([]);
    setMatchedPairs([]);
    setMoves(0);
    setTimer(0);
    setGameOver(false);
    setGameStarted(false);
  };

  // Start timer when game begins
  useEffect(() => {
    let interval;
    if (gameStarted && !gameOver) {
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameOver]);

  // Check if game is over
  useEffect(() => {
    if (matchedPairs.length === CARD_PAIRS && gameStarted) {
      setGameOver(true);
    }
  }, [matchedPairs, gameStarted]);

  // Initialize on first load
  useEffect(() => {
    initializeGame();
  }, []);

  const handleCardPress = (index) => {
    // Start game on first card flip
    if (!gameStarted) {
      setGameStarted(true);
    }

    // Ignore if card is already flipped or matched
    if (
      flippedIndices.includes(index) || 
      matchedPairs.includes(cards[index].symbol) ||
      flippedIndices.length >= 2
    ) {
      return;
    }

    // Flip the card
    const newFlippedIndices = [...flippedIndices, index];
    setFlippedIndices(newFlippedIndices);
    
    // If we have 2 cards flipped, check for a match
    if (newFlippedIndices.length === 2) {
      setMoves(prevMoves => prevMoves + 1);
      
      const [firstIndex, secondIndex] = newFlippedIndices;
      const firstCard = cards[firstIndex];
      const secondCard = cards[secondIndex];
      
      if (firstCard.symbol === secondCard.symbol) {
        // Match found
        setMatchedPairs(prev => [...prev, firstCard.symbol]);
        setFlippedIndices([]);
      } else {
        // No match, flip back after delay
        setTimeout(() => {
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine grid based on card count
  const gridSize = Math.ceil(Math.sqrt(CARD_PAIRS * 2));

  // Styles with theme support
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      backgroundColor: theme.background,
    },
    header: {
      width: '100%',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 8,
    },
    stats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '80%',
      marginBottom: 16,
    },
    statsText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
    },
    gameBoard: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    card: {
      backgroundColor: theme.cardBackground,
      margin: 5,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    cardFlipped: {
      backgroundColor: theme.primary + '20', // Add opacity to primary color
      borderColor: theme.primary,
      borderWidth: 2,
    },
    cardText: {
      fontSize: 32,
      color: theme.text,
    },
    cardBack: {
      fontSize: 32,
      color: theme.subText,
    },
    gameOverContainer: {
      alignItems: 'center',
      marginTop: 20,
      padding: 16,
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      width: '80%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 5,
      elevation: 5,
    },
    gameOverText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 12,
    },
    gameOverStats: {
      fontSize: 16,
      color: theme.subText,
      marginBottom: 16,
    },
    playAgainButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    playAgainText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    resetButton: {
      marginTop: 16,
      backgroundColor: theme.subText,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    resetText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Memory Match</Text>
        <View style={styles.stats}>
          <Text style={styles.statsText}>Moves: {moves}</Text>
          <Text style={styles.statsText}>Time: {formatTime(timer)}</Text>
        </View>
      </View>

      <View style={[styles.gameBoard, { width: gridSize * 80 }]}>
        {cards.map((card, index) => (
          <TouchableOpacity
            key={card.id}
            style={[
              styles.card,
              {
                width: 70,
                height: 70,
              },
              flippedIndices.includes(index) || matchedPairs.includes(card.symbol)
                ? styles.cardFlipped
                : {}
            ]}
            onPress={() => handleCardPress(index)}
            activeOpacity={0.8}
          >
            {(flippedIndices.includes(index) || matchedPairs.includes(card.symbol)) ? (
              <Text style={styles.cardText}>{card.symbol}</Text>
            ) : (
              <Text style={styles.cardBack}>?</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {gameOver && (
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverText}>Game Complete!</Text>
          <Text style={styles.gameOverStats}>
            Time: {formatTime(timer)} | Moves: {moves}
          </Text>
          <TouchableOpacity 
            style={styles.playAgainButton}
            onPress={initializeGame}
          >
            <Text style={styles.playAgainText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {!gameOver && (
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={initializeGame}
        >
          <Text style={styles.resetText}>Reset Game</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default MemoryGame;