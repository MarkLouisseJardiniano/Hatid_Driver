import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

const Subscription = () => {
  const [selectedOption, setSelectedOption] = useState('tricycle');

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Subscribe</Text>
      <Text style={styles.subtitle}>Choose your plan</Text>
      <View style={styles.optionContainer}>
      <Text  style={styles.header}>For Tricycle</Text>
        <View style={styles.subsOption}>
        <View style={styles.selection}>
        {renderRadioButton('tricycle-free')}
        <Text style={styles.optionText}>Free</Text>
        </View>
        <View style={styles.selection}>
        {renderRadioButton('tricycle-month')}
        <Text style={styles.optionText}>Monthly</Text>
        </View>
        <View style={styles.selection}>
        {renderRadioButton('tricycle-quarter')}
        <Text style={styles.optionText}>Quarterly</Text>
        </View>
        <View style={styles.selection}>
        {renderRadioButton('tricycle-annual')}
        <Text style={styles.optionText}>Annually</Text>
        </View>
        </View>
      </View>
      <View style={styles.optionContainer}>
      <Text style={styles.header}>For Jeepney</Text>
        <View style={styles.subsOption}>
        <View style={styles.selection}>
        {renderRadioButton('jeepney-free')}
        <Text style={styles.optionText}>Free</Text>
        </View>
        <View style={styles.selection}>
        {renderRadioButton('jeepney-month')}
        <Text style={styles.optionText}>Monthly</Text>
        </View>
        <View style={styles.selection}>
        {renderRadioButton('jeepney-quarter')}
        <Text style={styles.optionText}>Quarterly</Text>
        </View>
        <View style={styles.selection}>
        {renderRadioButton('jeepney-annual')}
        <Text style={styles.optionText}>Annually</Text>
        </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginLeft: 40,
    marginTop: 20,
    flexDirection: 'column',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  header: {
    fontWeight: '700'
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
  },
  optionContainer: {
    flexDirection: 'column',
    marginBottom: 15,
  },
  subsOption: {
    flexDirection: ' row'
  },
  selection : {
    flexDirection: 'row',
    marginTop: 20,
    marginRight: 10
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
});

export default Subscription;
