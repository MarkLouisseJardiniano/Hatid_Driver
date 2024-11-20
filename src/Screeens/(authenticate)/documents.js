import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, Alert, Image } from "react-native";
import axios from "axios";
import imagePath from "../../constants/imagePath";
import { TouchableOpacity } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Documents = ({ route, navigation }) => {
  // Extract email and name from route params
  const { email, name } = route.params;

  console.log("Received email:", email);
  console.log("Received name:", name);

  const sendEmail = async (email, name) => {
    try {
      const response = await axios.post('https://melodious-conkies-9be892.netlify.app/.netlify/functions/api/driver/send-email', {
        email: email,
        name: name,
      });

      // Check if the response is successful
      if (response.status === 200) {
 
        await AsyncStorage.multiRemove(['driver', 'vehicleInfo2']);

        navigation.navigate('Login');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      Alert.alert("Error", "Failed to send email.");
    }
  };


  return (
    <View style={{ flex: 1, backgroundColor: "white", padding: 40 }}>
      <View style={{ justifyContent: "center", alignItems: "center" }}>
        <Image
          source={imagePath.document}
          style={{
            height: 200,
            width: 200,
            paddingVertical: 150,
            justifyContent: "center",
            alignItems: "center",
          }}
        />

        <View style={{ fontSize: 16, marginBottom: 10, width: "100%" }}>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
            Document Submission
          </Text>
          <Text style={{
            fontSize: 16,
            marginBottom: 10,
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}>
            The following documents must be photocopied and submitted in person at the office:
          </Text>

          <View>
            <Text style={{
              fontSize: 16,
              marginBottom: 5,
              color: "black",
            }}>• Driver's License</Text>
            <Text style={{
              fontSize: 16,
              marginBottom: 5,
              color: "black",
            }}>• Vehicle Registration Documents (OR/CR)</Text>
            <Text style={{
              fontSize: 16,
              marginBottom: 5,
              color: "black",
            }}>• Proof of Vehicle Insurance</Text>
            <Text style={{
              fontSize: 16,
              marginBottom: 5,
              color: "black",
            }}>• Police Clearance</Text>
          </View>

          <Text style={{ paddingVertical: 20, color: "gray" }}>
            After submitting this form, You will receive an email with further instructions.
          </Text>
        </View>
      </View>

      {/* On Press, send email with the email and name parameters */}
      <TouchableOpacity onPress={() => sendEmail(email, name)}>
        <Text style={{
          backgroundColor: "powderblue",
          padding: 10,
          borderRadius: 10,
          width: "100%",
          textAlign: "center",
        }}>
          Confirm and Continue
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default Documents;
