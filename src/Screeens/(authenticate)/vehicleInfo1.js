import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

const VehicleInformation = () => {
  const navigation = useNavigation();
  const [or, setOr] = useState(""); 
  const [cr, setCr] = useState(""); 
  const [vehicleFront, setVehicleFront] = useState("");
  const [vehicleBack, setVehicleBack] = useState(""); 
  const [vehicleLeft, setVehicleLeft] = useState(""); 
  const [vehicleRight, setVehicleRight] = useState("");

  // Function to handle image picking

  useEffect(() => {
    const getPermissions = async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "You need to grant camera roll permissions to upload images."
        );
      }
    };
    getPermissions();
  }, []);
  const pickImageAsync = async (side) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) {
      switch (side) {
        case "or":
          setOr(result.assets[0].uri);
          break;
        case "cr":
          setCr(result.assets[0].uri);
          break;
        case "front":
          setVehicleFront(result.assets[0].uri);
          break;
        case "back":
          setVehicleBack(result.assets[0].uri);
          break;
        case "left":
          setVehicleLeft(result.assets[0].uri);
          break;
        case "right":
          setVehicleRight(result.assets[0].uri);
          break;
        default:
          break;
      }
    } else {
      alert("You did not select any image.");
    }
  };

  // Function to handle the "Next" button press
  const handleNext = async () => {
    // Save image URIs to AsyncStorage
    await AsyncStorage.setItem(
      "vehicleInfo1",
      JSON.stringify({
        or,
        cr,
        vehicleFront,
        vehicleBack,
        vehicleLeft,
        vehicleRight,
      })
    );

    // Navigate to the next screen
    navigation.navigate("VehicleInfo2");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Vehicle Information</Text>
      <ScrollView style={styles.license}>
        <View style={styles.uploadSection}>
          <Text style={styles.uploadText}>Official Receipt (OR)</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickImageAsync("or")}
          >
            <Text>Upload</Text>
            {or ? <Image source={{ uri: or }} style={styles.image} /> : null}
          </TouchableOpacity>
        </View>
        <View style={styles.uploadSection}>
          <Text style={styles.uploadText}>
            Certificate of Registration (CR)
          </Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickImageAsync("cr")}
          >
            <Text>Upload</Text>
            {cr ? <Image source={{ uri: cr }} style={styles.image} /> : null}
          </TouchableOpacity>
        </View>
        <View style={styles.uploadSection}>
          <Text style={styles.uploadText}>Vehicle Front</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickImageAsync("front")}
          >
            <Text>Upload</Text>
            {vehicleFront ? (
              <Image source={{ uri: vehicleFront }} style={styles.image} />
            ) : null}
          </TouchableOpacity>
        </View>
        <View style={styles.uploadSection}>
          <Text style={styles.uploadText}>Vehicle Back</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickImageAsync("back")}
          >
            <Text>Upload</Text>
            {vehicleBack ? (
              <Image source={{ uri: vehicleBack }} style={styles.image} />
            ) : null}
          </TouchableOpacity>
        </View>
        <View style={styles.uploadSection}>
          <Text style={styles.uploadText}>Vehicle Left</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickImageAsync("left")}
          >
            <Text>Upload</Text>
            {vehicleLeft ? (
              <Image source={{ uri: vehicleLeft }} style={styles.image} />
            ) : null}
          </TouchableOpacity>
        </View>
        <View style={styles.uploadSection}>
          <Text style={styles.uploadText}>Vehicle Right</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickImageAsync("right")}
          >
            <Text>Upload</Text>
            {vehicleRight ? (
              <Image source={{ uri: vehicleRight }} style={styles.image} />
            ) : null}
          </TouchableOpacity>
        </View>
      </ScrollView>
      <TouchableOpacity onPress={handleNext} style={styles.button}>
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
};

export default VehicleInformation;

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
  license: {
    gap: 40,
  },
  uploadSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 20,
  },
  uploadText: {
    marginTop: 25,
    fontWeight: "500",
    fontSize: 16,
  },
  uploadButton: {
    padding: 30,
    backgroundColor: "powderblue",
    alignItems: "center",
  },
  image: {
    width: 100,
    height: 100,
    marginTop: 10,
    borderRadius: 5,
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
