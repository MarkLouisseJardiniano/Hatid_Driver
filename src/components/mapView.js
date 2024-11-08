import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import MapView, { Marker, AnimatedRegion } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { GOOGLE_MAP_KEY } from "../constants/googleMapKey";
import imagePath from "../constants/imagePath";
import {
    requestForegroundPermissionsAsync,
    getCurrentPositionAsync,
    LocationAccuracy,
  } from "expo-location";

const screen = Dimensions.get("window");
const ASPECT_RATIO = screen.width / screen.height;
const LATITUDE_DELTA = 0.04;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const MapComponent = ({route}) => {

    const [commuterLocation, setCommuterLocation] = useState(null);
    const [destinationCords, setDestinationCords] = useState(null);
    const [acceptedSharedBooking, setAcceptedSharedBooking] = useState([]);
    const [acceptedJoinSharedBooking, setAcceptedJoinSharedBooking] = useState([]);
    const [isPickupConfirmed, setIsPickupConfirmed] = useState({});
    const [distanceToPickup, setDistanceToPickup] = useState({});
    const [distanceToDropoff, setDistanceToDropoff] = useState({});
    const [isArrivedAtPickup, setIsArrivedAtPickup] = useState({});
  
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
    if (route?.params?.destinationCords) {
      updateState({
        destinationCords: route.params.destinationCords,
        showVehicleOptions: true,
      });
    }
  }, [route?.params?.destinationCords]);

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

  const mapRef = useRef();
  const markerRef = useRef();

  return (
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
        coordinate={curLoc}
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

      {acceptedSharedBooking.map((booking) => (
        <React.Fragment key={booking.id}>
          {!isPickupConfirmed[booking._id] && (
            <MapViewDirections
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
        </React.Fragment>
      ))}
    </MapView>
  );
};
const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default MapComponent;
