import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import Login from '../navigation/Auth';
import TabNav from '../navigation/TabNav';
import Message from '../Screeens/HomeScreen/message';
import Cancelled from '../Screeens/HomeScreen/cancelled'
const Stack = createStackNavigator();

const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="LoginStack" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="TabNav" component={TabNav} options={{ headerShown: false }} />
        <Stack.Screen name="Message" component={Message} />
        <Stack.Screen name="Cancelled" component={Cancelled} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
