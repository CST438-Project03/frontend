import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { router } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Modal, TextInput, Alert } from 'react-native';


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
      const res = await fetch(`http://localhost:8080/api/reviews/create/game/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add your auth token here if needed
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
        Alert.alert('Success', 'Review submitted successfully!');
        setModalVisible(false);
        setRating('');
        setComment('');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong.');
      console.error(error);
    }
  };

  const fetchUserLists = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/lists/getUserLists', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',

        },
      });
      const data = await response.json();
      if (response.ok) {
        setLists(data.lists || []);
        setListModalVisible(true);
      } else {
        Alert.alert('Error', data.message || 'Could not fetch lists.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch user lists.');
    }
  };

  const handleAddGameToList = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/lists/addGame/${selectedListId}/games/${id}`, {
        method: 'POST',
        credentials: 'include',
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
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/home')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Image source={{ uri: game.imageUrl }} style={styles.gameImage} />
        <Text style={styles.title}>{game.title}</Text>
        <Text style={styles.genre}>Genre: {game.genre}</Text>
        <Text style={styles.info}>Release Date: {game.releaseDate}</Text>
        <Text style={styles.info}>Rating: {game.rating}</Text>
        <Text style={styles.info}>Platforms: {game.platforms}</Text>
        <Text style={styles.info}>Developers: {game.developers}</Text>
        <Text style={styles.description}>{game.description}</Text>
        <Button title="Write a Review" onPress={() => setModalVisible(true)} color="#BB86FC" />
        <Button title="Add to List" onPress={() => setListModalVisible(true)} color="#BB86FC" />

      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Submit a Review</Text>
            <TextInput
              style={styles.input}
              placeholder="Rating (1–10)"
              keyboardType="numeric"
              value={rating}
              onChangeText={setRating}
              placeholderTextColor="#999"
            />
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Comment"
              value={comment}
              onChangeText={setComment}
              multiline
              placeholderTextColor="#999"
            />
            <View style={styles.modalButtons}>
              <Button title="Submit" onPress={handleSubmitReview} color={'#BB86FC'}/>
              <Button title="Cancel" onPress={() => setModalVisible(false)} color="red" />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={listModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select a List</Text>
            {lists.map((list) => (
              <TouchableOpacity key={list.id} onPress={() => setSelectedListId(list.id)} style={{ padding: 10 }}>
                <Text style={{ color: '#fff' }}>{list.name}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.modalButtons}>
              <Button title="Add" onPress={handleAddGameToList} color={'#BB86FC'}/>
              <Button title="Cancel" onPress={() => setListModalVisible(false)} color="red" />
            </View>
          </View>
        </View>
      </Modal>

    </>



  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  gameImage: {
    width: 300,
    height: 300,
    borderRadius: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  genre: {
    fontSize: 18,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 10,
  },
  info: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
    color: 'white',
    textAlign: 'justify',
    marginTop: 20,
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
    backgroundColor: '#222',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },


});
