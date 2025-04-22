import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { 
  Platform, 
  TouchableOpacity, 
  Text, 
  View, 
  StyleSheet, 
  Animated,
  ScrollView 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, usePathname } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const isWeb: boolean = Platform.OS === 'web';

// API URL based on platform
const API_URL: string = isWeb 
  ? 'http://localhost:8080' 
  : 'http://10.0.2.2:8080';

// Define custom colors
const backgroundColor = '#afafaf';
const surfaceColor = '#afafaf';
const textColor = '#FFFFFF';
const textSecondaryColor = '#AAAAAA';
const accentColor = '#BB86FC';
const borderColor = 'rgba(255, 255, 255, 0.1)';
const dangerColor = '#CF6679';

// Type for Material Icons names
type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

// Type for Navigation Items
type NavigationItem = {
  name: string;
  title: string;
  icon: MaterialIconName;
  special?: boolean;
  action?: () => void;
  danger?: boolean;
};

// DropdownHeader Component
function DropdownHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [animatedHeight] = useState(new Animated.Value(0));
  
  const router = useRouter();
  const pathname = usePathname();

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
      
      // Call API to check admin status
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

  // Direct logout function
  const handleLogout = (): void => {
    console.log("Logout button clicked");
    
    // Toggle menu closed
    setMenuOpen(false);
    
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
      
      // Navigate to profile 
      router.push({
        pathname: '/userProfile' as any,
        params: { refresh: refreshTimestamp }
      });
      
      // Close menu after navigation
      toggleMenu();
    } catch (error) {
      console.error('Error navigating to profile:', error);
      router.push('/userProfile' as any);
    }
  };

  // Get navigation items based on login/admin status
  const getNavigationItems = (): NavigationItem[] => {
    const items: NavigationItem[] = [];
    
    // Welcome/Home items always shown
    items.push({ name: 'index', title: 'Welcome', icon: 'waving-hand',   action: () => {
      // You can trigger navigation to the index page here
      router.push('/');
    } });
    items.push({ name: 'home', title: 'Home', icon: 'home' });
    
    // Items shown when logged out
    if (!isLoggedIn) {
      items.push({ name: 'login', title: 'Login', icon: 'login' });
      items.push({ name: 'createAccount', title: 'Sign Up', icon: 'person-add' });
    }
    
    // Items shown when logged in
    if (isLoggedIn) {
      items.push({ 
        name: 'userProfile', 
        title: 'Profile', 
        icon: 'person', 
        special: true, 
        action: navigateToProfile 
      });
      
      // Admin panel if admin
      if (isAdmin) {
        items.push({ 
          name: 'admin', 
          title: 'Admin Panel', 
          icon: 'admin-panel-settings' 
        });
      }
      
      // Logout option
      items.push({ 
        name: 'logout', 
        title: 'Logout', 
        icon: 'logout', 
        special: true, 
        action: handleLogout, 
        danger: true 
      });
    }
    
    return items;
  };

  // Toggle menu function with animation
  const toggleMenu = () => {
    const items = getNavigationItems();
    const itemHeight = 50; // Height of each menu item
    const targetHeight = menuOpen ? 0 : items.length * itemHeight;
    
    console.log("Toggling menu. Items:", items.length, "Target height:", targetHeight);
    
    Animated.timing(animatedHeight, {
      toValue: targetHeight,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    setMenuOpen(!menuOpen);
  };

  // Navigate to a screen
  const navigateTo = (item: NavigationItem) => {
    if (item.special && typeof item.action === 'function') {
      item.action();
    } else {
      // Regular navigation
      router.push(`/${item.name}` as any);
      toggleMenu(); 
    }
  };

  // Check if a route is active
  const isActive = (routeName: string) => {
    if (!pathname) return false;
    // Get the first segment of the path
    const currentRoute = pathname.substring(1).split('/')[0] || '';
    return currentRoute === routeName;
  };

  const navigationItems = getNavigationItems();

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={[styles.header, { backgroundColor: 'rgba(117, 110, 110, 0.7)' }]}>
        <Text style={[styles.title, { color: textColor }]}>
          My App
        </Text>
        
        <View style={styles.headerControls}>
          {/* Hamburger Menu Button */}
          <TouchableOpacity 
            onPress={toggleMenu}
            style={styles.menuButton}
          >
            {menuOpen ? (
              <MaterialIcons name="close" size={24} color={textColor} />
            ) : (
              <MaterialIcons name="menu" size={24} color={textColor} />
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Dropdown Menu */}
      <Animated.View style={[styles.menuContainer, { 
        height: animatedHeight, 
        backgroundColor: 'rgba(181, 167, 167, 0.7)', 
        borderBottomColor: borderColor
      }]}>
        <ScrollView style={{ width: '100%' }}>
          {navigationItems.map(item => (
            <TouchableOpacity
              key={item.name}
              style={[ 
                styles.menuItem,
                isActive(item.name) && { backgroundColor: 'rgba(187, 134, 252, 0.12)' },
                item.danger && { borderLeftColor: dangerColor, borderLeftWidth: 4 }
              ]}
              onPress={() => navigateTo(item)}
            >
              <MaterialIcons 
                name={item.icon} 
                size={24} 
                color={item.danger ? dangerColor : 
                      isActive(item.name) ? accentColor : textColor} 
              />
              <Text style={[ 
                styles.menuItemText, 
                { color: item.danger ? dangerColor : 
                        isActive(item.name) ? accentColor : textColor }
              ]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// Main Layout Component
export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        header: () => <DropdownHeader />,
        contentStyle: { backgroundColor: backgroundColor },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: true }} />
      <Stack.Screen name="home" options={{ headerShown: true }} />
      <Stack.Screen name="login" options={{ headerShown: true }} />
      <Stack.Screen name="createAccount" options={{ headerShown: true }} />
      <Stack.Screen name="userProfile" options={{ headerShown: true }} />
      <Stack.Screen name="admin" options={{ headerShown: true }} />
    </Stack>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    zIndex: 100,
    width: '100%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  header: {
    height: Platform.OS === 'ios' ? 90 : 60,
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: borderColor,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 8,
  },
  menuContainer: {
    width: '100%',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: borderColor,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingLeft: 16,
    borderBottomWidth: 1,
    borderBottomColor: borderColor,
  },
  menuItemText: {
    marginLeft: 12,
    fontSize: 16,
  },
});
