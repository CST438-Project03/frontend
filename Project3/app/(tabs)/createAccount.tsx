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

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
const isWeb = Platform.OS === 'web';

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

  // Handle account creation form submission
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
      
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('email', email);
      params.append('password', password);
      
      const createResponse = await fetch('http://localhost:8080/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
  
      console.log("Response status:", createResponse.status);
      const responseText = await createResponse.text();
      console.log("Response body:", responseText);
      
      if (!createResponse.ok) {
        setError(responseText || 'Failed to create account');
        setIsLoading(false);
        return;
      }
  
      console.log("Account created successfully");
      
      // Reset loading state immediately to unfreeze the UI
      setIsLoading(false);
      
      // Clear input fields
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      
      // Instead of using Alert, navigate directly
      console.log("Navigating to login page directly");
      
      // Add a small delay before navigation to ensure state updates are processed
      setTimeout(() => {
        try {
          console.log("Executing navigation to login");
          router.replace('/login');
        } catch (navError) {
          console.error("Navigation error:", navError);
          // Fallback navigation attempt
          try {
            console.log("Trying fallback navigation");
            router.push('/login');
          } catch (fallbackError) {
            console.error("Fallback navigation failed:", fallbackError);
          }
        }
      }, 300);
      
    } catch (err) {
      console.error('Error during account creation:', err);
      setError('An error occurred. Please try again later.');
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.push('/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#000000', '#808080']} style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.overlay}>
              <Text style={styles.title}>Create an Account</Text>

              {/* Username field with label */}
              <Text style={styles.inputLabel}>Please enter username</Text>
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
              
              {/* Email field with label */}
              <Text style={styles.inputLabel}>Please enter email</Text>
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
              
              {/* Password field with label */}
              <Text style={styles.inputLabel}>Please enter password</Text>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry
              />
              
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
              
              {/* Confirm Password field with label */}
              <Text style={styles.inputLabel}>Please re-enter your password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />

              {error && <Text style={styles.error}>{error}</Text>}

              {/* Enhanced Create Account Button */}
              <TouchableOpacity
                style={[styles.createButton, isLoading && styles.createButtonDisabled]}
                onPress={handleCreateAccount}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.createButtonText}>Create Account</Text>
                )}
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
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  overlay: {
    padding: isWeb ? 40 : 20,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    width: isWeb ? '80%' : '85%',
    minWidth: isWeb ? 480 : 'auto',
    maxWidth: isWeb ? 600 : '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20, 
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
    marginBottom: 16, 
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: 'white',
    fontSize: 16,
  },
  error: {
    color: '#ff6b6b',
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 16,
  },
  passwordFeedback: {
    alignSelf: 'flex-start',
    marginBottom: 8, 
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
    marginBottom: 16,
    fontStyle: 'italic',
  },
  createButton: {
    backgroundColor: '#BB86FC',
    paddingVertical: 14, 
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  createButtonDisabled: {
    backgroundColor: 'rgba(187, 134, 252, 0.6)',
  },
  createButtonText: {
    color: '#121212',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    marginTop: 16, 
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginText: {
    color: 'white',
    marginRight: 5,
    fontSize: 16,
  },
  loginLink: {
    color: '#4da6ff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CreateAccount;