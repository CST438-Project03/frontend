import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { router } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Modal, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ToastAndroid, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';


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

  const handleSubmitReview = async () => {
    const numRating = parseInt(rating);

    if (isNaN(numRating) || numRating < 1 || numRating > 10) {
      Alert.alert('Invalid Rating', 'Please enter a rating between 1 and 10.');
      return;
    }

    if (!comment.trim()) {
      Alert.alert('Empty Comment', 'Please enter a comment.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken'); // Get the stored JWT

      const res = await fetch(`http://localhost:8080/api/reviews/create/game/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${token}`, // Add the token here
        },
        body: new URLSearchParams({
          rating: numRating.toString(),
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

      const response = await fetch('http://localhost:8080/api/lists/getUserLists', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('User Lists API Response:', data); //  log here

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

      const res = await fetch(`http://localhost:8080/api/lists/addGame/${selectedListId}/games/${id}`, {
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
            <View style={{ height: 1, backgroundColor: '#444', marginVertical: 10 }} />
            <Text style={styles.genre}>Genre: {game.genre}</Text>
            <Text style={styles.info}>Release Date: {game.releaseDate}</Text>
            <Text style={styles.info}>Rating: {game.rating}</Text>
            <Text style={styles.info}>Platforms: {game.platforms}</Text>
            <Text style={styles.info}>Developers: {game.developers}</Text>
            <Text style={styles.description}>{game.description}</Text>
          </View>


          <View style={styles.actionButtons}>

            <TouchableOpacity style={styles.modalButton} onPress={async () => {
              setModalVisible(true)
            }}>
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

        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Submit a Review</Text>
              <TextInput
                style={styles.input}
                placeholder="Rating (1–5)"
                keyboardType="numeric"
                value={rating}
                onChangeText={setRating}
                placeholderTextColor="#fff"
              />
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Comment"
                value={comment}
                onChangeText={setComment}
                multiline
                placeholderTextColor="#fff"
              />
              <View style={styles.modalButtons}>
              
                <TouchableOpacity style={[styles.modalButton]} onPress={handleSubmitReview}>
                                  <Text style={styles.modalButtonText}>Cancel</Text>
                                </TouchableOpacity>

               
                  <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#444' }]} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.modalButtonText}>Cancel</Text>
                                  </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={listModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select a List</Text>

              {lists.map((list) => (
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
              ))}

              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton,]} onPress={handleAddGameToList}>
                  <Text style={styles.modalButtonText}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#444' }]} onPress={() => setListModalVisible(false)}>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3a1c71',
    textAlign: 'center',
    marginBottom: 10,
  },
  genre: {
    fontSize: 18,
    color: '#3a1c71',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold'
  },
  info: {
    fontSize: 16,
    color: '#3a1c71',
    textAlign: 'center',
    marginBottom: 5,
    fontWeight: 'bold'
  },
  description: {
    fontSize: 16,
    color: '#3a1c71',
    textAlign: 'left',
    marginTop: 15,
    lineHeight: 22,
    fontWeight: 'bold'
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#3a1c71',
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'gray',
    color: '#fff',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
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
  },
  buttonWrapper: {
    flex: 1,
    marginHorizontal: 5,
  },
  equalButton: {
    flex: 1,
    alignSelf: 'stretch',
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
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
});
