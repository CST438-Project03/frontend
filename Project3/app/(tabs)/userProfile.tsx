import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ActivityIndicator, 
  TouchableOpacity,
  Platform,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  SafeAreaView,
  Modal,
  Alert,
  Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const windowWidth = Dimensions.get('window').width;
const isWeb = Platform.OS === 'web';

// API URL based on platform
const API_URL = isWeb 
  ? 'https://cst438-project3-2224023aed89.herokuapp.com/api'
  : 'http://10.0.2.2:8080/api'; 

const UserProfile = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const refreshTimestamp = params.refresh; 
  
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState({
    id: '',
    username: '',
    email: ''
  });
  
  // State for modals
  const [usernameModalVisible, setUsernameModalVisible] = useState(false);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [hasSetPassword, setHasSetPassword] = useState(false);
  const [oauthProvider, setOauthProvider] = useState('');
  
  // State for form inputs
  const [oldUsername, setOldUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [oldEmail, setOldEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserData();
  }, [refreshTimestamp]);
  
  const getAuthToken = async () => {
    return isWeb 
      ? localStorage.getItem('jwtToken') || ''
      : await AsyncStorage.getItem('jwtToken') || '';
  };
  
  const fetchUserData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const token = await getAuthToken();
      
      if (!token) {
        console.error('No authentication token found');
        Alert.alert(
          'Authentication Error', 
          'You are not logged in. Please login again.',
          [{ text: 'OK', onPress: () => router.replace('/login') }]
        );
        return;
      }
      
      console.log('Token found, fetching user data from API');
      
      // Fetch complete user profile from API
      const response = await axios.get(`${API_URL}/user/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('User data fetched successfully:', response.data);
      
      if (!response.data || !response.data.id) {
        throw new Error('Invalid user data received');
      }
      
      setUserData({
        id: response.data.id || '',
        username: response.data.username || '',
        email: response.data.email || ''
      });

      const oauthStatusResponse = await axios.get(`${API_URL}/user/password/status`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (oauthStatusResponse.data) {
        setIsOAuthUser(oauthStatusResponse.data.isOAuthUser);
        setHasSetPassword(oauthStatusResponse.data.hasSetPassword);
        setOauthProvider(oauthStatusResponse.data.oauthProvider);
      }
      
      // Store user data in AsyncStorage/localStorage
      if (response.data.username) {
        if (isWeb) {
          localStorage.setItem('username', response.data.username);
          localStorage.setItem('userId', response.data.id.toString());
        } else {
          await AsyncStorage.setItem('username', response.data.username);
          await AsyncStorage.setItem('userId', response.data.id.toString());
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      
      // Fallback to stored data if API call fails
      try {
        const username = isWeb
          ? localStorage.getItem('username')
          : await AsyncStorage.getItem('username');
        
        const userId = isWeb
          ? localStorage.getItem('userId')
          : await AsyncStorage.getItem('userId');
        
        if (username) {
          setUserData({
            id: userId || '',
            username: username || '',
            email: userData.email 
          });
          Alert.alert('Warning', 'Using cached profile data. Some information may be outdated.');
        } else {
          Alert.alert('Error', 'Failed to load user profile');
        }
      } catch (storageError) {
        console.error('Error accessing storage:', storageError);
        Alert.alert('Error', 'Failed to load user profile');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      // Get JWT token
      const token = await getAuthToken();
      
      // Call logout API if token exists
      if (token) {
        try {
          await axios.post(`${API_URL.replace('/api', '')}/auth/logout`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (error) {
          console.warn('Logout API call failed, proceeding with local logout');
        }
      }
      
      // Clear storage
      if (isWeb) {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
      } else {
        const keys = await AsyncStorage.getAllKeys();
        const authKeys = keys.filter(key => 
          key === 'jwtToken' || 
          key === 'username' || 
          key === 'userId' ||
          key.startsWith('user')
        );
        
        if (authKeys.length > 0) {
          await AsyncStorage.multiRemove(authKeys);
        }
      }

      router.replace('/');
    } catch (error) {
      console.error('Error during logout:', error);
      router.replace('/');
    }
  };
  
  const handleUsernameUpdate = async () => {
    setError('');
    try {
      if (oldUsername !== userData.username) {
        setError('Current username does not match');
        return;
      }
      
      if (!newUsername.trim()) {
        setError('New username cannot be empty');
        return;
      }
      
      setIsLoading(true);
      
      // Get JWT token
      const token = await getAuthToken();
      
      if (!token) {
        setError('Authentication error. Please log in again.');
        return;
      }
      
      await axios.put(`${API_URL}/user/username`, {
        oldUsername,
        newUsername
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update local state and storage
      setUserData(prevData => ({
        ...prevData,
        username: newUsername
      }));
      
      if (isWeb) {
        localStorage.setItem('username', newUsername);
      } else {
        await AsyncStorage.setItem('username', newUsername);
      }
      
      setUsernameModalVisible(false);
      setOldUsername('');
      setNewUsername('');
      
      Alert.alert('Success', 'Username updated successfully');
    } catch (error) {
      console.error('Error updating username:', error);
      setError('Failed to update username. It may already be in use.');
      
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEmailUpdate = async () => {
    setError('');
    try {
      if (oldEmail !== userData.email) {
        setError('Current email does not match');
        return;
      }
      
      if (!newEmail.trim() || !newEmail.includes('@')) {
        setError('Please enter a valid email address');
        return;
      }
      
      setIsLoading(true);
      
      // Get JWT token
      const token = await getAuthToken();
      
      if (!token) {
        setError('Authentication error. Please log in again.');
        return;
      }
      
      await axios.put(`${API_URL}/user/email`, {
        oldEmail,
        newEmail
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update local state
      setUserData(prevData => ({
        ...prevData,
        email: newEmail
      }));
      
      setEmailModalVisible(false);
      setOldEmail('');
      setNewEmail('');
      
      Alert.alert('Success', 'Email updated successfully');
    } catch (error) {
      console.error('Error updating email:', error);
      setError('Failed to update email. It may already be in use.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePasswordUpdate = async () => {
    setError('');
    try {
      // Skip current password check for OAuth users who haven't set a password yet
      const skipCurrentPasswordCheck = isOAuthUser && !hasSetPassword;
      
      if (!skipCurrentPasswordCheck && !currentPassword.trim()) {
        setError('Current password is required');
        return;
      }
      
      if (!newPassword.trim() || newPassword.length < 6) {
        setError('New password must be at least 6 characters');
        return;
      }
      
      if (newPassword !== confirmPassword) {
        setError('New passwords do not match');
        return;
      }
      
      setIsLoading(true);
      
      // Get JWT token
      const token = await getAuthToken();
      
      if (!token) {
        setError('Authentication error. Please log in again.');
        return;
      }
      
      // Use different endpoint for OAuth users setting password for the first time
      const endpoint = skipCurrentPasswordCheck 
        ? `${API_URL}/user/password/create` 
        : `${API_URL}/user/password`;
      
      const data = skipCurrentPasswordCheck
        ? { newPassword }
        : { currentPassword, newPassword };
      
      await axios.post(endpoint, data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Update hasSetPassword state
      if (skipCurrentPasswordCheck) {
        setHasSetPassword(true);
      }
      
      Alert.alert('Success', 'Password updated successfully');
    } catch (error) {
      console.error('Error updating password:', error);
      setError('Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteAccount = async () => {
    setError('');
    try {
      if (deleteConfirmation !== 'DELETE') {
        setError('Please type DELETE to confirm account deletion');
        return;
      }
      
      setIsLoading(true);
      
      // Get JWT token
      const token = await getAuthToken();
      
      if (!token) {
        setError('Authentication error. Please log in again.');
        return;
      }
      
      await axios.delete(`${API_URL}/user/account`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      await handleLogout();
      
      setDeleteAccountModalVisible(false);
      setDeleteConfirmation('');
      
      Alert.alert('Account Deleted', 'Your account has been successfully deleted');
    } catch (error) {
      console.error('Error deleting account:', error);
      setError('Failed to delete account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const navigateBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={['#121212', '#2a2a2a']} style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#BB86FC" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#3a1c71', '#d76d77', '#ffaf7b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }} style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.title}>User Profile</Text>
            </View>
            
            <View style={styles.profileContainer}>
              <View style={styles.profileImageSection}>
                <View style={styles.profileImageContainer}>
                  <Image 
                    source={{ uri: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + userData.username }} 
                    style={styles.profileImage} 
                  />
                </View>
                <TouchableOpacity style={styles.imageEditButton}>
                  <Text style={styles.imageEditButtonText}>Change Photo</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.welcomeText}>Welcome, {userData.username}!</Text>

              {/*OAuth badge */}
              {isOAuthUser && (
                <View style={styles.oauthBadge}>
                  <Text style={styles.oauthBadgeText}>
                    Signed in with {oauthProvider.charAt(0).toUpperCase() + oauthProvider.slice(1)}
                  </Text>
                </View>
          )}
              
              <View style={styles.profileInfo}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Username</Text>
                  <Text style={styles.infoValue}>{userData.username}</Text>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                      setOldUsername('');
                      setNewUsername('');
                      setError('');
                      setUsernameModalVisible(true);
                    }}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{userData.email}</Text>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                      setOldEmail('');
                      setNewEmail('');
                      setError('');
                      setEmailModalVisible(true);
                    }}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.passwordRow}>
                  <Text style={styles.passwordText}>
                    {isOAuthUser && !hasSetPassword 
                    ? `Set password for direct login (you currently use ${oauthProvider} to sign in)`
                    : 'Change your password'}
                  </Text>
                  <TouchableOpacity
                  style={styles.passwordButton}
                  onPress={() => {
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setError('');
                    setPasswordModalVisible(true);
                  }}
                  >
                 <Text style={styles.passwordButtonText}>
                  {isOAuthUser && !hasSetPassword ? 'Set Password' : 'Reset Password'}
                 </Text>
                 </TouchableOpacity>
                </View>
                
                <View style={styles.dangerZone}>
                  <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
                  <Text style={styles.dangerZoneDescription}>
                    Permanently remove your account and all associated data
                  </Text>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      setDeleteConfirmation('');
                      setError('');
                      setDeleteAccountModalVisible(true);
                    }}
                  >
                    <Text style={styles.deleteButtonText}>Delete Account</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        
        {/* Username Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={usernameModalVisible}
          onRequestClose={() => setUsernameModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Update Username</Text>
              
              <Text style={styles.inputLabel}>Current Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter current username"
                placeholderTextColor="#999"
                value={oldUsername}
                onChangeText={setOldUsername}
                autoCapitalize="none"
              />
              
              <Text style={styles.inputLabel}>New Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter new username"
                placeholderTextColor="#999"
                value={newUsername}
                onChangeText={setNewUsername}
                autoCapitalize="none"
              />
              
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setUsernameModalVisible(false);
                    setError('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton, isLoading && styles.disabledButton]}
                  onPress={handleUsernameUpdate}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#121212" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        
        {/* Email Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={emailModalVisible}
          onRequestClose={() => setEmailModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Update Email</Text>
              
              <Text style={styles.inputLabel}>Current Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter current email"
                placeholderTextColor="#999"
                value={oldEmail}
                onChangeText={setOldEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              
              <Text style={styles.inputLabel}>New Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter new email"
                placeholderTextColor="#999"
                value={newEmail}
                onChangeText={setNewEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setEmailModalVisible(false);
                    setError('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton, isLoading && styles.disabledButton]}
                  onPress={handleEmailUpdate}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#121212" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        
        {/* Password Reset Modal */}
<Modal
  animationType="slide"
  transparent={true}
  visible={passwordModalVisible}
  onRequestClose={() => setPasswordModalVisible(false)}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>
        {isOAuthUser && !hasSetPassword ? 'Set Password' : 'Reset Password'}
      </Text>
      
      {/* Only show current password field if not a first-time OAuth password setup */}
      {!(isOAuthUser && !hasSetPassword) && (
        <>
          <Text style={styles.inputLabel}>Current Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter current password"
            placeholderTextColor="#999"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />
        </>
      )}
      
      <Text style={styles.inputLabel}>New Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter new password"
        placeholderTextColor="#999"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />
      
      <Text style={styles.inputLabel}>Confirm New Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Re-enter new password"
        placeholderTextColor="#999"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      
      {isOAuthUser && !hasSetPassword && (
        <Text style={styles.infoText}>
          Setting a password will allow you to log in directly with your email and password,
          in addition to using {oauthProvider} authentication.
        </Text>
      )}
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      <View style={styles.modalButtons}>
        <TouchableOpacity
          style={[styles.modalButton, styles.cancelButton]}
          onPress={() => {
            setPasswordModalVisible(false);
            setError('');
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.modalButton, styles.saveButton, isLoading && styles.disabledButton]}
          onPress={handlePasswordUpdate}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#121212" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isOAuthUser && !hasSetPassword ? 'Create' : 'Save'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
        
        {/* Delete Account Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={deleteAccountModalVisible}
          onRequestClose={() => setDeleteAccountModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Delete Account</Text>
              
              <Text style={styles.warningText}>
                Warning: This action cannot be undone. All your data will be permanently deleted.
              </Text>
              
              <Text style={styles.inputLabel}>Type DELETE to confirm</Text>
              <TextInput
                style={styles.input}
                placeholder="DELETE"
                placeholderTextColor="#999"
                value={deleteConfirmation}
                onChangeText={setDeleteConfirmation}
              />
              
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setDeleteAccountModalVisible(false);
                    setError('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.deleteConfirmButton, isLoading && styles.disabledButton]}
                  onPress={handleDeleteAccount}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.deleteConfirmButtonText}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  keyboardAvoidView: {
    flex: 1,
    width: '100%',
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    width: '100%',
    paddingVertical: 30,
    paddingBottom: 50, 
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    left: 20,
  },
  backButtonText: {
    color: '#BB86FC',
    fontSize: 18,
    fontWeight: '500',
  },
  logoutButton: {
    position: 'absolute',
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  profileContainer: {
    padding: 25,
    width: isWeb ? '80%' : '90%',
    maxWidth: 600,
    backgroundColor: 'rgba(40, 40, 40, 0.8)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  profileImageSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3a3a3a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#BB86FC',
  },
  profileImage: {
    width: 120,
    height: 120,
    resizeMode: 'cover',
  },
  imageEditButton: {
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BB86FC',
  },
  imageEditButtonText: {
    color: '#BB86FC',
    fontWeight: '500',
    fontSize: 14,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#BB86FC',
    textAlign: 'center',
    marginBottom: 25,
  },
  profileInfo: {
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoLabel: {
    width: 90,
    fontWeight: 'bold',
    color: 'white',
    fontSize: 16,
  },
  infoValue: {
    flex: 1,
    color: 'white',
    fontSize: 16,
  },
  editButton: {
    backgroundColor: '#BB86FC',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  editButtonText: {
    color: '#121212',
    fontWeight: 'bold',
  },
  passwordRow: {
    marginTop: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  passwordText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10,
  },
  passwordButton: {
    backgroundColor: 'rgba(3, 218, 198, 0.9)',
    paddingVertical: 12,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  passwordButtonText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dangerZone: {
    marginTop: 30,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 0, 0, 0.3)',
    borderRadius: 15,
    backgroundColor: 'rgba(207, 102, 121, 0.1)',
    padding: 15,
  },
  dangerZoneTitle: {
    color: '#CF6679',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  dangerZoneDescription: {
    color: '#f0f0f0',
    fontSize: 14,
    marginBottom: 15,
    opacity: 0.8,
  },
  deleteButton: {
    backgroundColor: 'rgba(207, 102, 121, 0.9)',
    paddingVertical: 12,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    padding: 25,
    width: isWeb ? '40%' : '80%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  warningText: {
    color: '#CF6679',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
    lineHeight: 22,
  },
  modalText: {
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  inputLabel: {
    alignSelf: 'flex-start',
    color: 'white',
    marginBottom: 6,
    fontWeight: '500',
    fontSize: 16,
  },
  input: {
    width: '100%',
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 10,
    backgroundColor: '#3a3a3a',
    color: 'white',
    fontSize: 16,
  },
  errorText: {
    color: '#ff6b6b',
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  cancelButton: {
    backgroundColor: '#555',
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#BB86FC',
    marginLeft: 10,
  },
  deleteConfirmButton: {
    backgroundColor: '#CF6679',
    marginLeft: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButtonText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteConfirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Add these to your styles
oauthBadge: {
  backgroundColor: '#3a3a3a',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 20,
  alignSelf: 'flex-start',
  marginBottom: 15,
},
oauthBadgeText: {
  color: '#BB86FC',
  fontWeight: '600',
},
infoText: {
  color: '#b0b0b0',
  fontSize: 14,
  marginTop: 10,
  marginBottom: 15,
  textAlign: 'center',
},
});

export default UserProfile;