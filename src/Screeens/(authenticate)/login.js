import React, { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet, TextInput, Alert } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from "expo-router";
import { useNavigation } from '@react-navigation/native';

const Login = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const driverData = { email, password };
      const res = await axios.post(`https://main--exquisite-dodol-f68b33.netlify.app/.netlify/functions/api/driver/driver-login`, driverData);
        
      console.log('Login Response:', res.data); 
    
      if (res.data.status === 'ok') {
        const { token, driverId } = res.data.data;
  
        if (!driverId) {
          throw new Error('Driver ID is missing in the response');
        }
        
        await AsyncStorage.setItem('KeepLoggedIn', 'true');  
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('driverId', driverId); 
          
        console.log('Token:', token);
        console.log('Driver ID:', driverId);
  
        navigation.replace("TabNav"); 
      } else {
        Alert.alert('Login Failed', res.data.message);
      }
    } catch (error) {
      console.error('Login Error:', error);
      Alert.alert('Login Failed', 'Failed to login. Please try again.');
    }
  };
  
  const handleBackToSignUp = () => {
    navigation.navigate("Signup");
  }
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Login</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Text style={styles.forgotPassword}>Forgot Password</Text>
      <TouchableOpacity onPress={handleLogin} style={styles.button}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <Text style={styles.backToSignUp}>Dont have an account? <Text   style={styles.blueText} onPress={handleBackToSignUp}>SignUp</Text></Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'white',
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 100,
  },
  input: {
    width: "100%",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 8,
  },
  button: {
    width: '100%',
    backgroundColor: 'blue',
    padding: 15,
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 15,
    alignItems: 'center',
  },
  forgotPassword: {
    marginLeft: 260,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  blueText: {
    color: "blue",
  },
  backToSignUp: {
    alignItems: 'center',
    justifyContent:'center',
    marginBottom: 300,
  }
});

export default Login;
