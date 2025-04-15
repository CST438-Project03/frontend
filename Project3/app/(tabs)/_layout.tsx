import { Tabs } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // Set dark theme colors for both platforms
        tabBarStyle: {
          backgroundColor: '#121212', // Dark background
          borderTopColor: '#333', // Darker border
        },
        tabBarActiveTintColor: '#BB86FC', // Purple active color (matching button color)
        tabBarInactiveTintColor: '#808080', // Gray for inactive tabs
        // Tab header styling
        headerStyle: {
          backgroundColor: '#121212', // Dark header
        },
        headerTintColor: '#FFFFFF', // White header text
        headerTitleStyle: {
          fontWeight: 'bold',
        },
       // tabBarPressColor: Platform.OS === 'android' ? 'rgba(187, 134, 252, 0.2)' : undefined,
      }}
    >
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
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="person-add" color={color} />,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="home" color={color} />,
        }}
      />
    </Tabs>
  );
}