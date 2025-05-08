import React, { useState } from 'react';
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
import { MaterialIcons } from '@expo/vector-icons';

// Get device width for responsive sizing
const windowWidth = Dimensions.get('window').width;
const isWeb = Platform.OS === 'web';
const isSmallScreen = windowWidth < 375;

// API URLs adjusted by platform
const API_URL = isWeb 
  ? 'https://cst438-project3-2224023aed89.herokuapp.com' 
  : 'http://10.0.2.2:8080'; 

const OAUTH2_URL = isWeb 
  ? 'https://cst438-project3-2224023aed89.herokuapp.com/api/oauth2/authorization/google' 
  : 'http://10.0.2.2:8080/oauth2/authorization/google';
  
interface UserCredentials {
  username: string;
  email: string;
  password: string;
}

// Password validation function
const validatePassword = (password: string): { isValid: boolean; message: string } => {
  // Check minimum length
  if (password.length < 6) {
    return { 
      isValid: false, 
      message: 'Password must be at least 6 characters long' 
    };
  }
  
  // Check for alphanumeric characters
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  if (!hasLetter || !hasNumber) {
    return { 
      isValid: false, 
      message: 'Password must contain both letters and numbers' 
    };
  }
  
  // Check for special character
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  if (!hasSpecialChar) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one special character' 
    };
  }
  
  return { isValid: true, message: '' };
};

const CreateAccount: React.FC = () => {
  // State for account creation form
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [passwordFeedback, setPasswordFeedback] = useState<string>('');

  const router = useRouter(); // For navigation to home.tsx

  // Check password as it's being typed
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    // Clear feedback when field is empty
    if (!text) {
      setPasswordFeedback('');
      return;
    }
    
    const validation = validatePassword(text);
    if (!validation.isValid) {
      setPasswordFeedback(validation.message);
    } else {
      setPasswordFeedback('Password meets all requirements ✓');
    }
  };

  const handleCreateAccount = async (): Promise<void> => {
    // Check if all fields are filled
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill out all fields.');
      return;
    }
    
    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message);
      return;
    }
    
    // Check if passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
  
    setIsLoading(true);
    setError('');
  
    try {
      console.log("Starting account creation process...");
      
      // Create user data object in JSON format
      const userData = {
        username,
        email,
        password
      };
      
      // Use the correct endpoint that matches your security configuration
      const endpoint = 'api/auth/register'; // This should match the allowed path in your security config
      console.log("Sending request to:", `${API_URL}${endpoint}`);
      
      // Important: Don't use credentials: 'include' to avoid CORS preflight issues
      const createResponse = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        // Remove credentials: 'include' to avoid CORS preflight issues with OAuth
      });
      
      console.log("Response status:", createResponse.status);
      
      // Process the response
      let responseData;
      try {
        responseData = await createResponse.json();
      } catch (e) {
        const responseText = await createResponse.text();
        responseData = { message: responseText };
      }
      
      console.log("Response data:", responseData);
      
      // Check if successful
      if (createResponse.ok) {
        console.log("Account created successfully");
        setIsLoading(false);
        clearForm();
        // Navigate to login page
        navigateToLogin();
      } else {
        // Show error message
        setError(responseData.message || 'Failed to create account');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error during account creation:', err);
      setError('Network error. Please check your connection and try again.');
      setIsLoading(false);
    }
  };
  
  // Helper function to clear form
  const clearForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setPasswordFeedback('');
  };
  
  // Helper function for navigation
  const navigateToLogin = () => {
    console.log("Navigating to login page");
    setTimeout(() => {
      try {
        router.push('/login');
      } catch (navError) {
        console.error("Navigation error:", navError);
        router.replace('/login');
      }
    }, 300);
  };

  // Helper function to handle Google signup
  const handleGoogleSignup = () => {
    // For web, redirect to the OAuth endpoint
    if (Platform.OS === 'web') {
      console.log('Redirecting to Google OAuth2 signup');
      window.location.href = OAUTH2_URL;
    } else {
      // For mobile, you'll need to handle this differently
      // Consider using a WebView or a library for OAuth
      setError('Google signup is only available on web currently');
    }
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
              
              <Text style={styles.title}>Create an Account</Text>

              {/* Username field with icon */}
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
              
              {/* Email field with icon */}
              <View style={styles.inputWrapper}>
                <MaterialIcons name="email" size={20} color="#3a1c71" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              
              {/* Password field with icon */}
              <View style={styles.inputWrapper}>
                <MaterialIcons name="lock" size={20} color="#3a1c71" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry
                />
              </View>
              
              {/* Password requirements feedback */}
              {passwordFeedback && (
                <Text style={[
                  styles.passwordFeedback, 
                  passwordFeedback.includes('✓') ? styles.validFeedback : styles.invalidFeedback
                ]}>
                  {passwordFeedback}
                </Text>
              )}
              
              {/* Password requirements info */}
              <Text style={styles.passwordRequirements}>
                Password must contain at least 6 characters, include both letters and numbers, 
                and have at least one special character.
              </Text>
              
              {/* Confirm Password field with icon */}
              <View style={styles.inputWrapper}>
                <MaterialIcons name="lock" size={20} color="#3a1c71" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              {error && <Text style={styles.error}>{error}</Text>}

              {/* Create Account Button */}
              <TouchableOpacity
                style={[styles.createButton, isLoading && styles.createButtonDisabled]}
                onPress={handleCreateAccount}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <MaterialIcons name="person-add" size={20} color="white" style={styles.buttonIcon} />
                    <Text style={styles.createButtonText}>Create Account</Text>
                  </>
                )}
              </TouchableOpacity>
              
              {/* OAuth Signup Section */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Signup Button */}
              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleSignup}
                activeOpacity={0.8}
              >
                <View style={styles.googleIconContainer}>
                  <Text style={styles.googleIcon}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>Sign up with Google</Text>
              </TouchableOpacity>
              
              {/* Login section */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account?</Text>
                <TouchableOpacity onPress={navigateToLogin}>
                  <Text style={styles.loginLink}>Login here</Text>
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
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 16,
  },
  passwordFeedback: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    fontSize: 14,
  },
  validFeedback: {
    color: '#4cd964',
  },
  invalidFeedback: {
    color: '#ff9500',
  },
  passwordRequirements: {
    color: '#aaa',
    fontSize: 12,
    alignSelf: 'flex-start',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  createButton: {
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
  createButtonDisabled: {
    backgroundColor: 'rgba(58, 28, 113, 0.6)',
  },
  buttonIcon: {
    marginRight: 10,
  },
  createButtonText: {
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
  loginContainer: {
    marginTop: 25,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  loginText: {
    color: '#666',
    marginRight: 5,
    fontSize: 16,
  },
  loginLink: {
    color: '#3a1c71',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
export default CreateAccount;