import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ExerciseTabNavigator from './ExerciseTabNavigator';

const Stack = createStackNavigator();

const MainExerciseScreen = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="Exercises" 
        component={ExerciseTabNavigator} 
      />
    </Stack.Navigator>
  );
};

export default MainExerciseScreen;