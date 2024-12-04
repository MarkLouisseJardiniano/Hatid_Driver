    
    
    
    
    const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  
  const paymentModalClose = () => {
    setPaymentSubmitted(false);
  };



          setAcceptedSpecialBooking((prevBooking) => ({
            ...prevBooking,
            status: "Dropped off",
            ratings: updatedBooking.ratings?.rating,
            report: updatedBooking.report?.report,
            description: updatedBooking.report?.description,
            paymentMethod: updatedBooking.paymentMethod,
            receiptImage: updatedBooking.receiptImage,
          }));

    <Modal
            visible={paymentSubmitted}
            animationType="fade"
            transparent={true}
          >
            <View
              style={{
                flex: 1,
                padding: 20,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(0,0,0,0.5)",
              }}
            >
              <View
                style={{
                  width: "100%",
                  padding: 20,
                  backgroundColor: "#f4f4f4",
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                >
                  Payment Submitted
                </Text>

                {acceptedSpecialBooking && (
                  <>
                    <Text
                      style={{
                        fontWeight: "bold",
                        marginBottom: 10,
                        fontSize: 20,
                      }}
                    >
                      {acceptedSpecialBooking.name}
                    </Text>

                    <View style={{ flexDirection: "column" }}>
                      <Text>
                        <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                          Pickup:
                        </Text>
                        {acceptedSpecialBooking.pickupAddress}
                      </Text>
                      <Text>
                        <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                          Destination:{" "}
                        </Text>
                        {acceptedSpecialBooking.destinationAddress}
                      </Text>
                      <Text>
                        <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                          Ratings:
                        </Text>
                        {acceptedSpecialBooking.ratings ?? "No ratings yet"}
                      </Text>
                      {acceptedSpecialBooking?.report && (
                        <View>
                          <Text style={styles.details}>
                            <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                              Report:
                            </Text>
                            {acceptedSpecialBooking.report}
                          </Text>
                        </View>
                      )}
                      <Text>
                        <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                          Fare:
                        </Text>
                        {acceptedSpecialBooking.fare ?? "Not provided"}
                      </Text>
                      <Text>
                        <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                          Payment Method:{" "}
                        </Text>
                        {acceptedSpecialBooking.paymentMethod ?? "Not provided"}
                      </Text>
                      {acceptedSpecialBooking.receiptImage && (
                        <View>
                          <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                            Receipt Image:
                          </Text>
                          <View style={{ paddingVertical: 10 }}>
                            <Image
                              source={{
                                uri: acceptedSpecialBooking.receiptImage,
                              }}
                              style={{
                                width: "100%",
                                height: 200,
                                borderRadius: 30,
                              }}
                            />
                          </View>
                        </View>
                      )}

                      {console.log(
                        "Accepted Special Booking:",
                        acceptedSpecialBooking
                      )}
                      {console.log(
                        "Ratings:",
                        acceptedSpecialBooking.ratings?.rating
                      )}
                    </View>
                  </>
                )}
                <View style={{paddingVertical: 20}}>
                  <Button
                    title="Close"
                    onPress={() => paymentModalClose(false)}
                  />
                </View>
              </View>
            </View>
          </Modal>