
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OAuthCallback = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token, userId, username } = params;

  useEffect(() => {
    const storeAuthData = async () => {
      try {
        if (token && userId && username) {
          // Store the authentication data
          await AsyncStorage.setItem('jwtToken', token.toString());
          await AsyncStorage.setItem('userId', userId.toString());
          await AsyncStorage.setItem('username', username.toString());
          await AsyncStorage.setItem('lastLogin', Date.now().toString());

          // Navigate to home screen
          router.replace('/home');
        } else {
          // Handle error case
          console.error('Invalid OAuth callback parameters');
          router.replace('/login');
        }
      } catch (error) {
        console.error('Error storing OAuth data:', error);
        router.replace('/login');
      }
    };

    storeAuthData();
  }, [token, userId, username, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#BB86FC" />
      <Text style={{ marginTop: 20, color: 'white' }}>Completing login...</Text>
    </View>
  );
};

export default OAuthCallback;