import axios from 'axios';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from "@react-navigation/native";

const Profile = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);

  const HandleLogOut = () => {
    Alert.alert("Button Pressed", "You clicked the button!");
  };

  const handleEdit = () => {
    navigation.navigate("EditProfile");
  };

  const handlePlaces = () => {
    navigation.navigate("SavedPlaces");
  };

  const handleContact = () => {
    navigation.navigate("Contact");
  };

  // Function to fetch user data
  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.post('https://main--exquisite-dodol-f68b33.netlify.app/.netlify/functions/api/driver/driverdata', { token });
      if (res.data.status === 'ok') {
        setUserData(res.data.data);
      } else {
        console.error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Polling setup
  useEffect(() => {
    fetchData(); // Fetch data on component mount

    // Set up polling interval
    const intervalId = setInterval(fetchData, 3000); // Poll every 3 seconds

    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <View style={styles.rowContainer}>
      <View style={styles.fullWidthBox}>
        <View style={styles.circle} />
        {userData ? (
          <View>
            <Text style={styles.userName}> {userData.name}</Text>
          </View>
        ) : (
          <Text>Loading...</Text>
        )}
      </View>

      <View style={styles.myProfile}>
        <Text style={{ fontWeight: "700", fontSize: 24 }}>My Profile</Text>
      </View>
      <View style={styles.profileContents}>
        <TouchableOpacity onPress={handleEdit}>
          <Text style={{ fontWeight: "700", fontSize: 20 }}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePlaces}>
          <Text style={{ fontWeight: "700", fontSize: 20 }}>Saved Places</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleContact}>
          <Text style={{ fontWeight: "700", fontSize: 20 }}>
            Emergency Contact
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonPosition}>
        <TouchableOpacity onPress={HandleLogOut} style={styles.button}>
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: "column",
  },
  fullWidthBox: {
    height: 150,
    flexDirection: "row",
    backgroundColor: "powderblue",
    alignItems: "center",
    gap: 20,
  },
  header: {
    fontSize: 24,
    marginTop: 30,
    fontWeight: "700",
    fontFamily: "sans-serif",
  },
  userName: {
    marginTop: 30,
    fontWeight: '700',
    fontSize: 24,
  },
  circle: {
    width: 60,
    height: 60,
    backgroundColor: "gray",
    borderRadius: 50,
    marginLeft: 30,
    marginTop: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  myProfile: {
    marginLeft: 40,
    marginTop: 40,
  },
  profileContents: {
    gap: 20,
    marginLeft: 60,
    marginTop: 20,
  },
  buttonPosition: {
    marginTop: 400,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    width: 250,
    height: 40,
    backgroundColor: "powderblue",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "700",
  },
});

export default Profile;
