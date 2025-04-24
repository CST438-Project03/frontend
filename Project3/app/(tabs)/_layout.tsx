import { Tabs } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function TabLayout() {
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
    </Tabs>
  );
}