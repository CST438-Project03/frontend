import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Platform, TouchableOpacity, Alert, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const isWeb: boolean = Platform.OS === 'web';

// API URL based on platform
const API_URL: string = isWeb 
  ? 'http://localhost:8080' 
  : 'http://10.0.2.2:8080';

export default function TabLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const router = useRouter();

  // Check login status and admin status
  useEffect(() => {
    const checkLoginAndAdminStatus = async (): Promise<void> => {
      try {
        const token: string | null = isWeb 
          ? localStorage.getItem('jwtToken') 
          : await AsyncStorage.getItem('jwtToken');
        
        const loggedIn: boolean = !!token;
        setIsLoggedIn(loggedIn);
        
        // Only check admin status if logged in
        if (loggedIn && token) {
          await checkAdminStatus(token);
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        setIsLoggedIn(false);
        setIsAdmin(false);
      }
    };

    checkLoginAndAdminStatus();
    
    // Set up periodic check
    const interval = setInterval(checkLoginAndAdminStatus, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // Function to check admin status
  const checkAdminStatus = async (token: string): Promise<void> => {
    try {
      console.log("Checking admin status...");
      
      if (!token) {
        console.log("No authentication token found");
        setIsAdmin(false);
        return;
      }
      
      // Try to get admin status from your API
      try {
        const response = await fetch(`${API_URL}/api/user/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setIsAdmin(userData.admin === true);
          console.log("Admin status:", userData.admin);
        } else {
          console.log("Error checking admin status:", response.status);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      }
    } catch (err) {
      console.error("Error in admin status check:", err);
      setIsAdmin(false);
    }
  };

  // Simple direct logout function
  const handleLogout = (): void => {
    console.log("Logout button clicked");
    
    // Clear token immediately (synchronously) on web
    if (isWeb) {
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('lastLogin');
      
      // Get token for API call (before we cleared it)
      const token = localStorage.getItem('jwtToken');
      
      // Call logout API in background
      if (token) {
        fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(e => console.error("API call error:", e));
      }
      
      // Update state and navigate
      setIsLoggedIn(false);
      router.push('/');
    } 
    // For mobile, use async operations but still be direct
    else {
      AsyncStorage.getItem('jwtToken')
        .then(token => {
          // Clear storage
          AsyncStorage.getAllKeys()
            .then(keys => {
              const authKeys = keys.filter(key => 
                key === 'jwtToken' || 
                key === 'username' || 
                key === 'userId' ||
                key === 'lastLogin' ||
                key.startsWith('user')
              );
              
              if (authKeys.length > 0) {
                AsyncStorage.multiRemove(authKeys);
              }
            })
            .catch(e => console.error("Storage clear error:", e));
          
          // Call logout API
          if (token) {
            fetch(`${API_URL}/auth/logout`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }).catch(e => console.error("API call error:", e));
          }
        })
        .catch(e => console.error("Token retrieval error:", e))
        .finally(() => {
          // Always update state and navigate
          setIsLoggedIn(false);
          router.push('/');
        });
    }
  };

  // Navigate to profile with refresh parameter
  const navigateToProfile = async (): Promise<void> => {
    try {
      // Get login timestamp or create a new one
      const refreshTimestamp: string = Date.now().toString();
      
      if (isWeb) {
        localStorage.setItem('lastLogin', refreshTimestamp);
      } else {
        await AsyncStorage.setItem('lastLogin', refreshTimestamp);
      }
      
      // Navigate to profile with refresh parameter
      router.push({
        pathname: '/userProfile',
        params: { refresh: refreshTimestamp }
      });
    } catch (error) {
      console.error('Error navigating to profile:', error);
      router.push('/userProfile');
    }
  };

  // Custom header right component with logout button
  const LogoutButton = (): React.ReactNode => (
    <TouchableOpacity 
      onPress={handleLogout}
      style={{ 
        marginRight: 15, 
        backgroundColor: '#CF6679',  // Red shade for danger
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 4
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <MaterialIcons name="logout" size={16} color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', marginLeft: 4, fontWeight: 'bold' }}>
          Logout
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Tabs
      screenOptions={{
        // Dark theme colors
        tabBarStyle: {
          backgroundColor: '#121212', 
          borderTopColor: '#333',
        },
        tabBarActiveTintColor: '#BB86FC',
        tabBarInactiveTintColor: '#808080',
        headerStyle: {
          backgroundColor: '#121212',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        // Add logout button to all screens when logged in
        headerRight: isLoggedIn ? () => <LogoutButton /> : undefined
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Welcome',
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="waving-hand" color={color} />,
        }}
      />
      
      {/* Only show Login if not logged in */}
      {!isLoggedIn && (
        <Tabs.Screen
          name="login"
          options={{
            title: 'Login',
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="login" color={color} />,
          }}
        />
      )}
      
      {/* Only show Sign Up if not logged in */}
      {!isLoggedIn && (
        <Tabs.Screen
          name="createAccount"
          options={{
            title: 'Sign Up',
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="person-add" color={color} />,
          }}
        />
      )}
      
      {/* Always show Home */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="home" color={color} />,
        }}
      />
      
      {/* Only show Profile if logged in */}
      {isLoggedIn && (
        <Tabs.Screen
          name="userProfile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="person" color={color} />,
          }}
          listeners={{
            tabPress: (e) => {
              // Prevent default navigation
              e.preventDefault();
              // Use custom navigation with refresh parameter
              navigateToProfile();
            },
          }}
        />
      )}
      
      {/* Show Admin panel only for admin users */}
      {isLoggedIn && isAdmin && (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="admin-panel-settings" color={color} />,
          }}
        />
      )}
    </Tabs>
  );
}