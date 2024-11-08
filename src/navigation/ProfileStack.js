import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import EditProfile from '../Screeens/ProfileScreen/editProfile'; 
import Profile from '../Screeens/ProfileScreen/profile'; 
import Contact from '../Screeens/ProfileScreen/contact'; 
import AddContact from '../Screeens/ProfileScreen/addContact'; 
import Subscription from '../Screeens/ProfileScreen/subscription';


const Stack = createStackNavigator();

export default function Layout() {
  return (
    <Stack.Navigator >
      <Stack.Screen 
        name="Profile" 
        component={Profile} 
        options={{ headerShown: false }}
      />
      <Stack.Screen name="EditProfile" component={EditProfile} />
      <Stack.Screen name="Contact" component={Contact} />
      <Stack.Screen name="AddContact" component={AddContact} />
      <Stack.Screen name="Subscription" component={Subscription} />
    </Stack.Navigator>
  );
}
