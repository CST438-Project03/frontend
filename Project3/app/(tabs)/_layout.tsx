import React, { useState, useEffect } from 'react';
import { Slot, usePathname, useRouter } from 'expo-router';
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
    <SafeAreaView style={styles.container}>
      <StatusBar 
        translucent 
        backgroundColor="transparent" 
        barStyle="dark-content" 
      />
      {showNav && (
        <View style={styles.navContainer}>
          {/* Logo on the left */}
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>GameStack</Text>
            </View>
          </View>

          {/* Navigation Routes in the Middle */}
          <View style={styles.routesContainer}>
            {navItems.map(({ name, route }) => (
              <Pressable
                key={route}
                onPress={() => router.push(route)}
                style={styles.navItem}
              >
                <Text
                  style={[
                    styles.navText,
                    pathname === route && styles.activeText,
                  ]}
                >
                  {name}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Logout Button on the Right */}
          <View style={styles.logoutContainer}>
            {isLoggedIn && (
              <Pressable 
                onPress={handleLogout} 
                style={styles.logoutButton}
              >
                <MaterialIcons 
                  name="logout" 
                  size={24} 
                  color={COLORS.navText} 
                />
              </Pressable>
            )}
            
            {/* Show Admin Panel if user is admin */}
            {isAdmin && (
              <Pressable 
                onPress={() => router.push('/admin' as any)} 
                style={styles.adminButton}
              >
                <MaterialIcons 
                  name="admin-panel-settings" 
                  size={24} 
                  color={COLORS.navText} 
                />
              </Pressable>
            )}
          </View>
        </View>
      )}
      
      <View style={styles.content}>
        <Slot />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', 
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent', 
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0, 
    borderColor: 'transparent',
    // Added for iOS to ensure proper safe area handling
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  logo: {
    backgroundColor: COLORS.logoBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.navText,
  },
  routesContainer: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navItem: {
    paddingHorizontal: 12,
  },
  navText: {
    fontSize: 16,
    color: COLORS.navText,
  },
  activeText: {
    fontWeight: 'bold',
    color: COLORS.activeText,
  },
  logoutContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  logoutButton: {
    padding: 8,
    marginRight: 8,
  },
  adminButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
});