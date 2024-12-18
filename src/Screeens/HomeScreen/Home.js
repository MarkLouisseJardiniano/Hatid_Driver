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
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
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
import Geocoder from "react-native-geocoding";
import { Picker } from '@react-native-picker/picker';
import haversine from "haversine";


Geocoder.init(GOOGLE_MAP_KEY);
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
  const [showImage, setShowImage] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [acceptedSpecialBooking, setAcceptedSpecialBooking] = useState(null);
  const [acceptedSharedBooking, setAcceptedSharedBooking] = useState([]);
  const [acceptedJoinSharedBooking, setJoinAcceptedSharedBooking] = useState(
    []
  );
  const [driverId, setDriverId] = useState(null);
  const [vehicleType, setVehicleType] = useState(null); 
  const [selectedVehicleType, setSelectedVehicleType] = useState(null);
  const [commuterLocation, setCommuterLocation] = useState(null);
  const [destinationCords, setDestinationCords] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [
    isCopassengerDetailsModalVisible,
    setIsCoPassengerDetailsModalVisible,
  ] = useState(false);
  const [selectedCommuter, setSelectedCommuter] = useState(null);
  const [selectedCoPassenger, setSelectedCoPassenger] = useState(null);
  const [isPickupConfirmed, setIsPickupConfirmed] = useState({});
  const [distanceToPickup, setDistanceToPickup] = useState({});
  const [distanceToDropoff, setDistanceToDropoff] = useState({});
  const [joinRequests, setJoinRequests] = useState([]);
  const [isConfirmationModalVisible, setConfirmationModalVisible] =
    useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalArrivedVisible, setArrivedModalVisible] = useState(false);
  const [modalParentVisible, setParentModalsVisible] = useState(false);
  const [modalSpecialTripArrivalVisible, setSpecialTripModalArrivalVisible] =
    useState(false);
  const [modalSharedTripArrivalVisible, setSharedTripModalArrivalVisible] =
    useState(false);
  const [modalSpecialTripVisible, setSpecialTripModalsVisible] =
    useState(false);
  const [modalSpecialTripDropoffVisible, setSpecialTripDropoffModalVisible] =
    useState(false);
  const [modalSpecialTripEndRideVisible, setSpecialTripEndRideModalVisible] =
    useState(false);
  const [modalCancelVisible, setCancelModalVisible] = useState(false);
  const [modalCancelSharedVisible, setCancelSharedModalVisible] =
    useState(false);
  const [selectedSpecialTripPassenger, setSelectedSpecialTripPassenger] =
    useState(null);
  const [selectedCopassenger, setSelectedCopassenger] = useState(null);
  const [selectedParent, setSelectedParent] = useState(null);
  const [isParentModalVisible, setParentModalVisible] = useState(false);
  const [isEndRideModalVisible, setEndRideModalVisible] = useState(false);
  const [selectReason, setSelectReason] = useState("");
  const [bookingDetails, setBookingDetails] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);
  const handleSkip = () => {
    console.log('Skipping subscription');
    setShowImage(false); // Hide the image when skip is clicked
  };

  //details modal
  const openModal = () => setIsModalVisible(true);
  const closeModal = () => setIsModalVisible(false);

  const openDetailsModal = (commuter) => {
    setSelectedCommuter(commuter);
    setIsDetailsModalVisible(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalVisible(false);
    setSelectedCommuter(null);
  };

  const openCoPassengerDetailsModal = (copassenger) => {
    console.log("Opening modal for:", copassenger);
    setSelectedCoPassenger(copassenger);
    setIsCoPassengerDetailsModalVisible(true);
  };

  const closeCoPassengerDetailsModal = () => {
    setIsCoPassengerDetailsModalVisible(false);
    setSelectedCoPassenger(null);
  };

  // Copassenger Confirmation Handler
  const handleAcceptJoinRequest = async (bookingId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const driverId = await AsyncStorage.getItem("driverId");
      const userId = await AsyncStorage.getItem("userId");
      const curLoc = await getLiveLocation();

      console.log("Token:", token);
      console.log("Driver ID:", driverId);
      console.log("User ID:", userId);
      console.log("Current Location:", curLoc);
      console.log("Booking ID:", bookingId);

      if (!token || !driverId || !bookingId || !curLoc || !userId) {
        throw new Error(
          "Missing token, driverId, userId, booking ID, or current location"
        );
      }

      const acceptJoin = {
        newBookingId: bookingId,
        userId,
        driverId,
      };
      const res = await axios.post(
        "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/accept-copassenger",
        acceptJoin,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.status === 200) {
        const newAcceptedBooking = res.data.booking;

        if (!newAcceptedBooking) {
          throw new Error("Booking data not found in response.");
        }

        console.log("New Accepted Booking:", newAcceptedBooking);
        const getAddress = async (latitude, longitude) => {
          const reverseGeocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=pk.eyJ1IjoibWF3aTIxIiwiYSI6ImNseWd6ZGp3aTA1N2IyanM5Ymp4eTdvdzYifQ.0mYPMifHNHONTvY6mBbkvg`;
          try {
            const geoResponse = await axios.get(reverseGeocodeUrl);
            if (geoResponse.data.features.length > 0) {
              let barangay = "";
              let district = "";

              const addressComponents = geoResponse.data.features[0].context;

              addressComponents.forEach((component) => {
                if (component.id.includes("locality")) {
                  barangay = component.text;
                } else if (component.id.includes("place")) {
                  district = component.text;
                }
              });

              return `${barangay}, ${district}` || "Address not found";
            }
          } catch (geoError) {
            console.error("Error during geocoding:", geoError);
          }
          return "Address not found";
        };

        const getDistanceAndTime = async (pickup, destination) => {
          const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${pickup.longitude},${pickup.latitude};${destination.longitude},${destination.latitude}?access_token=pk.eyJ1IjoibWF3aTIxIiwiYSI6ImNseWd6ZGp3aTA1N2IyanM5Ymp4eTdvdzYifQ.0mYPMifHNHONTvY6mBbkvg&geometries=geojson`;

          try {
            const response = await axios.get(directionsUrl);
            if (response.data.routes.length > 0) {
              const distance = response.data.routes[0].distance;
              const time = response.data.routes[0].duration;
              return {
                distance: (distance / 1000).toFixed(2) + " km",
                time: (time / 60).toFixed(0) + " mins",
              };
            }
          } catch (error) {
            console.error("Error fetching distance and time:", error);
          }
          return { distance: "N/A", time: "N/A" };
        };

        const pickupAddress = await getAddress(
          newAcceptedBooking.pickupLocation.latitude,
          newAcceptedBooking.pickupLocation.longitude
        );
        const destinationAddress = await getAddress(
          newAcceptedBooking.destinationLocation.latitude,
          newAcceptedBooking.destinationLocation.longitude
        );

        const { distance, time } = await getDistanceAndTime(
          newAcceptedBooking.pickupLocation,
          newAcceptedBooking.destinationLocation
        );

        newAcceptedBooking.pickupAddress = pickupAddress;
        newAcceptedBooking.destinationAddress = destinationAddress;
        newAcceptedBooking.distance = distance;
        newAcceptedBooking.time = time;

        // Reverse geocode for each co-passenger
        await Promise.all(
          newAcceptedBooking.copassengers.map(async (copassenger) => {
            const copassengerPickupAddress = await getAddress(
              copassenger.pickupLocation.latitude,
              copassenger.pickupLocation.longitude
            );
            const copassengerDestinationAddress = await getAddress(
              copassenger.destinationLocation.latitude,
              copassenger.destinationLocation.longitude
            );

            const { distance, time } = await getDistanceAndTime(
              copassenger.pickupLocation,
              copassenger.destinationLocation
            );

            // Add addresses to co-passenger details
            copassenger.pickupAddress = copassengerPickupAddress;
            copassenger.destinationAddress = copassengerDestinationAddress;
            copassenger.distance = distance;
            copassenger.time = time;
          })
        );

        setJoinAcceptedSharedBooking((prevBookings) => {
          const existingBookingIndex = prevBookings.findIndex(
            (b) => b._id === newAcceptedBooking._id
          );

          if (existingBookingIndex !== -1) {
            const updatedBookings = [...prevBookings];
            updatedBookings[existingBookingIndex] = newAcceptedBooking;
            return updatedBookings;
          } else {
            return [...prevBookings, newAcceptedBooking];
          }
        });

        setAcceptedSharedBooking((prevAcceptedBookings) => {
          const existingAcceptedBookingIndex = prevAcceptedBookings.findIndex(
            (b) => b._id === newAcceptedBooking._id
          );

          if (existingAcceptedBookingIndex !== -1) {
            const updatedAcceptedBookings = [...prevAcceptedBookings];
            updatedAcceptedBookings[existingAcceptedBookingIndex] =
              newAcceptedBooking;
            return updatedAcceptedBookings;
          } else {
            return [...prevAcceptedBookings, newAcceptedBooking];
          }
        });
        startPollingForCancel(newAcceptedBooking._id);
        setCommuterLocation(newAcceptedBooking.pickupLocation);
        setDestinationCords(newAcceptedBooking.destinationLocation);

        setJoinRequests((prevRequests) =>
          prevRequests.filter((request) => request._id !== bookingId)
        );
      } else {
        console.error("Unexpected response status:", res.status, res.data);
      }
    } catch (error) {
      console.error("Error accepting booking:", error);
      if (error.response) {
        console.error("Error Response:", error.response.data);
      } else {
        console.error("Error Message:", error.message);
      }
    }
  };

  const openArrivedModal = (copassenger) => {
    console.log("Opening modal for copassenger:", copassenger);
    setSelectedCopassenger(copassenger);
    setArrivedModalVisible(true);
  };

  const closeArrivedModal = () => {
    setArrivedModalVisible(false);
    setSelectedCopassenger(null);
  };

  const handleConfirmArrival = async () => {
    console.log("Current selected copassenger:", selectedCopassenger);

    if (!selectedCopassenger) {
      console.error("No copassenger selected");
      return;
    }
    try {
      const updatedStatus = "Arrived";
      console.log("Updated status to be sent:", updatedStatus);

      const response = await axios.post(
        `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/copassenger/arrived`,
        {
          copassengerId: selectedCopassenger, // Send copassengerId in the body
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response from backend:", response.data);

      if (response.data?.status === "ok") {
        // Update the local state for pickup confirmation
        setIsPickupConfirmed((prevState) => {
          const updatedState = {
            ...prevState,
            [selectedCopassenger]: updatedStatus,
          };
          console.log("Booking status updated successfully");
          console.log("New pickup confirmation state:", updatedState);
          return updatedState; // Return the updated state
        });

        setJoinAcceptedSharedBooking((prevBookings) => {
          return prevBookings.map((booking) => {
            const updatedBooking = response.data.data.find(
              (b) => b.bookingId === booking._id
            );
            if (updatedBooking) {
              const updatedCopassengers = booking.copassengers.map(
                (copassenger) =>
                  copassenger._id === updatedBooking.copassengerId
                    ? { ...copassenger, status: updatedBooking.updatedStatus }
                    : copassenger
              );
              return { ...booking, copassengers: updatedCopassengers };
            }
            return booking;
          });
        });
      } else {
        console.error(
          "Failed to update booking status:",
          response.data?.message || "No message available"
        );
      }
    } catch (error) {
      console.error(
        "Error updating booking status:",
        error.response?.data?.message || error.message
      );
    } finally {
      closeArrivedModal();
      console.log("Pickup modal closed.");
    }
  };

  const openPickupModal = (copassenger) => {
    console.log("Opening modal for copassenger:", copassenger); // Log the copassenger
    setSelectedCopassenger(copassenger); // Set the selected copassenger directly
    setModalVisible(true); // Show the modal
  };

  const closePickupModal = () => {
    setModalVisible(false); // Close the modal without confirming
    setSelectedCopassenger(null); // Clear any selected copassenger
  };

  const handleConfirmPickup = async () => {
    console.log("Current selected copassenger:", selectedCopassenger);

    // Check if a copassenger is selected
    if (!selectedCopassenger) {
      console.error("No copassenger selected to pickup");
      return;
    }

    const updatedStatus = "On board"; // New status to set
    console.log("Updated status to be sent:", updatedStatus);

    try {
      // Send a request to update the status to "On board"

      const response = await axios.post(
        `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/copassenger/onboard`,
        {
          copassengerId: selectedCopassenger, // Send copassengerId in the body
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Full response:", response);

      if (response.data?.status === "ok") {
        // Update the local state for pickup confirmation
        setIsPickupConfirmed((prevState) => {
          const updatedState = {
            ...prevState,
            [selectedCopassenger]: updatedStatus,
          };
          console.log("Booking status updated successfully");
          console.log("New pickup confirmation state:", updatedState);
          return updatedState; // Return the updated state
        });

        setJoinAcceptedSharedBooking((prevBookings) => {
          return prevBookings.map((booking) => {
            // Check if the booking was updated
            const updatedBooking = response.data.data.find(
              (b) => b.bookingId === booking._id
            );
            if (updatedBooking) {
              // Update the copassenger's status
              const updatedCopassengers = booking.copassengers.map(
                (copassenger) =>
                  copassenger._id === updatedBooking.copassengerId
                    ? { ...copassenger, status: updatedBooking.updatedStatus }
                    : copassenger
              );
              return { ...booking, copassengers: updatedCopassengers };
            }
            return booking;
          });
        });
      } else {
        console.error(
          "Failed to update copassenger status:",
          response.data?.message || "No message available"
        );
      }
    } catch (error) {
      console.error(
        "Error updating copassenger status:",
        error.response?.data?.message || error.message
      );
    } finally {
      closePickupModal();
    }
  };

  const openDropoffModal = (copassenger) => {
    setSelectedCopassenger(copassenger);
    setConfirmationModalVisible(true);
  };

  const closeDropoffModal = () => {
    setConfirmationModalVisible(false);
    setSelectedCopassenger(null);
  };

  const confirmDropOff = async () => {
    if (!selectedCopassenger) {
      console.error("No copassenger ID available for drop off.");
      return;
    }
    const updatedStatus = "Dropped off";

    try {
      const response = await axios.post(
        "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/copassenger/dropoff",
        { copassengerId: selectedCopassenger }
      );

      if (response.data?.status === "ok") {
        setIsPickupConfirmed((prevState) => {
          const updatedState = {
            ...prevState,
            [selectedCopassenger]: updatedStatus,
          };
          return updatedState;
        });

        setJoinAcceptedSharedBooking((prevBookings) => {
          return prevBookings.map((booking) => {
            const updatedBooking = response.data.data.find(
              (b) => b.bookingId === booking._id
            );
            if (updatedBooking) {
              const updatedCopassengers = booking.copassengers.map(
                (copassenger) =>
                  copassenger._id === updatedBooking.copassengerId
                    ? { ...copassenger, status: updatedBooking.updatedStatus }
                    : copassenger
              );
              return { ...booking, copassengers: updatedCopassengers };
            }
            return booking;
          });
        });

        closeDropoffModal();
      } else {
        console.error("Failed to complete dropoff:", response.data.message);
        alert("Failed to complete dropoff. Please try again.");
      }
    } catch (error) {
      console.error("Error completing dropoff:", error);
      alert(
        "There was an error dropping off the copassenger. Please try again."
      );
    }
  };

  const openEndRideModal = (parentId) => {
    console.log("Booking ID to End Ride:", parentId);
    console.log("Accepted Shared Bookings:", acceptedSharedBooking);
    const selectedBooking = acceptedSharedBooking.find(
      (booking) => booking._id === parentId
    );
    console.log("Selected Booking:", selectedBooking);
    if (selectedBooking) {
      setSelectedParent(selectedBooking);
      setEndRideModalVisible(true);
    } else {
      console.error("Booking not found for ID:", parentId);
    }
  };
  const sharedBookingsDroppedOff = acceptedSharedBooking.every((booking) => {
    console.log(`Booking Status: ${booking.status}`);
    return booking.status === "Dropped off";
  });
  console.log(
    "All Accepted Shared Bookings Dropped Off:",
    sharedBookingsDroppedOff
  );

  console.log("Accepted Join Shared Bookings:", acceptedJoinSharedBooking);
  const joinBookingsDroppedOff =
    !acceptedJoinSharedBooking.length ||
    acceptedJoinSharedBooking.every((booking) => {
      if (booking.copassengers) {
        console.log(
          `Copassengers: ${booking.copassengers.map((c) => c.status)}`
        );
      }
      return booking.copassengers
        ? booking.copassengers.every((copassenger) => {
            console.log(`Copassenger Status: ${copassenger.status}`);
            return copassenger.status === "Dropped off";
          })
        : true;
    });
  console.log(
    "All Accepted Join Bookings Dropped Off:",
    joinBookingsDroppedOff
  );

  const allPassengersDroppedOff =
    sharedBookingsDroppedOff && joinBookingsDroppedOff;
  console.log("All Passengers Dropped Off:", allPassengersDroppedOff);

  const hasJoinShared = acceptedJoinSharedBooking.length > 0;

  const totalSharedFare = acceptedSharedBooking.reduce(
    (acc, booking) =>
      acc + (hasJoinShared ? booking.fare || 0 : booking.fare || 0),
    0
  );
  // Calculate the total fare for accepted join shared bookings with a 30% discount applied to each co-passenger
  const totalJoinSharedFare = acceptedJoinSharedBooking.reduce(
    (acc, booking) => {
      // Add up the fares for each co-passenger after applying the 30% discount
      const coPassengerFareTotal = booking.copassengers.reduce(
        (coAcc, copassenger) => {
          const copassengerFare = copassenger.fare ? copassenger.fare : 0; // Apply 30% discount for each co-passenger
          return coAcc + copassengerFare; // Accumulate the total fare for co-passengers
        },
        0
      );

      // Add co-passenger fare total to the accumulator
      return acc + coPassengerFareTotal;
    },
    0
  );

  const finalTotalFare = totalSharedFare + totalJoinSharedFare;
  console.log("Final Total Fare:", finalTotalFare);

  const totalPickups =
    (Array.isArray(acceptedSharedBooking) ? acceptedSharedBooking.length : 0) +
    (Array.isArray(acceptedJoinSharedBooking)
      ? acceptedJoinSharedBooking.reduce((acc, booking) => {
          return (
            acc +
            (Array.isArray(booking.copassengers)
              ? booking.copassengers.length
              : 0)
          );
        }, 0)
      : 0);

  //Special Trip

  const handleAccept = async (bookingId) => {
    try {
      // Retrieve the token, driverId, and current location
      const token = await AsyncStorage.getItem("token");
      const driverId = await AsyncStorage.getItem("driverId");
      const curLoc = await getLiveLocation();

      console.log("Token:", token);
      console.log("Driver ID:", driverId);
      console.log("Booking ID:", bookingId);
      console.log("Current Location:", curLoc);

      if (!token || !driverId || !bookingId || !curLoc) {
        throw new Error(
          "Missing token, driverId, bookingId, or current location"
        );
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
        "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/accept",
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

        await AsyncStorage.setItem("parentBooking", bookingId.toString());

        // Log the parentBookingId
        console.log("Parent Booking ID:", newAcceptedBooking.parentBookingId);

        // Save the accepted booking ID
        await AsyncStorage.setItem(
          "bookingId",
          newAcceptedBooking._id.toString()
        );

        console.log("Booking ID saved:", bookingId);

        // Reverse geocoding for pickup and destination locations
        const getAddress = async (latitude, longitude) => {
          const reverseGeocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=pk.eyJ1IjoibWF3aTIxIiwiYSI6ImNseWd6ZGp3aTA1N2IyanM5Ymp4eTdvdzYifQ.0mYPMifHNHONTvY6mBbkvg`;
          const geoResponse = await axios.get(reverseGeocodeUrl);
          if (geoResponse.data.features.length > 0) {
            let barangay = "";
            let district = "";

            const addressComponents = geoResponse.data.features[0].context;

            addressComponents.forEach((component) => {
              if (component.id.includes("locality")) {
                barangay = component.text;
              } else if (component.id.includes("place")) {
                district = component.text;
              }
            });

            return `${barangay}, ${district}` || "Address not found";
          }
          return "Address not found";
        };

        const getDistanceAndTime = async (pickup, destination) => {
          const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${pickup.longitude},${pickup.latitude};${destination.longitude},${destination.latitude}?access_token=pk.eyJ1IjoibWF3aTIxIiwiYSI6ImNseWd6ZGp3aTA1N2IyanM5Ymp4eTdvdzYifQ.0mYPMifHNHONTvY6mBbkvg&geometries=geojson`;

          try {
            const response = await axios.get(directionsUrl);
            if (response.data.routes.length > 0) {
              const distance = response.data.routes[0].distance; // in meters
              const time = response.data.routes[0].duration; // in seconds
              return {
                distance: (distance / 1000).toFixed(2) + " km", // Convert to kilometers
                time: (time / 60).toFixed(0) + " mins", // Convert to minutes
              };
            }
          } catch (error) {
            console.error("Error fetching distance and time:", error);
          }
          return { distance: "N/A", time: "N/A" }; // Default values if fetch fails
        };

        // Fetch addresses
        const pickupAddress = await getAddress(
          newAcceptedBooking.pickupLocation.latitude,
          newAcceptedBooking.pickupLocation.longitude
        );
        const destinationAddress = await getAddress(
          newAcceptedBooking.destinationLocation.latitude,
          newAcceptedBooking.destinationLocation.longitude
        );
        // Fetch distance and time
        const { distance, time } = await getDistanceAndTime(
          newAcceptedBooking.pickupLocation,
          newAcceptedBooking.destinationLocation
        );

        newAcceptedBooking.pickupAddress = pickupAddress;
        newAcceptedBooking.destinationAddress = destinationAddress;
        newAcceptedBooking.distance = distance;
        newAcceptedBooking.time = time;

        setBookings((prevAvailableBookings) => {
          return prevAvailableBookings.filter(
            (booking) => booking._id !== bookingId
          );
        });

        if (newAcceptedBooking.rideType === "Shared Ride") {
          const currentSharedBookings = acceptedSharedBooking.length;

          setAcceptedSharedBooking((prevBookings) => {
            let updatedBookings;

            if (currentSharedBookings === 0) {
              newAcceptedBooking.finalFare = newAcceptedBooking.fare;
              updatedBookings = [...prevBookings, newAcceptedBooking];
            } else {
              newAcceptedBooking.finalFare = newAcceptedBooking.fare * 0.7;
              updatedBookings = [
                ...prevBookings.map((booking) => ({
                  ...booking,
                  finalFare: booking.fare * 0.7,
                })),
                newAcceptedBooking,
              ];
            }

            return updatedBookings;
          });
        } else {
          newAcceptedBooking.finalFare = newAcceptedBooking.fare;
          newAcceptedBooking.userId = newAcceptedBooking.user;
          await AsyncStorage.setItem(
            "userId",
            newAcceptedBooking.userId.toString()
          );
          console.log(
            "UserId saved to AsyncStorage:",
            newAcceptedBooking.userId
          );
          setAcceptedSpecialBooking(newAcceptedBooking);
        }
        startPollingForCancel(newAcceptedBooking._id);
        setCommuterLocation(newAcceptedBooking.pickupLocation);
        setDestinationCords(newAcceptedBooking.destinationLocation);

        setJoinRequests((prevJoinRequests) => {
          return prevJoinRequests.map((joinRequest) =>
            joinRequest.bookingId === bookingId
              ? { ...joinRequest, status: "accepted", ...newAcceptedBooking }
              : joinRequest
          );
        });

        console.log("Booking accepted successfully:", newAcceptedBooking);
      } else {
        console.error("Failed to accept booking:", res.data.message);
      }
    } catch (error) {
      console.error("Error accepting booking:", error.message);
    }
  };

  const openSpecialArrivalModal = (special) => {
    console.log("Opening modal for parent:", special);
    setSelectedSpecialTripPassenger(special);
    setSpecialTripModalArrivalVisible(true);
  };

  const closeSpecialTripArrivalModal = () => {
    setSpecialTripModalArrivalVisible(false); // Close the modal without confirming
    setSelectedSpecialTripPassenger(null); // Clear any selected copassenger
  };

  const handleConfirmSpecialTripArrival = async () => {
    console.log("Current selected booking:", selectedSpecialTripPassenger);

    if (!selectedSpecialTripPassenger) {
      console.error("No booking selected to update status");
      return;
    }

    try {
      const updatedStatus = "Arrived"; // New status to set
      console.log("Updated status to be sent:", updatedStatus);

      const response = await axios.post(
        `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/arrived?bookingId=${selectedSpecialTripPassenger}`,
        {
          status: updatedStatus,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response from backend:", response.data);

      if (response.data?.status === "ok") {
        // Update the local state for pickup confirmation
        setIsPickupConfirmed((prevState) => {
          const updatedState = {
            ...prevState,
            [selectedSpecialTripPassenger]: updatedStatus,
          };
          console.log("Booking status updated successfully");
          console.log("New pickup confirmation state:", updatedState);
          return updatedState; // Return the updated state
        });

        // Also update the status in accepted shared bookings if applicable
        setAcceptedSpecialBooking((prevBooking) => {
          // Check if the previous booking is the one to update
          if (prevBooking && prevBooking._id === selectedSpecialTripPassenger) {
            return { ...prevBooking, status: updatedStatus }; // Update the status
          }
          return prevBooking; // No change if IDs don't match or prevBooking is null
        });
      } else {
        console.error(
          "Failed to update booking status:",
          response.data?.message || "No message available"
        );
      }
    } catch (error) {
      console.error(
        "Error updating booking status:",
        error.response?.data?.message || error.message
      );
    } finally {
      closeSpecialTripArrivalModal();
      console.log("Pickup modal closed.");
    }
  };

  const openSpecialPickupModal = (special) => {
    console.log("Opening modal for parent:", special); // Log the copassenger
    setSelectedSpecialTripPassenger(special); // Set the selected copassenger directly
    setSpecialTripModalsVisible(true); // Show the modal
  };

  const closeSpecialTripPickupModal = () => {
    setSpecialTripModalsVisible(false); // Close the modal without confirming
    setSelectedSpecialTripPassenger(null); // Clear any selected copassenger
  };

  const handleConfirmSpecialTripPickup = async () => {
    console.log("Current selected booking:", selectedSpecialTripPassenger);

    // Check if a booking is selected
    if (!selectedSpecialTripPassenger) {
      console.error("No booking selected to update status");
      return;
    }
    try {
      const updatedStatus = "On board"; // New status to set
      console.log("Updated status to be sent:", updatedStatus);

      const response = await axios.post(
        `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/onboard?bookingId=${selectedSpecialTripPassenger}`,
        {
          status: updatedStatus,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response from backend:", response.data);

      if (response.data?.status === "ok") {
        setIsPickupConfirmed((prevState) => {
          const updatedState = {
            ...prevState,
            [selectedSpecialTripPassenger]: updatedStatus,
          };
          console.log("Booking status updated successfully");
          console.log("New pickup confirmation state:", updatedState);
          return updatedState;
        });


        setAcceptedSpecialBooking((prevBooking) => {
          if (prevBooking && prevBooking._id === selectedSpecialTripPassenger) {
            return { ...prevBooking, status: updatedStatus };
          }
          return prevBooking; 
        });
      } else {
        console.error(
          "Failed to update booking status:",
          response.data?.message || "No message available"
        );
      }
    } catch (error) {
      console.error(
        "Error updating booking status:",
        error.response?.data?.message || error.message
      );
    } finally {
      closeSpecialTripPickupModal();
      console.log("Pickup modal closed.");
    }
  };

  const openSpecialTripDropoffModal = (special) => {
    console.log("Opening modal for copassenger drop off:", special); 
    setSelectedSpecialTripPassenger(special); 
    setSpecialTripDropoffModalVisible(true);
  };

  const closeSpecialTripDropoffModal = () => {
    setSpecialTripDropoffModalVisible(false); 
    setSelectedSpecialTripPassenger(null); 
  };

  const confirmSpecialTripDropOff = async () => {
    if (!selectedSpecialTripPassenger) {
      console.error("No parent booking ID available for drop off.");
      return;
    }
    try {
      const response = await axios.post(
        "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/dropoff",
        { bookingId: selectedSpecialTripPassenger }
      );

      if (response.status === 200 && response.data.status === "ok") {
        console.log("Drop off confirmed for booking:", response.data.data);

        setAcceptedSpecialBooking((prevBooking) =>
          prevBooking && prevBooking._id === selectedSpecialTripPassenger
            ? { ...prevBooking, status: "Dropped off" }
            : prevBooking
        );

        closeSpecialTripPickupModal(); // Close the modal after confirming the dropoff
      } else {
        console.error("Failed to complete dropoff:", response.data.message);
        alert("Failed to complete dropoff. Please try again.");
      }
    } catch (error) {
      console.error("Error completing dropoff:", error);
      alert(
        "There was an error dropping off the parent booking. Please try again."
      );
    }
  };

  const openSpecialTripEndRideModal = (special) => {
    console.log("Opening modal for copassenger drop off:", special); // Log the copassenger
    setSelectedSpecialTripPassenger(special); // Set the selected copassenger directly
    setSpecialTripEndRideModalVisible(true); // Show the modal
  };

  const closeSpecialTripEndRideModal = () => {
    setSpecialTripEndRideModalVisible(false); // Close the modal without confirming
    setSelectedSpecialTripPassenger(null); // Clear any selected copassenger
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
        "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/complete",
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
        setDestinationCords(null);
        setCommuterLocation(null);
      } else {
        console.error("Failed to complete booking:", res.data.message);
      }
    } catch (error) {
      console.error("Error completing booking:", error.message);
    }
  };

  const handleRejectCopassenger = async (bookingId) => {
    await saveRejectedBooking(bookingId);
    setJoinRequests((prevBookings) =>
      prevBookings.filter((booking) => booking._id !== bookingId)
    );
  };

  const openSpecialCancelModal = (special) => {
    console.log("Opening modal for parent:", special); 
    setSelectedSpecialTripPassenger(special);
    setCancelModalVisible(true);
  };

  const closeSpecialTripCancelModal = () => {
    setCancelModalVisible(false); 
    setSelectedSpecialTripPassenger(null); 
  };

  const handleCancelBooking = async () => {
    console.log("Current selected copassenger:", selectedSpecialTripPassenger);
    console.log("Selected reason:", selectReason);
    console.log("Current selected driverId:", driverId);
    try {
      const response = await axios.post(
        "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/cancel/cancel",
        {
          bookingId: selectedSpecialTripPassenger,
          canceledBy: driverId,
          reason: selectReason,
        }
      );

      if (response.status === 200 && response.data.status === "ok") {
        setAcceptedSpecialBooking(null);
        closeSpecialTripCancelModal();
        setDestinationCords(null);
        setCommuterLocation(null);
      } else {
        Alert.alert(
          "Error",
          response.data.message || "Failed to cancel booking."
        );
      }
    } catch (error) {
      console.error("Error canceling booking:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Could not cancel the booking. Please try again."
      );
    }
  };

  //parent shared
  const openSharedArrivalModal = (parent) => {
    console.log("Opening modal for parent:", parent);
    setSelectedParent(parent);
    setSharedTripModalArrivalVisible(true);
  };

  const closeSharedTripArrivalModal = () => {
    setSharedTripModalArrivalVisible(false);
    setSelectedParent(null);
  };

  const handleConfirmSharedTripArrival = async () => {
    console.log("Current selected booking:", selectedParent);

    if (!selectedParent) {
      console.error("No booking selected to update status");
      return;
    }

    try {
      const updatedStatus = "Arrived";
      console.log("Updated status to be sent:", updatedStatus);

      const response = await axios.post(
        `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/arrived?bookingId=${selectedParent}`,
        {
          status: updatedStatus,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response from backend:", response.data);

      if (response.data?.status === "ok") {
        setIsPickupConfirmed((prevState) => {
          const updatedState = {
            ...prevState,
            [selectedParent]: updatedStatus,
          };
          console.log("Booking status updated successfully");
          console.log("New pickup confirmation state:", updatedState);
          return updatedState;
        });

        setAcceptedSharedBooking((prevBookings) =>
          prevBookings.map((booking) =>
            booking._id === selectedParent
              ? { ...booking, status: updatedStatus }
              : booking
          )
        );
      } else {
        console.error(
          "Failed to update booking status:",
          response.data?.message || "No message available"
        );
      }
    } catch (error) {
      console.error(
        "Error updating booking status:",
        error.response?.data?.message || error.message
      );
    } finally {
      closeSharedTripArrivalModal();
      console.log("Pickup modal closed.");
    }
  };

  const openParentPickupModal = (parent) => {
    console.log("Opening modal for parent:", parent); // Log the copassenger
    setSelectedParent(parent); // Set the selected copassenger directly
    setParentModalsVisible(true); // Show the modal
  };

  const closeParentPickupModal = () => {
    setParentModalsVisible(false); // Close the modal without confirming
    setSelectedParent(null); // Clear any selected copassenger
  };

  const handleConfirmParentPickup = async () => {
    console.log("Current selected booking:", selectedParent);

    // Check if a booking is selected
    if (!selectedParent) {
      console.error("No booking selected to update status");
      return;
    }

    try {
      const updatedStatus = "On board"; // New status to set
      console.log("Updated status to be sent:", updatedStatus);

      const response = await axios.post(
        `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/onboard?bookingId=${selectedParent}`,
        {
          status: updatedStatus,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response from backend:", response.data);

      if (response.data?.status === "ok") {
        // Update the local state for pickup confirmation
        setIsPickupConfirmed((prevState) => {
          const updatedState = {
            ...prevState,
            [selectedParent]: updatedStatus,
          };
          console.log("Booking status updated successfully");
          console.log("New pickup confirmation state:", updatedState);
          return updatedState; // Return the updated state
        });

        // Also update the status in accepted shared bookings if applicable
        setAcceptedSharedBooking((prevBookings) =>
          prevBookings.map((booking) =>
            booking._id === selectedParent
              ? { ...booking, status: updatedStatus } // Update the status in the booking
              : booking
          )
        );
      } else {
        console.error(
          "Failed to update booking status:",
          response.data?.message || "No message available"
        );
      }
    } catch (error) {
      console.error(
        "Error updating booking status:",
        error.response?.data?.message || error.message
      );
    } finally {
      closeParentPickupModal();
      console.log("Pickup modal closed.");
    }
  };

  const openParentDropoffModal = (copassenger) => {
    console.log("Opening modal for copassenger drop off:", copassenger); // Log the copassenger
    setSelectedParent(copassenger); // Set the selected copassenger directly
    setParentModalVisible(true); // Show the modal
  };

  const closeParentDropoffModal = () => {
    setParentModalVisible(false); // Close the modal without confirming
    setSelectedParent(null); // Clear any selected copassenger
  };

  const confirmParentDropOff = async () => {
    // Check if a parent booking is selected
    if (!selectedParent) {
      console.error("No parent booking ID available for drop off.");
      return;
    }

    try {
      // Send a request to drop off the selected parent booking
      const response = await axios.post(
        "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/dropoff",
        { bookingId: selectedParent } // Send the selected parent booking ID in the body
      );

      if (response.status === 200 && response.data.status === "ok") {
        console.log("Drop off confirmed for booking:", response.data.data);

        // Update the local state for the booking status to 'Dropped off'
        setAcceptedSharedBooking((prevBookings) =>
          prevBookings.map((booking) =>
            booking._id === selectedParent
              ? { ...booking, status: "Dropped off" } // Update the status to 'Dropped off'
              : booking
          )
        );

        closeDropoffModal(); // Close the modal after confirming the dropoff
      } else {
        console.error("Failed to complete dropoff:", response.data.message);
        alert("Failed to complete dropoff. Please try again.");
      }
    } catch (error) {
      console.error("Error completing dropoff:", error);
      alert(
        "There was an error dropping off the parent booking. Please try again."
      );
    }
  };

  const openSharedCancelModal = (parent) => {
    console.log("Opening modal for parent:", parent);
    setSelectedParent(parent);
    setCancelSharedModalVisible(true);
  };

  const closeSharedTripCancelModal = () => {
    setCancelSharedModalVisible(false);
    setSelectedParent(null);
  };

  const handleCancelSharedBooking = async () => {
    if (!selectedParent) {
      Alert.alert("Error", "No booking selected.");
      return;
    }
    console.log("Selected reason:", selectReason);
    console.log("Current selected driverId:", driverId);
    console.log("Current selected copassenger:", selectedParent);

    try {
      const updatedStatus = "canceled";
      const response = await axios.post(
        "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/cancel/cancel",
        {
          bookingId: selectedParent,
          canceledBy: driverId,
          reason: selectReason,
        }
      );

      if (
        response.status === 200 &&
        response.data &&
        response.data.status === "ok"
      ) {
        setAcceptedSharedBooking((prevBookings) =>
          prevBookings.map((booking) =>
            booking._id === selectedParent
              ? { ...booking, status: updatedStatus }
              : booking
          )
        );
        closeSharedTripCancelModal();
        setDestinationCords(null);
        setCommuterLocation(null);
      } else {
        Alert.alert(
          "Error",
          response.data?.message || "Failed to cancel booking."
        );
      }
    } catch (error) {
      console.error("Error canceling booking:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Could not cancel the booking. Please try again."
      );
    }
  };

  const endRide = async () => {
    if (!selectedParent) {
      console.error("No parent selected for ending the ride.");
      return;
    }

    const bookingId = selectedParent._id;

    try {
      console.log("Booking ID:", bookingId);

      const response = await axios.post(
        "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/complete",
        { bookingId }
      );

      if (response.status === 200) {
        console.log("Booking completed successfully:", response.data);
        setAcceptedSharedBooking((prevBookings) =>
          prevBookings.filter((booking) => booking._id !== bookingId)
        );
        setDestinationCords(null);
        setCommuterLocation(null);
      } else {
        console.error("Failed to complete booking:", response.data.message);
      }
    } catch (error) {
      console.error(
        "Error completing booking:",
        error.response ? error.response.data : error.message
      );
    } finally {
      setEndRideModalVisible(false);
      setSelectedParent(null);
    }
  };

  //reject
  const getRejectedBookings = async () => {
    try {
      const rejected = await AsyncStorage.getItem("rejectedBookings");
      return rejected ? JSON.parse(rejected) : [];
    } catch (error) {
      console.error("Error fetching rejected bookings:", error);
      return [];
    }
  };

  const saveRejectedBooking = async (bookingId) => {
    try {
      const rejected = await getRejectedBookings();
      rejected.push(bookingId);
      await AsyncStorage.setItem("rejectedBookings", JSON.stringify(rejected));
    } catch (error) {
      console.error("Error saving rejected booking:", error);
    }
  };

  const handleReject = async (bookingId) => {
    await saveRejectedBooking(bookingId);
    setBookings((prevBookings) =>
      prevBookings.filter((booking) => booking._id !== bookingId)
    );
  };

  const handleMessage = (userId) => {
    try {
      if (userId) {
        navigation.navigate("Message", { userId });
      } else {
        console.error("User ID is missing.");
      }
    } catch (error) {
      console.error("Error handling the message action:", error.message);
    }
  };


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
  const getLiveLocation = async (driverId) => {
    try {
      const { status } = await requestForegroundPermissionsAsync();
      if (status !== "granted") {
        updateState({
          errorMessage: "Permission to access location was denied",
        });
        return null;
      }

      const location = await getCurrentPositionAsync({
        accuracy: LocationAccuracy.High,
      });
      const { latitude, longitude } = location.coords;
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

      await updateDriverLocation(driverId, curLoc);

      return curLoc;
    } catch (error) {
      updateState({
        errorMessage: error.message,
      });
      return null;
    }
  };

  const updateDriverLocation = async (driverId, curLoc) => {
    try {
      const response = await fetch(
        `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/update-driver-location`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            driverId,
            latitude: curLoc.latitude,
            longitude: curLoc.longitude,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update driver location");
      }

      const data = await response.json();
    } catch (error) {
      console.error("Error updating driver location:", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      getLiveLocation();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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
        if (!token) throw new Error("No token found");
  
        if (!driverId) throw new Error("No driver ID provided");
  
        // Get live location of the driver
        const driverLocation = await getLiveLocation(driverId);
        if (!driverLocation) return; // Stop if location cannot be fetched
  
        const res = await axios.get(
          "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/available",
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { driverId, vehicleType: selectedVehicleType },
          }
        );
  
        if (res.data.status === "ok") {
          let bookingsData = res.data.data;
  
          const rejectedBookingsJSON = await AsyncStorage.getItem("rejectedBookings");
          const rejectedBookings = rejectedBookingsJSON
            ? JSON.parse(rejectedBookingsJSON)
            : [];
  
          bookingsData = bookingsData.filter(
            (booking) => !rejectedBookings.includes(booking._id)
          );
  
          if (selectedVehicleType) {
            bookingsData = bookingsData.filter(
              (booking) => booking.vehicleType === selectedVehicleType
            );
          }
  
          const bookingsNearby = bookingsData.filter((booking) => {
            const pickupLocation = {
              latitude: booking.pickupLocation.latitude,
              longitude: booking.pickupLocation.longitude,
            };
            const distance = haversine(driverLocation, pickupLocation, { unit: "km" });
            return distance <= 1;
          });
  
          const getAddress = async (latitude, longitude) => {
            const reverseGeocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=pk.eyJ1IjoibWF3aTIxIiwiYSI6ImNseWd6ZGp3aTA1N2IyanM5Ymp4eTdvdzYifQ.0mYPMifHNHONTvY6mBbkvg`;
            const geoResponse = await axios.get(reverseGeocodeUrl);
            if (geoResponse.data.features.length > 0) {
              let barangay = "";
              let district = "";
              geoResponse.data.features[0].context.forEach((component) => {
                if (component.id.includes("locality")) {
                  barangay = component.text;
                } else if (component.id.includes("place")) {
                  district = component.text;
                }
              });
              return `${barangay}, ${district}` || "Address not found";
            }
            return "Address not found";
          };
  
          const bookingsWithAddresses = await Promise.all(
            bookingsNearby.map(async (booking) => {
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
            })
          );
  
          setBookings(bookingsWithAddresses);
          console.log("Available bookings with addresses:", bookingsWithAddresses);
        } else {
          console.error("Error fetching bookings:", res.data.message);
        }
      } catch (error) {
        console.error("Error fetching available bookings:", error);
      }
    };
  
    if (online && driverId) {
      fetchAvailableBookings();
      const intervalId = setInterval(fetchAvailableBookings, 3000);
      return () => clearInterval(intervalId);
    }
  }, [online, driverId, selectedVehicleType]);
  
  useEffect(() => {
    const fetchJoinRequestsForAcceptedBooking = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          throw new Error("No token found");
        }

        const bookingId = await AsyncStorage.getItem("bookingId");
        if (!bookingId) {
          throw new Error("No parent booking ID found");
        }

        console.log("Booking ID (accepted parentBooking):", bookingId);

        const res = await axios.get(
          `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/joining/shared/${bookingId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              vehicleType: selectedVehicleType || "",
              driverId: driverId || "",
            },
          }
        );

        if (res.data.status === "ok") {
          let joinData = res.data.data;
          const rejectedBookingsJSON = await AsyncStorage.getItem(
            "rejectedBookings"
          );
          const rejectedBookings = rejectedBookingsJSON
            ? JSON.parse(rejectedBookingsJSON)
            : [];
          joinData = joinData.filter(
            (booking) => !rejectedBookings.includes(booking._id)
          );

          joinData = joinData.filter(
            (joinBooking) =>
              joinBooking.rideAction === "Join" &&
              joinBooking.status === "pending"
          );

          if (joinData.length > 0) {
            const getAddress = async (latitude, longitude) => {
              const reverseGeocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=pk.eyJ1IjoibWF3aTIxIiwiYSI6ImNseWd6ZGp3aTA1N2IyanM5Ymp4eTdvdzYifQ.0mYPMifHNHONTvY6mBbkvg`;
              const geoResponse = await axios.get(reverseGeocodeUrl);
              if (geoResponse.data.features.length > 0) {
                let barangay = "";
                let district = "";

                const addressComponents = geoResponse.data.features[0].context;

                addressComponents.forEach((component) => {
                  if (component.id.includes("locality")) {
                    barangay = component.text;
                  } else if (component.id.includes("place")) {
                    district = component.text;
                  }
                });

                return `${barangay}, ${district}` || "Address not found";
              }
              return "Address not found";
            };

            const joinRequestsWithAddresses = await Promise.all(
              joinData.map(async (joinBooking) => {
                const pickupAddress = await getAddress(
                  joinBooking.pickupLocation.latitude,
                  joinBooking.pickupLocation.longitude
                );
                const destinationAddress = await getAddress(
                  joinBooking.destinationLocation.latitude,
                  joinBooking.destinationLocation.longitude
                );

                console.log("User Data:", joinBooking.user);

                let userId = joinBooking.user;

                if (
                  typeof joinBooking.user === "object" &&
                  joinBooking.user !== null
                ) {
                  userId = joinBooking.user._id || joinBooking.user.id;
                }

                if (userId) {
                  await AsyncStorage.setItem("userId", userId);
                  console.log("Stored userId:", userId);
                } else {
                  console.error("User ID is undefined or invalid");
                }

                return {
                  ...joinBooking,
                  pickupAddress,
                  destinationAddress,
                };
              })
            );

            setJoinRequests(joinRequestsWithAddresses);
            console.log(
              "Join requests with addresses:",
              joinRequestsWithAddresses
            );
            console.log(
              "User IDs from join requests:",
              joinRequestsWithAddresses.map((request) => request.user)
            );
          } else {
            console.log("No join requests found.");
          }
        } else {
          // Handle error or unexpected response status
          console.log("Error fetching join requests:", res.data.status);
        }
      } catch (error) {
        // Handle error
        console.error("Error in fetching join requests:", error);
      }
    };

    if (driverId) {
      fetchJoinRequestsForAcceptedBooking();
      const intervalId = setInterval(fetchJoinRequestsForAcceptedBooking, 6000);
      return () => clearInterval(intervalId);
    }
  }, [selectedVehicleType, driverId]);


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
        `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/subs/subscription/status/${driverId}`
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

  const startPollingForCancel = (bookingId, token) => {
    const intervalId = setInterval(async () => {
      try {
        const res = await axios.get(
          `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/ride/booking/${bookingId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("API Response Copassengers:", res.data.copassengers);
        if (res.data) {
          const updatedBooking = res.data;

          if (updatedBooking.status === "canceled") {
            if (updatedBooking.cancellation.canceledByType === "Driver") {
              clearInterval(intervalId);
              return;
            }

            console.log("Booking has been canceled. Stopping polling.");
            clearInterval(intervalId);

            setAcceptedSharedBooking((prevBookings) => {
              return prevBookings.map((booking) =>
                booking._id === bookingId && booking.status !== "canceled"
                  ? { ...booking, status: "canceled" }
                  : booking
              );
            });

            setJoinAcceptedSharedBooking((prevBookings) =>
              prevBookings.map((booking) => {
                if (booking._id === bookingId) {
                  const updatedCopassengers = updatedBooking.copassengers.length
                    ? booking.copassengers.map((cp) =>
                        updatedBooking.copassengers.some(
                          (updatedCp) =>
                            updatedCp._id === cp._id &&
                            updatedCp.status === "canceled"
                        )
                          ? { ...cp, status: "canceled" }
                          : cp
                      )
                    : booking.copassengers;
                  return { ...booking, copassengers: updatedCopassengers };
                }
                return booking;
              })
            );

            const { cancellation } = updatedBooking;
            if (navigation && navigation.navigate) {
              navigation.navigate("Cancelled", {
                date: cancellation?.timestamp,
                reason: cancellation?.reason,
                bookingId: updatedBooking._id,
                userId: updatedBooking.user,
              });
            }
            updatedBooking.copassengers.forEach((copassenger) => {
              if (
                copassenger.status === "canceled" &&
                !hasNavigatedRef.current
              ) {
                console.log(
                  `Copassenger ${copassenger._id} has canceled. Navigating to Cancelled screen.`
                );
                hasNavigatedRef.current = true;

                setJoinAcceptedSharedBooking((prevBookings) =>
                  prevBookings.map((booking) => {
                    if (booking._id === bookingId) {
                      const updatedCopassengers = booking.copassengers.map(
                        (cp) =>
                          cp._id === copassenger._id
                            ? { ...cp, status: "canceled" }
                            : cp
                      );
                      return { ...booking, copassengers: updatedCopassengers };
                    }
                    return booking;
                  })
                );
              }
            });
          }
          updatedBooking.copassengers.forEach((copassenger) => {
            if (copassenger.status === "canceled") {
              setJoinAcceptedSharedBooking((prevBookings) =>
                prevBookings.map((booking) => {
                  if (booking._id === bookingId) {
                    const updatedCopassengers = booking.copassengers.map((cp) =>
                      cp._id === copassenger._id
                        ? { ...cp, status: "canceled" }
                        : cp
                    );
                    return { ...booking, copassengers: updatedCopassengers };
                  }
                  return booking;
                })
              );
            }
          });
        }
      } catch (error) {
        console.error("Error fetching booking status:", error.message);
      }
    }, 3000);

    setPollingInterval(intervalId);
  };

  // Cleanup Effect
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        console.log("Stopped polling on unmount.");
      }
    };
  }, [pollingInterval]);

  useEffect(() => {
    if (route.params?.resetStates) {
      console.log(
        "Resetting state due to resetStates:",
        route.params.resetStates
      );

      setAcceptedSpecialBooking(null);
      navigation.setParams({ resetStates: false });
    }
  }, [route.params?.resetStates]);

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookingItem}>
      {item && (
        <View style={{}}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View>
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
            </View>
            <View>
              <Text
                style={{ color: "black", fontSize: 16, fontWeight: "bold" }}
              >
                ₱{item.fare.toFixed(2) || "Ride type not available"}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", width: "100%" }}>
            <TouchableOpacity
              style={[styles.bookingButton, { flex: 1, marginRight: 5 }]}
              onPress={() => handleAccept(item._id)}
            >
              <Text style={{ color: "white" }}>Accept Booking</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bookingButton, { flex: 1, marginLeft: 5 }]}
              onPress={() => handleReject(item._id)}
            >
              <Text style={{ color: "white" }}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const renderJoinSharedBookingItem = ({ item }) => (
    <View style={styles.bookingItem}>
      {item && (
        <>
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
            Ride Action {item.rideAction || "Ride type not available"}
          </Text>
          <Text>{item.status || "Ride type not available"}</Text>
          <Text style={styles.commuterinfoText}>{item.user}</Text>
          <TouchableOpacity
            style={styles.bookingButton}
            onPress={() => handleAcceptJoinRequest(item._id)}
          >
            <Text style={{ color: "white" }}>Accept Booking</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bookingButton}
            onPress={() => handleRejectCopassenger(item._id)}
          >
            <Text style={{ color: "white" }}>Reject</Text>
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
          <View style={styles.bookingDetail}>
            {!isPickupConfirmed[acceptedSpecialBooking._id] ? (
              <Text style={styles.sharedBookingItemTextLight}>
                Pickup: {acceptedSpecialBooking.pickupAddress}
              </Text>
            ) : (
              <Text style={styles.sharedBookingItemTextLight}>
                Destination: {acceptedSpecialBooking.destinationAddress}
              </Text>
            )}
            <View style={styles.bookingDetails}>
              <TouchableOpacity
                onPress={() => openDetailsModal(acceptedSpecialBooking)}
              >
                <Text style={styles.sharedBookingItemText}>Details</Text>
              </TouchableOpacity>
            </View>
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
                    <TouchableOpacity
                      onPress={closeDetailsModal}
                      style={styles.closeDetailsButton}
                    >
                      <Icon
                        name="times"
                        size={18}
                        color="#000"
                        style={styles.closeIcon}
                      />
                    </TouchableOpacity>
                    <View style={styles.bookingDetailsContainer}>
                      <Text style={styles.bookingDetailsHeader}>
                        Booking Details
                      </Text>
                    </View>
                    {selectedCommuter && (
                      <View style={styles.bookingContainer}>
                        <View style={styles.bookingInfo}>
                          {selectedCommuter.profilePic ? (
                            <Image
                              source={{ uri: selectedCommuter.profilePic }}
                              style={{
                                width: 60,
                                height: 60,
                                borderRadius: 30,
                              }}
                            />
                          ) : (
                            <Image
                              source={imagePath.defaultPic}
                              style={{
                                width: 60,
                                height: 60,
                                borderRadius: 30,
                              }}
                              resizeMode="contain"
                            />
                          )}
                          <View style={styles.commuterInfo}>
                            <Text style={styles.commuterinfoText}>
                              {selectedCommuter.name}
                            </Text>
                            <Text style={styles.commuterinfoText}>
                              {selectedCommuter.status}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.location}>
                          <View style={styles.pickupLocation}>
                            <Text style={styles.locationText}>Pickup:</Text>
                            <Text style={styles.locationText}>
                              {selectedCommuter.pickupAddress}
                            </Text>
                          </View>
                          <View style={styles.destinationLocation}>
                            <Text style={styles.locationText}>Drop-off:</Text>
                            <Text style={styles.locationText}>
                              {selectedCommuter.destinationAddress}
                            </Text>
                          </View>
                        </View>
                        <View>
                          <View style={styles.fares}>
                            <Text style={styles.fareText}>
                              Fare: {selectedCommuter.fare.toFixed(2)}
                            </Text>
                            <Text style={styles.fareText}>
                              Est. Time: {selectedCommuter.time}
                            </Text>
                            <Text style={styles.fareText}>
                              Distance: {selectedCommuter.distance}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.communication}>
                          <TouchableOpacity
                            onPress={() => handleMessage(selectedCommuter.user)}
                            style={styles.communicationContainer}
                          >
                            <Text style={styles.communicationText}>
                              <Icon
                                name="envelope"
                                size={18}
                                color="#000"
                                style={styles.communicationIcon}
                              />{" "}
                              Message
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </Animated.View>
            </View>
          </Modal>

          <View style={styles.updateStatus}>
            {distanceToPickup[acceptedSpecialBooking._id] < 4.5 &&
              !isPickupConfirmed[acceptedSpecialBooking._id] && (
                <View style={styles.arrivalMessageContainer}>
                  <TouchableOpacity
                    style={styles.statusContainer}
                    onPress={() =>
                      openSpecialArrivalModal(acceptedSpecialBooking._id)
                    }
                  >
                    <Text style={styles.arrivalMessageText}>
                      Arrived at Pickup
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

            {isPickupConfirmed[acceptedSpecialBooking._id] &&
              acceptedSpecialBooking.status === "Arrived" && (
                <View style={styles.arrivalMessageContainer}>
                  <TouchableOpacity
                    style={styles.statusContainer}
                    onPress={() =>
                      openSpecialPickupModal(acceptedSpecialBooking._id)
                    }
                  >
                    <Text style={styles.arrivalMessageText}>
                      Confirm Pickup
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

            {isPickupConfirmed[acceptedSpecialBooking._id] &&
              distanceToDropoff[acceptedSpecialBooking._id] < 100.5 &&
              acceptedSpecialBooking.status === "On board" && (
                <View style={styles.arrivalMessageContainer}>
                  <TouchableOpacity
                    style={styles.statusContainer}
                    onPress={() =>
                      openSpecialTripDropoffModal(acceptedSpecialBooking._id)
                    }
                  >
                    <Text style={styles.arrivalMessageText}>
                      Confirm Drop Off
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            {acceptedSpecialBooking.status === "Dropped off" ? (
              <TouchableOpacity
                style={styles.endContainer}
                onPress={() =>
                  openSpecialTripEndRideModal(acceptedSpecialBooking._id)
                }
              >
                <Text style={styles.arrivalMessageText}>End Ride</Text>
              </TouchableOpacity>
            ) : null}

            {acceptedSpecialBooking.status !== "Dropped off" && (
              <View style={styles.cancelButton}>
                <TouchableOpacity
                  onPress={() =>openSpecialCancelModal(acceptedSpecialBooking._id)}
                >
                  <Text style={styles.arrivalMessageText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Modal
            animationType="slide"
            transparent={true}
            visible={modalSpecialTripArrivalVisible}
            onRequestClose={closeSpecialTripArrivalModal}
          >
            <View style={styles.modalConfirm}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Confirm Arrival </Text>
                <Text style={styles.modalMessage}>
                  Are you sure you want to confirm your arrival at the pickup
                  location?
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    onPress={handleConfirmSpecialTripArrival}
                    style={styles.confirmButton}
                  >
                    <Text style={styles.arrivalMessageText}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={closeSpecialTripArrivalModal}
                    style={styles.confirmButton}
                  >
                    <Text style={styles.arrivalMessageText}>No</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Modal
            animationType="slide"
            transparent={true}
            visible={modalCancelVisible}
            onRequestClose={closeSpecialTripCancelModal}
          >
            <View style={styles.modalConfirm}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Confirm Cancel Booking</Text>
                <Text style={styles.modalMessage}>
                  Are you sure you want to cancel?
                </Text>
                <View style={styles.dropdownContainer}>
                  <Picker
                    selectedValue={selectReason}
                    onValueChange={(itemValue) => {
                      console.log("Selected payment method:", itemValue);
                      setSelectReason(itemValue);
                    }}
                    style={styles.picker}
                  >
                    <Picker.Item label="Reason" value="" />
                    <Picker.Item
                      label="Long Wait Time"
                      value="Long Wait Time"
                    />
                    <Picker.Item
                      label="Vehicle malfunction"
                      value="Vehicle malfunction"
                    />
                    <Picker.Item
                      label="Cancel due to personal reasons"
                      value="Driver has to cancel due to personal reasons"
                    />
                    <Picker.Item
                      label="Arrived at wrong location"
                      value="Driver arrived at wrong location"
                    />
                  </Picker>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    onPress={handleCancelBooking}
                    style={styles.confirmButton}
                  >
                    <Text style={styles.arrivalMessageText}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={closeSpecialTripCancelModal}
                    style={styles.confirmButton}
                  >
                    <Text style={styles.arrivalMessageText}>No</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Modal
            animationType="slide"
            transparent={true}
            visible={modalSpecialTripVisible}
            onRequestClose={closeSpecialTripPickupModal}
          >
            <View style={styles.modalConfirm}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Confirm Pickup </Text>
                <Text style={styles.modalMessage}>
                  Are you sure you want to confirm your pickup at the pickup
                  location?
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    onPress={handleConfirmSpecialTripPickup}
                    style={styles.confirmButton}
                  >
                    <Text style={styles.arrivalMessageText}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={closeSpecialTripPickupModal}
                    style={styles.confirmButton}
                  >
                    <Text style={styles.arrivalMessageText}>No</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Modal
            visible={modalSpecialTripDropoffVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={closeSpecialTripDropoffModal}
          >
            <View style={styles.modalConfirm}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Confirm Drop Off</Text>
                <Text style={styles.modalMessage}>
                  Are you sure you want to confirm the drop-off?
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    onPress={() => {
                      confirmSpecialTripDropOff(acceptedSpecialBooking._id);
                      closeSpecialTripDropoffModal();
                    }}
                    style={styles.confirmButton}
                  >
                    <Text style={styles.arrivalMessageText}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={closeSpecialTripPickupModal}
                    style={styles.confirmButton}
                  >
                    <Text style={styles.arrivalMessageText}>No</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Modal
            visible={modalSpecialTripEndRideVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={closeSpecialTripEndRideModal}
          >
            <View style={styles.modalConfirm}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>End Special Trip</Text>
                <Text style={styles.modalMessage}>
                  Are you sure you want to end this special trip? This will
                  complete the booking.
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    onPress={() => {
                      handleCompleteBooking(acceptedSpecialBooking._id);
                      closeSpecialTripEndRideModal();
                    }}
                    style={styles.confirmButton}
                  >
                    <Text style={styles.arrivalMessageText}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={closeSpecialTripEndRideModal}
                    style={styles.confirmButton}
                  >
                    <Text style={styles.arrivalMessageText}>No</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );

  const renderSharedBookingItem = ({ item }) => (
    <View style={styles.sharedRideContent}>
      <View style={styles.sharedBookingItem}>
        <Text style={styles.sharedBookingItemText}>{item.name}</Text>
        <View style={styles.bookingDetail}>
          {!isPickupConfirmed[item._id] ? (
            <Text style={styles.sharedBookingItemTextLight}>
              Pickup: {item.pickupAddress}
            </Text>
          ) : (
            <Text style={styles.sharedBookingItemTextLight}>
              Destination: {item.destinationAddress}
            </Text>
          )}

          <View style={styles.bookingDetails}>
            {item.status === "Dropped off" ? (
              <Text style={styles.sharedBookingItemText}>Dropped Off</Text>
            ) : item.status === "canceled" ? ( // Check for "Cancelled" status
              <Text style={styles.sharedBookingItemText}>Cancelled</Text>
            ) : (
              <TouchableOpacity onPress={() => openDetailsModal(item)}>
                <Text style={styles.sharedBookingItemText}>Details</Text>
              </TouchableOpacity>
            )}
          </View>
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
                  <TouchableOpacity
                    onPress={closeDetailsModal}
                    style={styles.closeDetailsButton}
                  >
                    <Icon
                      name="times"
                      size={18}
                      color="#000"
                      style={styles.closeIcon}
                    />
                  </TouchableOpacity>
                  <View style={styles.bookingDetailsContainer}>
                    <Text style={styles.bookingDetailsHeader}>
                      Booking Details
                    </Text>
                  </View>
                  {selectedCommuter && (
                    <View style={styles.bookingContainer}>
                      <View style={styles.bookingInfo}>
                        {selectedCommuter.profilePic ? (
                          <Image
                            source={{ uri: selectedCommuter.profilePic }}
                            style={{ width: 60, height: 60, borderRadius: 30 }}
                          />
                        ) : (
                          <Image
                            source={imagePath.defaultPic}
                            style={{ width: 60, height: 60, borderRadius: 30 }}
                            resizeMode="contain"
                          />
                        )}
                        <View style={styles.commuterInfo}>
                          <Text style={styles.commuterinfoText}>
                            {selectedCommuter.name}
                          </Text>
                          <Text style={styles.commuterinfoText}>
                            {selectedCommuter.status}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.location}>
                        <View style={styles.pickupLocation}>
                          <Text style={styles.locationText}>Pickup:</Text>
                          <Text style={styles.locationText}>
                            {selectedCommuter.pickupAddress}
                          </Text>
                        </View>
                        <View style={styles.destinationLocation}>
                          <Text style={styles.locationText}>Drop-off:</Text>
                          <Text style={styles.locationText}>
                            {selectedCommuter.destinationAddress}
                          </Text>
                        </View>
                      </View>
                      <View>
                        <View style={styles.fares}>
                          <Text style={styles.fareText}>
                            Fare: {selectedCommuter.fare.toFixed(2)}
                          </Text>

                          <Text style={styles.fareText}>
                            Est. Time: {selectedCommuter.time}
                          </Text>
                          <Text style={styles.fareText}>
                            Distance: {selectedCommuter.distance}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.communication}>
                        <TouchableOpacity
                          onPress={() => handleMessage(selectedCommuter.user)}
                          style={styles.communicationContainer}
                        >
                          <Text style={styles.communicationText}>
                            <Icon
                              name="envelope"
                              size={18}
                              color="#000"
                              style={styles.communicationIcon}
                            />{" "}
                            Message
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </Animated.View>
          </View>
        </Modal>

        {item.status !== "canceled" && (
          <View style={styles.updateStatus}>
            {distanceToPickup[item._id] < 4.5 &&
              !isPickupConfirmed[item._id] && (
                <View style={styles.arrivalMessageContainer}>
                  <TouchableOpacity
                    style={styles.statusContainer}
                    onPress={() => openSharedArrivalModal(item._id)}
                  >
                    <Text style={styles.arrivalMessageText}>
                      Arrived at Pickup
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

            {isPickupConfirmed[item._id] && item.status === "Arrived" && (
              <View style={styles.arrivalMessageContainer}>
                <TouchableOpacity
                  style={styles.statusContainer}
                  onPress={() => openParentPickupModal(item._id)}
                >
                  <Text style={styles.arrivalMessageText}>Confirm Pickup</Text>
                </TouchableOpacity>
              </View>
            )}

            {isPickupConfirmed[item._id] &&
              distanceToDropoff[item._id] < 100.5 &&
              item.status === "On board" && (
                <View style={styles.arrivalMessageContainer}>
                  <TouchableOpacity
                    style={styles.statusContainer}
                    onPress={() => openParentDropoffModal(item._id)}
                  >
                    <Text style={styles.arrivalMessageText}>
                      Confirm Drop Off
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

            {item.status !== "Dropped off" && (
              <View style={styles.cancelButton}>
                <TouchableOpacity
                  onPress={() => openSharedCancelModal(item._id)}
                >
                  <Text style={styles.arrivalMessageText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalSharedTripArrivalVisible}
          onRequestClose={closeSharedTripArrivalModal}
        >
          <View style={styles.modalConfirm}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Confirm Arrival</Text>
              <Text style={styles.modalMessage}>
                Are you sure you want to confirm your arrival at the pickup
                location?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={handleConfirmSharedTripArrival}
                  style={styles.confirmButton}
                >
                  <Text style={styles.arrivalMessageText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={closeSharedTripArrivalModal}
                  style={styles.confirmButton}
                >
                  <Text style={styles.arrivalMessageText}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalParentVisible}
          onRequestClose={closeParentPickupModal}
        >
          <View style={styles.modalConfirm}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Confirm Pickup</Text>
              <Text style={styles.modalMessage}>
                Are you sure you want to confirm your pickup at the pickup
                location?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={handleConfirmParentPickup}
                  style={styles.confirmButton}
                >
                  <Text style={styles.arrivalMessageText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={closeParentPickupModal}
                  style={styles.confirmButton}
                >
                  <Text style={styles.arrivalMessageText}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>

      <Modal
        visible={isParentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeParentDropoffModal}
      >
        <View style={styles.modalConfirm}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Drop Off</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to confirm the drop-off?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  confirmParentDropOff(selectedParent._id);
                  closeParentDropoffModal();
                }}
                style={styles.confirmButton}
              >
                <Text style={styles.arrivalMessageText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={closeParentDropoffModal}
                style={styles.confirmButton}
              >
                <Text style={styles.arrivalMessageText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalCancelSharedVisible}
        onRequestClose={closeSharedTripCancelModal}
      >
        <View style={styles.modalConfirm}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Cancel Booking</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to cancel?
            </Text>
            <View style={styles.dropdownContainer}>
              <Picker
                selectedValue={selectReason}
                onValueChange={(itemValue) => {
                  console.log("Selected payment method:", itemValue);
                  setSelectReason(itemValue);
                }}
                style={styles.picker}
              >
                <Picker.Item label="Reason" value="" />
                <Picker.Item label="Long Wait Time" value="Long Wait Time" />
                <Picker.Item
                  label="Vehicle malfunction"
                  value="Vehicle malfunction"
                />
                <Picker.Item
                  label="Cancel due to personal reasons"
                  value="Driver has to cancel due to personal reasons"
                />
                <Picker.Item
                  label="Arrived at wrong location"
                  value="Driver arrived at wrong location"
                />
              </Picker>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={handleCancelSharedBooking}
                style={styles.confirmButton}
              >
                <Text style={styles.arrivalMessageText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={closeSharedTripCancelModal}
                style={styles.confirmButton}
              >
                <Text style={styles.arrivalMessageText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderJoinSharedBooking = ({ item }) => (
    <View style={styles.sharedRideContent}>
      <View style={styles.sharedBookingItem}>
        <Text style={styles.sharedBookingItemText}>{item.name}</Text>
        <View style={styles.bookingDetail}>
          {!isPickupConfirmed[item._id] ? (
            <Text style={styles.sharedBookingItemTextLight}>
              Pickup: {item.pickupAddress}
            </Text>
          ) : (
            <Text style={styles.sharedBookingItemTextLight}>
              Destination: {item.destinationAddress}
            </Text>
          )}

          <View style={styles.bookingDetails}>
            <TouchableOpacity onPress={() => openCoPassengerDetailsModal(item)}>
              <Text style={styles.sharedBookingItemText}>Details</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Modal
          visible={isCopassengerDetailsModalVisible}
          transparent={true}
          animationType="none"
          onRequestClose={closeCoPassengerDetailsModal}
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
                  <TouchableOpacity
                    onPress={closeCoPassengerDetailsModal}
                    style={styles.closeDetailsButton}
                  >
                    <Icon
                      name="times"
                      size={18}
                      color="#000"
                      style={styles.closeIcon}
                    />
                  </TouchableOpacity>
                  <View style={styles.bookingDetailsContainer}>
                    <Text style={styles.bookingDetailsHeader}>
                      Booking Details
                    </Text>
                  </View>
                  {selectedCoPassenger && (
                    <View style={styles.bookingContainer}>
                      <View style={styles.bookingInfo}>
                        <View style={styles.circle} />
                        <View style={styles.commuterInfo}>
                          <Text style={styles.commuterinfoText}>
                            {selectedCoPassenger.name}
                          </Text>
                          <Text style={styles.commuterinfoText}>
                            {selectedCoPassenger.status}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.location}>
                        <View style={styles.pickupLocation}>
                          <Text style={styles.locationText}>Pickup:</Text>
                          <Text style={styles.locationText}>
                            {selectedCoPassenger.pickupAddress}
                          </Text>
                        </View>
                        <View style={styles.destinationLocation}>
                          <Text style={styles.locationText}>Drop-off:</Text>
                          <Text style={styles.locationText}>
                            {selectedCoPassenger.destinationAddress}
                          </Text>
                        </View>
                      </View>
                      <View>
                        <View style={styles.fares}>
                          <Text style={styles.fareText}>
                            Fare: {selectedCoPassenger.fare}
                          </Text>

                          <Text style={styles.fareText}>
                            Est. Time: {selectedCoPassenger.time}
                          </Text>
                          <Text style={styles.fareText}>
                            Distance: {selectedCoPassenger.distance || "NA"}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.communication}>
                        <TouchableOpacity
                          onPress={() =>
                            handleMessage(selectedCoPassenger.userId)
                          }
                          style={styles.communicationContainer}
                        >
                          <Text style={styles.communicationText}>
                            <Icon
                              name="envelope"
                              size={18}
                              color="#000"
                              style={styles.communicationIcon}
                            />{" "}
                            Message
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.communicationContainer}>
                          <Text style={styles.communicationText}>
                            <Icon
                              name="phone"
                              size={18}
                              color="#000"
                              style={styles.communicationIcon}
                            />{" "}
                            Call
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </Animated.View>
          </View>
        </Modal>
        <View style={styles.updateStatus}>
          {distanceToPickup[item._id] < 4.5 && !isPickupConfirmed[item._id] && (
            <View style={styles.arrivalMessageContainer}>
              <TouchableOpacity
                style={styles.statusContainer}
                onPress={() => openArrivedModal(item._id)}
              >
                <Text style={styles.arrivalMessageText}>Arrived at Pickup</Text>
              </TouchableOpacity>
            </View>
          )}

          {isPickupConfirmed[item._id] && item.status === "Arrived" && (
            <View style={styles.arrivalMessageContainer}>
              <TouchableOpacity
                style={styles.statusContainer}
                onPress={() => openPickupModal(item._id)}
              >
                <Text style={styles.arrivalMessageText}>Confirm Pickup</Text>
              </TouchableOpacity>
            </View>
          )}

          {isPickupConfirmed[item._id] &&
            distanceToDropoff[item._id] < 100.5 &&
            item.status === "On board" && (
              <View style={styles.arrivalMessageContainer}>
                <TouchableOpacity
                  style={styles.statusContainer}
                  onPress={() => openDropoffModal(item._id)}
                >
                  <Text style={styles.arrivalMessageText}>
                    Confirm Drop Off
                  </Text>
                </TouchableOpacity>
              </View>
            )}

          {item.status !== "Dropped off" && (
            <View style={styles.cancelButton}>
              <TouchableOpacity onPress={() => openSharedCancelModal(item._id)}>
                <Text style={styles.arrivalMessageText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalArrivedVisible}
          onRequestClose={closeArrivedModal}
        >
          <View style={styles.modalConfirm}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Confirm Arrival</Text>
              <Text style={styles.modalMessage}>
                Are you sure you want to confirm your arrival at the pickup
                location?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={handleConfirmArrival}
                  style={styles.confirmButton}
                >
                  <Text style={styles.arrivalMessageText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={closeArrivedModal}
                  style={styles.confirmButton}
                >
                  <Text style={styles.arrivalMessageText}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closePickupModal}
        >
          <View style={styles.modalConfirm}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Confirm Pick up</Text>
              <Text style={styles.modalMessage}>
                Are you sure you want to confirm your pickup at the pickup
                location?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={handleConfirmPickup}
                  style={styles.confirmButton}
                >
                  <Text style={styles.arrivalMessageText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={closePickupModal}
                  style={styles.confirmButton}
                >
                  <Text style={styles.arrivalMessageText}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
      <Modal
        visible={isConfirmationModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeDropoffModal}
      >
        <View style={styles.modalConfirm}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Drop Off</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to confirm the drop-off?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  confirmDropOff(selectedCopassenger._id); // Pass the selected copassenger ID
                  closeDropoffModal(); // Close the modal after confirmation
                }}
                style={styles.confirmButton}
              >
                <Text style={styles.arrivalMessageText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={closeDropoffModal}
                style={styles.confirmButton}
              >
                <Text style={styles.arrivalMessageText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  const { width } = Dimensions.get("window");
  const translateX = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    if (isCopassengerDetailsModalVisible) {
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
  }, [isCopassengerDetailsModalVisible]);
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


  useEffect(() => {
    const fetchDriverId = async () => {
      try {
        const storedDriverId = await AsyncStorage.getItem("driverId");
        if (storedDriverId) {
          setDriverId(storedDriverId);
          fetchDriverData(storedDriverId);
        } else {
          Alert.alert("Error", "Driver ID not found. Please log in again.");
        }
      } catch (error) {
        console.error("Error fetching driver ID:", error);
        Alert.alert("Error", "Error fetching driver ID");
      }
    };

    const fetchDriverData = async (id) => {
      try {
        const response = await axios.get(
          `https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/driver/driver/${id}`
        );
        setVehicleType(response.data.vehicleInfo2.vehicleType); 
      } catch (error) {
        console.error("Error fetching user data:", error);
        Alert.alert("Error", "Error fetching user data");
      }
    };

    fetchDriverId();
  }, []);

  const renderPromotionImage = () => {
    if (vehicleType === 'Tricycle') {
      return (
        <Image
          source={imagePath.tricyclePromotion} 
          style={{
            width: '90%',
            height: '80%',
            resizeMode: 'contain',
            backgroundColor: 'transparent',
          }}
        />
      );
    } else {
      return (
        <Image
          source={imagePath.jeepPromotion} 
          style={{
            width: '90%',
            height: '80%',
            resizeMode: 'contain',
            backgroundColor: 'transparent',
          }}
        />
      );
    }
  };



  return (
      <View style={styles.container}>
        <Loader isLoading={isLoading} />
        {subscribed === false && showImage && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        >
          {renderPromotionImage()} 
          <TouchableOpacity
            onPress={() => setShowImage(false)}
            style={{
              position: 'absolute',
              bottom: 20,
              paddingVertical: 10,
              paddingHorizontal: 20,
              backgroundColor: 'white',
              borderRadius: 10,
            }}
          >
            <Text style={{ color: '#000', fontSize: 16 }}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}



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

        {acceptedSpecialBooking && (
          <React.Fragment>
            {!isPickupConfirmed[acceptedSpecialBooking._id] && (
              <MapViewDirections
                key={`direction-pickup-${acceptedSpecialBooking._id}`}
                origin={curLoc} 
                destination={acceptedSpecialBooking.pickupLocation} 
                apikey={GOOGLE_MAP_KEY}
                strokeWidth={6}
                strokeColor="red" 
                optimizeWaypoints={true}
                onReady={(result) => {
                  setDistanceToPickup((prevDistances) => ({
                    ...prevDistances,
                    [acceptedSpecialBooking._id]: result.distance,
                  }));
                  fetchTime(result.duration);
                  mapRef.current.fitToCoordinates(
                    [curLoc, acceptedSpecialBooking.pickupLocation],
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
            {isPickupConfirmed[acceptedSpecialBooking._id] && (
              <MapViewDirections
                key={`direction-destination-${acceptedSpecialBooking._id}`}
                origin={acceptedSpecialBooking.pickupLocation}
                destination={acceptedSpecialBooking.destinationLocation}
                apikey={GOOGLE_MAP_KEY}
                strokeWidth={6}
                strokeColor="black"
                optimizeWaypoints={true}
                onReady={(result) => {
                  setDistanceToDropoff((prevDistances) => ({
                    ...prevDistances,
                    [acceptedSpecialBooking._id]: result.distance,
                  }));
                  fetchTime(result.duration);
                  mapRef.current.fitToCoordinates(
                    [
                      acceptedSpecialBooking.pickupLocation,
                      acceptedSpecialBooking.destinationLocation,
                    ],
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

            <Marker coordinate={curLoc} title="Current Location" />
            <Marker
              coordinate={acceptedSpecialBooking.pickupLocation}
              title="Pickup Location"
            />

            {isPickupConfirmed[acceptedSpecialBooking._id] && (
              <Marker
                coordinate={acceptedSpecialBooking.destinationLocation}
                title="Destination"
              />
            )}
          </React.Fragment>
        )}

        {acceptedSharedBooking.map((booking) => (
          <React.Fragment key={booking.id}>
            {!isPickupConfirmed[booking._id] && (
              <MapViewDirections
                key={`direction-pickup-${booking.id}`}
                origin={curLoc}
                destination={booking.pickupLocation}
                apikey={GOOGLE_MAP_KEY}
                strokeWidth={6}
                strokeColor="red"
                optimizeWaypoints={true}
                onReady={(result) => {
                  setDistanceToPickup((prevDistances) => ({
                    ...prevDistances,
                    [booking._id]: result.distance,
                  }));
                  fetchTime(result.duration);
                  mapRef.current.fitToCoordinates(
                    [curLoc, booking.pickupLocation],
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

            {isPickupConfirmed[booking._id] && (
              <MapViewDirections
                key={`direction-destination-${booking.id}`}
                origin={booking.pickupLocation}
                destination={booking.destinationLocation}
                apikey={GOOGLE_MAP_KEY}
                strokeWidth={6}
                strokeColor="black"
                optimizeWaypoints={true}
                onReady={(result) => {
                  setDistanceToDropoff((prevDistances) => ({
                    ...prevDistances,
                    [booking._id]: result.distance,
                  }));
                  fetchTime(result.distance, result.duration);
                  mapRef.current.fitToCoordinates(
                    [booking.pickupLocation, booking.destinationLocation],
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
            <Marker coordinate={curLoc} title="Current Location" />
            <Marker
              coordinate={booking.pickupLocation}
              title="Pickup Location"
            />

            {isPickupConfirmed[booking._id] && (
              <Marker
                coordinate={booking.destinationLocation}
                title="Destination"
              />
            )}
          </React.Fragment>
        ))}

        {acceptedJoinSharedBooking.map((booking) => (
          <React.Fragment key={booking._id}>
            {booking.copassengers && booking.copassengers.length > 0 && (
              <View>
                {booking.copassengers.map((copassenger) => (
                  <React.Fragment key={copassenger._id}>
                    {!isPickupConfirmed[copassenger._id] && (
                      <MapViewDirections
                        key={`direction-copassenger-pickup-${copassenger._id}`}
                        origin={curLoc}
                        destination={copassenger.pickupLocation}
                        apikey={GOOGLE_MAP_KEY}
                        strokeWidth={4}
                        strokeColor="blue"
                        optimizeWaypoints={true}
                        onReady={(result) => {
                          console.log(
                            `Distance to ${copassenger.name}: ${result.distance} km`
                          );

                          setDistanceToPickup((prevDistances) => ({
                            ...prevDistances,
                            [copassenger._id]: result.distance,
                          }));

                          fetchTime(result.duration);
                          mapRef.current.fitToCoordinates(
                            [curLoc, copassenger.pickupLocation],
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

                    <Marker
                      coordinate={copassenger.pickupLocation}
                      title={`${copassenger.name} - Pickup`}
                    />
                    <Marker
                      coordinate={copassenger.destinationLocation}
                      title={`${copassenger.name} - Destination`}
                    />
                  </React.Fragment>
                ))}
              </View>
            )}

            {booking.copassengers &&
              booking.copassengers.length > 0 &&
              booking.copassengers.map(
                (copassenger) =>
                  isPickupConfirmed[copassenger._id] && (
                    <MapViewDirections
                      key={`direction-destination-join-${copassenger._id}`}
                      origin={copassenger.pickupLocation}
                      destination={copassenger.destinationLocation}
                      apikey={GOOGLE_MAP_KEY}
                      strokeWidth={6}
                      strokeColor="black"
                      optimizeWaypoints={true}
                      onReady={(result) => {
                        console.log(
                          `Distance to ${copassenger.name}: ${result.distance} km`
                        );

                        setDistanceToDropoff((prevDistances) => ({
                          ...prevDistances,
                          [copassenger._id]: result.distance,
                        }));

                        fetchTime(result.distance, result.duration);
                        mapRef.current.fitToCoordinates(
                          [
                            copassenger.pickupLocation,
                            copassenger.destinationLocation,
                          ],
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
                  )
              )}

            <Marker coordinate={curLoc} title="Current Location" />

            {booking.copassengers &&
              booking.copassengers.length > 0 &&
              booking.copassengers.map((copassenger) => (
                <React.Fragment key={`marker-${copassenger._id}`}>
                  <Marker
                    coordinate={copassenger.pickupLocation}
                    title={`${copassenger.name} - Pickup Location`}
                  />
                  {isPickupConfirmed[copassenger._id] && (
                    <Marker
                      coordinate={copassenger.destinationLocation}
                      title={`${copassenger.name} - Destination`}
                    />
                  )}
                </React.Fragment>
              ))}
          </React.Fragment>
        ))}
      </MapView>



      <TouchableOpacity style={styles.centerButton} onPress={onCenter}>
        <Image source={imagePath.greenIndicator} />
      </TouchableOpacity>
      <View style={styles.bottomCard}>
        <View style={styles.bottomContainer}>
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
        {acceptedSpecialBooking ? (
          <View
            style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 15 }}
          >
            {renderSpecialBookingItem()}
          </View>
        ) : acceptedSharedBooking.length > 0 ? (
          <View style={{}}>
            <FlatList
              data={acceptedSharedBooking}
              renderItem={renderSharedBookingItem}
              keyExtractor={(item) => item._id.toString()}
              contentContainerStyle={styles.sharedBookingList}
            />

            {acceptedJoinSharedBooking.map((booking) =>
              booking.copassengers && booking.copassengers.length > 0 ? (
                <View key={booking._id}>
                  <FlatList
                    data={booking.copassengers.filter(
                      (copassenger) =>
                        copassenger.status !== "Dropped off" &&
                        copassenger.status !== "canceled"
                    )}
                    renderItem={renderJoinSharedBooking}
                    keyExtractor={(item) => item._id.toString()}
                    contentContainerStyle={styles.sharedBookingList}
                  />
                </View>
              ) : null
            )}

            {joinRequests.length > 0 ? (
              <>
                <Text>Join Requests</Text>
                <FlatList
                  data={joinRequests}
                  keyExtractor={(item) => item._id.toString()}
                  renderItem={renderJoinSharedBookingItem}
                  contentContainerStyle={styles.joinRequestList}
                />
              </>
            ) : null}

            {allPassengersDroppedOff ||
            acceptedSharedBooking.some(
              (booking) =>
                booking.status === "canceled" ||
                booking.status === "Dropped off"
            ) ? (
              <TouchableOpacity
                onPress={() => openEndRideModal(acceptedSharedBooking[0]._id)}
                style={styles.sharedBookingModal}
              >
                <Text style={styles.rideDetails}>End Ride</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={openModal}
                style={styles.sharedBookingModal}
              >
                <Text style={styles.rideDetails}>
                  Ride Details
                  <Icon
                    name="chevron-up"
                    size={12}
                    color="#000"
                    style={styles.communicationIcon}
                  />
                </Text>
              </TouchableOpacity>
            )}

            <Modal
              animationType="slide"
              transparent={true}
              visible={isEndRideModalVisible}
              onRequestClose={() => setEndRideModalVisible(false)}
            >
              <View style={styles.modalConfirm}>
                <View style={styles.modalContainer}>
                  <Text style={styles.modalMessage}>
                    Are you sure you want to end the ride?
                  </Text>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      onPress={endRide}
                      style={styles.confirmButton}
                    >
                      <Text style={styles.arrivalMessageText}>Yes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setEndRideModalVisible(false)}
                      style={styles.confirmButton}
                    >
                      <Text style={styles.arrivalMessageText}>No</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            <Modal
              visible={isModalVisible}
              animationType="slide"
              transparent={true}
              onRequestClose={closeModal}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalDetailsContainer}>
                  <View style={styles.modalContent}>
                    <TouchableOpacity
                      onPress={closeModal}
                      style={styles.closeButton}
                    >
                      <Icon
                        name="times"
                        size={18}
                        color="#000"
                        style={styles.closeIcon}
                      />
                    </TouchableOpacity>
                    <Text style={styles.bookingDetailsHeaderText}>
                      Shared Ride in Progress
                    </Text>
                    <Text style={styles.bookingDetailsSubHeader}>Stops</Text>

                    {Array.isArray(acceptedSharedBooking) &&
                      acceptedSharedBooking.map((booking, index) => (
                        <Text
                          key={`pickup-shared-${index}`}
                          style={[
                            styles.bookingDetailsText,
                            isPickupConfirmed && { color: "green" },
                          ]}
                        >
                          {index + 1}. Pickup: {booking.name} At{" "}
                          {booking.pickupAddress}
                        </Text>
                      ))}

                    {Array.isArray(acceptedJoinSharedBooking) &&
                      acceptedJoinSharedBooking.map((booking, index) => (
                        <React.Fragment key={`pickup-joined-${index}`}>
                          {Array.isArray(booking.copassengers) &&
                            booking.copassengers.map(
                              (copassenger, copassengerIndex) => (
                                <Text
                                  key={`copassenger-${copassengerIndex}`}
                                  style={[
                                    styles.bookingDetailsText,
                                    isPickupConfirmed && { color: "green" },
                                  ]}
                                >
                                  {acceptedSharedBooking.length +
                                    copassengerIndex +
                                    1}
                                  . Pickup: {copassenger.name} At{" "}
                                  {copassenger.pickupAddress}
                                </Text>
                              )
                            )}
                        </React.Fragment>
                      ))}

                    {Array.isArray(acceptedSharedBooking) &&
                      acceptedSharedBooking.map((booking, index) => (
                        <Text
                          key={`dropoff-shared-${index}`}
                          style={[
                            styles.bookingDetailsText,
                            isPickupConfirmed && { color: "green" },
                          ]}
                        >
                          {totalPickups + index + 1}. Drop-off: {booking.name}{" "}
                          At {booking.destinationAddress}
                        </Text>
                      ))}

                    {Array.isArray(acceptedJoinSharedBooking) &&
                      acceptedJoinSharedBooking.map((booking, bookingIndex) => (
                        <React.Fragment key={`dropoff-joined-${bookingIndex}`}>
                          {Array.isArray(booking.copassengers) &&
                            booking.copassengers.map(
                              (copassenger, copassengerIndex) => (
                                <Text
                                  key={`copassenger-dropoff-${copassengerIndex}`}
                                  style={[
                                    styles.bookingDetailsText,
                                    isPickupConfirmed && { color: "green" },
                                  ]}
                                >
                                  {totalPickups +
                                    acceptedSharedBooking.length +
                                    bookingIndex +
                                    copassengerIndex +
                                    1}
                                  . Drop-off: {copassenger.name} At{" "}
                                  {copassenger.destinationAddress}
                                </Text>
                              )
                            )}
                        </React.Fragment>
                      ))}
                    <View style={{ justifyContent: "flex-end" }}>
                      <View style={styles.estimatedFares}>
                        <Text style={styles.estimatedFaresText}>
                          Earning Estimate
                        </Text>
                        <Text style={styles.estimatedFaresPrice}>
                          ₱ {finalTotalFare.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
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
  arrivalMessageText: {
    color: "white",
  },
  updateStatus: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusContainer: {
    backgroundColor: "black",
    padding: 10,
    width: "130%",
    alignItems: "center",
    borderTopEndRadius: 10,
    borderTopStartRadius: 10,
    borderBottomEndRadius: 10,
    borderBottomStartRadius: 10,
  },
  cancelButton: {
    backgroundColor: "black",
    padding: 10,
    width: "45%",
    alignItems: "center",
    borderTopEndRadius: 10,
    borderTopStartRadius: 10,
    borderBottomEndRadius: 10,
    borderBottomStartRadius: 10,
  },
  confirmButton: {
    backgroundColor: "black",
    padding: 10,
    width: "20%",
    alignItems: "center",
    borderTopEndRadius: 10,
    borderTopStartRadius: 10,
    borderBottomEndRadius: 10,
    borderBottomStartRadius: 10,
  },
  endContainer: {
    backgroundColor: "black",
    padding: 10,
    width: "100%",
    alignItems: "center",
    borderTopEndRadius: 10,
    borderTopStartRadius: 10,
    borderBottomEndRadius: 10,
    borderBottomStartRadius: 10,
  },

  detailsModalOverlay: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  modalButtonText: {
    fontSize: 16,
    color: "#007BFF",
    padding: 10,
  },
  endRide: {
    marginTop: 16,
    padding: 10,
    backgroundColor: "powderblue",
    borderRadius: 5,
  },
  estimatedFares: {
    marginTop: 40,
    padding: 10,
    backgroundColor: "#F3F3F3",
    borderRadius: 5,
  },
  estimatedFaresText: {
    fontSize: 16,
    fontWeight: "500",
  },
  estimatedFaresPrice: {
    fontSize: 20,
    fontWeight: "500",
  },
  bookingDetailsSubHeader: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
  },
  bookingDetailsHeaderText: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
  },
  bookingDetailsText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 5,
  },
  rideDetails: {
    color: "white",
  },
  fares: {
    borderBottomColor: "#f3f3f3",
    borderBottomWidth: 1,
    paddingTop: 15,
    paddingBottom: 15,
  },
  fareText: {
    fontSize: 16,
    fontWeight: "500",
  },
  commuterinfoText: {
    fontSize: 16,
    fontWeight: "500",
  },
  location: {
    gap: 20,
    borderBottomColor: "#f3f3f3",
    borderBottomWidth: 1,
    paddingTop: 15,
    paddingBottom: 15,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "500",
  },
  pickupLocation: {
    gap: 5,
  },
  destinationLocation: {
    gap: 5,
  },
  sharedBookingItemText: {
    fontSize: 16,
    fontWeight: "500",
  },
  communicationContainer: {
    width: "100%",
    height: 40,
    backgroundColor: "black",
    marginRight: 15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
  },
  communicationIcon: {
    color: "white",
    alignItems: "center",
  },
  communicationText: {
    color: "white",
  },
  communication: {
    flexDirection: "row",
    flex: 1,
  },
  bookingContainer: {
    gap: 20,
  },
  bookingInfo: {
    display: "flex",
    flexDirection: "row",
    marginTop: 40,
    gap: 20,
    borderBottomColor: "#f3f3f3",
    borderBottomWidth: 1,
    paddingTop: 15,
    paddingBottom: 15,
  },
  commuterInfo: {
    flexDirection: "column",
    justifyContent: "center",
  },
  sharedBookingModal: {
    alignItems: "center",
    backgroundColor: "gray",
    borderRadius: 5,
    padding: 10,
  },
  sharedBookingItemTextLight: {
    color: "#8B8A86",
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
    alignItems: "flex-end",
  },
  bookingDetail: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    width: "100%",
  },
  bookingDetailsContainer: {
    alignItems: "center",
  },
  dropdownContainer: {
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    overflow: "hidden",
  },

  bookingDetailsHeader: {
    marginTop: 20,
    fontSize: 20, // Adjust the font size as needed
    fontWeight: "bold", // Change to normal if you don't want it bold
    textAlign: "center", // Center text horizontally
  },

  closeIcon: {
    fontWeight: "normal",
  },
  modalText: {
    color: "black",
  },
  detailsButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#ddd",
    borderRadius: 5,
    alignItems: "center",
  },
  modalConfirm: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flex: 1,
    justifyContent: "center", // Center the modal vertically
    alignItems: "center", // Align modal to the right
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center", 
    alignItems: "flex-end", // Align modal to the right
  },
  detailsModalOverlay: {
    width: "70%", // Adjust width as needed
    height: "100%",
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
  },
  detailsModalContainer: {
    flex: 1, // Full width of the screen
    maxHeight: "100%", // Adjust as needed
    borderTopStartRadius: 24,
    borderTopEndRadius: 24,
    backgroundColor: "white",
  },
  detailsModalContent: {
    flex: 1,
    padding: 10, // Add some padding to ensure content isn't too close to the edges
    position: "relative", // Allows absolute positioning of the button
  },
  closeDetailsButton: {
    position: "absolute",
    right: 0,
    zIndex: 1, // Ensure the button is above other content
  },
  detailsButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#ddd",
    borderRadius: 5,
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    height: 300,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxHeight: "100%",
    padding: 20,
    borderTopStartRadius: 10,
    borderTopEndRadius: 10,
    borderBottomStartRadius: 10,
    borderBottomEndRadius: 10,
    backgroundColor: "white",
  },
  modalDetailsContainer: {
    width: "100%",
    maxHeight: "100%",
    borderTopStartRadius: 10,
    borderTopEndRadius: 10,
    borderBottomStartRadius: 10,
    borderBottomEndRadius: 10,
    backgroundColor: "white",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalMessage: {
    paddingVertical: 10,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingVertical: 20,
    gap: 10,
  },

  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderTopStartRadius: 24,
    borderTopEndRadius: 24,
    minHeight: 300,
    maxHeight: "100%",
    overflow: "hidden",
  },

  closeButton: {
    position: "absolute",
    right: "7%",
    top: "5%",
    zIndex: 1,
  },
  container: {
    flex: 1,
    position: 'relative'
  },

  map: {
    flex: 1,
  },
  bottomCard: {
    padding: 10,
    marginTop: -200,
  },
  sharedRideContent: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "white",
    paddingVertical: 15,
    paddingHorizontal: 40, // Space on both sides
    borderRadius: 12,
    marginBottom: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  bookingList: {
    backgroundColor: "#fff",
    borderTopEndRadius: 24,
    borderTopStartRadius: 24,
    borderBottomEndRadius: 24,
    borderBottomStartRadius: 24,
  },
  sharedBookingList: {
    borderWidth: 1,
    borderColor: "#ccc",
    gap: 5,
    backgroundColor: "#f9f9f9",
    borderTopEndRadius: 24,
    borderTopStartRadius: 24,
    borderBottomEndRadius: 24,
    borderBottomStartRadius: 24,
  },
  bookingItem: {
    width: "100%",
    backgroundColor: "#f9f9f9",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderTopEndRadius: 24,
    borderTopStartRadius: 24,
    borderBottomEndRadius: 24,
    borderBottomStartRadius: 24,
  },
  bookingButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  bottomContainer: {
    bottom: 20, // Adjust as necessary for spacing from the bottom
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  onlineOfflineButton: {
    padding: 10,
    borderRadius: 5,
    justifyContent: "center",
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
