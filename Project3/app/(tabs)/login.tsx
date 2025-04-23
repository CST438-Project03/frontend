import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ActivityIndicator, 
  TouchableOpacity,
  Platform,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get device width for responsive sizing
const windowWidth = Dimensions.get('window').width;
const isWeb = Platform.OS === 'web';

// API URLs adjusted by platform
const API_URL = isWeb 
  ? 'http://localhost:8080/auth' 
  : 'http://10.0.2.2:8080/auth';

interface LoginResponse {
  jwtToken: string;
  userId: number | string;
  username: string;
  [key: string]: any; 
}

const Login: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  
  // Clear any existing session data when login page loads
  useEffect(() => {
    const clearSessionData = async (): Promise<void> => {
      try {
        console.log('Clearing any stored session data...');
        // Get all keys in AsyncStorage
        const keys = await AsyncStorage.getAllKeys();
        
        // Filter out any user-related keys
        const authKeys = keys.filter((key: string) => 
          key === 'jwtToken' || 
          key === 'username' || 
          key === 'userId' ||
          key.startsWith('user')
        );
        
        if (authKeys.length > 0) {
          // Remove all authentication data
          await AsyncStorage.multiRemove(authKeys);
          console.log('Cleared authentication data on login page load:', authKeys);
        } else {
          console.log('No authentication data to clear on login page load');
        }
      } catch (error) {
        console.error('Error clearing session data:', error);
      }
    };
    
    clearSessionData();
  }, []);

  const handleLogin = async (): Promise<void> => {
    if (!username.trim() || !password.trim()) {
      setError('Please fill out all fields.');
      return;
    }
  
    setIsLoading(true);
    setError('');
  
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
  
      console.log('Attempting login for:', username);
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });
  
      console.log('Response status:', response.status);
      
      const responseText = await response.text();
      console.log('Response body length:', responseText.length);
      

      let data: LoginResponse;
      try {
        data = JSON.parse(responseText);
        console.log('Response parsed successfully:', Object.keys(data));
      } catch (e) {
        console.error('Error parsing response:', e);

        setError(responseText || 'Server error occurred');
        setIsLoading(false);
        return;
      }
  
      if (!response.ok) {
        setError((data as any).message || 'Invalid username or password');
        setIsLoading(false);
        return;
      }
      
      const jwtToken = data.jwtToken;
      
      if (!jwtToken) {
        setError('Authentication failed: No token received');
        setIsLoading(false);
        return;
      }
  
      // Store the JWT token and user info in AsyncStorage
      console.log('Storing new authentication data...');
      await AsyncStorage.setItem('jwtToken', jwtToken);
      await AsyncStorage.setItem('username', username);
      
      // Also store the timestamp for refreshing profile data later
      await AsyncStorage.setItem('lastLogin', Date.now().toString());
  
      // Store user ID if available
      if (data.userId) {
        await AsyncStorage.setItem('userId', data.userId.toString());
      }
  
      console.log('Login successful, new data stored');
      
      // Clear the form
      setUsername('');
      setPassword('');
      setError('');
      
      // Navigate to home screen
      router.replace('/home');
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = (): void => {
    router.push('/createAccount');
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#121212', '#2a2a2a']} style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.overlay}>
              <Text style={styles.title}>Login to GameStack</Text>

              {/* Username field */}
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />

              {/* Password field */}
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#121212" size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Login</Text>
                )}
              </TouchableOpacity>

              {/* Create account section */}
              <View style={styles.createAccountContainer}>
                <Text style={styles.createAccountText}>Don't have an account?</Text>
                <TouchableOpacity onPress={handleCreateAccount}>
                  <Text style={styles.createAccountLink}>Create an account here</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidView: {
    flex: 1,
    width: '100%',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 30,
  },
  overlay: {
    padding: isWeb ? 40 : 20,
    borderRadius: 15,
    backgroundColor: 'rgba(40, 40, 40, 0.8)',
    alignItems: 'center',
    width: isWeb ? '60%' : '85%',
    minWidth: isWeb ? 480 : 'auto',
    maxWidth: isWeb ? 600 : '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputLabel: {
    alignSelf: 'flex-start',
    color: 'white',
    marginBottom: 6,
    fontWeight: '500',
    fontSize: 16,
  },
  input: {
    width: '100%',
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 10,
    backgroundColor: '#3a3a3a',
    color: 'white',
    fontSize: 16,
  },
  error: {
    color: '#ff6b6b',
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#BB86FC',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  loginButtonDisabled: {
    backgroundColor: 'rgba(187, 134, 252, 0.6)',
  },
  loginButtonText: {
    color: '#121212',
    fontSize: 18,
    fontWeight: 'bold',
  },
  createAccountContainer: {
    marginTop: 25,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  createAccountText: {
    color: 'white',
    marginRight: 5,
    fontSize: 16,
  },
  createAccountLink: {
    color: '#BB86FC',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Login;