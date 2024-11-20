import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
  Platform,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { useNavigation } from "@react-navigation/native";

const SharedBookingItem = ({
  item,
}) => {
  const { width } = Dimensions.get("window");
  const translateX = useRef(new Animated.Value(width)).current;

  const mapRef = useRef();
  const markerRef = useRef();

  // Navigation
  const navigation = useNavigation();

  // Ride-related state
  const [tripStarted, setTripStarted] = useState(false);
  const [tripCompleted, setTripCompleted] = useState(false);
  const [selectedVehicleType, setSelectedVehicleType] = useState(null);

  // Booking states
  const [acceptedSharedBooking, setAcceptedSharedBooking] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [selectedCommuter, setSelectedCommuter] = useState(null);

  // UI modal visibility
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isParentModalVisible, setParentModalVisible] = useState(false);
  const [modalParentVisible, setParentModalsVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Pickup & Dropoff confirmations
  const [isPickupConfirmed, setIsPickupConfirmed] = useState({});
  const [distanceToPickup, setDistanceToPickup] = useState({});
  const [distanceToDropoff, setDistanceToDropoff] = useState({});


  const openDetailsModal = (commuter) => {
    setSelectedCommuter(commuter);
    setIsDetailsModalVisible(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalVisible(false);
    setSelectedCommuter(null);
  };


  const openParentPickupModal = (parent) => {
    console.log("Opening modal for parent:", parent); // Log the copassenger
    setSelectedParent(parent); // Set the selected copassenger directly
    setParentModalsVisible(true); // Show the modal
  };

  const closeParentPickupModal = () => {
    setModalVisible(false); // Close the modal without confirming
    setParentModalsVisible(null); // Clear any selected copassenger
  };

  
  const handleConfirmParentArrival = async () => {
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
        `https://melodious-conkies-9be892.netlify.app/.netlify/functions/api/ride/onboard?bookingId=${selectedParent}`,
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
        "https://melodious-conkies-9be892.netlify.app/.netlify/functions/api/ride/dropoff",
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

        closeParentDropoffModal(); // Close the modal after confirming the dropoff
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


  return (
    <View style={styles.sharedRideContent}>
      <View style={styles.sharedBookingItem}>
        <Text style={styles.sharedBookingItemText}>{item.name}</Text>

        {!isPickupConfirmed[item._id] ? (
          <Text style={styles.sharedBookingItemTextLight}>
            Pickup: {item.pickupAddress}
          </Text>
        ) : (
          <Text style={styles.sharedBookingItemTextLight}>
            Destination: {item.destinationAddress}
          </Text>
        )}

        {distanceToPickup[item._id] < 4.5 && !isPickupConfirmed[item._id] && (
          <View style={styles.arrivalMessageContainer}>
            {/* Show "Arrived at Pickup" button */}
            <TouchableOpacity onPress={() => openParentPickupModal(item._id)}>
              <Text style={styles.arrivalMessageText}>Arrived at Pickup</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Modal for confirming arrival at pickup */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalParentVisible}
          onRequestClose={closeParentPickupModal}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Confirm Arrival Parent</Text>
              <Text style={styles.modalMessage}>
                Are you sure you want to confirm your arrival at the pickup
                location?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={handleConfirmParentArrival}
                  style={styles.confirmButton}
                >
                  <Text style={styles.buttonText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={closeParentPickupModal}
                  style={styles.cancelButton}
                >
                  <Text style={styles.buttonText}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {isPickupConfirmed[item._id] &&
          distanceToDropoff[item._id] < 100.5 &&
          item.status !== "Dropped off" && (
            <TouchableOpacity onPress={() => openParentDropoffModal(item._id)}>
              <Text style={styles.arrivalMessageText}>Confirm Drop Off</Text>
            </TouchableOpacity>
          )}
      </View>
      <Modal
        visible={isParentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeParentDropoffModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Drop Off</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to confirm the drop-off?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  confirmParentDropOff(selectedParent._id); // Pass the selected copassenger ID
                  closeParentDropoffModal(); // Close the modal after confirmation
                }}
                style={styles.confirmButton}
              >
                <Text style={styles.buttonText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={closeParentDropoffModal}
                style={styles.cancelButton}
              >
                <Text style={styles.buttonText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.bookingDetails}>
        {console.log("Current booking status:", item.status)}

        {item.status === "Dropped off" ? (
          <Text style={styles.sharedBookingItemText}>Dropped Off</Text>
        ) : (
          <TouchableOpacity onPress={() => openDetailsModal(item)}>
            <Text style={styles.sharedBookingItemText}>Details</Text>
          </TouchableOpacity>
        )}
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
                <View style={styles.bookingDetails}>
                  <Text style={styles.bookingDetailsHeader}>
                    Booking Details
                  </Text>
                </View>
                {selectedCommuter && (
                  <View style={styles.bookingContainer}>
                    <View style={styles.bookingInfo}>
                      <View style={styles.circle} />
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
                          Fare: {selectedCommuter.fare}
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
                      <TouchableOpacity style={styles.communicationContainer}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  sharedRideContent: {
    padding: 10,
  },
  sharedBookingItem: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#fff",
    marginVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sharedBookingItemText: {
    fontSize: 16,
    fontWeight: "600",
  },
  sharedBookingItemTextLight: {
    fontSize: 14,
    color: "#555",
  },
  arrivalMessageContainer: {
    marginVertical: 5,
  },
  arrivalMessageText: {
    color: "#007BFF",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: 300,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 14,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  confirmButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: "#CCC",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  detailsModalOverlay: {
    width: "100%",
    paddingHorizontal: 20,
    backgroundColor: "#FFF",
  },
  bookingDetailsHeader: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
  },
  locationText: {
    fontSize: 14,
    color: "#555",
  },
  fareText: {
    fontSize: 14,
    color: "#000",
  },
  closeDetailsButton: {
    alignSelf: "flex-end",
  },
  closeIcon: {
    margin: 5,
  },
});

export default SharedBookingItem;
