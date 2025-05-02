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
  SafeAreaView,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

// Get device width for responsive sizing
const windowWidth = Dimensions.get('window').width;
const isWeb = Platform.OS === 'web';
const isSmallScreen = windowWidth < 375;

// API URLs adjusted by platform
const API_URL_AUTH = isWeb 
  ? 'http://localhost:8080/auth' 
  : 'http://10.0.2.2:8080/auth';

const OAUTH2_URL = isWeb 
  ? 'http://localhost:8080/oauth2/authorization/google' 
  : 'http://10.0.2.2:8080/oauth2/authorization/google';

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
  
      console.log('Attempting JWT login for:', username);
      
      // Use /auth/login for regular JWT login
      const response = await fetch(`${API_URL_AUTH}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        redirect: 'manual' // Prevent automatic redirects
      });
  
      console.log('Response status:', response.status);
      
      const responseText = await response.text();
      console.log('Response body length:', responseText.length);
      
      // Log a preview of the response for debugging
      if (responseText.length > 0) {
        console.log('Response preview:', responseText.substring(0, 200));
      }
  
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
  
      // Store authentication data and navigate to home
      storeAuthDataAndNavigate(jwtToken, username, data.userId);
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to handle Google OAuth login
  const handleGoogleLogin = () => {
    // For web, redirect to the OAuth endpoint
    if (Platform.OS === 'web') {
      console.log('Redirecting to Google OAuth2 login');
      window.location.href = OAUTH2_URL;
    } else {
      // For mobile, you'll need to handle this differently
      // Consider using a WebView or a library for OAuth
      setError('Google login is only available on web currently');
    }
  };
  
  // Helper function to store auth data and navigate
  const storeAuthDataAndNavigate = async (token: string, username: string, userId: any) => {
    try {
      // Store the JWT token and user info in AsyncStorage
      console.log('Storing new authentication data...');
      await AsyncStorage.setItem('jwtToken', token);
      await AsyncStorage.setItem('username', username);
      
      // Also store the timestamp for refreshing profile data later
      await AsyncStorage.setItem('lastLogin', Date.now().toString());
  
      // Store user ID if available
      if (userId) {
        await AsyncStorage.setItem('userId', userId.toString());
      }
  
      console.log('Login successful, new data stored');
      
      // Clear the form
      setUsername('');
      setPassword('');
      setError('');
      
      // Navigate to home screen
      router.replace('/home');
    } catch (err) {
      console.error('Error storing auth data:', err);
      setError('Error saving authentication data');
    }
  };

  const handleCreateAccount = (): void => {
    router.push('/createAccount');
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#3a1c71', '#d76d77', '#ffaf7b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.contentContainer}>
              {/* Logo and title section */}
              <View style={styles.logoContainer}>
                <MaterialIcons name="sports-esports" size={64} color="#fff" />
              </View>
              
              <Text style={styles.title}>Login to GameStack</Text>

              {/* Username field */}
              <View style={styles.inputWrapper}>
                <MaterialIcons name="person" size={20} color="#3a1c71" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#999"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password field */}
              <View style={styles.inputWrapper}>
                <MaterialIcons name="lock" size={20} color="#3a1c71" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <MaterialIcons name="login" size={20} color="white" style={styles.buttonIcon} />
                    <Text style={styles.loginButtonText}>Login</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* OAuth Login Section */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Login Button */}
              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleLogin}
                activeOpacity={0.8}
              >
                <View style={styles.googleIconContainer}>
                  <Text style={styles.googleIcon}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
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
  contentContainer: {
    width: isWeb ? '80%' : '90%',
    maxWidth: 500,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: isSmallScreen ? 20 : 30,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 15,
      },
      web: {
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)'
      }
    }),
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3a1c71',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
      }
    }),
  },
  title: {
    fontSize: isSmallScreen ? 28 : 36,
    fontWeight: 'bold',
    color: '#3a1c71',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)'
      }
    }),
  },
  inputIcon: {
    marginLeft: 15,
    marginRight: 5,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#333',
  },
  error: {
    color: '#ff6b6b',
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#3a1c71',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#3a1c71',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 12px rgba(58, 28, 113, 0.3)',
        cursor: 'pointer',
      }
    }),
  },
  loginButtonDisabled: {
    backgroundColor: 'rgba(58, 28, 113, 0.6)',
  },
  buttonIcon: {
    marginRight: 10,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    paddingHorizontal: 15,
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  googleButton: {
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
      }
    }),
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4285F4', // Google blue color
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  createAccountContainer: {
    marginTop: 25,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  createAccountText: {
    color: '#666',
    marginRight: 5,
    fontSize: 16,
  },
  createAccountLink: {
    color: '#3a1c71',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Login;