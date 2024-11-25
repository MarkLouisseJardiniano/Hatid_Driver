import axios from 'axios';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from "@react-navigation/native";

const Profile = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [rating, setRating] = useState(null);
  const [driverId, setDriverId] = useState('')


  const handleEdit = () => {
    navigation.navigate("EditProfile");
  };

  const handlePlaces = () => {
    navigation.navigate("SavedPlaces");
  };

  const handleContact = () => {
    navigation.navigate("Contact");
  };
  const handleSubscription = () => {
    navigation.navigate("Subscription");
  };

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.post('https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/driver/driverdata', { token });
      if (res.data.status === 'ok') {
        setUserData(res.data.data);
        setDriverId(res.data.data._id); 
      } else {
        console.error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };
  

  const fetchRating = async () => {
    try {
      if (!driverId) return;
  
      const res = await axios.get(`https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/rate/ratings/${driverId}`);
      
      console.log("API Response:", res.data); 
      if (res.data.status === 'ok') {
        const { averageRating } = res.data.data;
    
        console.log("Fetched Average Rating:", averageRating);
  
        const formattedRating = averageRating.toFixed(1);
  
        setRating(formattedRating);
      } else {
        console.error("Cannot find rating");
        setRating('0.0'); 
      }
    } catch (error) {

      setRating('0.0');
    }
  };
  
  
  useEffect(() => {
    console.log("Current driverId:", driverId);
    if (driverId) {
      fetchRating();
    }
    const intervalId = setInterval(fetchRating, 2000); 

    return () => clearInterval(intervalId);
  }, [driverId]);
  

  useEffect(() => {
    fetchData(); 

    const intervalId = setInterval(fetchData, 3000); 

    return () => clearInterval(intervalId);
  }, []);

  const HandleLogOut = async () => {
    await AsyncStorage.removeItem('token');
    navigation.navigate("Login"); 
  };
  

  return (
    <View style={styles.rowContainer}>
      <View style={styles.fullWidthBox}>
        <View style={styles.circle} />
        {userData ? (
          <View>
            <Text style={styles.userName}> {userData.name} <View style={styles.ratings}><Text style={styles.averageRating}>{rating !== null ? rating : 'Loading...'}</Text></View></Text>
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
        <TouchableOpacity onPress={handleContact}>
          <Text style={{ fontWeight: "700", fontSize: 20 }}>
            Emergency Contact
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSubscription}>
          <Text style={{ fontWeight: "700", fontSize: 20 }}>Subscription</Text>
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
  ratings: {
    backgroundColor: 'white',
  },
  averageRating: {
  }
});

export default Profile;
