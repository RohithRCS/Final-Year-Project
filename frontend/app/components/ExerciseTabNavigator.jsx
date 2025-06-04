import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTheme } from './ThemeContext';
import ExercisesScreen from './exercise';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import FavExScreen from './favouriteexercise'

const Tab = createMaterialTopTabNavigator();


const ExerciseTabNavigator = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>

      
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.subText,
          tabBarIndicatorStyle: { backgroundColor: theme.primary },
          tabBarStyle: { backgroundColor: theme.cardBackground },
          tabBarLabelStyle: { fontWeight: 'bold' },
        }}
      >
        <Tab.Screen 
          name="All Exercises" 
          component={ExercisesScreen} 
        />
        <Tab.Screen 
          name="Favorites" 
          component={FavExScreen} 
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  backButton: {
    marginRight: 15,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#202124',
  },
});

export default ExerciseTabNavigator;