import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  Alert
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from 'expo-image-picker';

const License = () => {
  const navigation = useNavigation();
  const [licenseFront, setLicenseFront] = useState("");
  const [licenseBack, setLicenseBack] = useState("");

  useEffect(() => {
    const getPermissions = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'You need to grant camera roll permissions to upload images.');
      }
    };
    getPermissions();
  }, []);

  const pickImageAsync = async (side) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1,
      mediaTypes: ImagePicker.MediaTypeOptions.Images
    });

    if (!result.canceled) {
      if (side === 'licenseFront') {
        setLicenseFront(result.assets[0].uri);
      } else if (side === 'licenseBack') {
        setLicenseBack(result.assets[0].uri);
      }
    } else {
      Alert.alert('No Image Selected', 'You did not select any image.');
    }
  };

  const handleNext = async () => {
    await AsyncStorage.setItem('license', JSON.stringify({ licenseFront, licenseBack }));
    navigation.navigate("VehicleInfo1");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Driver License</Text>
      <ScrollView style={styles.license}>
        <View style={styles.uploadSection}>
          <Text style={styles.uploadText}>Driver License (Front)</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickImageAsync('licenseFront')}
          >
            <Text>Upload</Text>
            {licenseFront ? <Image source={{ uri: licenseFront }} style={styles.image} /> : null}
          </TouchableOpacity>
        </View>
        <View style={styles.uploadSection}>
          <Text style={styles.uploadText}>Driver License (Back)</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickImageAsync('licenseBack')}
          >
            <Text>Upload</Text>
            {licenseBack ? <Image source={{ uri: licenseBack }} style={styles.image} /> : null}
          </TouchableOpacity>
        </View>
      </ScrollView>
      <TouchableOpacity onPress={handleNext} style={styles.button}>
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: 40,
    paddingRight: 40,
    paddingTop: 80,
  },
  header: {
    fontWeight: '700',
    fontSize: 24,
  },
  license: {
    gap: 40,
  },
  uploadSection: {
    flexDirection: "row",
    justifyContent: 'space-between',
    paddingTop: 20,
  },
  uploadText: {
    marginTop: 25,
    fontWeight: '500',
    fontSize: 16,
  },
  uploadButton: {
    padding: 30,
    backgroundColor: 'powderblue',
    alignItems: 'center',
  },
  image: {
    width: 100,
    height: 100,
    marginTop: 10,
    borderRadius: 5,
  },
  button: {
    marginTop: 40,
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default License;
