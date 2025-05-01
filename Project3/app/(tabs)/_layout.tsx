import React, { useState, useEffect } from 'react';
import { Slot, usePathname, useRouter } from 'expo-router';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  View, 
  Text, 
  Pressable, 
  SafeAreaView, 
  StyleSheet, 
  Platform,
  Image,
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// Shared constants for styling
const COLORS = {
  background: 'transparent',
  navBackground: 'transparent', 
  text: '#333333',
  activeText: '#007AFF',
  border: 'transparent', 
  logoBackground: 'rgba(240, 240, 240, 0.2)',
  navText: 'rgba(36, 33, 33, 0.79)',
};

export default function Layout() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // API URL based on platform
  const isWeb: boolean = Platform.OS === 'web';
  const API_URL: string = isWeb 
    ? 'http://localhost:8080' 
    : 'http://10.0.2.2:8080';

  // Navigation items
  const navItems = [
    { name: 'Home', route: '/home' },
    { name: 'Lists', route: '/userLists' },
    { name: 'Profile', route: '/userProfile' },
    { name: 'Search', route: '/search' },
  ];

  // Hidden routes that don't show navigation
  const hiddenRoutes = ['/', '/login', '/createAccount', '/oauth-callback'];
  const showNav = !hiddenRoutes.includes(pathname);

  // Check login status on component mount
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token: string | null = isWeb 
          ? localStorage.getItem('jwtToken') 
          : await AsyncStorage.getItem('jwtToken');
        
        const loggedIn: boolean = !!token;
        setIsLoggedIn(loggedIn);
        
        // Check admin status if logged in
        if (loggedIn && token) {
          await checkAdminStatus(token);
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        setIsLoggedIn(false);
        setIsAdmin(false);
      }
    };

    checkLoginStatus();
    
    // Set up periodic check
    const interval = setInterval(checkLoginStatus, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // Function to check admin status
  const checkAdminStatus = async (token: string): Promise<void> => {
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
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    }
  };

  // Logout function
  const handleLogout = (): void => {
    console.log("Logout button clicked");
    
    // Clear token on web
    if (isWeb) {
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('lastLogin');
      
      // Get token for API call
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
      router.push('/' as any);
    } else {
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
          router.push('/' as any);
        });
    }
  };

  // Render nothing if not logged in and on a hidden route
  if (!isLoggedIn && hiddenRoutes.includes(pathname)) {
    return <Slot />;
  }

  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Welcome',
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="waving-hand" color={color} />,
        }}
      />
      <Tabs.Screen
        name="login"
        options={{
          title: 'Login',
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="login" color={color} />,
        }}
      />
      <Tabs.Screen
        name="createAccount"
        options={{
          title: 'Sign Up',
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="add-circle" color={color} />,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="search" color={color} />,
        }}
        />
      <Tabs.Screen
        name="userListsAndReviews"
        options={{
          title: 'My Lists', 
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}