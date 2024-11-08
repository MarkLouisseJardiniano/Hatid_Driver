// JoinSharedBookingItem.js
import React from 'react';
import { View, Text, TouchableOpacity, Modal, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const JoinSharedBookingItems = ({
  item,
  isPickupConfirmed,
  distanceToPickup,
  distanceToDropoff,
  modalVisible,
  isConfirmationModalVisible,
  isDetailsModalVisible,
  openPickupModal,
  closePickupModal,
  handleConfirmArrival,
  openDropoffModal,
  closeDropoffModal,
  confirmDropOff,
  openDetailsModal,
  closeDetailsModal,
  selectedCommuter,
  translateX,
  styles,
}) => {
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
            <TouchableOpacity onPress={() => openPickupModal(item._id)}>
              <Text style={styles.arrivalMessageText}>Arrived at Pickup</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Modal for confirming arrival at pickup */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closePickupModal}
        >
          <View style={styles.modalBackdrop}>
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
                  <Text style={styles.buttonText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={closePickupModal}
                  style={styles.cancelButton}
                >
                  <Text style={styles.buttonText}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {isPickupConfirmed[item._id] && distanceToDropoff[item._id] < 100.5 && (
          <TouchableOpacity onPress={() => openDropoffModal(item._id)}>
            <Text style={styles.arrivalMessageText}>Confirm Drop Off</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={isConfirmationModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeDropoffModal}
      >
        {/* Drop-off confirmation modal */}
      </Modal>

      <View style={styles.bookingDetails}>
        <TouchableOpacity onPress={() => openDetailsModal(item)}>
          <Text style={styles.sharedBookingItemText}>Details</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isDetailsModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeDetailsModal}
      >
        {/* Details modal */}
      </Modal>
    </View>
  );
};

export default JoinSharedBookingItems;
