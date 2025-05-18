import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ScrollView,
  Animated,
  Easing,
  Image,
  FlatList,
} from 'react-native';
import * as Speech from 'expo-speech';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './ThemeContext';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const CARD_HEIGHT = height * 0.35;
const SPACING = 12;

// Card Component
const InfoCard = ({ item, onPress, theme }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);

  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Convert bullet points to an array
  const bulletPoints = item.fullDescription
    .split('\n')
    .filter(point => point.trim() !== '')
    .map(point => point.trim().replace('• ', ''));

  return (
    <Animated.View 
      style={[
        styles.cardContainer, 
        { 
          opacity, 
          transform: [{ scale }],
          backgroundColor: theme.cardBackground,
          shadowColor: theme.isDarkMode ? '#000' : '#888',
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          marginRight: SPACING,
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.9}
        onPress={onPress}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: item.gradientColors[0] }]}>
            <MaterialCommunityIcons name={item.icon} size={28} color="white" />
          </View>
          <View style={styles.cardTitleContainer}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
            <Text style={[styles.cardSubtitle, { color: theme.subText }]}>{item.shortDescription}</Text>
          </View>
        </View>
        
        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
        
        <View style={styles.cardContent}>
          {bulletPoints.map((point, idx) => (
            <View key={idx} style={styles.bulletItem}>
              <View style={[styles.bulletDot, { backgroundColor: item.gradientColors[0] }]} />
              <Text style={[styles.bulletText, { color: theme.text }]}>{point}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Horizontal Card List Component
const HorizontalCardList = ({ title, data, onCardPress, onRefresh, theme }) => {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
        <TouchableOpacity 
          style={[styles.refreshButton, { backgroundColor: theme.isDarkMode ? '#333' : '#F0F0F0' }]}
          onPress={onRefresh}
        >
          <MaterialCommunityIcons name="refresh" size={18} color={theme.primary} />
          <Text style={[styles.refreshText, { color: theme.primary }]}>Refresh</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.horizontalListContainer}
        snapToInterval={CARD_WIDTH + SPACING}
        decelerationRate="fast"
        renderItem={({ item }) => (
          <InfoCard 
            item={item} 
            onPress={() => onCardPress(item)} 
            theme={theme}
          />
        )}
      />
    </View>
  );
};

// App Component (without ThemeProvider)
const HealthTipsApp = () => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [displayedTips, setDisplayedTips] = useState([]);
  const [displayedFacts, setDisplayedFacts] = useState([]);
  const scrollViewRef = useRef(null);
  
  // Tips data - reduced to 5 items as requested
  const tips = [
    {
      id: '1',
      title: 'Prevent Falls',
      icon: 'home-floor-g',
      shortDescription: 'Make your home safer',
      fullDescription: '• Remove loose rugs and cords\n• Install grab bars in the bathroom\n• Keep frequently used items within easy reach\n• Use non-slip mats in the bathroom',
      gradientColors: ['#4A97E8', '#2176D2'],
    },
    {
      id: '2',
      title: 'Medication Management',
      icon: 'pill',
      shortDescription: 'Remember your medications',
      fullDescription: '• Use a large-print pill organizer\n• Connect medicine with daily routines\n• Ask for easy-to-open packaging\n• Keep a simple list of medications',
      gradientColors: ['#E05252', '#C43030'],
    },
    {
      id: '3',
      title: 'Stay Mentally Active',
      icon: 'brain',
      shortDescription: 'Keep your mind sharp',
      fullDescription: '• Do crossword puzzles or word games\n• Try new hobbies or learn new skills\n• Read books or listen to audiobooks\n• Play card games with friends',
      gradientColors: ['#5DB761', '#3C9142'],
    },
    {
      id: '4',
      title: 'Better Sleep',
      icon: 'sleep',
      shortDescription: 'Tips for restful sleep',
      fullDescription: '• Keep your bedroom cool and dark\n• Avoid caffeine after lunch\n• Try to go to bed at the same time each night\n• Limit fluids 2 hours before bedtime',
      gradientColors: ['#7986CB', '#3F51B5'],
    },
    {
      id: '5',
      title: 'Stay Hydrated',
      icon: 'water',
      shortDescription: 'Water is essential for health',
      fullDescription: '• Drink at least 8 glasses of water daily\n• Keep a water bottle nearby\n• Set reminders to drink water\n• Eat water-rich fruits like watermelon',
      gradientColors: ['#29B6F6', '#0288D1'],
    },
  ];

  // Fun Facts data - reduced to 5 items as requested
  const funFacts = [
    {
      id: '1',
      title: 'Fun Fact',
      icon: 'lightbulb-on',
      shortDescription: "Giraffe's neck mystery!",
      fullDescription: '• A giraffe\'s neck contains the same number of vertebrae as a human\'s neck!',
      gradientColors: ['#FF9800', '#F57C00'],
    },
    {
      id: '2',
      title: 'Fun Fact',
      icon: 'food-apple',
      shortDescription: "Honey's timeless secret!",
      fullDescription: '• Honey never spoils, and archaeologists have found pots of honey in ancient tombs that are over 3,000 years old!',
      gradientColors: ['#66BB6A', '#4CAF50'],
    },
    {
      id: '3',
      title: 'Fun Fact',
      icon: 'paw',
      shortDescription: "Cats have nose prints!",
      fullDescription: '• A cat\'s nose print is unique, much like a human\'s fingerprint.',
      gradientColors: ['#42A5F5', '#2196F3'],
    },
    {
      id: '4',
      title: 'Fun Fact',
      icon: 'tower-beach',
      shortDescription: "Eiffel Tower grows!",
      fullDescription: '• The Eiffel Tower can grow by about 6 inches during the summer due to the heat expanding the metal.',
      gradientColors: ['#AB47BC', '#9C27B0'],
    },
    {
      id: '5',
      title: 'Fun Fact',
      icon: 'emoticon-happy',
      shortDescription: "Longest hiccuping spree!",
      fullDescription: '• The longest hiccuping spree lasted 68 years!',
      gradientColors: ['#26C6DA', '#00ACC1'],
    },
  ];

  // Function to get random items from an array
  const getRandomItems = (array, count) => {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // Set random tips and facts on initial load
  useEffect(() => {
    setDisplayedTips(getRandomItems(tips, Math.min(7, tips.length)));
    setDisplayedFacts(getRandomItems(funFacts, Math.min(5, funFacts.length)));
  }, []);

  // Refresh tips function
  const refreshTips = () => {
    setDisplayedTips(getRandomItems(tips, Math.min(7, tips.length)));
  };

  // Refresh facts function
  const refreshFacts = () => {
    setDisplayedFacts(getRandomItems(funFacts, Math.min(5, funFacts.length)));
  };

  // Speak the content of a card
  const speakContent = (item) => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    
    const textToSpeak = `${item.title}. ${item.shortDescription}. ${item.fullDescription.replace(/•/g, '')}`;
    
    Speech.speak(textToSpeak, {
      language: 'en',
      pitch: 1.0,
      rate: 0.75, // Slower for seniors
      onStart: () => setIsSpeaking(true),
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => {
        setIsSpeaking(false);
        Alert.alert("Speech Error", "Unable to use voice feature. Please try again.");
      },
    });
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Daily Health Tips</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: theme.isDarkMode ? '#333' : '#F0F0F0' }]}
            onPress={toggleTheme}
          >
            <MaterialCommunityIcons 
              name={isDarkMode ? "weather-sunny" : "weather-night"} 
              size={22} 
              color={theme.text} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: theme.isDarkMode ? '#333' : '#F0F0F0' }]}
            onPress={() => {
              if (isSpeaking) {
                Speech.stop();
                setIsSpeaking(false);
              }
            }}
          >
            <MaterialCommunityIcons 
              name={isSpeaking ? "volume-high" : "volume-medium"} 
              size={22} 
              color={isSpeaking ? theme.primary : theme.text} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Main content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Tips Section with Horizontal Scroll */}
        <HorizontalCardList
          title="Today's Tips"
          data={displayedTips}
          onCardPress={speakContent}
          onRefresh={refreshTips}
          theme={theme}
        />
        
        {/* Fun Facts Section with Horizontal Scroll */}
        <HorizontalCardList
          title="Fun Facts"
          data={displayedFacts}
          onCardPress={speakContent}
          onRefresh={refreshFacts}
          theme={theme}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

// Main App with ThemeProvider
const App = () => {
  return (
    <ThemeProvider>
      <HealthTipsApp />
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
    paddingBottom: 15,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    borderRadius: 12,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  sectionContainer: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  horizontalListContainer: {
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 5,
    paddingLeft: 16,
    paddingRight: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  refreshText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  cardContainer: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  card: {
    padding: 16,
    height: '100%',
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 12,
  },
  cardContent: {
    marginTop: 4,
    flex: 1,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 10,
  },
  bulletText: {
    fontSize: 15,
    flex: 1,
    lineHeight: 22,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});

export default HealthTipsApp;