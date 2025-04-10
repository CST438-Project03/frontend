import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, StyleSheet, TextInput, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { routeToScreen } from 'expo-router/build/useScreens';

const Login: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);


  return (
    <LinearGradient colors={['#000000', '#808080']} style={styles.container}>
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
          onPress={() => useRouter().push('/home')}
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
          <TouchableOpacity onPress={() => useRouter().push('/createAccount')}>
            <Text style={styles.createAccountLink}>Create an account here</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    padding: 40,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    width: '60%',
    maxWidth: 600,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputLabel: {
    alignSelf: 'flex-start',
    color: 'white',
    marginBottom: 8,
    fontWeight: '500',
    fontSize: 18,
  },
  input: {
    width: '100%',
    padding: 15,
    marginBottom: 20,
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
    paddingVertical: 15,
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
    marginTop: 20,
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