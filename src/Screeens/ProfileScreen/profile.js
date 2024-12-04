import axios from 'axios';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert,Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from "@react-navigation/native";
import imagePath from '../../constants/imagePath';


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
    const intervalId = setInterval(fetchRating, 5000); 
    return () => clearInterval(intervalId);
  }, [driverId]);
  

  useEffect(() => {
    fetchData(); 

    const intervalId = setInterval(fetchData, 4000); 

    return () => clearInterval(intervalId);
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('KeepLoggedIn');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('driverId');
  
      console.log('Logged out successfully');
      navigation.navigate('LoginStack'); 
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Logout Failed', 'Failed to log out. Please try again.');
    }
  };


  return (
<View style={styles.rowContainer}>
  <View style={styles.fullWidthBox}>
    {userData && userData.profilePic ? (
      <Image
        source={{ uri: userData.profilePic }}
        style={styles.profileImage}
        resizeMode="cover"
      />
    ) : (
      <Image
        source={imagePath.defaultPic}
        style={styles.defaultImage}
        resizeMode="contain"
      />
    )}
    {userData ? (
      <View style={{ flexDirection: "row", justifyContent: "space-between", width: "70%" }}>
        <View>
          <Text style={styles.userName}>{userData.name}</Text>
          <View style={{ flexDirection: "row", gap: 20 }}>
            <Text>{userData.vehicleInfo2.vehicleType}</Text>
            <Text>{userData.vehicleInfo2.plateNumber}</Text>
          </View>
        </View>
        <View>
          <View style={styles.ratings}>
            <Image
              source={imagePath.star}
              style={{
                height: 20,
                width: 20,
              }}
            />
            <Text style={styles.averageRating}>
              {rating !== null ? rating : 'Loading...'}
            </Text>
          </View>
        </View>
      </View>
    ) : (
      <Text>Loading...</Text>
    )}
  </View>

  <View style={styles.myProfile}>
    <Text style={{ fontWeight: "700", fontSize: 24 }}>My Profile</Text>
  </View>

  <View style={styles.profileContents}>
    <TouchableOpacity style={styles.divider} onPress={handleEdit}>
      <Text style={styles.dividerText}>Edit Profile</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.divider} onPress={handleContact}>
      <Text style={styles.dividerText}>Emergency Contact</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.divider} onPress={handleSubscription}>
      <Text style={styles.dividerText}>Subscription</Text>
    </TouchableOpacity>
  </View>


  <View style={{ flex: 1 }} /> 
  <View style={styles.buttonPosition}>
    <TouchableOpacity onPress={handleLogout} style={styles.button}>
      <Text style={styles.buttonText}>Log Out</Text>
    </TouchableOpacity>
  </View>
</View>

  );
};

const styles = StyleSheet.create({
  profileImage: {
    height: 80,
    width: 80,
    borderRadius: 50,
    
  },
  defaultImage: {
    height: 100,
    width: 100,
    borderRadius: 50,
    borderWidth: 0.2,
    borderColor: 'lightgray',
  },
  rowContainer: {
    flex: 1,
    backgroundColor: 'white', 
  },
  fullWidthBox: {
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: "row",
    backgroundColor: "lightblue",
    alignItems: "center",
    gap: 20,
    paddingHorizontal: 40,
  },
  userName: {
    fontWeight: '700',
    flexDirection: "column",
    fontSize: 20,
  },
  myProfile: {
    paddingTop:40,
    paddingLeft: 40
      },
      dividerText: {
        fontSize: 16,
        marginLeft: 60,
      },
      divider: {
        borderBottomColor: '#f3f3f3',
        borderBottomWidth: 1, 
        padding: 15,
      },
  profileContents: {
  },
  buttonPosition: {
   paddingBottom: 40,
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
    flexDirection: "row",
    padding:10,
    borderRadius: 30
  },
  averageRating: {
    fontSize: 16,
    fontWeight: "bold",
  }
});

export default Profile;
