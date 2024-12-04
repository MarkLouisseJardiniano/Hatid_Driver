import React from 'react';
import { View, Image, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import imagePath from '../../constants/imagePath';
const Auth = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
            <Image
            source={imagePath.logo}
            style={{width: 250, height: 250, alignItems: "center",}}
            resizeMode="contain"
          />
      <View style={styles.buttonList}>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.button}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('SignupStack')} style={styles.button}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'white', 
  },
  buttonList: {
    flexDirection: 'column',
    marginTop: 20, 
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold"
  },
  button: {
    backgroundColor: 'powderblue',
    marginHorizontal: 10,
    borderRadius: 10,
    width: 300,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10, 
  },
});

export default Auth;
