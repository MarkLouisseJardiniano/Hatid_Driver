import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import Signup from "../Screeens/(authenticate)/register";
import { StatusBar } from "react-native";
import License from "../Screeens/(authenticate)/license";
import VehicleInformation1 from "../Screeens/(authenticate)/vehicleInfo1";
import VehicleInformation2 from "../Screeens/(authenticate)/vehicleInfo2";

const Stack = createStackNavigator();

const SignupStack = () => (
  <>
  <StatusBar
    barStyle="dark-content"
    translucent
    backgroundColor="transparent"
  />
  <Stack.Navigator initialRouteName="Signup">
    <Stack.Screen
      name="Signup"
      component={Signup}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="License"
      component={License}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="VehicleInfo1"
      component={VehicleInformation1}
      options={{ headerShown: false }}
    />
        <Stack.Screen
      name="VehicleInfo2"
      component={VehicleInformation2}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
  </>
);

export default SignupStack;
