import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform, Image } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function WelcomeScreen() {
  // Animation values for button hover effects
  const loginButtonScale = React.useRef(new Animated.Value(1)).current;
  const createButtonScale = React.useRef(new Animated.Value(1)).current;
  
  // Button press animation functions
  const handlePressIn = (buttonRef: Animated.Value): void => {
    Animated.spring(buttonRef, {
      toValue: 0.95,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (buttonRef: Animated.Value): void => {
    Animated.spring(buttonRef, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <LinearGradient colors={['#000000', '#808080']} style={styles.container}>
      <View style={styles.overlay}>
        {/* App Logo */}
        {/* <View style={styles.logoContainer}>
          <MaterialIcons name="leaderboard" size={60} color="#BB86FC" />
        </View> */}
        
        <Text style={styles.title}>Welcome to GameStack!</Text>
        <Text style={styles.subtitle}> need to add something here</Text>
        
        <View style={styles.buttonContainer}>
          {/* Login Button */}
          <Animated.View 
            style={[
              styles.buttonWrapper, 
              { transform: [{ scale: loginButtonScale }] }
            ]}
          >
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => router.replace('/login')}
              onPressIn={() => handlePressIn(loginButtonScale)}
              onPressOut={() => handlePressOut(loginButtonScale)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="login" size={20} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Create Account Button */}
          <Animated.View 
            style={[
              styles.buttonWrapper, 
              { transform: [{ scale: createButtonScale }] }
            ]}
          >
            <TouchableOpacity 
              style={styles.createAccountButton}
              onPress={() => router.push('/createAccount')}
              onPressIn={() => handlePressIn(createButtonScale)}
              onPressOut={() => handlePressOut(createButtonScale)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="person-add" size={20} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Create Account</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Rank anything. Share everything.
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    padding: 30,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    width: '80%',
    maxWidth: 450,
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
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)'
      }
    }),
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    ...Platform.select({
      ios: {
        shadowColor: '#BB86FC',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 0 15px rgba(187, 134, 252, 0.5)'
      }
    }),
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#E0E0E0',
    marginBottom: 40,
    textAlign: 'center',
    opacity: 0.8,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonWrapper: {
    width: '100%',
    marginVertical: 8,
  },
  loginButton: {
    backgroundColor: '#BB86FC',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#BB86FC',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(187, 134, 252, 0.3)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        ':hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(187, 134, 252, 0.4)',
        }
      }
    }),
  },
  createAccountButton: {
    backgroundColor: '#555',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        ':hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.25)',
        }
      }
    }),
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    width: '80%',
  },
  footerText: {
    color: '#A0A0A0',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  }
});