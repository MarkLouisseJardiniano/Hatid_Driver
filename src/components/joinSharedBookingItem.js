
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const JoinSharedBookingItem = ({ item, expoPushToken, handleAcceptJoinRequest }) => (
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
        <Text>{item.status || "Status not available"}</Text>
        <TouchableOpacity
          style={styles.bookingButton}
          onPress={() => handleAcceptJoinRequest(item._id)}
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
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sharedBookingItemText: {
    fontSize: 16,
    fontWeight: "500",
  },
  sharedBookingItemTextLight: {
    color: "#8B8A86",
    fontSize: 14,
  },
  bookingButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
    alignItems: "center",
  },
});

export default JoinSharedBookingItem;
