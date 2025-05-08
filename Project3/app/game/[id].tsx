import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { router } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons'; // Add MaterialIcons
import { Button, Modal, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ToastAndroid, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Star Rating Selector Component
const StarRatingSelector = ({ rating, setRating, maxStars = 5 }) => {
  return (
    <View style={styles.starContainer}>
      {[...Array(maxStars)].map((_, index) => {
        const starValue = index + 1;
        return (
          <TouchableOpacity
            key={starValue}
            onPress={() => setRating(starValue.toString())}
            style={styles.starButton}
          >
            <MaterialIcons
              name={starValue <= parseInt(rating || 0) ? "star" : "star-border"}
              size={36}
              color="#FFD700"
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default function GameDetails() {
  const { id } = useLocalSearchParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [rating, setRating] = useState('');
  const [comment, setComment] = useState('');

  const [lists, setLists] = useState([]);
  const [listModalVisible, setListModalVisible] = useState(false);
  const [selectedListId, setSelectedListId] = useState(null);

  useEffect(() => {
    const fetchGameDetails = async () => {
      try {
        const response = await fetch(`https://api.rawg.io/api/games/${id}?key=c3101d469d92487fa6cc0d34454b74d7`);
        const data = await response.json();
        setGame({
          title: data.name,
          imageUrl: data.background_image,
          genre: data.genres.map((genre) => genre.name).join(', '),
          description: data.description_raw,
          releaseDate: data.released,
          rating: data.rating,
          platforms: data.platforms.map((platform) => platform.platform.name).join(', '),
          developers: data.developers.map((developer) => developer.name).join(', '),
        });
      } catch (error) {
        console.error('Error fetching game details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGameDetails();
  }, [id]);

  // Modified to use star rating
  const handleSubmitReview = async () => {
    const starRating = parseInt(rating);
    
    // Convert 5-star rating to 10-point scale
    const numRating = starRating * 2;

    if (isNaN(starRating) || starRating < 1 || starRating > 5) {
      Alert.alert('Invalid Rating', 'Please select a rating between 1 and 5 stars.');
      return;
    }

    if (!comment.trim()) {
      Alert.alert('Empty Comment', 'Please enter a comment.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken'); 

      const res = await fetch(`https://cst438-project3-2224023aed89.herokuapp.com/api/reviews/create/game/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${token}`, 
        },
        body: new URLSearchParams({
          rating: numRating.toString(), // Send the converted 10-point rating
          comment,
        }).toString(),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert('Error', data.message || 'Failed to submit review.');
      } else {
        showToast('Review submitted successfully!');
        setModalVisible(false);
        setRating('');
        setComment('');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong.');
      console.error(error);
    }
  };

  const showToast = (message) => {
    if (Platform.OS === 'android' && ToastAndroid) {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Notice', message); // Web
    }
  };

  const fetchUserLists = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');

      const response = await fetch('https://cst438-project3-2224023aed89.herokuapp.com/api/lists/getUserLists', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('User Lists API Response:', data);

      if (response.ok) {
        setLists(data.lists || []);
      } else {
        Alert.alert('Error', data.message || 'Could not fetch lists.');
      }
    } catch (error) {
      console.error('Fetch user lists failed:', error);
      Alert.alert('Error', 'Failed to fetch user lists.');
    }
  };

  const handleAddGameToList = async () => {
    if (!selectedListId) {
      Alert.alert('Please select a list');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        Alert.alert('Authentication Error', 'You are not logged in.');
        return;
      }

      const res = await fetch(`https://cst438-project3-2224023aed89.herokuapp.com/api/lists/addGame/${selectedListId}/games/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert('Error', data.message || 'Failed to add game.');
      } else {
        Alert.alert('Success', 'Game added to list!');
        setListModalVisible(false);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (!game) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Game not found.</Text>
      </View>
    );
  }

  return (
    <>
      <LinearGradient
        colors={['#3a1c71', '#d76d77', '#ffaf7b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/home')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
  
          <Image source={{ uri: game.imageUrl }} style={styles.gameImage} />
          <View style={styles.gameInfoCard}>
            <Text style={styles.cardTitle}>{game.title}</Text>
            <View style={styles.divider} />
            
            {/* Improved info section with consistent formatting */}
            <View style={styles.infoGrid}>
              <Text style={styles.infoLabel}>Genre:</Text>
              <Text style={styles.infoValue}>{game.genre}</Text>
              
              <Text style={styles.infoLabel}>Release Date:</Text>
              <Text style={styles.infoValue}>{game.releaseDate}</Text>
              
              <Text style={styles.infoLabel}>Rating:</Text>
              <Text style={styles.infoValue}>{game.rating}</Text>
              
              <Text style={styles.infoLabel}>Platforms:</Text>
              <Text style={styles.infoValue}>{game.platforms}</Text>
              
              <Text style={styles.infoLabel}>Developers:</Text>
              <Text style={styles.infoValue}>{game.developers}</Text>
            </View>
            
            {/* Improved description section */}
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>Description</Text>
              <Text style={styles.description}>{game.description}</Text>
            </View>
          </View>
  
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(true)}>
              <Text style={styles.modalButtonText}>Write a Review</Text>
            </TouchableOpacity>
  
            <TouchableOpacity style={styles.modalButton} onPress={async () => {
              await fetchUserLists();
              setListModalVisible(true);
            }}>
              <Text style={styles.modalButtonText}>Add To List</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
  
        {/* Improved Review Modal with Star Rating */}
        <Modal visible={modalVisible} animationType="fade" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Submit a Review</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Rating</Text>
                <StarRatingSelector rating={rating} setRating={setRating} />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Your Review</Text>
                <TextInput
                  style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                  placeholder="Share your thoughts about this game..."
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  placeholderTextColor="rgba(58, 28, 113, 0.5)"
                />
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton]} onPress={handleSubmitReview}>
                  <Text style={styles.modalButtonText}>Submit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#444' }]} 
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
  
        {/* Improved List Modal */}
        <Modal visible={listModalVisible} animationType="fade" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select a List</Text>
              
              <View style={styles.listsContainer}>
                {lists.length > 0 ? (
                  lists.map((list) => (
                    <TouchableOpacity
                      key={list.id}
                      onPress={() => setSelectedListId(list.id)}
                      style={[
                        styles.listCard,
                        selectedListId === list.id && styles.listCardSelected
                      ]}
                    >
                      <Text
                        style={[
                          styles.listCardText,
                          selectedListId === list.id && { color: '#fff' }
                        ]}
                      >
                        {list.name}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noListsText}>No lists available. Create a list first.</Text>
                )}
              </View>
  
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton]} 
                  onPress={handleAddGameToList}
                  disabled={!selectedListId}
                >
                  <Text style={styles.modalButtonText}>Add</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#444' }]} 
                  onPress={() => setListModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: 20,
  },
  gameImage: {
    width: 300,
    height: 300,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  starButton: {
    padding: 5,
  },
  infoGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  infoLabel: {
    width: '30%',
    fontSize: 16,
    color: '#3a1c71',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoValue: {
    width: '70%',
    fontSize: 16,
    color: '#3a1c71',
    marginBottom: 8,
  },
  descriptionContainer: {
    marginTop: 10,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3a1c71',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    textAlign: 'left',
  },
  inputGroup: {
    marginBottom: 16,
    width: '100%',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3a1c71',
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(58, 28, 113, 0.1)',
    color: '#333',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(58, 28, 113, 0.2)',
  },
  listsContainer: {
    maxHeight: 300,
    marginVertical: 12,
  },
  noListsText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 20,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    width: '85%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#3a1c71',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 8,
    borderRadius: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 320,
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  divider: {
    height: 1, 
    backgroundColor: 'rgba(58, 28, 113, 0.2)', 
    marginVertical: 10,
    width: '100%',
  },
  gameInfoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    marginTop: 20,
    width: '90%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3a1c71',
    marginBottom: 15,
    textAlign: 'center',
  },
  listCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#3a1c71',
  },
  listCardSelected: {
    borderColor: '#3a1c71',
    backgroundColor: '#3a1c71',
    color: '#fff'
  },
  listCardText: {
    color: '#3a1c71',
    fontSize: 16,
    fontWeight: '500',
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#3a1c71',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
});