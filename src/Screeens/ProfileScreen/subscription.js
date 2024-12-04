import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity,Button, Alert, Linking, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from "@react-navigation/native";

const Subscription = () => {
  const navigation = useNavigation();
  const [selectedOption, setSelectedOption] = useState("");
  const [driverId, setDriverId] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [status, setStatus] = useState("");
  const [vehicleInfo2, setVehicleInfo2] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ price, setPrice] = useState('');
  const [ subscriptionType, setSubscriptionType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expiredDate, setExpiredDate] = useState("");
  const [image, setImage] = useState(null); 


  const checkSubscriptionStatus = async () => {
    try {
      // Retrieve the driver ID from AsyncStorage
      const driverId = await AsyncStorage.getItem("driverId");
      if (!driverId) {
        console.error("Driver ID not found");
        setLoading(false);
        return;
      }

      // Make the API call to check subscription status
      const res = await axios.get(
        `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/subs/subscription/status/${driverId}`
      );
      setIsSubscribed(res.data.subscribed);
    } catch (error) {
      console.error("Error checking subscription status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

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
          `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/driver/driver/${id}`
        );
        setVehicleInfo2(response.data.vehicleInfo2);
      } catch (error) {
        console.error("Error fetching user data:", error);
        Alert.alert("Error", "Error fetching user data");
      }
    };

    fetchUserId();
  }, []);

  
  const handleMonthlySubscribe = () => {
    setSubscriptionType("Monthly");
  
    console.log("Driver ID:", driverId);
    console.log("Subscription Type:", "Monthly");
  
    const vehicleType = vehicleInfo2.vehicleType;
  
    if (vehicleType === "Tricycle") {
      navigation.navigate("TricycleMonthlySubscribe", { subscriptionType: "Monthly", driverId });
    } else {
      navigation.navigate("MonthlySubscribe", { subscriptionType: "Monthly", driverId });
    }
  };
  
  // Function to handle Quarterly Subscription with navigation
  const handleQuarterlySubscribe = () => {
    setSubscriptionType("Quarterly");
  
    const vehicleType = vehicleInfo2.vehicleType ; 
  
    if (vehicleType === "Tricycle") {
      navigation.navigate("TricycleQuarterlySubscribe", { subscriptionType: "Quarterly", driverId });
    } else {
      navigation.navigate("QuarterlySubscribe", { subscriptionType: "Quarterly", driverId });
    }
  };
  
  const handleAnnuallySubscribe = () => {
    setSubscriptionType("Annually");
  
    const vehicleType = vehicleInfo2.vehicleType;
  
    if (vehicleType === "Tricycle") {
      navigation.navigate("TricycleAnnualSubscribe", { subscriptionType: "Annually", driverId });
    } else {
      navigation.navigate("AnnualSubscribe", { subscriptionType: "Annually", driverId });
    }
  };
  
  
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.cancelled) {
      setFile(result);
    }
  };

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await axios.get(
          `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/subs/subscription/${driverId}`
        );
        const subscriptionData = response.data;
        setSubscriptionType(subscriptionData.subscriptionType);
        setPrice(subscriptionData.price);
        setStatus(subscriptionData.status);
        setImage(subscriptionData.receipt)
        const formattedDate = new Date(subscriptionData.startDate).toLocaleDateString('en-PH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        setStartDate(formattedDate);
        const formattedEndDate = new Date(subscriptionData.endDate).toLocaleDateString('en-PH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        setEndDate(formattedEndDate);
      } catch (error) {
        console.error("Error fetching subscription:", error);
      }
    };

    fetchSubscription();
  }, [driverId]);

  useEffect(() => {
    const fetchEndDate = async () => {
      try {
        const response = await axios.get(
          `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/subs/subscription/end-date/${driverId}`
        );
        const subscriptionData = response.data.remainingTime;

        setExpiredDate(subscriptionData);
      } catch (error) {
        console.error("Error fetching subscription:", error);
      }
    };

    fetchEndDate();
  }, [driverId]);


  if (isSubscribed) {
    return (
      <>
      <View style={styles.subscriptionContainer}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            padding: 30,
          }}
        >
          <View style={{ flexDirection: "column" }}>
            <Text style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>
              Your subscription
            </Text>
            <Text style={{ color: "white", fontSize: 14 }}>
              Next Renewal in {expiredDate}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              backgroundColor: "white",
              padding: 10,
              alignItems: "center",
              borderRadius: 20,
            }}
          >
            <Text style={{ color: "black", fontSize: 16, fontWeight: "bold" }}>
              {status}
            </Text>
          </View>
        </View>
      </View>
      <View  style={{
              backgroundColor: "white",
              padding: 30,
    
            }}
          >
<Text>₱ {price}/{subscriptionType}</Text>

      </View>
      <View style={{  padding: 15,  }}>
  <View style={{  width: "100%",  padding: 15,backgroundColor: "white", gap: 20, borderRadius: 10   }}>
    <Text style={{ fontSize: 16, fontWeight: "bold"  }}>Subscription History</Text>
    <View >
      <View style={{ flexDirection: "row",paddingVertical: 10, justifyContent: "space-between" }}>
        <Text>Last Payment</Text>
        <Text>₱ {price}</Text>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text>Payment Date</Text>
        <Text>{startDate}</Text>
      </View>
      <View style={{ flexDirection: "row",paddingVertical: 10, justifyContent: "space-between" }}>
        <Text>Next Payment</Text>
        <Text>{endDate}</Text>
      </View>
      <View style={{ padding: 10, alignItems: "center", }}>
        <TouchableOpacity>
        <Text>
        View all transactions
        </Text>
        </TouchableOpacity>
       
      </View>
    </View>
  </View>
