import { StyleSheet, Text, View,Image, FlatList, ScrollView, ActivityIndicator, Modal } from "react-native";
import React, { useEffect, useState,useCallback } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import imagePath from "../../constants/imagePath";
import { TouchableOpacity } from "react-native";

const Activity = () => {
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [driverId, setDriverId] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);

  const openBookingDetails = (booking) => {
    console.log(booking);
    setBookingDetails(booking);
  };
  const closeBookingDetails = (booking) => {
    console.log(booking);
    setBookingDetails(null);
  };

  useEffect(() => {
    const fetchDriverId = async () => {
      try {
        const storedDriverId = await AsyncStorage.getItem('driverId');
        if (storedDriverId) {
          setDriverId(storedDriverId);
        } else {
          setError("Driver ID is not found.");
        }
      } catch (err) {
        console.error("Error fetching driver ID:", err);
        setError("Error fetching driver ID");
      }
    };

    fetchDriverId();
  }, []);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        if (!driverId) return;
        setLoading(true);
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          throw new Error("No token found");
        }
  
        console.log('Fetching activities for driverId:', driverId);
  
        const res = await axios.get(
          `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/activities/driver/${driverId}`,
          {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          }
        );
  
        console.log('API Response:', res);
  
        if (res.data && res.data.data) {
          const activityData = res.data.data;
  
          const sortedActivities = await Promise.all(
            activityData.map(async (activity) => {
              const pickupAddress = await getAddress(
                activity.pickupLocation.latitude,
                activity.pickupLocation.longitude
              );
              const destinationAddress = await getAddress(
                activity.destinationLocation.latitude,
                activity.destinationLocation.longitude
              );
  
              return {
                ...activity,
                pickupAddress,
                destinationAddress,
              };
            })
          );
          const sortedByDate = sortedActivities.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
  
          console.log('Sorted activities:', sortedActivities);
  
          setActivities(sortedByDate);
        } else {
          setError("No activities found.");
        }
      } catch (error) {
        console.error("Error fetching activity:", error);
        setError("Error fetching activities");
      } finally {
        setLoading(false); 
      }
    };
    
    fetchActivities();
  
    const intervalId = setInterval(() => {
      fetchActivities(); 
    }, 10000); 
    return () => clearInterval(intervalId);
  }, [driverId]);
  
  

  const getAddress = async (latitude, longitude) => {
    try {
      const reverseGeocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=pk.eyJ1IjoibWF3aTIxIiwiYSI6ImNseWd6ZGp3aTA1N2IyanM5Ymp4eTdvdzYifQ.0mYPMifHNHONTvY6mBbkvg`;
      const geoResponse = await axios.get(reverseGeocodeUrl);
      if (geoResponse.data.features.length > 0) {
        let barangay = '';
        let district = '';

        const addressComponents = geoResponse.data.features[0].context;

        addressComponents.forEach((component) => {
          if (component.id.includes('locality')) {
            barangay = component.text;
          } else if (component.id.includes('place')) {
            district = component.text;
          }
        });

        return `${barangay}, ${district}` || 'Address not found';
      }
      return 'Address not found';
    } catch (error) {
      console.error('Error fetching address:', error);
      return 'Address not found';
    }
  };

  const renderItem = useCallback(({ item }) => (
    <View style={styles.activityContainer}>
      <View style={styles.activityContent}>
        <View style={styles.activity}>
        {item.driver?.profilePic ? (
  <Image
    source={{ uri: item.driver.profilePic }}
    style={{ width: 60, height: 60, borderRadius: 30 }}
  />
) : (
  <Image
    source={imagePath.defaultPic}
    style={{ width: 60, height: 60, borderRadius: 30 }}
    resizeMode="contain"
  />
)}
          <View style={styles.driverData}>
            <Text style={{ fontSize: 16,  fontWeight: "bold",}}>{item.name}</Text>
          
          <View style={styles.rightSection}>
            <View style={styles.statusContainer}>
              <Text style={{color: "white"}}>{item.status}</Text>
            </View>
            <Text style={{ fontSize: 16, fontWeight: "bold",}}>Fare {item?.fare ? item.fare.toFixed(2) : '0.00'}</Text>
</View>
          </View>
        </View>
      </View>
      <View style={styles.locationContainer}>
  <View style={{ flexDirection: 'column', width: '70%' }}>
    <Text style={{ fontSize: 16 }}>Pickup: {item.pickupAddress}</Text>
    <Text style={{ fontSize: 16 }}>Destination: {item.destinationAddress}</Text>
  </View>
  <View style={{alignItems:"center", justifyContent: "center"}}>
    <TouchableOpacity onPress={() => openBookingDetails(item)}>
      <Text style={{ fontWeight: 'bold' }}>Details</Text>
    </TouchableOpacity>
  </View>
</View>

    </View>
  ), []);

  return (
    <View style={styles.container}>
          <FlatList
    data={activities}
    keyExtractor={(item) => item._id}
    renderItem={renderItem}
  />
   {bookingDetails && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={!!bookingDetails}
          onRequestClose={closeBookingDetails}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
            <Text style={styles.header}>Booking Details:</Text>
<Text >
  <Text style={styles.details}>Driver: </Text>
  {bookingDetails.name || "N/A"}
</Text>
<Text>
  <Text style={styles.details}>Pickup: </Text>
  {bookingDetails.pickupAddress}
</Text>
<Text>
  <Text style={styles.details}>Destination: </Text>
  {bookingDetails.destinationAddress}
</Text>

              {bookingDetails.ratings?.rating && (
                <Text>
                <Text style={styles.details}>Ratings:</Text>
                {bookingDetails.ratings.rating}
                </Text>

)}

{bookingDetails.report?.report && (
<Text>
<Text style={styles.details}>Report: </Text>
{bookingDetails.report.report}
</Text>

)}

{bookingDetails.cancellation?.reason && (
  <Text>
    <Text style={styles.details}>Cancellation Reason:</Text>
    {bookingDetails.cancellation.reason}
  </Text>

)}

{bookingDetails.paymentMethod && (
  <Text>
  <Text style={styles.details}>PaymentMethod: </Text>
  {bookingDetails.paymentMethod}
  </Text>

)}
<Text>
<Text style={styles.details}>Fare: </Text>
{bookingDetails.fare?.toFixed(2) || "0.00"}
</Text>
             
 
              {bookingDetails.receiptImage && (
                <View>
                  <Text style={styles.details}>Receipt Image:</Text>
                  <View style={{paddingVertical:10}}>
                  <Image 
    source={{ uri: bookingDetails.receiptImage }}
    style={{ width: "100%", height: 400, borderRadius: 30 }}
  />
                  </View> 
                </View>

)}
              <TouchableOpacity onPress={closeBookingDetails}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>

  );
};

export default Activity;

const styles = StyleSheet.create({
  modalBackground: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flex: 1,
    justifyContent: "center", // Center the modal vertically
    alignItems: "center", // Align modal to the right
  },
  modalContainer: {
    width: "90%",
    maxHeight: "100%",
    padding: 20,
    borderTopStartRadius: 10,
    borderTopEndRadius: 10,
    borderBottomStartRadius: 10,
    borderBottomEndRadius: 10,
    backgroundColor: "#f4f4f4",
  },
  details: {
    fontWeight: "bold",
    fontSize: 16,
      },
      closeButton: {
        alignSelf: "flex-end",
        backgroundColor: "powderblue",
        padding: 10,
        borderRadius: 10
          },
  container: {
    flex: 1,
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 40,
    backgroundColor: '#fff',
  },
  circle: {
    width: 60,
    height: 60,
    backgroundColor: "gray",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20
  },
  header: {
    fontWeight: '700',
    fontSize: 24,
    marginBottom: 20,
  },
  activityContainer: {
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
  activity: {
    flexDirection: 'row',
    width: '100%',
  },
  driverData: {
    flexDirection: 'row',
    justifyContent: "space-between",
    alignItems: 'center',
    width: '70%',
   

  },
  rightSection: {
    flexDirection: 'column',
    

  },
  activityContent: {
    marginBottom: 10,
  },
  statusContainer: {
    backgroundColor: 'black',
    paddingTop: 2,
    paddingBottom: 2,
    paddingRight: 10,
    paddingLeft: 10,
    borderRadius: 10
  },
  locationContainer: {
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-evenly"
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
});
