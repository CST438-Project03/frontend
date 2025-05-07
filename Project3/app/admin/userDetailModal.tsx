import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Alert,
  ScrollView,
  Platform,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Define API URL based on platform
const isWeb = Platform.OS === 'web';
export const API_URL = isWeb 
  ? 'http://localhost:8080' 
  : Platform.OS === 'ios'
    ? 'http://127.0.0.1:8080'
    : 'http://10.0.2.2:8080'; // For Android emulator

// Define the User interface
interface User {
  id: number;
  username: string;
  email: string;
  admin: boolean;
  profilePicture?: string;
  passwordSetDate?: string;
}

// Define the props for the component
interface UserDetailModalProps {
  visible: boolean;
  user: User;
  onClose: () => void;
  onDelete: (userId: number) => Promise<void>;
  onToggleAdmin: (userId: number, isAdmin: boolean) => Promise<void>;
  onUpdateUser: (updatedUser: User) => void;
}

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

const UserDetailModal: React.FC<UserDetailModalProps> = ({ 
  visible, 
  user, 
  onClose, 
  onDelete, 
  onToggleAdmin,
  onUpdateUser
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedUser, setEditedUser] = useState<User>({ ...user });
  const [showPasswordReset, setShowPasswordReset] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  
  const toggleAdminButtonScale = useSharedValue(1);
  const deleteButtonScale = useSharedValue(1);
  const saveButtonScale = useSharedValue(1);
  const resetPwdButtonScale = useSharedValue(1);
  const editButtonScale = useSharedValue(1);
  
  
  const handlePressIn = (animValue: Animated.SharedValue<number>): void => {
    animValue.value = withSpring(0.95);
  };

  const handlePressOut = (animValue: Animated.SharedValue<number>): void => {
    animValue.value = withSpring(1);
  };
  
  const handleStartEditing = (): void => {
    setIsEditing(true);
    setEditedUser({ ...user });
  };
  
  const handleCancelEditing = (): void => {
    setIsEditing(false);
    setShowPasswordReset(false);
    setNewPassword('');
  };
  
  const confirmDelete = (): void => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: async () => {
            try {
              console.log('Attempting to delete user:', user.id);
              await onDelete(user.id);
            } catch (error) {
              console.error('Error in delete operation:', error);
              Alert.alert('Error', 'Failed to delete user. Please try again.');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const handleEditUsername = async (newUsername: string): Promise<void> => {
    if (!newUsername || newUsername === user.username) {
      return; // No change needed
    }
    
    try {
      // Get the JWT token
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        Alert.alert('Error', 'Authentication error. Please log in again.');
        return;
      }
      
      // Call the API to update the username
      const response = await axios.put(
        `${API_URL}/api/admin/users/${user.id}`,
        {
          username: newUsername
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      // Update the user locally
      if (response.data) {
        // Pass the updated user back to the parent component
        onUpdateUser(response.data);
      }
      
      Alert.alert('Success', 'Username has been updated successfully');
    } catch (error) {
      console.error('Error updating username:', error);
      let errorMessage = 'Failed to update username. Please try again.';
      
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Error', errorMessage);
    }
  };
  
  const handleSaveChanges = async (): Promise<void> => {
    try {
      // Get the JWT token
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        Alert.alert('Error', 'Authentication error. Please log in again.');
        return;
      }
      
      // Only make the API call if there are changes
      if (JSON.stringify(user) !== JSON.stringify(editedUser)) {
        const response = await axios.put(
          `${API_URL}/api/admin/users/${user.id}`,
          editedUser,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        // Update the user locally
        if (response.data) {
          // Pass the updated user back to the parent component
          onUpdateUser(response.data);
        }
        
        Alert.alert('Success', 'User updated successfully!');
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating user:', error);
      let errorMessage = 'Failed to update user. Please try again.';
      
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Error', errorMessage);
    }
  };
  
  const handleResetPassword = async (): Promise<void> => {
    if (!newPassword) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }
    
    try {
      // Get the JWT token
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        Alert.alert('Error', 'Authentication error. Please log in again.');
        return;
      }
      
      // Call the API to reset the password
      const response = await axios.patch(
        `${API_URL}/api/user/${user.id}/password`, 
        {
          currentPassword: null, // Admin doesn't need to provide current password
          newPassword: newPassword
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      Alert.alert('Success', 'Password has been reset successfully');
      setShowPasswordReset(false);
      setNewPassword('');
    } catch (error) {
      console.error('Error resetting password:', error);
      let errorMessage = 'Failed to reset password. Please try again.';
      
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const handleConfirmedDelete = async () => {
    try {
      console.log('Delete confirmed for user:', user.id);
      console.log('Calling onDelete function with user ID:', user.id);
      await onDelete(user.id);
      console.log('onDelete function completed successfully');
      setShowDeleteConfirm(false);
      onClose(); 
    } catch (error) {
      console.error('Error in delete operation:', error);
      Alert.alert('Error', 'Failed to delete user. Please try again.');
    }
  };

  const renderUserEditForm = () => (
    <View style={styles.userInfoContainer}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Username</Text>
        <TextInput
          style={styles.input}
          value={editedUser.username}
          onChangeText={(text) => setEditedUser({...editedUser, username: text})}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.input}
          value={editedUser.email}
          onChangeText={(text) => setEditedUser({...editedUser, email: text})}
          keyboardType="email-address"
        />
      </View>
      
      
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#888' }]}
          onPress={handleCancelEditing}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        
        <Animated.View style={{ transform: [{ scale: saveButtonScale }] }}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#3a1c71' }]}
            onPress={handleSaveChanges}
            onPressIn={() => handlePressIn(saveButtonScale)}
            onPressOut={() => handlePressOut(saveButtonScale)}
          >
            <MaterialIcons
              name="check"
              size={20}
              color="#fff"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );

  const renderUserInfo = () => (
    <View style={styles.userInfoContainer}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.username ? user.username.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        {user.admin && (
          <View style={styles.adminBadge}>
            <MaterialIcons name="verified" size={16} color="#3a1c71" />
          </View>
        )}
      </View>
      
      <Text style={styles.username}>{user.username}</Text>
      <Text style={styles.email}>{user.email}</Text>
      
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <MaterialIcons name="person" size={20} color="#666" />
          <Text style={styles.detailLabel}>User ID:</Text>
          <Text style={styles.detailValue}>{user.id}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <MaterialIcons name="verified-user" size={20} color="#666" />
          <Text style={styles.detailLabel}>Admin:</Text>
          <Text style={styles.detailValue}>{user.admin ? 'Yes' : 'No'}</Text>
        </View>
        
        {user.passwordSetDate && (
          <View style={styles.detailRow}>
            <MaterialIcons name="calendar-today" size={20} color="#666" />
            <Text style={styles.detailLabel}>Password Set:</Text>
            <Text style={styles.detailValue}>{user.passwordSetDate}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.buttonRow}>
        <Animated.View style={{ transform: [{ scale: toggleAdminButtonScale }] }}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: user.admin ? '#ff9f7d' : '#3a1c71' }
            ]}
            onPress={() => onToggleAdmin(user.id, user.admin)}
            onPressIn={() => handlePressIn(toggleAdminButtonScale)}
            onPressOut={() => handlePressOut(toggleAdminButtonScale)}
          >
            <MaterialIcons
              name={user.admin ? 'remove-moderator' : 'add-moderator'}
              size={20}
              color="#fff"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>
              {user.admin ? 'Remove Admin' : 'Make Admin'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
        
        <Animated.View style={{ transform: [{ scale: editButtonScale }] }}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#3a1c71' }]}
            onPress={handleStartEditing}
            onPressIn={() => handlePressIn(editButtonScale)}
            onPressOut={() => handlePressOut(editButtonScale)}
          >
            <MaterialIcons
              name="edit"
              size={20}
              color="#fff"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
      
      <View style={styles.buttonRow}>
        <Animated.View style={{ transform: [{ scale: resetPwdButtonScale }], width: '100%' }}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#d76d77' }]}
            onPress={() => setShowPasswordReset(true)}
            onPressIn={() => handlePressIn(resetPwdButtonScale)}
            onPressOut={() => handlePressOut(resetPwdButtonScale)}
          >
            <MaterialIcons
              name="vpn-key"
              size={20}
              color="#fff"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>Reset Password</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
      
      <Animated.View style={{ transform: [{ scale: deleteButtonScale }], width: '100%', marginTop: 16 }}>
  <TouchableOpacity
    style={[styles.deleteButton]}
    onPress={() => {
      console.log('Delete button pressed for user:', user.id);
      setShowDeleteConfirm(true);
    }}
    onPressIn={() => handlePressIn(deleteButtonScale)}
    onPressOut={() => handlePressOut(deleteButtonScale)}
  >
    <MaterialIcons
      name="delete"
      size={20}
      color="#fff"
      style={styles.buttonIcon}
    />
    <Text style={styles.buttonText}>Delete User</Text>
  </TouchableOpacity>
</Animated.View>
    </View>
  );
  
  const renderPasswordReset = () => (
    <View style={styles.passwordResetContainer}>
      <Text style={styles.sectionTitle}>Reset Password</Text>
      <Text style={styles.passwordInstructions}>
        Enter a new password for {user.username}
      </Text>
      
      <TextInput
        style={styles.passwordInput}
        placeholder="Enter new password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />
      
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#888' }]}
          onPress={() => {
            setShowPasswordReset(false);
            setNewPassword('');
          }}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        
        <Animated.View style={{ transform: [{ scale: saveButtonScale }] }}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#3a1c71' }]}
            onPress={handleResetPassword}
            onPressIn={() => handlePressIn(saveButtonScale)}
            onPressOut={() => handlePressOut(saveButtonScale)}
          >
            <MaterialIcons
              name="check"
              size={20}
              color="#fff"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>Confirm</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );

  const renderDeleteConfirmation = () => (
    <Modal
      visible={showDeleteConfirm}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDeleteConfirm(false)}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowDeleteConfirm(false)}
        />
        
        <View style={[styles.modalContent, { maxWidth: 400, maxHeight: 250 }]}>
          <LinearGradient
            colors={['#3a1c71', '#dc3545']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>Confirm Delete</Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowDeleteConfirm(false)}
            >
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>
          
          <View style={{ padding: 24, alignItems: 'center' }}>
            <MaterialIcons name="warning" size={40} color="#dc3545" style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 18, textAlign: 'center', marginBottom: 24, color: '#333' }}>
              Are you sure you want to delete {user.username}?
            </Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#888', minWidth: '45%' }]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#dc3545', minWidth: '45%' }]}
                onPress={handleConfirmedDelete}
              >
                <MaterialIcons
                  name="delete"
                  size={20}
                  color="#fff"
                  style={styles.buttonIcon}
                />
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
  

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <View style={styles.modalContent}>
          {/* Header with gradient */}
          <LinearGradient
            colors={['#3a1c71', '#d76d77']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>User Details</Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
            >
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>
          
          <ScrollView style={styles.modalBody}>
            {isEditing 
              ? renderUserEditForm() 
              : (showPasswordReset ? renderPasswordReset() : renderUserInfo())}
          </ScrollView>
        </View>
      </View>
      {showDeleteConfirm && renderDeleteConfirmation()}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  userInfoContainer: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3a1c71',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  adminBadge: {
    position: 'absolute',
    bottom: 8,
    right: -4,
    backgroundColor: '#ffaf7b',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  detailsContainer: {
    width: '100%',
    marginBottom: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
    marginRight: 8,
    width: 100,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    minWidth: '48%',
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
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
        cursor: 'pointer',
      }
    }),
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 8,
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
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
        cursor: 'pointer',
      }
    }),
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  passwordResetContainer: {
    width: '100%',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  passwordInstructions: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  passwordInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});

export default UserDetailModal;