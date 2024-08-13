import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const VehicleInformation2 = () => {
  const navigation = useNavigation();
  const [vehicleType, setVehicleType] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [plateNumber, setPlate] = useState("");
  const [capacity, setCapacity] = useState("");

  const handleSignup = async () => {
    try {
      // Retrieve data from AsyncStorage
      const [driver, license, vehicleInfo1, vehicleInfo2] = await AsyncStorage.multiGet([
        'driver',
        'license',
        'vehicleInfo1',
        'vehicleInfo2'
      ]);
  
      if (!driver[1] || !license[1] || !vehicleInfo1[1] || !vehicleInfo2) {
        throw new Error("Required data not found in AsyncStorage.");
      }

      if (!vehicleType || !model || !year || !color || !plateNumber || !capacity) {
        Alert.alert("Validation Error", "All fields are required.");
        return;
      }

      const vehicleData = {
        vehicleType,
        model,
        year,
        color,
        plateNumber,
        capacity,
      };

      const signupData = {
        name: JSON.parse(driver[1]).name,  
        email: JSON.parse(driver[1]).email, 
        password: JSON.parse(driver[1]).password, 
        number: JSON.parse(driver[1]).number,  
        birthday: JSON.parse(driver[1]).birthday,  
        address: JSON.parse(driver[1]).address, 
        license: JSON.parse(license[1]),  
        vehicleInfo1: JSON.parse(vehicleInfo1[1]), 
        vehicleInfo2: vehicleData,
      };
  
      console.log('Combined Data:', signupData);
  
      const response = await axios.post(
        "https://main--exquisite-dodol-f68b33.netlify.app/.netlify/functions/api/driver/driver-signup",
        signupData
      );
      if (response.data.message === "Driver created successfully") {
        navigation.navigate("Login");
      } else {
        Alert.alert(
          "Signup Failed",
          response.data.message || "Unexpected error occurred"
        );
      }
    } catch (error) {
      console.error("Error during signup:", error);
      Alert.alert(
        "Error",
        error.message || "An error occurred during signup. Please try again."
      );
    }
  };
  
  

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Vehicle Information</Text>
      <TextInput
        placeholder="Type of Vehicle"
        value={vehicleType}
        onChangeText={setVehicleType}
        style={styles.input}
      />
      <TextInput
        placeholder="Model"
        value={model}
        onChangeText={setModel}
        style={styles.input}
      />
      <TextInput
        placeholder="Year"
        value={year}
        onChangeText={setYear}
        style={styles.input}
      />
      <TextInput
        placeholder="Color"
        value={color}
        onChangeText={setColor}
        style={styles.input}
      />
      <TextInput
        placeholder="Plate Number"
        value={plateNumber}
        onChangeText={setPlate}
        style={styles.input}
      />
      <TextInput
        placeholder="Capacity"
        value={capacity}
        onChangeText={setCapacity}
        style={styles.input}
      />
      <TouchableOpacity onPress={handleSignup} style={styles.button}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: 40,
    paddingRight: 40,
    paddingTop: 80,
  },
  header: {
    fontWeight: "700",
    fontSize: 24,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginBottom: 16,
    paddingBottom: 8,
    width: "100%",
  },
  button: {
    marginTop: 40,
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default VehicleInformation2;
