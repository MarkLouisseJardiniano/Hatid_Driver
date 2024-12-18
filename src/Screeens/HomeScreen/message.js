import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, FlatList,Alert, Text, StyleSheet,KeyboardAvoidingView, Platform } from 'react-native';
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, AntDesign, Entypo } from '@expo/vector-icons';


const Message = ({ route, navigation }) => {
  const [senderId, setSenderId] = useState('');
  const [recepientId, setRecepientId] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]); 
const { userId} =  route.params ;

useEffect(() => {
    const initializeIds = async () => {
      try {
  
        const loggedInUserId = await AsyncStorage.getItem('driverId'); // Get the current user's ID
        if (loggedInUserId) {
          console.log('Logged in user ID retrieved from AsyncStorage:', loggedInUserId);
          setSenderId(loggedInUserId);
        } else {
          console.log('No driver ID found in AsyncStorage.');
        }
  
        if (userId) {
          console.log('Setting recipient ID from navigation parameters:', userId);
          setRecepientId(userId); // Set driver ID from navigation parameters
        } else {
          console.log('Error: Driver ID not provided in navigation parameters.');
      
        }
      } catch (error) {
        console.error('Error retrieving user ID:', error);
      }
    };
  
    initializeIds();
  }, [userId]);
  
  const handleSendMessage = async () => {
    if (!senderId || !recepientId || !message) {

      return;
    }

    try {
      const response = await axios.post('https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/message/send-messages', {
        senderId,
        recepientId,
        message,
      });

      if (response.data.message === 'Message sent successfully') {
      
        setMessage('');  // Clear message input
        fetchMessages();  // Fetch updated messages after sending
      } else {

      }
    } catch (error) {
      console.error("Error sending message:", error);
  
    }
  };

  // Function to fetch messages
  const fetchMessages = async () => {
    if (!senderId || !recepientId) {
      return;  // Ensure both IDs are available
    }
  
    try {
      const response = await axios.get(`https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/message/messages/${recepientId}/${senderId}`);
      console.log("fetchMessages: Response data:", response.data);
      setMessages(response.data); 
    } catch (error) {
      console.error("fetchMessages: Error fetching messages:", error.message);
    }
  };
  

  useEffect(() => {
    if (senderId && recepientId) {
      fetchMessages(); 
  
      const intervalId = setInterval(() => {
        
        fetchMessages();
      }, 2000);

      return () => clearInterval(intervalId);
    }
  }, [senderId, recepientId]);  // Re-run when IDs change

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 100} 
    >
    <View style={{ flex: 1, justifyContent: 'space-between', padding: 20 }}>
      
      <FlatList
        data={messages}
        keyExtractor={(item) => item._id.toString()}
        renderItem={({ item }) => {
          const isSender = item.senderId._id === senderId;
          const isRecipient = item.recepientId._id === senderId;

          return (
            <View
              style={[
                styles.messageContainer,
                isSender ? styles.sentMessage : styles.receivedMessage
              ]}
            >
         
              {isSender && (
                <>
                  <Text
                    style={[
                      styles.message,
                      isSender ? styles.sentMessageText : styles.receivedMessageText
                    ]}
                  >
                    {item.message}
                  </Text>
                </>
              )}

              {isRecipient && (
                <>
                  {/* <Text
                    style={[
                      styles.sender,
                      isRecipient ? styles.receivedSender : styles.sentSender
                    ]}
                  >
                    {item.senderId.name}:
                  </Text> */}
                  <Text
                    style={[
                      styles.message,
                      isRecipient ? styles.receivedMessageText : styles.sentMessageText
                    ]}
                  >
                    {item.message}
                  </Text>
                </>
              )}
            </View>
          );
        }}
      />

      <View style={{flexDirection: "row", padding: 20, width: "90%"}}>

        <TextInput
          style={{backgroundColor: "lightgray", padding: 10, width: "100%", borderRadius: 10}}
          value={message}
          onChangeText={setMessage}
          placeholder="Enter your message"
          multiline
        />

<Ionicons style={{ padding: 10,}} onPress={handleSendMessage} name="send" size={30} color="blue" />

      </View>
    </View>
  </KeyboardAvoidingView>
  );
};


const styles = StyleSheet.create({
    messageContainer: {
      flexDirection: 'row',
      marginTop: 5 // Align messages side by side
    },
    sentMessage: {
      justifyContent: 'flex-end', // Aligns sent messages to the right
      alignItems: 'flex-end',
    },
    receivedMessage: {
      justifyContent: 'flex-start', // Aligns received messages to the left
      alignItems: 'flex-start',
    },
    sentSender: {
      color: 'blue', // Customize color for sender label
    },
    receivedSender: {
      color: 'gray', // Customize color for recipient label
    },
    sentMessageText: {
      backgroundColor: 'lightblue', // Sent message background color
      borderRadius: 10,
      padding: 10,
      maxWidth: '70%',
      alignSelf: 'flex-end', // Aligns text to the right
    },
    receivedMessageText: {
      backgroundColor: 'lightgray', // Received message background color
      borderRadius: 10,
      padding: 10,
      maxWidth: '70%',
      alignSelf: 'flex-start', // Aligns text to the left
    },
  });
  
export default Message;
