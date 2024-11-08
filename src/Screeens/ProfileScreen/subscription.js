import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const Subscription = () => {
  const [selectedOption, setSelectedOption] = useState('');
  const [driverId, setDriverId] = useState(null);
  const [vehicleInfo2, setVehicleInfo2] = useState(null);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedDriverId = await AsyncStorage.getItem('driverId');
        if (storedDriverId) {
          setDriverId(storedDriverId);
          fetchUserData(storedDriverId);
        } else {
          Alert.alert('Error', 'Driver ID not found. Please log in again.');
        }
      } catch (error) {
        console.error('Error fetching driver ID:', error);
        Alert.alert('Error', 'Error fetching driver ID');
      }
    };

    const fetchUserData = async (id) => {
      try {
        const response = await axios.get(`https://zippy-pie-b50d6c.netlify.app/.netlify/functions/api/driver/driver/${id}`);
        setVehicleInfo2(response.data.vehicleInfo2);
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Error fetching user data');
      }
    };

    fetchUserId();
  }, []);
 
  const handleSubscribe = async () => {
    if (!selectedOption) {
      Alert.alert('Error', 'Please select a subscription type.');
      return;
    }
  
    if (!vehicleInfo2) {
      Alert.alert('Error', 'Vehicle info not loaded.');
      return;
    }
  
    const subscriptionType = selectedOption;
    const vehicleType = vehicleInfo2.vehicleType;
  
    try {
      await axios.post('https://zippy-pie-b50d6c.netlify.app/.netlify/functions/api/subs/subscription', {
        driverId,
        subscriptionType,
        vehicleType,
      });
  
      Alert.alert('Success', 'Subscription created successfully!');
    } catch (error) {
      console.error('Error creating subscription:', error);
      Alert.alert('Error', 'Error creating subscription');
    }
  };
  

  const renderRadioButton = (value) => (
    <TouchableOpacity
      style={styles.radioButton}
      onPress={() => setSelectedOption(value)}
    >
      <View
        style={[
          styles.radioButtonCircle,
          selectedOption === value && styles.radioButtonCircleSelected,
        ]}
      />
    </TouchableOpacity>
  );

  if (vehicleInfo2 === null) {
    return <View style={styles.container}><Text>Loading...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Subscribe</Text>
      <Text style={styles.subtitle}>Choose your plan</Text>
      
      {vehicleInfo2.vehicleType === 'Tricycle' && (
        <View style={styles.optionContainer}>
          <Text style={styles.header}>For Tricycle</Text>
          <View style={styles.subsOption}>
            <View style={styles.selection}>
              {renderRadioButton('Free')}
              <Text style={styles.optionText}>Free</Text>
            </View>
            <View style={styles.selection}>
              {renderRadioButton('Monthly')}
              <Text style={styles.optionText}>Monthly</Text>
            </View>
            <View style={styles.selection}>
              {renderRadioButton('Quarterly')}
              <Text style={styles.optionText}>Quarterly</Text>
            </View>
            <View style={styles.selection}>
              {renderRadioButton('Anually')}
              <Text style={styles.optionText}>Annually</Text>
            </View>
          </View>
        </View>
      )}
      
      {vehicleInfo2.vehicleType === 'Jeep' && (
        <View style={styles.optionContainer}>
          <Text style={styles.header}>For Jeep</Text>
          <View style={styles.subsOption}>
            <View style={styles.selection}>
              {renderRadioButton('Free')}
              <Text style={styles.optionText}>Free</Text>
            </View>
            <View style={styles.selection}>
              {renderRadioButton('Monthly')}
              <Text style={styles.optionText}>Monthly</Text>
            </View>
            <View style={styles.selection}>
              {renderRadioButton('Quarterly')}
              <Text style={styles.optionText}>Quarterly</Text>
            </View>
            <View style={styles.selection}>
              {renderRadioButton('Annually')}
              <Text style={styles.optionText}>Annually</Text>
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
        <Text style={styles.subscribeButtonText}>Subscribe</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginLeft: 20,
    marginTop: 20,
    paddingHorizontal: 10,
    flexDirection: 'column',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  header: {
    fontWeight: '700',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
  },
  optionContainer: {
    marginBottom: 15,
  },
  subsOption: {
    flexDirection: 'column',
  },
  selection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  optionText: {
    fontSize: 16,
    marginLeft: 10,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'transparent',
  },
  radioButtonCircleSelected: {
    backgroundColor: '#000',
  },
  subscribeButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#007BFF',
    borderRadius: 5,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Subscription;
