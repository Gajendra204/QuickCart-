import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Animated, Easing } from 'react-native';

const HomeScreen = ({ navigation }) => {
  const [barcodeId, setBarcodeId] = useState('');
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);
  const scaleValue = new Animated.Value(1);

  const handleSubmit = () => {
    if (barcodeId.trim()) {
      navigation.navigate('StoreDetails', { barcodeId });
    } else {
      setError('Please enter a valid Barcode ID.');
      Animated.sequence([
        Animated.timing(scaleValue, { toValue: 1.1, duration: 100, useNativeDriver: true }),
        Animated.timing(scaleValue, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
    }
  };

  const handleFocus = () => {
    setFocused(true);
    setError('');
  };

  const handleBlur = () => {
    setFocused(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}

      <View style={styles.innerContainer}>
        <Text style={styles.title}>📦 Barcode Scanner</Text>
        <Text style={styles.subtitle}>Enter the Barcode ID to get store details.</Text>

        <Animated.View style={{ transform: [{ scale: scaleValue }], width: '100%' }}>
          <TextInput
            style={[styles.input, focused && styles.inputFocused, error && styles.inputError]}
            placeholder="Enter Barcode ID"
            placeholderTextColor="#888"
            value={barcodeId}
            onChangeText={(text) => {
              setBarcodeId(text);
              setError('');
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </Animated.View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => navigation.navigate('BarCode')}
        >
          <Text style={styles.scanButtonText}>📷 Scan Barcode</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  innerContainer: {
    width: '100%',
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
  },
  inputFocused: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#007AFF',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  scanButton: {
    backgroundColor: '#34C759',
    paddingVertical: 15,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#34C759',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default HomeScreen;