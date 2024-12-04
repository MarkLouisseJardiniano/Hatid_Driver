import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const Contact = () => {
  const navigation = useNavigation();
  const [contacts, setContacts] = useState([]);
  const [driverId, setDriverId] = useState(null);

  // Fetch sample contacts
  const fetchSampleContacts = async () => {
    try {
      const response = await axios.get(
        "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/contact/sample"
      );
      console.log("Sample Contacts Response:", response.data);
      return response.data; // Return sample contacts
    } catch (error) {
      console.error("Error fetching sample contacts:", error);
      return []; // Return an empty array in case of error
    }
  };

  // Fetch driver-specific contacts
  const fetchDriverContacts = async () => {
    if (!driverId) return;
    try {
      const response = await axios.get(
        `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/contact/driver/${driverId}`
      );
      const fetchedContacts = response.data.length > 0 ? response.data : [];
      return fetchedContacts; // Return driver contacts
    } catch (err) {
      console.error("Error fetching driver contacts:", err);
      return []; // Return empty array in case of error
    }
  };

  const handleAdd = () => {
    navigation.navigate("AddContact");
  };

  useEffect(() => {
    const fetchDriverId = async () => {
      try {
        const storedDriverId = await AsyncStorage.getItem("driverId");
        if (storedDriverId) {
          setDriverId(storedDriverId);
        }
      } catch (err) {
        console.error("Error fetching driver ID:", err);
      }
    };

    fetchDriverId();
  }, []);

  // Fetch both contacts (driver and sample) and combine them
  useEffect(() => {
    const fetchAllContacts = async () => {
      if (driverId) {
        const [sampleContacts, driverContacts] = await Promise.all([
          fetchSampleContacts(),
          fetchDriverContacts(),
        ]);

        // Combine both sample and driver contacts
        setContacts([...sampleContacts, ...driverContacts]);
      }
    };

    fetchAllContacts();
  }, [driverId]);

  const renderContact = useCallback(
    ({ item }) => (
      <View style={styles.contactContainer}>
        <View style={styles.contactContent}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactPhone}>{item.number}</Text>
        </View>
      </View>
    ),
    []
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={contacts}
        keyExtractor={(item) => item._id || item.id || item.name} // Ensure unique key
        renderItem={renderContact}
        initialNumToRender={10}
        windowSize={5}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No contacts available</Text>
        }
      />

      <TouchableOpacity onPress={handleAdd} style={styles.button}>
        <Text style={styles.buttonText}>Add</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "white",
  },
  contactContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  contactContent: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  contactName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  contactPhone: {
    fontSize: 16,
    color: "#666",
  },
  button: {
    width: 250,
    height: 40,
    backgroundColor: "powderblue",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    marginTop: 20,
    alignSelf: "center",
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "700",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
  },
});

export default Contact;
