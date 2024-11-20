import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import EditProfile from '../Screeens/ProfileScreen/editProfile'; 
import Profile from '../Screeens/ProfileScreen/profile'; 
import Contact from '../Screeens/ProfileScreen/contact'; 
import AddContact from '../Screeens/ProfileScreen/addContact'; 
import Subscription from '../Screeens/ProfileScreen/subscription';
import MonthlySubscribe from '../Screeens/ProfileScreen/monthlySubscribe';
import QuarterlySubscribe from '../Screeens/ProfileScreen/JeepQuarterlySubscribe';
import AnnualSubscribe from '../Screeens/ProfileScreen/JeepAnnualSubscribe';
import TricycleMonthlySubscribe from '../Screeens/ProfileScreen/monthlyTricycleSubscribe';
import TricycleQuarterlySubscribe from '../Screeens/ProfileScreen/tricycleQuarterlySubscribe';
import TricycleAnnualSubscribe from '../Screeens/ProfileScreen/tricycleAnnualSubscribe';


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
      <Stack.Screen name="Subscription" component={Subscription}  options={{ headerStyle: { backgroundColor: 'black',      elevation: 0,
      shadowOpacity: 0,  }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' } }} />
      <Stack.Screen name="TricycleMonthlySubscribe" component={TricycleMonthlySubscribe} />
      <Stack.Screen name="TricycleQuarterlySubscribe" component={TricycleQuarterlySubscribe} />
      <Stack.Screen name="TricycleAnnualSubscribe" component={TricycleAnnualSubscribe} />
      <Stack.Screen name="MonthlySubscribe" component={MonthlySubscribe} />
      <Stack.Screen name="QuarterlySubscribe" component={QuarterlySubscribe} />
      <Stack.Screen name="AnnualSubscribe" component={AnnualSubscribe} />
    </Stack.Navigator>
  );
}
