import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTheme } from './ThemeContext';
import MeditationScreen from './relaxation';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import FavoriteMeditationsScreen from './favoritemeditation'

const Tab = createMaterialTopTabNavigator();


const MeditationTabNavigator = () => {
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
          name="All Meditations" 
          component={MeditationScreen} 
        />
        <Tab.Screen 
          name="Favorites" 
          component={FavoriteMeditationsScreen} 
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

export default MeditationTabNavigator;