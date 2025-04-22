import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function WelcomeScreen() {
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideUpAnim = React.useRef(new Animated.Value(50)).current;
  const loginButtonScale = React.useRef(new Animated.Value(1)).current;
  const createButtonScale = React.useRef(new Animated.Value(1)).current;
  
  // Run entrance animations when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);
  
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
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#3a1c71', '#d76d77', '#ffaf7b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      />
      
      {/* Content container with entrance animation */}
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }]
          }
        ]}
      >
        {/* Logo placeholder - replace with your logo */}
        <View style={styles.logoContainer}>
          <MaterialIcons name="sports-esports" size={64} color="#fff" />
        </View>
        
        <Text style={styles.title}>GameStack</Text>
        <Text style={styles.subtitle}>Your personal gaming collection manager</Text>
        
        <View style={styles.featureRow}>
          <View style={styles.featureItem}>
            <MaterialIcons name="star" size={24} color="#ffaf7b" />
            <Text style={styles.featureText}>Rate Games</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialIcons name="collections" size={24} color="#ffaf7b" />
            <Text style={styles.featureText}>Build Collection</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialIcons name="people" size={24} color="#ffaf7b" />
            <Text style={styles.featureText}>Connect</Text>
          </View>
        </View>
        
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
              <MaterialIcons name="person-add" size={20} color="#3a1c71" style={styles.buttonIcon} />
              <Text style={[styles.buttonText, { color: '#3a1c71' }]}>Create Account</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Track. Rate. Share. Game.
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  contentContainer: {
    width: Platform.OS === 'web' ? '80%' : '90%',
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
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: isSmallScreen ? 16 : 18,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
    flexWrap: 'wrap',
  },
  featureItem: {
    alignItems: 'center',
    padding: 10,
    minWidth: 80,
  },
  featureText: {
    marginTop: 8,
    color: '#555',
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  buttonWrapper: {
    width: '100%',
    marginVertical: 8,
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
  createAccountButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3a1c71',
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
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: 'bold',
    color: 'white',
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    width: '100%',
  },
  footerText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  }
});