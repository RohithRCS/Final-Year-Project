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
// Remove fixed CARD_HEIGHT to make cards responsive to content
const SPACING = 12;

// Card Component with dynamic height
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

  // Calculate appropriate card height based on content
  // Tips have max 5 lines, fun facts have max 3 lines
  const isTip = item.title !== 'Fun Fact';
  const cardHeight = isTip ? 260 : 200; // Adjusted heights based on content type

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
          height: cardHeight, // Use dynamic height
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
      title: 'Watermelon - Stay Hydrated & Fresh',
      icon: 'fruit-watermelon',
      shortDescription: 'Keeps your body cool and hydrated',
      fullDescription: '• Helps with memory and focus\n• Refreshes your body\n• Full of vitamins\n• Eat in the morning for best results',
      gradientColors: ['#EC407A', '#D81B60'],
    },
    {
      id: '6',
      title: 'Banana - Boost Energy & Help Digestion',
      icon: 'basket',
      shortDescription: 'Provides quick energy and aids digestion',
      fullDescription: '• Helps you feel energized\n• Easy on the stomach\n• Keeps the heart healthy\n• Eat daily with breakfast',
      gradientColors: ['#FFD54F', '#FFA000']
    },
    {
      id: '7',
      title: 'Spinach - Good for Brain & Bones',
      icon: 'leaf',
      shortDescription: 'Strengthens bones and improves brain health',
      fullDescription: '• Boosts memory\n• Keeps bones strong\n• Great source of iron\n• Eat in soups or salads',
      gradientColors: ['#66BB6A', '#388E3C']
    },
    {
      id: '8',
      title: 'Carrot - Eye Care & Immunity',
      icon: 'carrot',
      shortDescription: 'Good for eyesight and immune system',
      fullDescription: '• Helps you see better\n• Full of Vitamin A\n• Boosts immunity\n• Eat raw or cooked',
      gradientColors: ['#FF8A65', '#E64A19']
    },
    {
      id: '9',
      title: 'Grapes - Help Heart & Mind',
      icon: 'fruit-grapes',
      shortDescription: 'Supports memory and heart health',
      fullDescription: '• Improves memory\n• Keeps the heart strong\n• Hydrates your body\n• Eat a small bunch for a snack',
      gradientColors: ['#9575CD', '#5E35B1']
    },
    {
      id: '10',
      title: 'Home Safety Tips',
      icon: 'home',
      shortDescription: 'Ensure a safe living environment',
      fullDescription: '• Keep lights on at night\n• Use handrails on stairs\n• Clear walking paths\n• Keep essentials within easy reach',
      gradientColors: ['#4DB6AC', '#00897B']
    },
    {
      id: '11',
      title: 'Morning Habits',
      icon: 'weather-sunset-up',
      shortDescription: 'Start your day right',
      fullDescription: '• Drink warm water after waking\n• Take 5 deep breaths\n• Wash your face and smile\n• Sit in sunlight for 10 minutes',
      gradientColors: ['#FFB74D', '#FF9800']
    },
    {
      id: '12',
      title: 'Cucumber - Cooling & Skin',
      icon: 'sprout',
      shortDescription: 'Keeps you cool and improves skin health',
      fullDescription: '• Helps lower blood pressure\n• Refreshes skin\n• Hydrates the body\n• Eat raw in salads',
      gradientColors: ['#81C784', '#4CAF50']
    },
    {
      id: '13',
      title: 'Memory Tips',
      icon: 'brain',
      shortDescription: 'Enhance your memory every day',
      fullDescription: '• Recall 3 things from yesterday\n• Look at old photos and share stories\n• Solve a puzzle\n• Learn one new word daily',
      gradientColors: ['#7986CB', '#3F51B5']
    },
    {
      id: '14',
      title: 'Garlic - Heart & Immunity Helper',
      icon: 'seed',
      shortDescription: 'Supports heart health and immunity',
      fullDescription: '• Lowers blood pressure\n• Keeps heart strong\n• Fights illness\n• Add to daily cooking',
      gradientColors: ['#E05252', '#C43030'],
    },
    {
      id: '15',
      title: 'Relaxation Tips',
      icon: 'meditation',
      shortDescription: 'Relax and ease your mind',
      fullDescription: '• Sit quietly and breathe\n• Listen to soft music\n• Close eyes and focus on your heartbeat\n• Think of a happy memory',
      gradientColors: ['#90CAF9', '#1976D2']
    },
    {
      id: '16',
      title: 'Music for Joy',
      icon: 'music',
      shortDescription: 'Bring joy through music',
      fullDescription: '• Play an old favorite song\n• Sing or hum softly\n• Dance or move to the rhythm\n• Share music with someone',
      gradientColors: ['#9FA8DA', '#3949AB']
    },
    {
      id: '17',
      title: 'Safety Outside Home',
      icon: 'walk',
      shortDescription: 'Stay safe when walking outside',
      fullDescription: '• Use a walking stick if needed\n• Wear non-slip shoes\n• Cross roads carefully\n• Go outside during daylight',
      gradientColors: ['#4DD0E1', '#00ACC1']
    },
    {
      id: '18',
      title: 'Warm Milk - Sleep & Bones',
      icon: 'cup',
      shortDescription: 'Helps you sleep and strengthens bones',
      fullDescription: '• Promotes restful sleep\n• Boosts calcium for bones\n• Calms your mind\n• Drink before bedtime with honey',
      gradientColors: ['#E05252', '#C43030']
    },
    {
      id: '19',
      title: 'Lemon Water - Fresh & Healthy',
      icon: 'fruit-citrus',
      shortDescription: 'Start the day fresh and healthy',
      fullDescription: '• Aids digestion\n• Fights sickness\n• Keeps you refreshed\n• Drink with honey after waking',
      gradientColors: ['#FFF176', '#FBC02D']
    },
    {
      id: '20',
      title: 'Feel-Good Habits',
      icon: 'calendar-check',
      shortDescription: 'Positive habits to brighten your day',
      fullDescription: '• Be kind to yourself\n• Thank someone today\n• Hug a loved one\n• Smile at your reflection',
      gradientColors: ['#FFD54F', '#FFC107']
    },
    {
      id: '21',
      title: 'Stretching',
      icon: 'yoga',
      shortDescription: 'Simple stretches for relaxation',
      fullDescription: '• Stretch your arms\n• Roll your neck gently\n• Move your shoulders\n• Stretch your legs while seated',
      gradientColors: ['#AED581', '#7CB342']
    },
    {
      id: '22',
      title: 'Fish - Brain & Joint Care',
      icon: 'fish',
      shortDescription: 'Supports brain function and joint health',
      fullDescription: '• Boosts memory\n• Strengthens joints\n• Keeps the heart healthy\n• Eat twice a week',
      gradientColors: ['#4FC3F7', '#039BE5']
    },
    {
      id: '23',
      title: 'Emergency Tips',
      icon: 'alert',
      shortDescription: 'Stay prepared in case of emergencies',
      fullDescription: '• Keep your phone close\n• Save emergency numbers\n• Write numbers near your bed\n• Always tell someone your plans',
      gradientColors: ['#EF5350', '#E53935']
    },
    {
      id: '24',
      title: 'Fun Daily Activities',
      icon: 'party-popper',
      shortDescription: 'Enjoy simple activities to brighten your day',
      fullDescription: '• Water a plant\n• Try coloring or drawing\n• Read a story\n• Watch birds outside',
      gradientColors: ['#80DEEA', '#00ACC1']
    },
    {
      id: '25',
      title: 'Strawberries - Skin & Heart',
      icon: 'fruit-cherries',
      shortDescription: 'Improves skin and heart health',
      fullDescription: '• Full of Vitamin C\n• Fights illness\n• Keeps your heart healthy\n• Snack on them daily',
      gradientColors: ['#EC407A', '#D81B60']
    },
    {
      id: '26',
      title: 'Almonds - Brain & Energy',
      icon: 'seed',
      shortDescription: 'Boosts brain function and energy',
      fullDescription: '• Enhances memory\n• Provides quick energy\n• Helps lower cholesterol\n• Eat 4-5 soaked almonds',
      gradientColors: ['#BCAAA4', '#8D6E63']
    },
    {
      id: '27',
      title: 'Simple Breathing Exercise',
      icon: 'lungs',
      shortDescription: 'Relax with easy breathing techniques',
      fullDescription: '• Sit comfortably\n• Breathe in for 4 seconds\n• Hold for 4 seconds\n• Exhale slowly for 4 seconds',
      gradientColors: ['#90CAF9', '#42A5F5']
    },
    {
      id: '28',
      title: 'Turmeric - Natural Healer',
      icon: 'leaf',
      shortDescription: 'Fights inflammation and boosts immunity',
      fullDescription: '• Reduces joint pain\n• Strengthens your immune system\n• Helps digestion\n• Add to warm milk or meals',
      gradientColors: ['#FFD54F', '#FFA000']
    },
    {
      id: '29',
      title: 'Backyard Nature Walk',
      icon: 'walk',
      shortDescription: 'Relax while enjoying nature',
      fullDescription: '• Walk slowly and observe\n• Listen to birds\n• Smell flowers\n• Stretch your arms to the sky',
      gradientColors: ['#A5D6A7', '#4CAF50']
    },
    {
      id: '30',
      title: 'Technology Use Tips',
      icon: 'laptop',
      shortDescription: 'Simple tech tips for ease of use',
      fullDescription: '• Use speakerphone for calls\n• Increase screen brightness\n• Ask family for help with reminders\n• Use voice commands',
      gradientColors: ['#90A4AE', '#607D8B']
    },
    {
      id: '31',
      title: 'Herbal Tea - Relax & Refresh',
      icon: 'cup',
      shortDescription: 'Calm your mind and body',
      fullDescription: '• Drink chamomile or ginger tea\n• Helps you relax before bed\n• Keeps your throat warm\n• Relieves stress',
      gradientColors: ['#81C784', '#388E3C']
    },
    {
      id: '32',
      title: 'Yogurt - Digestion & Bone Health',
      icon: 'food-variant',
      shortDescription: 'Promotes digestion and strengthens bones',
      fullDescription: '• Improves gut health\n• Full of calcium\n• Aids in nutrient absorption\n• Enjoy it for breakfast',
      gradientColors: ['#E1BEE7', '#9C27B0']
    },
    {
      id: '33',
      title: 'Talk About The Weather',
      icon: 'weather-sunny',
      shortDescription: 'Start conversations with simple weather talk',
      fullDescription: '• Observe the clouds\n• Share how the weather feels\n• Write one line about the day\n• Look forward to tomorrow\'s weather',
      gradientColors: ['#81D4FA', '#03A9F4']
    },
    {
      id: '34',
      title: 'Nail & Hand Care',
      icon: 'hand-pointing-up',
      shortDescription: 'Keep your hands and nails healthy',
      fullDescription: '• Trim nails regularly\n• Massage hands with lotion\n• Wear gloves when necessary\n• Keep nails clean and dry',
      gradientColors: ['#F48FB1', '#E91E63']
    },
    {
      id: '35',
      title: 'Oats - Heart & Energy',
      icon: 'food-variant',
      shortDescription: 'Boosts heart health and gives energy',
      fullDescription: '• Lowers cholesterol\n• Provides steady energy\n• Full of fiber\n• Have oats for breakfast',
      gradientColors: ['#D7CCC8', '#795548']
    },
    {
      id: '36',
      title: 'Stay Active',
      icon: 'run',
      shortDescription: 'Exercise daily for strength and flexibility',
      fullDescription: '• Take a short walk\n• Do stretching exercises\n• Try light yoga\n• Avoid sitting for too long',
      gradientColors: ['#FFCC80', '#FF9800']
    },
    {
      id: '37',
      title: 'Healthy Fats - Avocado',
      icon: 'fruit-citrus',
      shortDescription: 'Supports brain and heart health',
      fullDescription: '• Boosts brain function\n• Keeps the heart strong\n• Full of healthy fats\n• Add to salads or sandwiches',
      gradientColors: ['#A5D6A7', '#388E3C']
    },
    {
      id: '38',
      title: 'Walking Stick Use',
      icon: 'human-cane',
      shortDescription: 'Use a walking stick for balance',
      fullDescription: '• Helps maintain balance\n• Reduces fall risk\n• Adjust height for comfort\n• Carry it on walks',
      gradientColors: ['#BDBDBD', '#757575']
    },
    {
      id: '39',
      title: 'Memory Games',
      icon: 'brain',
      shortDescription: 'Strengthen memory with fun activities',
      fullDescription: '• Solve crosswords\n• Play card games\n• Try puzzles\n• Watch quiz shows',
      gradientColors: ['#9FA8DA', '#3F51B5']
    },
    {
      id: '40',
      title: 'Regular Check-ups',
      icon: 'heart-pulse',
      shortDescription: 'Stay on top of your health',
      fullDescription: '• Visit your doctor yearly\n• Get your vision and hearing checked\n• Take medications as prescribed\n• Follow up on health concerns',
      gradientColors: ['#80CBC4', '#009688']
    },
    {
      id: '41',
      title: 'Early Morning Walk',
      icon: 'walk',
      shortDescription: 'Start your day with a walk',
      fullDescription: '• Walk before breakfast\n• Enjoy cool morning air\n• Take deep breaths\n• Feel the warmth of the sun',
      gradientColors: ['#FFE082', '#FFC107']
    },
    {
      id: '42',
      title: 'Laughter Therapy',
      icon: 'emoticon-lol',
      shortDescription: 'Laughing boosts mood and health',
      fullDescription: '• Watch a comedy show\n• Listen to jokes\n• Share funny memories\n• Laugh with friends',
      gradientColors: ['#FFCC80', '#FF9800']
    },
    {
      id: '43',
      title: 'Easy Breathing Exercise',
      icon: 'lungs',
      shortDescription: 'Relax with deep breathing',
      fullDescription: '• Sit down and close eyes\n• Take deep breaths through your nose\n• Hold for 3 seconds\n• Exhale slowly through your mouth',
      gradientColors: ['#B3E5FC', '#03A9F4']
    },
    {
      id: '44',
      title: 'Mindful Meditation',
      icon: 'meditation',
      shortDescription: 'Calm your mind and relax',
      fullDescription: '• Find a quiet space\n• Sit comfortably\n• Focus on your breathing\n• Practice for 10 minutes',
      gradientColors: ['#C5CAE9', '#3F51B5']
    }
  ];

  // Fun Facts data (shortened for brevity)
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
    {
      id: '6',
      title: 'Fun Fact',
      icon: 'sword-cross',
      shortDescription: "Shortest war ever!",
      fullDescription: '• The shortest war in history lasted just 38 to 45 minutes between Britain and Zanzibar in 1896.',
      gradientColors: ['#FFA726', '#FB8C00'],
    },
    {
      id: '7',
      title: 'Fun Fact',
      icon: 'apple',
      shortDescription: "Is strawberry a berry?",
      fullDescription: '• A strawberry is not a berry, but a banana is!',
      gradientColors: ['#66BB6A', '#43A047'],
    },
    {
      id: '8',
      title: 'Fun Fact',
      icon: 'music-note',
      shortDescription: "Try humming!",
      fullDescription: '• You can\'t hum while holding your nose closed.',
      gradientColors: ['#7E57C2', '#5E35B1'],
    },
    {
      id: '9',
      title: 'Fun Fact',
      icon: 'package-variant-closed',
      shortDescription: "Pringles inventor's wish!",
      fullDescription: '• The inventor of the Pringles can is buried in one!',
      gradientColors: ['#EC407A', '#D81B60'],
    },
    {
      id: '10',
      title: 'Fun Fact',
      icon: 'heart-pulse',
      shortDescription: "Heart hard at work!",
      fullDescription: '• Your heart beats around 100,000 times a day to pump blood through your body.',
      gradientColors: ['#EF5350', '#E53935'],
    },
    {
      id: '11',
      title: 'Fun Fact',
      icon: 'emoticon-tongue',
      shortDescription: "Sneezing mystery!",
      fullDescription: '• It\'s impossible to sneeze with your eyes open.',
      gradientColors: ['#26A69A', '#00897B'],
    },
    {
      id: '12',
      title: 'Fun Fact',
      icon: 'traffic-light',
      shortDescription: "Waiting at red lights!",
      fullDescription: '• The average person spends about six months of their life waiting for red lights to turn green!',
      gradientColors: ['#FF7043', '#FF5722'],
    },
    {
      id: '13',
      title: 'Fun Fact',
      icon: 'shield-star',
      shortDescription: "D-Day meaning!",
      fullDescription: '• The "D" in D-Day stands for "Day," and it\s used to mark the day of any military operation.',
      gradientColors: ['#5C6BC0', '#3949AB'],
    },
    {
      id: '14',
      title: 'Fun Fact',
      icon: 'snowflake',
      shortDescription: "Giant snowflake!",
      fullDescription: '• The world\'s largest snowflake on record was 15 inches wide and 8 inches thick!',
      gradientColors: ['#29B6F6', '#0288D1'],
    },
    {
      id: '15',
      title: 'Fun Fact',
      icon: 'clock-outline',
      shortDescription: "Sloths hold breath longer!",
      fullDescription: '• Sloths can hold their breath longer than dolphins, up to 40 minutes!',
      gradientColors: ['#66BB6A', '#43A047'],
    },
    {
      id: '16',
      title: 'Fun Fact',
      icon: 'duck',
      shortDescription: "Fake flamingos!",
      fullDescription: '• There are more fake flamingos in the world than real ones.',
      gradientColors: ['#FF4081', '#F50057'],
    },
    {
      id: '17',
      title: 'Fun Fact',
      icon: 'blood-bag',
      shortDescription: "Blood vessel length!",
      fullDescription: '• The human body contains around 100,000 miles of blood vessels!',
      gradientColors: ['#EC407A', '#D81B60'],
    },
    {
      id: '18',
      title: 'Fun Fact',
      icon: 'star',
      shortDescription: "Starfish regeneration!",
      fullDescription: '• If you cut a starfish in half, it can regenerate a new body!',
      gradientColors: ['#7E57C2', '#5E35B1'],
    },
    {
      id: '19',
      title: 'Fun Fact',
      icon: 'bird',
      shortDescription: "Chicken's flight!",
      fullDescription: '• The longest recorded flight of a chicken is 13 seconds.',
      gradientColors: ['#FFA726', '#FB8C00'],
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
    marginBottom: 8,
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
    lineHeight: 20,
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