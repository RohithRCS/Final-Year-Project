import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MeditationTabNavigator from './MeditationTabNavigator';

const Stack = createStackNavigator();

const MainMeditationScreen = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="Meditation" 
        component={MeditationTabNavigator} 
      />
    </Stack.Navigator>
  );
};

export default MainMeditationScreen;