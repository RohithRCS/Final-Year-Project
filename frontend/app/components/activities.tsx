import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from './ThemeContext'; // Update the import path

// Define types for your navigation stack
type RootStackParamList = {
  ExerciseStack: undefined;
  RelaxStack: undefined;
  MusicStack: undefined;
  GameStack: undefined;
  TipsStack: undefined;
  // Add other screens here as needed
};

type ActivityItem = {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  navigateTo: keyof RootStackParamList;
};

type ActivitiesScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ActivitiesScreen = () => {
  const navigation = useNavigation<ActivitiesScreenNavigationProp>();
  const { theme } = useTheme(); // Get the current theme
  
  const activities: ActivityItem[] = [
    { id: '1', title: 'Exercises', icon: 'fitness', color: '#4285F4', description: 'Exercise your memory with this card matching game', navigateTo: 'ExerciseStack' },
    { id: '2', title: 'Relaxation', icon: 'body', color: '#34A853', description: 'Guided meditation and breathing exercises', navigateTo: 'RelaxStack' },
    { id: '3', title: 'Music playlist', icon: 'musical-notes', color: '#FBBC05', description: 'Curated playlists to improve your mood', navigateTo: 'MusicStack' },
    { id: '4', title: 'Games', icon: 'game-controller', color: '#EA4335', description: 'Word and number puzzles to keep your mind sharp', navigateTo: 'GameStack' },
    { id: '5', title: 'Tips', icon: 'bulb', color: '#9AA0A6', description: 'Review cherished memories with loved ones', navigateTo: 'TipsStack' },
  ];
  
  const handleActivityPress = (item: ActivityItem) => {
    navigation.navigate(item.navigateTo);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.screenTitle, { color: theme.text }]}>Activities & Games</Text>
      
      <FlatList
        data={activities}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.activityCard, { backgroundColor: theme.cardBackground }]}
            onPress={() => handleActivityPress(item)}
          >
            <View style={[styles.activityIcon, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon as any} size={32} color="white" />
            </View>
            <View style={styles.activityContent}>
              <Text style={[styles.activityTitle, { color: theme.text }]}>{item.title}</Text>
              <Text style={[styles.activityDescription, { color: theme.subText }]}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.subText} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

// Update styles to use theme where dynamic
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  activityDescription: {
    fontSize: 14,
  },
});

export default ActivitiesScreen;