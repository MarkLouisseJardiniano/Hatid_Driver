import React, { useState, useEffect } from "react";
import { View, Text,StyleSheet, TextInput, Button, Alert, Image } from "react-native";
import axios from "axios";
import imagePath from "../../constants/imagePath";
import { TouchableOpacity } from "react-native-gesture-handler";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from "@react-navigation/native";

const Cancelled = ({route}) => {
   const {
    reason,
    bookingId, 
    user,
    date,
  } = route.params;
    const navigation = useNavigation();

    const handleHome = async (canceledBookingId) => {
      try {

        await AsyncStorage.removeItem("bookingId");

        navigation.navigate("Home", {
          resetStates: true,
          canceledBookingId: canceledBookingId, // Pass the canceled booking's ID
        });
      } catch (error) {
        console.error("Error resetting booking and navigating home:", error);
      }
    };
   

  return (
    <View style={{flex:1,backgroundColor: "white",  justifyContent: "center"}}>
    <View style={{alignItems: "center", padding: 20, justifyContent: "center"}}>
    <View style={{paddingVertical: 20}}>
    <Image
          source={imagePath.xcircle}
          style={{
            height: 100,
            width: 100,
            justifyContent: "center",
            alignItems: "center",
          }} 
        />
    </View>
        <Text style={{fontWeight: "bold", fontSize: 24, color: "red"}}>Booking Cancelled</Text>
        <Text style={{textAlign: "center", fontSize: 16}}>Your booking has been cancelled. We're sorry for any inconvenience this may have caused.
</Text>
<View style={{    display: "flex",
    flexDirection: "row",
    borderBottomColor: "lightgray",
    borderBottomWidth: 1,
    padding: 15,
    width: "100%",}}></View>
    </View>

    <View style={{padding: 20}}>
        <View style={{flexDirection: "row", justifyContent: "space-between"}}>
            <Text style={{fontSize: 16, fontWeight: "bold"}}>Booking Id:</Text>
            <Text style={{fontSize: 16, fontWeight: "bold"}}>{bookingId|| 'null'}</Text>
        </View>
        <View style={{flexDirection: "row", justifyContent: "space-between"}}>
        <Text style={{fontSize: 16, fontWeight: "bold"}}>Cancelled Date:</Text>
        <Text style={{ fontSize: 16, fontWeight: "bold" }}>
  {date ? new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "null"}
</Text>

        </View>
        <View style={{flexDirection: "row", justifyContent: "space-between"}}>
        <Text style={{fontSize: 16, fontWeight: "bold"}}>Reason</Text>
        <Text style={{fontSize: 16, fontWeight: "bold"}}>{reason|| 'null'}</Text>
        </View>
    </View>
<View style={{padding: 20, flexDirection: "column", gap: 10}}>
    <TouchableOpacity onPress={handleHome} style={{backgroundColor: "black" , padding: 15,    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",}}>
        <Text style={{ color:"white"}}>Return to Home</Text>
    </TouchableOpacity>

</View>

    </View>
  )
}

export default Cancelled

const styles = StyleSheet.create({})