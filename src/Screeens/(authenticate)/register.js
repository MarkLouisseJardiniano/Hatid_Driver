import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  TextInput,
  Text,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import imagePath from "../../constants/imagePath";
import * as ImagePicker from "expo-image-picker";

const DriverSignup = () => {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [isDisabled, setIsDisabled] = useState(false);
  const [timer, setTimer] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [number, setNumber] = useState("");
  const [birthday, setBirthday] = useState("");
  const [address, setAddress] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [licenseFront, setLicenseFront] = useState(null);
  const [licenseBack, setLicenseBack] = useState(null);
  const [or, setOR] = useState(null);
  const [cr, setCR] = useState(null);
  const [vehicleFront, setVehicleFront] = useState(null);
  const [vehicleBack, setVehicleBack] = useState(null);
  const [vehicleLeft, setVehicleLeft] = useState(null);
  const [vehicleRight, setVehicleRight] = useState(null);
  const [uploading, setUploading] = useState(false);

  const allSteps = [
    { id: 1, title: "Personal Information" },
    { id: 2, title: "Email Verification" },
    { id: 3, title: "Vehicle Information" },
    { id: 4, title: "License & Registration" },
    { id: 5, title: "Vehicle Image" },
  ];

  const getStepsForCurrentCase = () => {
    switch (currentStep) {
      case 1:
        return [1, 2, 3];
      case 2:
        return [1, 2, 3];
      case 3:
        return [2, 3, 4];
      case 4:
        return [3, 4, 5];
      case 5:
        return [3, 4, 5];
      default:
        return [];
    }
  };

  const handleLogin = () => {
    navigation.navigate("Login");
  };

  const stepsToShow = allSteps.filter((step) =>
    getStepsForCurrentCase().includes(step.id)
  );

  const handleNextStep2 = async () => {
    // Validate form fields
    if (!name || !email || !password || !number || !birthday || !address) {
      Alert.alert("Error", "Please fill in all fields before proceeding.");
      return;
    }

    try {
      // Step 1: Check if email is already registered
      const emailCheckResponse = await axios.post(
        "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/driver/check-email",
        { email }
      );

      // If the email is already registered, show an error and stop
      if (emailCheckResponse.data.exists) {
        Alert.alert("Validation Error", "This email is already registered.");
        return;
      }

      // Debugging: log the values you're sending for OTP generation
      console.log("Sending OTP request with:", { email, name });

      // Step 2: Send OTP request to backend
      const otpResponse = await axios.post(
        "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/otp/generate-driver-otp",
        { email, name },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("OTP Response:", otpResponse.data);

      if (!otpResponse.data || !otpResponse.data.message) {
        Alert.alert("Error", "Failed to generate OTP. Please try again.");
        return;
      }

      console.log("OTP generated successfully:", otpResponse.data.message);

      const step1Data = { name, email, password, number, birthday, address };
      await AsyncStorage.setItem("step1Data", JSON.stringify(step1Data));
      console.log("Saving step1Data:", step1Data);
      setCurrentStep(2);
    } catch (error) {
      console.error(
        "Error generating OTP or checking email:",
        error.response ? error.response.data : error.message
      );
      Alert.alert("Error", "An error occurred. Please try again.");
    }
  };

  const handleNextStep3 = async () => {
    if (!otp) {
      Alert.alert("Error", "Please enter the OTP.");
      return;
    }
    const formData = JSON.parse(await AsyncStorage.getItem("step1Data"));

    if (!formData || !formData.email) {
      Alert.alert("Error", "Email is not available.");
      return;
    }

    const { email } = formData;

    try {
      console.log("Verifying OTP for:", { email, otp });

      const response = await axios.post(
        "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/otp/driver-verify-otp",
        { email, otp }
      );

      console.log("OTP Verification Response:", response.data);

      if (response.data.message === "OTP verified and user is now verified") {
        console.log("OTP verified successfully:", response.data.message);

        setCurrentStep(3);
      } else {
        // OTP verification failed
        Alert.alert("Error", "Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error(
        "Error verifying OTP:",
        error.response ? error.response.data : error.message
      );
      Alert.alert(
        "Error",
        "An error occurred during OTP verification. Please try again."
      );
    }
  };

  const handleNextStep4 = async () => {
    if (
      !vehicleType ||
      !model ||
      !color ||
      !year ||
      !plateNumber ||
      !capacity
    ) {
      Alert.alert("Error", "Please fill in all the fields before proceeding.");
      return;
    }
    if (vehicleType !== "Jeep" && vehicleType !== "Tricycle") {
      Alert.alert("Error", "Vehicle type must be either 'Jeep' or 'Tricycle'.");
      return;
    }
    const formData = { vehicleType, model, color, year, plateNumber, capacity };
    await AsyncStorage.setItem("step3Data", JSON.stringify(formData));
    console.log("Saving step3Data:", formData);

    setCurrentStep(4);
  };

  const handleResendOtp = async () => {
    if (!email) {
      Alert.alert("Validation Error", "Email is required to resend OTP.");
      return;
    }

    try {
      // Send OTP request
      const response = await axios.post(
        "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/otp/generate-driver-otp",
        { email }
      );

      if (response.status === 200) {
        setIsDisabled(true);
        let countdown = 120;
        setTimer(countdown);

        const interval = setInterval(() => {
          countdown -= 1;
          setTimer(countdown);

          if (countdown <= 0) {
            clearInterval(interval);
            setIsDisabled(false); // Re-enable the button after 2 minutes
          }
        }, 1000);
      } else {
        Alert.alert("Error", response.data.message || "Failed to resend OTP.");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "An error occurred. Please try again.";
      Alert.alert("Error", errorMessage);
    }
  };

  useEffect(() => {
    const getPermissions = async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "You need to grant camera roll permissions to upload images."
        );
      }
    };
    getPermissions();
  }, []);

  const pickImage = async (side) => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.2,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      console.log("Image Picker Result:", result);

      if (result?.canceled !== true && result?.assets?.length > 0) {
        console.log("Image selected:", result.assets[0]);

        if (side === "licenseFront") {
          setLicenseFront(result.assets[0]);
        } else if (side === "licenseBack") {
          setLicenseBack(result.assets[0]);
        } else if (side === "or") {
          setOR(result.assets[0]);
        } else if (side === "cr") {
          setCR(result.assets[0]);
        } else if (side === "vehicleFront") {
          setVehicleFront(result.assets[0]);
        } else if (side === "vehicleBack") {
          setVehicleBack(result.assets[0]);
        } else if (side === "vehicleLeft") {
          setVehicleLeft(result.assets[0]);
        } else if (side === "vehicleRight") {
          setVehicleRight(result.assets[0]);
        } else {
          console.log("Invalid side provided");
        }
      } else {
        Alert.alert("No Image Selected", "You did not select any image.");
        console.log("No image selected"); // Log when no image is selected
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "An error occurred while selecting the image.");
    }
  };

  const uploadLicenseImages = async () => {
    if (!licenseFront || !licenseBack || !or || !cr) {
      console.error("All required license images are not provided.");
      return;
    }

    // Helper function to extract the file name from the URI
    const extractFileName = (uri) => {
      return uri.split("/").pop() || "default_image.jpg"; // Ensure default name if uri is empty
    };

    // Prepare FormData for all images
    const formData = new FormData();

    // Append the front license image
    formData.append("licenseFront", {
      uri: licenseFront.uri, // Ensure the URI is correct
      name: extractFileName(licenseFront.uri), // Extract the file name from URI
      type: "image/jpeg", // Define the file type
    });

    // Append the back license image
    formData.append("licenseBack", {
      uri: licenseBack.uri, // Ensure the URI is correct
      name: extractFileName(licenseBack.uri), // Extract the file name from URI
      type: "image/jpeg", // Define the file type
    });

    formData.append("or", {
      uri: or.uri, // Ensure the URI is correct
      name: extractFileName(or.uri), // Extract the file name from URI
      type: "image/jpeg", // Define the file type
    });

    formData.append("cr", {
      uri: cr.uri,
      name: extractFileName(cr.uri),
      type: "image/jpeg",
    });

    setUploading(true);

    try {
      console.log("Starting file upload for both images...");

      const response = await axios.post(
        "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/driver/upload-licenses",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("File upload response:", response.data);

      if (response.data && response.data.files) {
        console.log(
          "Front Signed URL:",
          response.data.files.licenseFront.signedUrl
        );
        console.log(
          "Back Signed URL:",
          response.data.files.licenseBack.signedUrl
        );
        console.log("OR Signed URL:", response.data.files.or.signedUrl);
        console.log("CR Signed URL:", response.data.files.cr.signedUrl);

        // Call the next process with the signed URLs
        handleNextProcess(
          response.data.files.licenseFront.signedUrl,
          response.data.files.licenseBack.signedUrl,
          response.data.files.or.signedUrl,
          response.data.files.cr.signedUrl
        );
      } else {
        console.error("Missing signed URLs in response:", response.data);
      }
    } catch (error) {
      console.error("Upload failed:", error.response?.data || error.message);
    } finally {
      setUploading(false); // Reset uploading state
    }
  };

  const handleNextProcess = async (
    frontSignedUrl,
    backSignedUrl,
    orSignedUrl,
    crSignedUrl
  ) => {
    console.log("Front Signed URL:", frontSignedUrl);
    console.log("Back Signed URL:", backSignedUrl);
    console.log("OR Signed URL:", orSignedUrl);
    console.log("CR Signed URL:", crSignedUrl);

    const fileData = {
      licenseFront: frontSignedUrl,
      licenseBack: backSignedUrl,
      or: orSignedUrl,
      cr: crSignedUrl,
    };

    try {
      await AsyncStorage.setItem(
        "uploadedLicenseFiles",
        JSON.stringify(fileData)
      );
      console.log("File data saved successfully:", fileData);
    } catch (error) {
      console.error("Failed to save file data:", error);
    }

    setCurrentStep(5); // Proceed to the next step
  };

  const uploadVehicleImages = async () => {
    if (!vehicleFront || !vehicleBack || !vehicleLeft || !vehicleRight) {
      console.error("All vehicle images are required.");
      return;
    }

    // Helper function to extract the file name from the URI
    const extractFileName = (uri) =>
      uri.split("/").pop() || "default_image.jpg";

    // Prepare FormData for all images
    const formData = new FormData();
    formData.append("vehicleFront", {
      uri: vehicleFront.uri,
      name: extractFileName(vehicleFront.uri),
      type: "image/jpeg",
    });
    formData.append("vehicleBack", {
      uri: vehicleBack.uri,
      name: extractFileName(vehicleBack.uri),
      type: "image/jpeg",
    });
    formData.append("vehicleLeft", {
      uri: vehicleLeft.uri,
      name: extractFileName(vehicleLeft.uri),
      type: "image/jpeg",
    });
    formData.append("vehicleRight", {
      uri: vehicleRight.uri,
      name: extractFileName(vehicleRight.uri),
      type: "image/jpeg",
    });

    setUploading(true);
    try {
      console.log("Starting file upload for vehicle images...");

      const response = await axios.post(
        "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/driver/upload-vehicle-image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("File upload response:", response.data);

      if (response.data && response.data.files) {
        handleSubmitProcess(
          response.data.files.vehicleFront.signedUrl,
          response.data.files.vehicleBack.signedUrl,
          response.data.files.vehicleLeft.signedUrl,
          response.data.files.vehicleRight.signedUrl
        );
      } else {
        console.error("Missing signed URLs in response:", response.data);
      }
    } catch (error) {
      console.error("Upload failed:", error.response?.data || error.message);
    } finally {
      setUploading(false); // Reset uploading state
    }
  };

  const handleSubmitProcess = (frontUrl, backUrl, leftUrl, rightUrl) => {
    // Log the extracted signed URLs
    console.log("Vehicle Front Signed URL:", frontUrl);
    console.log("Vehicle Back Signed URL:", backUrl);
    console.log("Vehicle Left Signed URL:", leftUrl);
    console.log("Vehicle Right Signed URL:", rightUrl);

    // Save the signed URLs in AsyncStorage or process further
    const vehicleImage = {
      vehicleFront: frontUrl,
      vehicleBack: backUrl,
      vehicleLeft: leftUrl,
      vehicleRight: rightUrl,
    };

    try {
      // Make sure AsyncStorage is set asynchronously
      AsyncStorage.setItem(
        "uploadedVehicleFileNames",
        JSON.stringify(vehicleImage)
      )
        .then(() => {
          console.log("Vehicle file names saved successfully:", vehicleImage);
        })
        .catch((error) => {
          console.error("Failed to save vehicle file names:", error);
        });
    } catch (error) {
      console.error("Failed to save vehicle file names:", error);
    }
  };

  // useEffect to auto-upload images when all images are available
  useEffect(() => {
    if (vehicleFront && vehicleBack && vehicleLeft && vehicleRight) {
      uploadVehicleImages();
    }
  }, [vehicleFront, vehicleBack, vehicleLeft, vehicleRight]);

  const handleSignup = async () => {
    try {
      console.log("Retrieving data from AsyncStorage...");

      // Retrieve data from AsyncStorage for step1Data, step3Data, step4Data, and step5Data
      const step1Data = await AsyncStorage.getItem("step1Data");
      const step3Data = await AsyncStorage.getItem("step3Data");
      const step4Data = await AsyncStorage.getItem("uploadedLicenseFiles");
      const step5Data = await AsyncStorage.getItem("uploadedVehicleFileNames");

      console.log("Retrieved step1Data:", step1Data);
      console.log("Retrieved step3Data:", step3Data);
      console.log("Retrieved step4Data:", step4Data);
      console.log("Retrieved step5Data:", step5Data);

      if (!step1Data || !step3Data || !step4Data || !step5Data) {
        throw new Error("Required data not found in AsyncStorage.");
      }

      console.log("Parsing form data from AsyncStorage...");

      // Parse the form data from AsyncStorage
      const { name, email, password, number, birthday, address } =
        JSON.parse(step1Data);
      const { vehicleType, model, year, color, plateNumber, capacity } =
        JSON.parse(step3Data);
      const { licenseFront, licenseBack, or, cr } = JSON.parse(step4Data);
      const { vehicleFront, vehicleBack, vehicleLeft, vehicleRight } =
        JSON.parse(step5Data);

      console.log("Parsed step1Data:", {
        name,
        email,
        password,
        number,
        birthday,
        address,
      });
      console.log("Parsed step3Data:", {
        vehicleType,
        model,
        year,
        color,
        plateNumber,
        capacity,
      });
      console.log("Parsed step4Data:", { licenseFront, licenseBack, or, cr });
      console.log("Parsed step5Data:", {
        vehicleFront,
        vehicleBack,
        vehicleLeft,
        vehicleRight,
      });

      // Validate required fields
      if (
        !vehicleType ||
        !model ||
        !year ||
        !color ||
        !plateNumber ||
        !capacity ||
        !name ||
        !email ||
        !password ||
        !number ||
        !birthday ||
        !address
      ) {
        Alert.alert("Validation Error", "All fields are required.");
        console.log("Validation failed. Missing required fields.");
        return;
      }

      console.log("Preparing signup data...");

      // Prepare signup data (no need to modify images here, just use the fileNames)
      const signupData = {
        name,
        email,
        password,
        number,
        birthday,
        address,
        license: {
          licenseFront,
          licenseBack,
          or,
          cr,
        },
        vehicleInfo2: {
          vehicleType,
          model,
          year,
          color,
          plateNumber,
          capacity,
        },
        vehicleInfo1: {
          vehicleFront,
          vehicleBack,
          vehicleLeft,
          vehicleRight,
        },
      };

      console.log("Signup Data with Filenames:", signupData);

      // Send data to the server
      console.log("Sending signup data to server...");

      const response = await axios.post(
        "https://serverless-api-hatid-5.onrender.com/.netlify/functions/api/driver/driver-signup",
        signupData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response from server:", response.data);

      if (response.data.message === "Driver created successfully") {
        console.log(
          "Driver created successfully. Clearing AsyncStorage and navigating..."
        );

        navigation.navigate("Documents", {
          email,
          name,
        });
      } else {
        console.log("Signup failed:", response.data.message);
        Alert.alert(
          "Signup Failed",
          response.data.message || "Unexpected error occurred"
        );
      }
    } catch (error) {
      console.error("Error during signup:", error);
      Alert.alert(
        "Error",
        error.message || "An error occurred during signup. Please try again."
      );
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <TextInput
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
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
              style={styles.input}
              secureTextEntry
            />
            <TextInput
              placeholder="Phone Number"
              value={number}
              onChangeText={setNumber}
              style={styles.input}
            />
            <TextInput
              placeholder="Birthday"
              value={birthday}
              onChangeText={setBirthday}
              style={styles.input}
            />
            <TextInput
              placeholder="Address"
              value={address}
              onChangeText={setAddress}
              style={styles.input}
            />
            <View
              style={{ justifyContent: "space-between", flexDirection: "row" }}
            >
              <View style={{ backgroundColor: "white" }}></View>
              <TouchableOpacity onPress={handleNextStep2} style={styles.button}>
                <Text
                  style={{
                    color: "black",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  Next
                </Text>
              </TouchableOpacity>
            </View>
          </>
        );
      case 2:
        return (
          <View style={{}}>
            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Image
                source={imagePath.verification}
                style={{
                  height: 200,
                  width: 200,
                  paddingVertical: 150,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              />
              <Text
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                  fontWeight: "bold",
                  fontSize: 20,
                }}
              >
                Email Verification
              </Text>
              <Text
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                  width: "70%",
                  fontSize: 16,
                  paddingVertical: 20,
                }}
              >
                We have sent the verification code to your email address
              </Text>
            </View>

            <TextInput
              value={otp}
              onChangeText={setOtp}
              placeholder="Enter OTP"
              keyboardType="numeric"
              style={{
                height: 40,
                borderBottomWidth: 1, // Bottom border only
                borderBottomColor: "gray", // Color of the bottom border
                marginBottom: 10,
                width: "100%",
              }}
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text>Didn’t Receive the Code? </Text>
              <TouchableOpacity
                disabled={isDisabled}
                onPress={handleResendOtp}
                style={{
                  padding: 10,
                  borderRadius: 5,
                }}
              >
                <Text
                  style={{
                    color: isDisabled ? "gray" : "blue", // Change color based on the button state
                    textAlign: "center",
                  }}
                >
                  {isDisabled ? `Resend in ${timer}s` : "Resend"}
                </Text>
              </TouchableOpacity>
            </View>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <TouchableOpacity
                onPress={handleBack}
                style={[styles.button, { backgroundColor: "gray" }]}
              >
                <Text style={styles.buttonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNextStep3} style={styles.button}>
                <Text
                  style={{
                    color: "black",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 3:
        return (
          <View>
            <TextInput
              placeholder="Type of Vehicle (Jeep, Tricycle)"
              value={vehicleType}
              onChangeText={setVehicleType}
              style={styles.input}
            />
            <TextInput
              placeholder="Model"
              value={model}
              onChangeText={setModel}
              style={styles.input}
            />
            <TextInput
              placeholder="Year"
              value={year}
              onChangeText={setYear}
              style={styles.input}
            />
            <TextInput
              placeholder="Color"
              value={color}
              onChangeText={setColor}
              style={styles.input}
            />
            <TextInput
              placeholder="Plate Number"
              value={plateNumber}
              onChangeText={setPlateNumber}
              style={styles.input}
            />
            <TextInput
              placeholder="Capacity"
              value={capacity}
              onChangeText={setCapacity}
              style={styles.input}
            />
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <TouchableOpacity
                onPress={handleBack}
                style={[styles.button, { backgroundColor: "gray" }]}
              >
                <Text style={styles.buttonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNextStep4} style={styles.button}>
                <Text
                  style={{
                    color: "black",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  Next
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 4:
        return (
          <View style={styles.license}>
            <View style={styles.uploadSection}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={styles.uploadText}>Driver License (Front)</Text>
                {!licenseFront ? (
                  <TouchableOpacity
                    onPress={() => pickImage("licenseFront")}
                    style={{
                      backgroundColor: "gainsboro",
                      width: 100,
                      height: 100,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderStyle: "dashed",
                      borderColor: "lightgray",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ textAlign: "center" }}>Click to upload</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => pickImage("licenseFront")}
                    style={{ width: 100, height: 100 }}
                  >
                    <Image
                      source={{ uri: licenseFront.uri }}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 10,
                      }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                )}
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={styles.uploadText}>Driver License (Back)</Text>

                {!licenseBack ? (
                  <TouchableOpacity
                    onPress={() => pickImage("licenseBack")}
                    style={{
                      backgroundColor: "gainsboro",
                      width: 100,
                      height: 100,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderStyle: "dashed",
                      borderColor: "lightgray",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ textAlign: "center" }}>Click to upload</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => pickImage("licenseBack")}
                    style={{ width: 100, height: 100 }}
                  >
                    <Image
                      source={{ uri: licenseBack.uri }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                )}
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={styles.uploadText}>Official Receipt (OR)</Text>
                {!or ? (
                  <TouchableOpacity
                    onPress={() => pickImage("or")}
                    style={{
                      backgroundColor: "gainsboro",
                      width: 100,
                      height: 100,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderStyle: "dashed",
                      borderColor: "lightgray",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ textAlign: "center" }}>Click to upload</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => pickImage("or")}
                    style={{ width: 100, height: 100 }}
                  >
                    <Image
                      source={{ uri: or.uri }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                )}
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={styles.uploadText}>
                  Certificate of Registration (CR)
                </Text>

                {!cr ? (
                  <TouchableOpacity
                    onPress={() => pickImage("cr")}
                    style={{
                      backgroundColor: "gainsboro",
                      width: 100,
                      height: 100,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderStyle: "dashed",
                      borderColor: "lightgray",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ textAlign: "center" }}>Click to upload</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => pickImage("cr")}
                    style={{ width: 100, height: 100 }}
                  >
                    <Image
                      source={{ uri: cr.uri }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                )}
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingTop: 10,
                }}
              >
                <TouchableOpacity
                  onPress={handleBack}
                  style={[styles.button, { backgroundColor: "gray" }]}
                >
                  <Text style={styles.buttonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={uploadLicenseImages}
                  style={[styles.button, uploading && styles.disabledButton]}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={{ fontWeight: "bold", color: "black" }}>
                      Next
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      case 5:
        return (
          <View style={styles.license}>
            <View style={styles.uploadSection}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={styles.uploadText}>Vehicle (Front)</Text>
                {!vehicleFront ? (
                  <TouchableOpacity
                    onPress={() => pickImage("vehicleFront")}
                    style={{
                      backgroundColor: "gainsboro",
                      width: 100,
                      height: 100,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderStyle: "dashed",
                      borderColor: "lightgray",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ textAlign: "center" }}>Click to upload</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => pickImage("vehicleFront")}
                    style={{ width: 100, height: 100 }}
                  >
                    <Image
                      source={{ uri: vehicleFront.uri }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                )}
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={styles.uploadText}>Vehicle (Back)</Text>

                {!vehicleBack ? (
                  <TouchableOpacity
                    onPress={() => pickImage("vehicleBack")} // Passing the side for license back
                    style={{
                      backgroundColor: "gainsboro",
                      width: 100,
                      height: 100,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderStyle: "dashed",
                      borderColor: "lightgray",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ textAlign: "center" }}>Click to upload</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => pickImage("vehicleBack")}
                    style={{ width: 100, height: 100 }}
                  >
                    <Image
                      source={{ uri: vehicleBack.uri }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                )}
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={styles.uploadText}>Vehicle (Left)</Text>
                {!vehicleLeft ? (
                  <TouchableOpacity
                    onPress={() => pickImage("vehicleLeft")}
                    style={{
                      backgroundColor: "gainsboro",
                      width: 100,
                      height: 100,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderStyle: "dashed",
                      borderColor: "lightgray",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ textAlign: "center" }}>Click to upload</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => pickImage("vehicleLeft")}
                    style={{ width: 100, height: 100 }}
                  >
                    <Image
                      source={{ uri: vehicleLeft.uri }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                )}
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={styles.uploadText}>Vehicle (Right)</Text>

                {!vehicleRight ? (
                  <TouchableOpacity
                    onPress={() => pickImage("vehicleRight")}
                    style={{
                      backgroundColor: "gainsboro",
                      width: 100,
                      height: 100,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderStyle: "dashed",
                      borderColor: "lightgray",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ textAlign: "center" }}>Click to upload</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => pickImage("vehicleRight")}
                    style={{ width: 100, height: 100 }}
                  >
                    <Image
                      source={{ uri: vehicleRight.uri }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                )}
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingTop: 10,
                }}
              >
                <TouchableOpacity
                  onPress={handleBack}
                  style={[styles.button, { backgroundColor: "gray" }]}
                >
                  <Text style={styles.buttonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSignup}
                  style={[styles.button, uploading && {}]} // Optionally disable button on loading
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="#ffffff" /> // Show loading spinner while uploading
                  ) : (
                    <Text style={styles.buttonText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  const isLastStep = currentStep === 5; // Check if it's the last step (step 5)

  return (
    <View style={styles.container}>
      {currentStep == 1 && (
        <View style={{ alignItems: "center", paddingTop: 70 }}>
          <Text style={{ fontWeight: "bold", fontSize: 32 }}>Signup</Text>
          <Text>Let's get started with your account</Text>
        </View>
      )}

      <View style={styles.stepIndicator}>
        {stepsToShow.map((step) => (
          <View key={step.id} style={styles.step}>
            <View
              style={[
                styles.stepCircle,
                step.id < currentStep
                  ? styles.completedStep
                  : step.id === currentStep
                  ? styles.activeStep
                  : styles.inactiveStep,
              ]}
            >
              <Text style={styles.stepText}>{step.id}</Text>
            </View>
            <Text style={styles.stepTitle}>{step.title}</Text>
          </View>
        ))}
      </View>

      <View style={styles.form}>{renderStep()}</View>

      <View style={styles.buttonContainer}></View>
      {currentStep == 1 && (
        <Text style={{ textAlign: "center", paddingVertical: 40 }}>
          Already have an Account?{" "}
          <Text onPress={handleLogin} style={{ color: "blue" }}>
            Login
          </Text>
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  license: {
    gap: 40,
  },
  uploadSection: {
    flexDirection: "column",
    justifyContent: "space-between",
    paddingTop: 20,
  },
  uploadText: {
    marginTop: 25,
    fontWeight: "500",
    fontSize: 16,
  },
  uploadButton: {
    padding: 30,
    backgroundColor: "lightgray",
    alignItems: "center",
  },
  image: {
    width: 100,
    height: 100,
    marginTop: 10,
    borderRadius: 5,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "white",
  },
  stepIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 20,
  },
  step: {
    alignItems: "center",
    marginHorizontal: 10,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  activeStep: {
    backgroundColor: "lightblue", // Active step is light blue
  },
  completedStep: {
    backgroundColor: "green", // Completed steps are green
  },
  inactiveStep: {
    backgroundColor: "gray", // Inactive steps are gray
  },
  stepText: {
    color: "white",
    fontWeight: "bold",
  },
  stepTitle: {
    marginTop: 5,
    fontSize: 12,
  },
  form: {
    marginBottom: 20,
    padding: 20,
  },
  input: {
    width: "100%",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: "powderblue",
    padding: 10,
    borderRadius: 5,
    width: "48%",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
});

export default DriverSignup;
