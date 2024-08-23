import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import MapView, { Marker, AnimatedRegion } from "react-native-maps";
import { GOOGLE_MAP_KEY } from "../../constants/googleMapKey";
import imagePath from "../../constants/imagePath";
import MapViewDirections from "react-native-maps-directions";
import Loader from "../../components/Loader";
import {
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
  LocationAccuracy,
} from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Image } from 'expo-image';
import { FlatList } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";

const screen = Dimensions.get("window");
const ASPECT_RATIO = screen.width / screen.height;
const LATITUDE_DELTA = 0.04;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const Home = ({ route }) => {
  const mapRef = useRef();
  const markerRef = useRef();
  const navigation = useNavigation();
  const [online, setOnline] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [acceptedBooking, setAcceptedBooking] = useState(null);
  const [driverId, setDriverId] = useState(null);
  const [tripStarted, setTripStarted] = useState(false);
  const [tripCompleted, setTripCompleted] = useState(false);

  const [state, setState] = useState({
    curLoc: {
      latitude: 13.3646,
      longitude: 121.9136,
    },
    destinationCords: {},
    isLoading: false,
    coordinate: new AnimatedRegion({
      latitude: 30.7046,
      longitude: 77.1025,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    }),
    time: 0,
    distance: 0,
    heading: 0,
    showVehicleOptions: false,
    selectedVehicleType: "",
  });

  const {
    curLoc,
    time,
    distance,
    destinationCords,
    isLoading,
    coordinate,
    heading,
  } = state;

  const updateState = (data) => setState((state) => ({ ...state, ...data }));

  useEffect(() => {
    getLiveLocation();
  }, []);

  useEffect(() => {
    if (route.params?.destinationCords) {
      updateState({
        destinationCords: route.params.destinationCords,
        showVehicleOptions: true,
      });
    }
  }, [route.params?.destinationCords]);

  const getLiveLocation = async () => {
    try {
      const { status } = await requestForegroundPermissionsAsync();
      if (status !== "granted") {
        updateState({
          errorMessage: "Permission to access location was denied",
        });
        return;
      }
      const location = await getCurrentPositionAsync({
        accuracy: LocationAccuracy.High,
      });
      const { latitude, longitude, heading } = location.coords;

      animate(latitude, longitude);

      updateState({
        heading: heading,
        curLoc: { latitude, longitude },
        coordinate: new AnimatedRegion({
          latitude: latitude,
          longitude: longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }),
      });
    } catch (error) {
      updateState({
        errorMessage: error.message,
      });
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      getLiveLocation();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const animate = (latitude, longitude) => {
    const newCoordinate = { latitude, longitude };
    if (Platform.OS === "android") {
      if (markerRef.current) {
        markerRef.current.animateMarkerToCoordinate(newCoordinate, 700);
      }
    } else {
      coordinate.timing(newCoordinate).start();
    }
  };

  const onCenter = () => {
    mapRef.current.animateToRegion({
      latitude: curLoc.latitude,
      longitude: curLoc.longitude,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    });
  };

  const fetchTime = (d, t) => {
    updateState({
      distance: d,
      time: t,
    });
  };

  useEffect(() => {
    const fetchAvailableBookings = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          throw new Error("No token found");
        }

        const res = await axios.get(
          "https://main--exquisite-dodol-f68b33.netlify.app/.netlify/functions/api/ride/available",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.data.status === "ok") {
          const bookingsData = res.data.data;

          // Set the first bookingId to AsyncStorage if there are bookings available
          if (bookingsData.length > 0) {
            await AsyncStorage.setItem("bookingId", bookingsData[0]._id);
            console.log("Booking ID set:", bookingsData[0]._id);
          }

          setBookings(bookingsData);
          console.log("Available bookings:", bookingsData);
        } else {
          console.error("Error fetching bookings:", res.data.message);
        }
      } catch (error) {
        console.error("Error fetching available bookings:", error);
      }
    };

    

    if (online) {
      fetchAvailableBookings();
      // Poll every 0.3 seconds
      const intervalId = setInterval(fetchAvailableBookings, 300);

      // Clear interval
      return () => clearInterval(intervalId);
    }
  }, [online]);

  useEffect(() => {
    const fetchDriverIdAndCheckSubscription = async () => {
      try {
        const storedDriverId = await AsyncStorage.getItem('driverId');
        if (storedDriverId) {
          setDriverId(storedDriverId);
          await checkSubscriptionStatus(storedDriverId);
        } else {
          setError('Driver ID not found.');
        }
      } catch (err) {
        console.error('Error fetching driver ID:', err);
        setError('Error fetching driver ID.');
      }
    };

    fetchDriverIdAndCheckSubscription();
  }, []);

  const checkSubscriptionStatus = async (id) => {
    try {
      const response = await axios.get(`https://main--exquisite-dodol-f68b33.netlify.app/.netlify/functions/api/subs/subscription/status/${id}`);
      setSubscribed(response.data.subscribed);
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setError('Error checking subscription status.');
    }
  };

  const toggleOnlineStatus = () => {
    if (subscribed) {
      setOnline(!online);
    } else {
      setError('You need an active subscription to go online.');
    }
  };

  const handleAccept = async (bookingId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const driverId = await AsyncStorage.getItem("driverId");
      if (!token || !driverId || !bookingId) {
        throw new Error("Missing token, driverId, or bookingId");
      }

      const acceptBooking = {
        driverId,
        bookingId,
      };

      const res = await axios.post(
        "https://main--exquisite-dodol-f68b33.netlify.app/.netlify/functions/api/ride/accept",
        acceptBooking,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data.status === "ok") {
        const acceptedBooking = bookings.find(
          (booking) => booking._id === bookingId
        );
        setAcceptedBooking(acceptedBooking);
        setBookings((prevBookings) =>
          prevBookings.filter((booking) => booking._id !== bookingId)
        );
        console.log("Booking accepted successfully");
      } else {
        console.error("Failed to accept booking:", res.data.message);
      }
    } catch (error) {
      console.error("Error accepting booking:", error.message);
    }
  };

  const handleStartTrip = async () => {
    if (!acceptedBooking) return;

    // Start the trip
    setTripStarted(true);
    console.log("Trip started");
  };

  const handleEndTrip = async () => {
    if (!acceptedBooking) return;

    // End the trip
    setTripStarted(false);
    setTripCompleted(true); 
    console.log("Trip ended");
  };



  const handleCompleteBooking = async () => {
    if (!acceptedBooking) return;

    // Complete the booking
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const res = await axios.post(
        "https://main--exquisite-dodol-f68b33.netlify.app/.netlify/functions/api/ride/complete",
        { bookingId: acceptedBooking._id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data.status === "ok") {
        console.log("Booking completed successfully");
        setAcceptedBooking(null); // Clear the accepted booking
        setTripCompleted(false); // Reset the trip completed status
      } else {
        console.error("Failed to complete booking:", res.data.message);
      }
    } catch (error) {
      console.error("Error completing booking:", error.message);
    }
  };

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookingItem}>
      <Text>{item.name}</Text>
      <Text>
        Pickup: {item.pickupLocation.latitude}, {item.pickupLocation.longitude}
      </Text>
      <Text>
        Destination: {item.destinationLocation.latitude},{" "}
        {item.destinationLocation.longitude}
      </Text>
      <Text>Vehicle: {item.vehicleType}</Text>
      <TouchableOpacity
        style={styles.bookingButton}
        onPress={() => handleAccept(item._id)}
      >
        <Text>Accept Booking</Text>
      </TouchableOpacity>
    </View>
  );
  const renderAcceptedBookingItem = () => (
    <View style={styles.bookingItem}>
      <Text>{acceptedBooking.name}</Text>

      <TouchableOpacity>
    <Image
        style={styles.image}
        source={imagePath.message}
      />
    </TouchableOpacity>
    <TouchableOpacity>
    <Image
        style={styles.image}
        source={imagePath.call}
      />
    </TouchableOpacity>
      <Text>
        Pickup: {acceptedBooking.pickupLocation.latitude},{" "}
        {acceptedBooking.pickupLocation.longitude}
      </Text>
      <Text>
        Destination: {acceptedBooking.destinationLocation.latitude},{" "}
        {acceptedBooking.destinationLocation.longitude}
      </Text>
      <Text>Vehicle: {acceptedBooking.vehicleType}</Text>

      {!tripStarted && !tripCompleted && (
        <TouchableOpacity
          style={styles.bookingButton}
          onPress={handleStartTrip}
        >
          <Text>Start Trip</Text>
        </TouchableOpacity>
      )}

      {tripStarted && !tripCompleted && (
        <TouchableOpacity style={styles.bookingButton} onPress={handleEndTrip}>
          <Text>End Trip</Text>
        </TouchableOpacity>
      )}

      {tripCompleted && (
        <TouchableOpacity
          style={styles.bookingButton}
          onPress={handleCompleteBooking}
        >
          <Text>Complete Booking</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Loader isLoading={isLoading} />
      <View style={styles.topContainer}>
      <TouchableOpacity
        style={[
          styles.onlineOfflineButton,
          { backgroundColor: online ? 'green' : 'red' },
          !subscribed && styles.buttonDisabled,
        ]}
        onPress={toggleOnlineStatus}
        disabled={!subscribed}
      >
        <Text style={styles.onlineOfflineButtonText}>
          {online ? 'Go Offline' : 'Go Online'}
        </Text>
      </TouchableOpacity>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          ...curLoc,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }}
      >
        <Marker.Animated
          ref={markerRef}
          coordinate={coordinate}
          image={imagePath.icBike}
        />
        {Object.keys(destinationCords).length > 0 && (
          <Marker
            coordinate={destinationCords}
            image={imagePath.icGreenMarker}
          />
        )}
        {Object.keys(destinationCords).length > 0 && (
          <MapViewDirections
            origin={curLoc}
            destination={destinationCords}
            apikey={GOOGLE_MAP_KEY}
            strokeWidth={6}
            strokeColor="red"
            optimizeWaypoints={true}
            onReady={(result) => {
              fetchTime(result.distance, result.duration);
              mapRef.current.fitToCoordinates(result.coordinates, {
                edgePadding: {
                  right: 30,
                  bottom: 300,
                  left: 30,
                  top: 100,
                },
              });
            }}
          />
        )}
      </MapView>
      <TouchableOpacity style={styles.centerButton} onPress={onCenter}>
          <Image source={imagePath.greenIndicator} />
        </TouchableOpacity>
      <View style={styles.bottomCard}>

      </View>

      {acceptedBooking
        ? renderAcceptedBookingItem()
        : online && (
            <FlatList
              data={bookings}
              renderItem={renderBookingItem}
              keyExtractor={(item) => item._id.toString()}
              contentContainerStyle={styles.bookingList}
            />
          )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  bottomCard: {
    backgroundColor: "#fff",
    width: "100%",
    padding: 30,
    borderTopEndRadius: 24,
    borderTopStartRadius: 24,
  },
  bookingList: {
    backgroundColor: "#fff",
    borderTopEndRadius: 24,
    borderTopStartRadius: 24,
  },
  bookingItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  bookingButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  topContainer: {
    position: "absolute",
    top: 100,
    left: 10,
    zIndex: 1,
  },
  onlineOfflineButton: {
    padding: 10,
    borderRadius: 5,
    top: 400,
    left: 160
  },
  onlineOfflineButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  centerButton: {
    marginTop: 10,
    alignItems: "center",
    position:'absolute',
    top: 300
  },
image: {
  width: 30,
  height: 30,
},
  
});

export default Home;
