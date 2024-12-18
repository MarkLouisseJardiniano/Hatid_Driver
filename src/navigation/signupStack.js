import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import Signup from "../Screeens/(authenticate)/register";
import { StatusBar } from "react-native";
import VehicleInformation2 from "../Screeens/(authenticate)/vehicleInfo2";
import OtpVerificationScreen from "../Screeens/(authenticate)/otp";
import Documents from "../Screeens/(authenticate)/documents";

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
      name="Otp"
      component={OtpVerificationScreen}
      options={{ headerShown: false }}
    />
        <Stack.Screen
      name="VehicleInfo2"
      component={VehicleInformation2}
      options={{ headerShown: false }}
    />
            <Stack.Screen
      name="Documents"
      component={Documents}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
  </>
);

export default SignupStack;
