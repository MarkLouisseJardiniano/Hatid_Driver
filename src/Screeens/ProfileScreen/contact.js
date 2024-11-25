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

  const fetchContacts = async () => {
    if (!driverId) return;
    try {
      const response = await axios.get(
        `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/contact/driver/${driverId}`
      );
      const fetchedContacts = response.data.length > 0 ? response.data : [];
      setContacts(fetchedContacts);
    } catch (err) {
      console.error("Error fetching contacts:", err);
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
        console.error("Error fetching user ID:", err);
    
      }
    };

    fetchDriverId();
  }, []);

  useEffect(() => {
    if (driverId) {
      fetchContacts();

      const interval = setInterval(() => {
        fetchContacts();
      }, 300);

    
      return () => clearInterval(interval);
    }
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
        keyExtractor={(item) => item._id}
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