</View>

      </>
    );
  }
  return (
    <View style={styles.container}>
    <View style={{    height: "15%",
    width: "100%",
    backgroundColor: "powderblue",
    justifyContent: "center",
    padding: 20}}>
    <Text style={styles.title}>Choose Your Subscription</Text>
      {vehicleInfo2.vehicleType === "Tricycle" && (
        <Text style={styles.header}>For Tricycle</Text>
      )}
      {vehicleInfo2.vehicleType === "Jeep" && (
        <Text style={styles.header}>For Jeep</Text>
      )}
    </View>


    {vehicleInfo2.vehicleType === "Tricycle" && (
  <View style={styles.optionContainer}>
    <View style={styles.subsOption}>
      
      {/* Monthly Subscription */}
      <View style={styles.selection}>
        <Text style={styles.optionText}>1-Month Subscription</Text>
        <Text>₱399 / Monthly</Text>
        <TouchableOpacity
          style={styles.subscribeButton}
          onPress={handleMonthlySubscribe} 
        >
          <Text style={styles.subscribeButtonText}>Subscribe</Text>
        </TouchableOpacity>
      </View>

      {/* Quarterly Subscription */}
      <View style={styles.selection}>
        <Text style={styles.optionText}>Quarterly Subscription</Text>
        <Text>₱1299 / Quarterly</Text>
        <TouchableOpacity
          style={styles.subscribeButton}
          onPress={handleQuarterlySubscribe}
        >
          <Text style={styles.subscribeButtonText}>Subscribe</Text>
        </TouchableOpacity>
      </View>

      {/* Annual Subscription */}
      <View style={styles.selection}>
        <Text style={styles.optionText}>Annual Subscription</Text>
        <Text>₱4599 / Annually</Text>
        <TouchableOpacity
          style={styles.subscribeButton}
          onPress={handleAnnuallySubscribe}
        >
          <Text style={styles.subscribeButtonText}>Subscribe</Text>
        </TouchableOpacity>
      </View>

    </View>
  </View>
)}

{vehicleInfo2.vehicleType === "Jeep" && (
  <View style={styles.optionContainer}>
    <View style={styles.subsOption}>
      
      {/* Monthly Subscription */}
      <View style={styles.selection}>
        <Text style={styles.optionText}>1-Month Subscription</Text>
        <Text>₱499 / Monthly</Text>
        <TouchableOpacity
          style={styles.subscribeButton}
          onPress={handleMonthlySubscribe}
        >
          <Text style={styles.subscribeButtonText}>Subscribe</Text>
        </TouchableOpacity>
      </View>

      {/* Quarterly Subscription */}
      <View style={styles.selection}>
        <Text style={styles.optionText}>Quarterly Subscription</Text>
        <Text>₱1499 / Quarterly</Text>
        <TouchableOpacity
          style={styles.subscribeButton}
          onPress={handleQuarterlySubscribe} // Call handleSubscription with "Quarterly"
        >
          <Text style={styles.subscribeButtonText}>Subscribe</Text>
        </TouchableOpacity>
      </View>

      {/* Annual Subscription */}
      <View style={styles.selection}>
        <Text style={styles.optionText}>Annual Subscription</Text>
        <Text>₱4799 / Annually</Text>
        <TouchableOpacity
          style={styles.subscribeButton}
          onPress={handleAnnuallySubscribe}  // Call handleSubscription with "Annually"
        >
          <Text style={styles.subscribeButtonText}>Subscribe</Text>
        </TouchableOpacity>
      </View>


    </View>
  </View>
)}

    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    width: 200,
    height: 200,
    marginTop: 10,
    borderRadius: 10,
  },
  subscriptionContainer: {
    height: "15%",
    width: "100%",
    backgroundColor: "powderblue",
    justifyContent: "center",
  },
  container: {
    flexDirection: "column",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "white"
  },
  header: {
    fontWeight: "700",
    marginBottom: 10,
        color: "white",
        fontSize: 20,
    
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
  },
  optionContainer: {
    marginBottom: 15,
  },
  subsOption: {
    flexDirection: "column",
    padding: 10
  },
  selection: {
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 5 }, 
    shadowOpacity: 1, 
    borderTopColor: "lightgray", // change color to whatever you need
    borderTopWidth: 1, // adjust width as needed
    borderBottomColor: "lightgray", // change color to whatever you need
    borderBottomWidth: 1, 
    shadowRadius: 6,
    marginBottom: 10,
    borderLeftColor: "lightgray", // change color to whatever you need
    borderLeftWidth: 1, // adjust width as needed
    borderRightColor: "lightgray", // change color to whatever you need
    borderRightWidth: 1,
  },
  optionText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "transparent",
  },
  radioButtonCircleSelected: {
    backgroundColor: "#000",
  },
  subscribeButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "powderblue",
    borderRadius: 5,
    alignItems: "center",
  },
  subscribeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default Subscription;
