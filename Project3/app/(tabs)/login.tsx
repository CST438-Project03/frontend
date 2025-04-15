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

// Get device width for responsive sizing
const windowWidth = Dimensions.get('window').width;
const isWeb = Platform.OS === 'web';

const Login: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleLogin = () => {
    router.push('/home');
  };

  const handleCreateAccount = () => {
    router.push('/createAccount');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#000000', '#808080']} style={styles.container}>
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

              {/* Password field */}
              <Text style={styles.inputLabel}>Please enter password</Text>
              <TextInput
                style={styles.input}
                placeholder="Password"
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
                  <ActivityIndicator color="#fff" size="small" />
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
  loginButton: {
    backgroundColor: '#BB86FC',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
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
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  createAccountText: {
    color: 'white',
    marginRight: 5,
    fontSize: 16,
  },
  createAccountLink: {
    color: '#4da6ff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Login;