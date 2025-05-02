import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  ListRenderItem,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserDetailModal from '../admin/userDetailModal';
import CreateUserModal from '../admin/createUserModal';

// Define API URL based on platform
const isWeb = Platform.OS === 'web';
export const API_URL = isWeb 
  ? 'http://localhost:8080' 
  : Platform.OS === 'ios'
    ? 'http://127.0.0.1:8080'
    : 'http://10.0.2.2:8080'; // For Android emulator

// Define the User type
interface User {
  id: number;
  username: string;
  email: string;
  admin: boolean;
  profilePicture?: string;
  passwordSetDate?: string;
}

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

const AdminScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetailVisible, setUserDetailVisible] = useState<boolean>(false);
  const [createUserVisible, setCreateUserVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  const fadeAnim = useSharedValue(0);
  const slideUpAnim = useSharedValue(50);
  const createButtonScale = useSharedValue(1);

  // Animation styles
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
      transform: [{ translateY: slideUpAnim.value }],
    };
  });

  // Button press animations
  const handlePressIn = (animValue: Animated.SharedValue<number>): void => {
    animValue.value = withSpring(0.95);
  };

  const handlePressOut = (animValue: Animated.SharedValue<number>): void => {
    animValue.value = withSpring(1);
  };

  useEffect(() => {
    // Log API URL in development
    if (__DEV__) {
      console.log('Using API URL:', API_URL);
    }
    
    // Start animations when component mounts
    fadeAnim.value = withSpring(1);
    slideUpAnim.value = withSpring(0);
    
    // Fetch users
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = users.filter(
        user => 
          user.username.toLowerCase().includes(lowercaseQuery) ||
          user.email.toLowerCase().includes(lowercaseQuery)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  // Get token from AsyncStorage (replacing the placeholder)
  const getToken = async (): Promise<string> => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        console.warn('No JWT token found in storage');
        Alert.alert(
          'Authentication Error', 
          'Your session has expired. Please log in again.',
          [{ text: 'OK', onPress: () => router.replace('/login') }]
        );
        return '';
      }
      return token;
    } catch (error) {
      console.error('Error retrieving token:', error);
      Alert.alert('Error', 'Authentication error occurred');
      return '';
    }
  };

  const fetchUsers = async (): Promise<void> => {
    try {
      setLoading(true);
      setApiError(null);
      
      // Get the JWT token from AsyncStorage
      const token = await getToken();
      if (!token) return; // Early return if no token
      
      console.log('Fetching users from:', `${API_URL}/api/admin/users`);
      
      const response = await axios.get<User[]>(`${API_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('User data received:', response.data.length, 'users');
      setUsers(response.data);
      setFilteredUsers(response.data);
      
    } catch (error) {
      let errorMessage = 'Failed to load users. Please try again.';
      
      if (axios.isAxiosError(error)) {
        // Enhanced error logging for Axios errors
        console.error('Error fetching users:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        
        // More descriptive error messages based on status code
        if (error.response?.status === 401) {
          errorMessage = 'Your session has expired. Please log in again.';
          // Redirect to login on auth error
          setTimeout(() => router.replace('/login'), 1500);
        } else if (error.response?.status === 403) {
          errorMessage = 'You do not have permission to view users.';
        } else if (error.response?.status === 404) {
          errorMessage = 'User data endpoint not found. Please check API configuration.';
        } else if (error.response?.status >= 500) {
          errorMessage = 'Server error occurred. Please try again later.';
        }
        
        // Add more details if available
        if (error.response?.data?.message) {
          errorMessage += ` (${error.response.data.message})`;
        }
      } else {
        // For non-Axios errors
        console.error('Non-Axios error fetching users:', error);
      }
      
      setApiError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = (): void => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleUserPress = (user: User): void => {
    setSelectedUser(user);
    setUserDetailVisible(true);
  };

  const handleDeleteUser = async (userId: number): Promise<void> => {
    try {
      // Show loading indicator
      setLoading(true);
      
      // Get the JWT token from AsyncStorage
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      
      console.log('Deleting user with ID:', userId);
      
      // Make the API call to delete the user
      await axios.delete(`${API_URL}/api/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('User deleted successfully');
      
      // Remove user from the list
      setUsers(users.filter(user => user.id !== userId));
      setFilteredUsers(filteredUsers.filter(user => user.id !== userId));
      
      // Close the modal if it's open
      setUserDetailVisible(false);
      
      Alert.alert('Success', 'User has been deleted successfully.');
    } catch (error) {
      console.error('Error deleting user:', error);
      // Error handling code here
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId: number, isCurrentlyAdmin: boolean): Promise<void> => {
    try {
      // Get the JWT token from AsyncStorage
      const token = await getToken();
      if (!token) return;
      
      const endpoint = isCurrentlyAdmin 
        ? `${API_URL}/api/admin/users/${userId}/revoke-admin`
        : `${API_URL}/api/admin/users/${userId}/grant-admin`;
      
      await axios.put(endpoint, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Update the user in both lists (all users and filtered users)
      const updatedUsers = users.map(user => {
        if (user.id === userId) {
          return { ...user, admin: !isCurrentlyAdmin };
        }
        return user;
      });
      
      setUsers(updatedUsers);
      setFilteredUsers(
        filteredUsers.map(user => {
          if (user.id === userId) {
            return { ...user, admin: !isCurrentlyAdmin };
          }
          return user;
        })
      );
      
      // Update selected user if it's open
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, admin: !isCurrentlyAdmin });
      }
      
      Alert.alert('Success', `User admin privileges ${isCurrentlyAdmin ? 'revoked' : 'granted'} successfully.`);
    } catch (error) {
      console.error('Error toggling admin status:', error);
      Alert.alert('Error', 'Failed to update admin status. Please try again.');
    }
  };

  interface CreateUserData {
    username: string;
    email: string;
    password: string;
    admin: boolean;
  }

  const handleCreateUser = async (userData: CreateUserData): Promise<void> => {
    try {
      // Get the JWT token from AsyncStorage
      const token = await getToken();
      if (!token) return;
      
      console.log('Creating user with data:', userData);
      
      const response = await axios.post(`${API_URL}/api/admin/users`, userData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('User creation response:', response.data);
      
      // Add the new user to the lists if the response includes the user data
      if (response.data) {
        setUsers([...users, response.data]);
        setFilteredUsers([...filteredUsers, response.data]);
      } else {
        // Otherwise, just refresh the user list
        fetchUsers();
      }
      
      // Close the modal
      setCreateUserVisible(false);
      
      Alert.alert('Success', 'User has been created successfully.');
    } catch (error) {
      console.error('Error creating user:', error);
      let errorMessage = 'Failed to create user. Please try again.';
      
      if (axios.isAxiosError(error)) {
        console.error('API error details:', {
          status: error.response?.status,
          data: error.response?.data
        });
        
        if (error.response?.data?.message) {
          errorMessage = `Failed to create user: ${error.response.data.message}`;
        }
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const handleUpdateUser = (updatedUser: User): void => {
    // Update the user in the users array
    const updatedUsers = users.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    );
    setUsers(updatedUsers);
    
    // Update the user in the filtered users array
    const updatedFilteredUsers = filteredUsers.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    );
    setFilteredUsers(updatedFilteredUsers);
    
    // Update the selected user if it's the same one
    if (selectedUser && selectedUser.id === updatedUser.id) {
      setSelectedUser(updatedUser);
    }
  };

  // Render user item for the list
  const renderUserItem: ListRenderItem<User> = ({ item }) => (
    <TouchableOpacity 
      style={styles.userItem} 
      onPress={() => handleUserPress(item)}
    >
      <View style={styles.userAvatar}>
        <Text style={styles.userInitial}>
          {item.username.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.username}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      {item.admin && (
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>Admin</Text>
        </View>
      )}
      <MaterialIcons name="chevron-right" size={24} color="#888" />
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="people" size={48} color="#ccc" />
      <Text style={styles.emptyText}>
        {searchQuery ? 'No users match your search' : apiError || 'No users found'}
      </Text>
      {apiError && (
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchUsers}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#3a1c71', '#d76d77', '#ffaf7b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>User Management</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Main content */}
      <Animated.View style={[styles.contentContainer, animatedStyle]}>
        {/* Search bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="clear" size={20} color="#888" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* User list */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3a1c71" />
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.userList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#3a1c71']}
                tintColor="#3a1c71"
              />
            }
            ListEmptyComponent={renderEmptyList}
          />
        )}
        
        {/* Create user button */}
        <Animated.View 
          style={[
            styles.fabContainer, 
            { transform: [{ scale: createButtonScale }] }
          ]}
        >
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setCreateUserVisible(true)}
            onPressIn={() => handlePressIn(createButtonScale)}
            onPressOut={() => handlePressOut(createButtonScale)}
          >
            <MaterialIcons name="person-add" size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
      
      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          visible={userDetailVisible}
          user={selectedUser}
          onClose={() => setUserDetailVisible(false)}
          onDelete={handleDeleteUser}
          onToggleAdmin={handleToggleAdmin}
          onUpdateUser={handleUpdateUser}
        />
      )}
      
      {/* Create User Modal */}
      <CreateUserModal
        visible={createUserVisible}
        onClose={() => setCreateUserVisible(false)}
        onCreate={handleCreateUser}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    padding: 4,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 -5px 10px rgba(0, 0, 0, 0.05)'
      }
    }),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: isSmallScreen ? 10 : 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
      }
    }),
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  userList: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
      }
    }),
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3a1c71',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#888',
  },
  adminBadge: {
    backgroundColor: '#ffaf7b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  adminBadgeText: {
    color: '#3a1c71',
    fontWeight: 'bold',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3a1c71',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3a1c71',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        cursor: 'pointer',
      }
    }),
  },
});

export default AdminScreen;