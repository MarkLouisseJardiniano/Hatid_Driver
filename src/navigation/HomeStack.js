import React from 'react';
import { StatusBar } from "react-native";
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Home from '../Screeens/HomeScreen/Home';// Replace with your actual screen components

const Stack = createStackNavigator();

const Layout = () => {
  return (
<>
<StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false, // Hide header for all screens in this stack
        }}
      >
        <Stack.Screen name="Home" component={Home} />
      </Stack.Navigator>
</>
  );
};

export default Layout;
