{
  "userId": " 66baf2167a125a92e9602477",  
  "pickupLocation": {
   "latitude": 13.4461074, "longitude": 121.8484329 //tampus
  },
  "destinationLocation": {
    "latitude": 13.2873294, "longitude": 122.0070217 //malibago
  },
  "vehicleType": "Jeep",
  "rideType": "Shared Ride",
  "fare": 150.00
}


{
  "userId": "6686134eafc8ad8258c057c3",  
"pickupLocation": {
   "latitude":  13.443627, "longitude": 121.843451 
  },
  "destinationLocation": {
    "latitude": 13.502353, "longitude": 121.856505  
  },

  "vehicleType": "Jeep",
  "rideType": "Shared Ride",
  "fare": 180.00
}





isok 1
"pickupLocation": {
   "latitude":  13.443627, "longitude": 121.843451 
  },
balanacan
  "destinationLocation": {
    "latitude": 13.502353, "longitude": 121.856505  
  },




import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import Icon from 'react-native-vector-icons/FontAwesome';
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
import { Image } from "expo-image";
import { FlatList } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import Geocoder from 'react-native-geocoding';
Geocoder.init(GOOGLE_MAP_KEY);
const screen = Dimensions.get("window");
const ASPECT_RATIO = screen.width / screen.height;
const LATITUDE_DELTA = 0.04;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const Home = ({ route   }) => {
  const mapRef = useRef();
  const markerRef = useRef();
  const navigation = useNavigation();
  const [online, setOnline] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [acceptedSpecialBooking, setAcceptedSpecialBooking] = useState(null);
  const [acceptedSharedBooking, setAcceptedSharedBooking] = useState([]);
  const [driverId, setDriverId] = useState(null);
  const [tripStarted, setTripStarted] = useState(false);
  const [tripCompleted, setTripCompleted] = useState(false);
  const [selectedVehicleType, setSelectedVehicleType] = useState(null);
  const [selectedRideType, setSelectedRideType] = useState(null);
  const [commuterLocation, setCommuterLocation] = useState(null);
  const [destinationCords, setDestinationCords] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [pickupAddress, setPickupAddress] = useState('Fetching pickup address...');
  const [destinationAddress, setDestinationAddress] = useState('Fetching destination address...');
  const [selectedCommuter, setSelectedCommuter] = useState(null);

  const openModal = () => setIsModalVisible(true);
  const closeModal = () => setIsModalVisible(false);

  const openDetailsModal = (commuter) => {
    setSelectedCommuter(commuter);
    setIsDetailsModalVisible(true);
  };
  
  const closeDetailsModal = () => setIsDetailsModalVisible(false);

  const [state, setState] = useState({
    curLoc: {
      latitude: 13.3646,
      longitude: 121.9136,
    },
    isLoading: false,
    coordinate: new AnimatedRegion({
      latitude: 30.7046,
      longitude: 77.1025,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    }),
    time: 0,
    distance: 0,
    showVehicleOptions: false,
    selectedVehicleType: "",
    selectedRideType: "",
  });

  const { curLoc, time, distance, isLoading, coordinate } = state;

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
        return null; // Return null if location permission is denied
      }

      const location = await getCurrentPositionAsync({
        accuracy: LocationAccuracy.High,
      });
      const { latitude, longitude } = location.coords;

      // Update the state with the current location
      const curLoc = { latitude, longitude };
      updateState({
        curLoc,
        coordinate: new AnimatedRegion({
          latitude: latitude,
          longitude: longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }),
      });

      return curLoc; // Return the current location
    } catch (error) {
      updateState({
        errorMessage: error.message,
      });
      return null;
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
  
        if (!driverId) {
          throw new Error("No driver ID provided");
        }
  
        const res = await axios.get(
          "https://main--exquisite-dodol-f68b33.netlify.app/.netlify/functions/api/ride/available",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              driverId: driverId,
              vehicleType: selectedVehicleType,
            },
          }
        );
  
        if (res.data.status === "ok") {
          let bookingsData = res.data.data;
  
          // Filtering by selectedVehicleType if it is provided
          if (selectedVehicleType) {
            bookingsData = bookingsData.filter(
              (booking) => booking.vehicleType === selectedVehicleType
            );
          }
  
          // Save the first bookingId if available
          if (bookingsData.length > 0) {
            await AsyncStorage.setItem("bookingId", bookingsData[0]._id);
            console.log("Booking ID set:", bookingsData[0]._id);
  
            // Reverse geocoding function
            const getAddress = async (latitude, longitude) => {
              const reverseGeocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=pk.eyJ1IjoibWF3aTIxIiwiYSI6ImNseWd6ZGp3aTA1N2IyanM5Ymp4eTdvdzYifQ.0mYPMifHNHONTvY6mBbkvg`;
              const geoResponse = await axios.get(reverseGeocodeUrl);
              if (geoResponse.data.features.length > 0) {
                let barangay = '';
                let district = '';
                
                const addressComponents = geoResponse.data.features[0].context;
                
                addressComponents.forEach(component => {
                  if (component.id.includes('locality')) {
                    barangay = component.text;  // Get the barangay
                  } else if (component.id.includes('place')) {
                    district = component.text;  // Get the district
                  }
                });
  
                return `${barangay}, ${district}` || 'Address not found';
              }
              return 'Address not found';
            };
  
        
            const bookingsWithAddresses = await Promise.all(bookingsData.map(async (booking) => {
              const pickupAddress = await getAddress(
                booking.pickupLocation.latitude,
                booking.pickupLocation.longitude
              );
              const destinationAddress = await getAddress(
                booking.destinationLocation.latitude,
                booking.destinationLocation.longitude
              );
  
              return {
                ...booking,
                pickupAddress,
                destinationAddress,
              };
            }));
  
            // Update the state with bookings including addresses
            setBookings(bookingsWithAddresses);
            console.log("Available bookings with addresses:", bookingsWithAddresses);
          }
        } else {
          console.error("Error fetching bookings:", res.data.message);
        }
      } catch (error) {
        console.error("Error fetching available bookings:", error);
      }
    };
  
    if (online && driverId) {
      fetchAvailableBookings();
      const intervalId = setInterval(fetchAvailableBookings, 300); // Interval of 30 seconds
      return () => clearInterval(intervalId);
    }
  }, [online, driverId, selectedVehicleType]);
  
  
  

  //fetching driverId for checking subs
  useEffect(() => {
    const fetchDriverIdAndCheckSubscription = async () => {
      try {
        const storedDriverId = await AsyncStorage.getItem("driverId");
        if (storedDriverId) {
          setDriverId(storedDriverId);
          await checkSubscriptionStatus(storedDriverId);
        } else {
          setError("Driver ID not found.");
        }
      } catch (err) {
        console.error("Error fetching driver ID:", err);
        setError("Error fetching driver ID.");
        2;
      }
    };
    fetchDriverIdAndCheckSubscription();
  }, []);

  const checkSubscriptionStatus = async (driverId) => {
    try {
      const response = await axios.get(
        `https://main--exquisite-dodol-f68b33.netlify.app/.netlify/functions/api/subs/subscription/status/${driverId}`
      );
      setSubscribed(response.data.subscribed);
    } catch (error) {
      console.error("Error checking subscription status:", error);
      setError("Error checking subscription status.");
    }
  };

  const toggleOnlineStatus = () => {
    if (subscribed) {
      setOnline(!online);
    } else {
      setError("You need an active subscription to go online.");
    }
  };

  const handleAccept = async (bookingId) => {
    try {
      // Retrieve the token, driverId, and current location
      const token = await AsyncStorage.getItem("token");
      const driverId = await AsyncStorage.getItem("driverId");
      const curLoc = await getLiveLocation();
  
      if (!token || !driverId || !bookingId || !curLoc) {
        throw new Error("Missing token, driverId, bookingId, or current location");
      }
  
      // Prepare the data for the request
      const acceptBooking = {
        bookingId,
        driverId,
        latitude: curLoc.latitude,
        longitude: curLoc.longitude,
      };
  
      // Make the POST request to accept the booking
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
        const newAcceptedBooking = res.data.data.acceptedBooking;
  
        // Reverse geocoding for pickup and destination locations
        const getAddress = async (latitude, longitude) => {
          const reverseGeocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=pk.eyJ1IjoibWF3aTIxIiwiYSI6ImNseWd6ZGp3aTA1N2IyanM5Ymp4eTdvdzYifQ.0mYPMifHNHONTvY6mBbkvg`;
          const geoResponse = await axios.get(reverseGeocodeUrl);
          if (geoResponse.data.features.length > 0) {
            let barangay = '';
            let district = '';
  
            const addressComponents = geoResponse.data.features[0].context;
  
            addressComponents.forEach(component => {
              if (component.id.includes('locality')) {
                barangay = component.text;  // Get the barangay
              } else if (component.id.includes('place')) {
                district = component.text;  // Get the district
              }
            });
  
            return `${barangay}, ${district}` || 'Address not found';
          }
          return 'Address not found';
        };
  
        const pickupAddress = await getAddress(newAcceptedBooking.pickupLocation.latitude, newAcceptedBooking.pickupLocation.longitude);
        const destinationAddress = await getAddress(newAcceptedBooking.destinationLocation.latitude, newAcceptedBooking.destinationLocation.longitude);
  
        newAcceptedBooking.pickupAddress = pickupAddress;
        newAcceptedBooking.destinationAddress = destinationAddress;
  
        if (newAcceptedBooking.rideType === "Shared Ride") {

          setAcceptedSharedBooking(prevBookings => [...prevBookings, newAcceptedBooking]);
        } else if (newAcceptedBooking.rideType === "Special") {
      
          setAcceptedSpecialBooking(newAcceptedBooking);
        }

        setCommuterLocation(newAcceptedBooking.pickupLocation);
        setDestinationCords(newAcceptedBooking.destinationLocation);


        console.log("Booking accepted successfully:", newAcceptedBooking);
      } else {
        console.error("Failed to accept booking:", res.data.message);
      }
    } catch (error) {
      console.error("Error accepting booking:", error.message);
    }
  };
  
  
  const handleStartTrip = async () => {
    if (!acceptedSpecialBooking && acceptedSharedBooking.length === 0) return;
  
    // Start the trip
    setTripStarted(true);
    console.log("Trip started");
  };
  
  const handleEndTrip = async () => {
    if (!acceptedSpecialBooking && acceptedSharedBooking.length === 0) return;
  
    // End the trip
    setTripStarted(false);
    setTripCompleted(true);
    console.log("Trip ended");
  };
  
  const handleCompleteBooking = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("No token found");
  
      let bookingId;
      if (acceptedSpecialBooking) {
        bookingId = acceptedSpecialBooking._id;
      } else if (acceptedSharedBooking.length > 0) {
       
        bookingId = acceptedSharedBooking[0]._id;
      }
  
      if (!bookingId) throw new Error("No booking found");
  
      const res = await axios.post(
        "https://main--exquisite-dodol-f68b33.netlify.app/.netlify/functions/api/ride/complete",
        { bookingId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      if (res.data.status === "ok") {
        console.log("Booking completed successfully");
        // Clear the booking states
        setAcceptedSpecialBooking(null);
        setAcceptedSharedBooking([]);
        setTripCompleted(false);
        setDestinationCords(null);
        setCommuterLocation(null);
      } else {
        console.error("Failed to complete booking:", res.data.message);
      }
    } catch (error) {
      console.error("Error completing booking:", error.message);
    }
  };
  

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookingItem}>
      {item && (
        <>
          <Text style={styles.sharedBookingItemText}>{item.name}</Text>
          <Text style={styles.sharedBookingItemTextLight} >Pickup: {item.pickupAddress}</Text>
          <Text style={styles.sharedBookingItemTextLight}>Destination: {item.destinationAddress}</Text>
          <Text style={styles.sharedBookingItemTextLight}>Ride Type: {item.rideType || 'Ride type not available'}</Text>
          <TouchableOpacity
            style={styles.bookingButton}
            onPress={() => handleAccept(item._id)}
          >
            <Text style={{ color: 'white' }}>Accept Booking</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
  // Function to render details for Special Ride
  const renderSpecialBookingItem = () => (
    <View style={styles.bookingItem}>
      {acceptedSpecialBooking && (
        <>
          <Text>{acceptedSpecialBooking.name}</Text>
  
          <TouchableOpacity>
            <Image style={styles.image} source={imagePath.message} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Image style={styles.image} source={imagePath.call} />
          </TouchableOpacity>
          <Text>Pickup: {acceptedSpecialBooking.pickupAddress}</Text>
          <Text>Destination: {acceptedSpecialBooking.destinationAddress}</Text>
          <Text>Vehicle: {acceptedSpecialBooking.vehicleType}</Text>
          <Text>Ride Type: {acceptedSpecialBooking.rideType}</Text>
  
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
        </>
      )}
    </View>
  );

  // Function to render details for Shared Ride
  
  const renderSharedBookingItem = ({ item }) => (
    <View style={styles.sharedRideContent}>
    <View style={styles.sharedBookingItem}>
      <Text style={styles.sharedBookingItemText}>{item.name}</Text>
      <Text style={styles.sharedBookingItemTextLight}>Pickup: {item.pickupAddress}</Text>
      <Text style={styles.sharedBookingItemTextLight}>Destination: {item.destinationAddress}</Text>
      </View>
      <View style={styles.bookingDetails}>
        <TouchableOpacity onPress={openDetailsModal}>
          <Text style={styles.sharedBookingItemText}>Details</Text>
        </TouchableOpacity>
      </View>
      <Modal
      visible={isDetailsModalVisible}
      transparent={true}
      animationType="none" 
      onRequestClose={closeDetailsModal}
    >
      <View style={styles.modalBackdrop}>
        <Animated.View
          style={[
            styles.detailsModalOverlay,
            { transform: [{ translateX }] },
          ]}
        >
          <View style={styles.detailsModalContainer}>
            <View style={styles.detailsModalContent}>
            <TouchableOpacity onPress={closeDetailsModal} style={styles.closeDetailsButton}>
                <Icon name="times" size={18} color="#000" style={styles.closeIcon}/>
              </TouchableOpacity>
              <View style={styles.bookingDetails}>
              <Text style={styles.bookingDetailsHeader}>Booking Details</Text>
              </View>
              <View style={styles.bookingContainer}>
              <View style={styles.bookingInfo}>
              <View style={styles.circle} />
              <View style={styles.commuterInfo}>
                <Text style={styles.commuterinfoText}>{item.name}</Text>
                <Text style={styles.commuterinfoText}>{item.status}</Text>
              </View>
              </View>
              <View style={styles.location}>
              <View style={styles.pickupLocation}> 
        
              <Text style={styles.locationText}>Pickup:</Text>
            <Text style={styles.locationText}>{item.pickupAddress}</Text>
              </View>
              <View style={styles.destinationLocation}> 
            
              <Text style={styles.locationText}>Drop-off:</Text>
              <Text style={styles.locationText}>{item.destinationAddress}</Text>
              </View>
              </View>
              <View>
                <View style={styles.fares}>
                  <Text  style={styles.fareText}>Fare: {item.fare}</Text>
                  <Text  style={styles.fareText}>Est. Time: {time.toFixed(0)} mins</Text>
                  <Text  style={styles.fareText}>Distance: {distance.toFixed(1)} km.</Text>
                </View>
              </View>

              <View style={styles.communication}>
                <TouchableOpacity style={styles.communicationContainer}>
                <Text style={styles.communicationText}>
                <Icon name="envelope" size={18} color="#000" style={styles.communicationIcon}/> Message
               </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.communicationContainer}>
                <Text style={styles.communicationText}>
                <Icon name="phone" size={18} color="#000" style={styles.communicationIcon}/> Call
               </Text>
                  </TouchableOpacity>
              </View>
              </View>
            
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
    </View>
  );

  const { width } = Dimensions.get('window');
    const translateX = useRef(new Animated.Value(width)).current; 
  
    useEffect(() => {
      if (isDetailsModalVisible) {
        Animated.timing(translateX, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.timing(translateX, {
          toValue: width,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }, [isDetailsModalVisible]);
  

  return (
    <View style={styles.container}>
      <Loader isLoading={isLoading} />
      <View style={styles.topContainer}>
        <TouchableOpacity
          style={[
            styles.onlineOfflineButton,
            { backgroundColor: online ? "green" : "red" },
            !subscribed && styles.buttonDisabled,
          ]}
          onPress={toggleOnlineStatus}
          disabled={!subscribed}
        >
          <Text style={styles.onlineOfflineButtonText}>
            {online ? "Go Offline" : "Go Online"}
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

        {commuterLocation && (
          <Marker
            coordinate={commuterLocation}
            image={imagePath.icGreenMarker}
            title="Commuter's Pickup Location"
          />
        )}
        {destinationCords && (
          <Marker
            coordinate={destinationCords}
            image={imagePath.icGreenMarker}
            title="Destination"
          />
        )}
        {commuterLocation && curLoc && (
          <MapViewDirections
            origin={curLoc}
            destination={commuterLocation}
            apikey={GOOGLE_MAP_KEY}
            strokeWidth={6}
            strokeColor="black"
            optimizeWaypoints={true}
            onReady={(result) => {
              fetchTime(result.distance, result.duration);
              mapRef.current.fitToCoordinates(
                [curLoc, commuterLocation, destinationCords],
                {
                  edgePadding: {
                    right: 30,
                    bottom: 300,
                    left: 30,
                    top: 100,
                  },
                }
              );
            }}
          />
        )}
        {commuterLocation && destinationCords && (
          <MapViewDirections
            origin={commuterLocation}
            destination={destinationCords}
            apikey={GOOGLE_MAP_KEY}
            strokeWidth={6}
            strokeColor="red"
            optimizeWaypoints={true}
            onReady={(result) => {
              fetchTime(result.distance, result.duration);
              mapRef.current.fitToCoordinates(
                [curLoc, commuterLocation, destinationCords],
                {
                  edgePadding: {
                    right: 30,
                    bottom: 300,
                    left: 30,
                    top: 100,
                  },
                }
              );
            }}
          />
        )}
      </MapView>
      <TouchableOpacity style={styles.centerButton} onPress={onCenter}>
        <Image source={imagePath.greenIndicator} />
      </TouchableOpacity>
      <View style={styles.bottomCard}>
  {acceptedSpecialBooking ? (
    <>
      <Text>Special Ride</Text>
      {renderSpecialBookingItem()}
    </>
  ) : acceptedSharedBooking.length > 0 ? (
    <>
      <Text>Shared Ride</Text>
      <FlatList
        data={acceptedSharedBooking}
        renderItem={renderSharedBookingItem}
        keyExtractor={(item) => item._id.toString()}
        contentContainerStyle={styles.sharedBookingList}
      />
      <FlatList
        data={bookings.filter((booking) => booking.rideType === "Shared Ride")}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item._id.toString()}
        contentContainerStyle={styles.bookingList}
      />
      <TouchableOpacity onPress={openModal} style={styles.sharedBookingModal}>
      <Text style={styles.rideDetails}>
      Ride Details <Icon name="chevron-up" size={12} color="#000" style={styles.communicationIcon}/>
               </Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Text>Close</Text>
              </TouchableOpacity>
              <Text>Stops</Text>
              {Array.isArray(acceptedSharedBooking) && acceptedSharedBooking.map((booking, index) => (
  <Text key={`pickup-${index}`}>
    {index + 1}. Pickup: {booking.name} At {booking.pickupAddress}
  </Text>
))}

{Array.isArray(acceptedSharedBooking) && acceptedSharedBooking.map((booking, index) => (
  <Text key={`dropoff-${index}`}>
    {acceptedSharedBooking.length + index + 1}. Drop-off: {booking.name} At {booking.destinationAddress}
  </Text>
))}


            </View>
          </View>
        </View>
      </Modal>
    </>
  ) : (
    online && (
      <FlatList
        data={bookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item._id.toString()}
        contentContainerStyle={styles.bookingList}
      />
    )
  )}
</View>


    </View>
  );
};

const styles = StyleSheet.create({
  rideDetails:{
    color: 'white'
  },
  fares: {
borderBottomColor: '#f3f3f3',
    borderBottomWidth: 1, 
    paddingTop: 15,
    paddingBottom: 15,
  },
  fareText: {
 fontSize: 16,
    fontWeight: '500'
  },
  commuterinfoText: {
fontSize: 16,
    fontWeight: '500'
  },
  location: {
    gap: 20,
    borderBottomColor: '#f3f3f3',
    borderBottomWidth: 1, 
    paddingTop: 15,
    paddingBottom: 15,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '500'
  },
  pickupLocation: {
    gap: 5,
  },
  destinationLocation: {
    gap: 5,
  },
  sharedBookingItemText: {
fontSize: 16,
    fontWeight: '500'
  },
  communicationContainer: {
    width: 110,
    height: 40,
    backgroundColor: 'black',
    marginRight: 15,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 5,
  },
  communicationIcon : {
    color: 'white',
    alignItems: 'center'
  },
  communicationText : {
    color: 'white',

  },
  communication: {
    flexDirection: 'row'
  },
  bookingContainer : {
    gap: 20,
  },
  bookingInfo: {
    display: 'flex',
    flexDirection: 'row',
    marginTop: 40,
    gap: 20,
    borderBottomColor: '#f3f3f3',
    borderBottomWidth: 1, 
    paddingTop: 15,
    paddingBottom: 15,
  },
 commuterInfo: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  sharedBookingModal: {
    alignItems: 'center',
    backgroundColor: 'lightgray',
    borderRadius: 5,
    padding: 10,
  },
  sharedBookingItemTextLight: {
    color: '#8B8A86',
  },
  circle: {
    width: 60,
    height: 60,
    backgroundColor: "gray",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  bookingDetails: {
    alignItems: 'center', // Center contents horizontally
    marginTop: 50, // Adjust margin as needed
  },
  bookingDetailsHeader: {
    marginTop: 20,
    fontSize: 20, // Adjust the font size as needed
    fontWeight: 'bold', // Change to normal if you don't want it bold
    textAlign: 'center', // Center text horizontally
  },

  closeIcon: {
    fontWeight: 'normal',
  },
  modalText: {
    color: 'black',
  },
  detailsButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#ddd',
    borderRadius: 5,
    alignItems: 'center',
  },
modalBackdrop: {
    flex: 1,
    justifyContent: 'center', // Center the modal vertically
    alignItems: 'flex-end', // Align modal to the right
  },
  detailsModalOverlay: {
    width: '70%', // Adjust width as needed
    height: '100%',
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
  },
  detailsModalContainer: {
    flex: 1, // Full width of the screen
    maxHeight: '100%', // Adjust as needed
    borderTopStartRadius: 24,
    borderTopEndRadius: 24,
    backgroundColor: 'white',
  },
detailsModalContent: {
    flex: 1,
    padding: 10, // Add some padding to ensure content isn't too close to the edges
    position: 'relative', // Allows absolute positioning of the button
  },
  closeDetailsButton: {
    position: 'absolute',
    right: 0, 
    zIndex: 1, // Ensure the button is above other content
  },
  detailsButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#ddd',
    borderRadius: 5,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    height: 300,
    justifyContent: 'flex-end', // Aligns the modal to the bottom
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%', // Full width of the screen
    maxHeight: '100%', // Adjust as needed
    borderTopStartRadius: 24,
    borderTopEndRadius: 24,
    backgroundColor: 'white',
  },
modalContent: {
    height: 600, // Fixed height for the modal content
    backgroundColor: 'white',
    padding: 20, // Adjust padding as needed
    borderTopStartRadius: 24,
    borderTopEndRadius: 24,
  },
closeButton: {
    marginTop: 15,
    padding: 8,
    backgroundColor: '#ddd',
    borderRadius: 5,
  },
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },
  bottomCard : {
    padding: 10
  },
  sharedRideContent: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 40, // Space on both sides
    borderRadius: 12,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  bookingDetails : {
    alignItems: 'center',
    justifyContent: 'center',
  },

  bookingList: {
    backgroundColor: "#fff",
    borderTopEndRadius: 24,
    borderTopStartRadius: 24,
    borderBottomEndRadius: 24,
    borderBottomStartRadius: 24,
  },
sharedBookingList: {
    gap: 5, // Gap between items (specific to Flex layouts, may need flexDirection adjustment)
    backgroundColor: "#f9f9f9",
    borderTopEndRadius: 24,
    borderTopStartRadius: 24,
    borderBottomEndRadius: 24,
    borderBottomStartRadius: 24,
  },
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
    left: 160,
  },
  onlineOfflineButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  centerButton: {
    marginTop: 10,
    alignItems: "center",
    position: "absolute",
    top: 300,
  },
  image: {
    width: 30,
    height: 30,
  },
});

export default Home;
