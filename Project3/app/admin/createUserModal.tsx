import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  ScrollView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';

interface CreateUserData {
  username: string;
  email: string;
  password: string;
  admin: boolean;
}

interface CreateUserModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (userData: CreateUserData) => Promise<void>;
}

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

const CreateUserModal: React.FC<CreateUserModalProps> = ({ visible, onClose, onCreate }) => {
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const createButtonScale = useSharedValue(1);
  
  const handlePressIn = (animValue: Animated.SharedValue<number>): void => {
    animValue.value = withSpring(0.95);
  };

  const handlePressOut = (animValue: Animated.SharedValue<number>): void => {
    animValue.value = withSpring(1);
  };
  
  const resetForm = (): void => {
    setUsername('');
    setEmail('');
    setPassword('');
    setIsAdmin(false);
  };
  
  const handleClose = (): void => {
    resetForm();
    onClose();
  };
  
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const validateForm = (): boolean => {
    if (!username.trim()) {
      Alert.alert('Error', 'Username is required');
      return false;
    }
    
    if (!email.trim()) {
      Alert.alert('Error', 'Email is required');
      return false;
    }
    
    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    
    if (!password.trim()) {
      Alert.alert('Error', 'Password is required');
      return false;
    }
    
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }
    
    return true;
  };
  
  const handleCreate = async (): Promise<void> => {
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await onCreate({
        username,
        email,
        password,
        admin: isAdmin,
      });
      
      resetForm();
    } catch (error) {
      console.error('Error creating user:', error);
      // Error will be handled in the parent component
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={handleClose}
        />
        
        <View style={styles.modalContent}>
          {/* Header with gradient */}
          <LinearGradient
            colors={['#3a1c71', '#d76d77']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>Create New User</Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={handleClose}
            >
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>
          
          <ScrollView style={styles.modalBody}>
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="person" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Enter username"
                    autoCapitalize="none"
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="email" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter email address"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="lock" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter password"
                    secureTextEntry
                  />
                </View>
              </View>
              
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Admin Privileges</Text>
                <Switch
                  value={isAdmin}
                  onValueChange={setIsAdmin}
                  trackColor={{ false: '#d1d1d1', true: '#ffaf7b' }}
                  thumbColor={isAdmin ? '#3a1c71' : '#f4f3f4'}
                  ios_backgroundColor="#d1d1d1"
                />
              </View>
              
              <Animated.View 
                style={[
                  styles.createButtonContainer, 
                  { transform: [{ scale: createButtonScale }] }
                ]}
              >
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={handleCreate}
                  onPressIn={() => handlePressIn(createButtonScale)}
                  onPressOut={() => handlePressOut(createButtonScale)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Text style={styles.buttonText}>Creating...</Text>
                  ) : (
                    <>
                      <MaterialIcons name="person-add" size={20} color="#fff" style={styles.buttonIcon} />
                      <Text style={styles.buttonText}>Create User</Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          </ScrollView>
        </View>
      </View>
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
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  createButtonContainer: {
    width: '100%',
    marginTop: 10,
  },
  createButton: {
    backgroundColor: '#3a1c71',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#3a1c71',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 12px rgba(58, 28, 113, 0.2)',
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
});

export default CreateUserModal;