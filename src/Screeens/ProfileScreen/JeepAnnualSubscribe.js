import { StyleSheet, Text, View, Image, TouchableOpacity, Alert, Platform } from 'react-native';
import React, { useState, useEffect } from "react";
import imagePath from "../../constants/imagePath";
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";

const AnnualSubscribe = ({ route }) => {
  const [image, setImage] = useState(null);
  const [vehicleInfo2, setVehicleInfo2] = useState(null);
  const [driverId, setDriverId] = useState(null);
  const { subscriptionType } = route.params;
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedDriverId = await AsyncStorage.getItem("driverId");
        if (storedDriverId) {
          setDriverId(storedDriverId);
          fetchUserData(storedDriverId);
        } else {
          Alert.alert("Error", "Driver ID not found. Please log in again.");
        }
      } catch (error) {
        console.error("Error fetching driver ID:", error);
        Alert.alert("Error", "Error fetching driver ID");
      }
    };

    const fetchUserData = async (id) => {
      try {
        const response = await axios.get(
          `https://melodious-conkies-9be892.netlify.app/.netlify/functions/api/driver/driver/${id}`
        );
        console.log('Fetched user data:', response.data);  // Log the full response

        // Ensure the data exists before setting the state
        if (response.data && response.data.vehicleInfo2) {
          setVehicleInfo2(response.data.vehicleInfo2);
        } else {
          console.error("vehicleInfo2 is undefined or null in the response.");
          Alert.alert("Error", "Invalid user data");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        Alert.alert("Error", "Error fetching user data");
      }
    };

    fetchUserId();
  }, []);

  useEffect(() => {
    if (vehicleInfo2) {
      console.log('Updated vehicleInfo2:', vehicleInfo2);
      console.log('Vehicle Type:', vehicleInfo2.vehicleType);
    }
  }, [vehicleInfo2]);

const uploadImage = async (image) => {
  if (image && image.uri) {
    console.log("Image selected, starting image upload...");
    
    const fileName = image.uri.split('/').pop();
    console.log("Extracted image file name:", fileName);
    
    const formData = new FormData();
    formData.append('file', {
      uri: image.uri,
      name: fileName,
      type: 'image/jpeg',
    });

    try {
      // Post the FormData to the server
      const fileResponse = await axios.post(
        "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/subs/upload",
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log("File upload response:", fileResponse.data);

      // Check if signedUrl exists in the response
      if (fileResponse.data && fileResponse.data.signedUrl) {
        console.log("Image signed URL successfully retrieved:", fileResponse.data.signedUrl);
        return fileResponse.data.signedUrl;  // Return the signed URL instead of image name
      } else {
        console.log("No signed URL returned from server.");
        Alert.alert("Error", "Image upload failed, cannot proceed with subscription.");
        return null;
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "There was an error uploading the image.");
      return null;
    }
  } else {
    console.log("No image selected, proceeding without an image...");
    return null;
  }
};

// Function to handle the subscription process
const handleSubscription = async () => {
  const vehicleType = vehicleInfo2 ? vehicleInfo2.vehicleType : null;

  // Log the vehicle type selection
  console.log("Selected vehicle type:", vehicleType);

  if (!vehicleType) {
    Alert.alert("Error", "Vehicle type is not available");
    return;
  }

  console.log("Starting subscription process...");

  try {
    let signedUrl = await uploadImage(image); 

    // If no signed URL is returned, proceed without the image
    if (!signedUrl) {
      console.log("Proceeding without image...");
    }

    const subscriptionData = {
      driverId,
      subscriptionType,
      vehicleType,
      receipt: signedUrl || null, // Set receipt as the signed URL or null if no image
    };

    console.log("Sending subscription data:", subscriptionData);

    // Step 2: Send subscription request
    const response = await axios.post(
      "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/subs/subscription",
      subscriptionData
    );

    console.log("Subscription response:", response.data);

    if (response.data.subscription) {
      console.log("Subscription created successfully:", response.data.subscription);
      navigation.navigate("Home");
      Alert.alert("Success", "Subscription created successfully");
    } else {
      Alert.alert("Error", "Failed to create subscription");
      console.log("Failed to create subscription.");
    }
  } catch (error) {
    console.error("Error creating subscription:", error);
    Alert.alert("Error", "There was an error creating the subscription.");
  }
};


const pickImage = async () => {
  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.3,
  });

  if (!result.cancelled) {
    // Set the full image object, not just the file name
    setImage(result.assets[0]);
  }

  // Log variables for debugging
  console.log("Driver ID:", driverId);
  console.log("Subscription Type:", subscriptionType);
  console.log("Vehicle Type:", vehicleInfo2 ? vehicleInfo2.vehicleType : "Loading...");
};


  return (
    <View style={{ backgroundColor: "white", flex: 1, padding: 40 }}>
      <View
        style={{
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "bold" }}>Scan the QR Code to pay</Text>
        <Text style={{ color: "gray" }}>Use your GCash app to scan and pay</Text>
        <Image
          source={imagePath.jeep4799}
          style={{
            height: 400,
            width: 300,
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 10
          }}
        />
      </View>
      <Text
        style={{
          color: "gray",
          textAlign: "center",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Open your GCash app and scan this QR code to make the payment
      </Text>

      <View style={{ flex: 1, paddingVertical: 20, justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontSize: 20, fontWeight: "bold" }}>Upload Payment Screenshot</Text>
          <TouchableOpacity
            onPress={pickImage}
            style={{
              backgroundColor: "gainsboro",
              padding: 10,
              borderRadius: 10,
              borderWidth: 2,
              borderStyle: "dashed",
              borderColor: "lightgray",
              marginTop: 10,
            }}
          >
            <Text style={{ textAlign: "center" }}>Click to upload</Text>
          </TouchableOpacity>
          {image && (
            <Image source={{ uri: image.uri }} style={{ width: 100, height: 50 }} />
          )}
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: "powderblue",
            padding: 10,
            borderRadius: 10,
          }}
          onPress={handleSubscription}
        >
          <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>Submit Payment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AnnualSubscribe;

const styles = StyleSheet.create({});
