import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const BookingItem = ({ item, expoPushToken, handleAccept }) => (

  
  <View style={styles.bookingItem}>
    {item && (
      <>
        {expoPushToken
          ? console.log("Expo Push Token:", expoPushToken.data)
          : console.log("Expo Push Token: Not available")}

        <Text style={styles.sharedBookingItemText}>{item.name}</Text>
        <Text style={styles.sharedBookingItemTextLight}>
          Pickup: {item.pickupAddress}
        </Text>
        <Text style={styles.sharedBookingItemTextLight}>
          Destination: {item.destinationAddress}
        </Text>
        <Text style={styles.sharedBookingItemTextLight}>
          Ride Type: {item.rideType || "Ride type not available"}
        </Text>
        <Text>
          Ride Action: {item.rideAction || "Ride action not available"}
        </Text>
        <TouchableOpacity
          style={styles.bookingButton}
          onPress={() => handleAccept(item._id)}
        >
          <Text style={{ color: "white" }}>Accept Booking</Text>
        </TouchableOpacity>
      </>
    )}
  </View>
);

const styles = StyleSheet.create({
  bookingItem: {
    padding: 10,
    paddingVertical: 15,
    paddingHorizontal: 40,
  },
  bookingButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  sharedBookingItemText: {
    fontSize: 16,
    fontWeight: "500",
  },
  sharedBookingItemTextLight: {
    color: "#8B8A86",
  },
});

export default BookingItem;
