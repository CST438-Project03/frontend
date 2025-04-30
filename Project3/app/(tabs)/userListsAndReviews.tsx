import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
  Button,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://localhost:8080/api';


export default function UserListsAndReviews() {
  const [username, setUsername] = useState<string>('');
  const [view, setView] = useState<'lists' | 'reviews'>('lists');

  // Lists State
  const [lists, setLists] = useState([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [newListName, setNewListName] = useState('');
  const [listModalVisible, setListModalVisible] = useState(false);

  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [rating, setRating] = useState('');
  const [comment, setComment] = useState('');
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [reviewIdToDelete, setReviewIdToDelete] = useState(null);


  // Fetch current user’s info once
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        const res = await fetch(`${API_URL}/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setUsername(data.username);
        console.log(data.username);
      } catch (e) {
        console.error('Error fetching user info:', e);
      }
    };
    fetchUser();
  }, []);

  // Fetch Lists
  const fetchLists = async () => {
    setLoadingLists(true);
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_URL}/lists/getUserLists`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setLists(data.lists || []);
    } catch (err) {
      console.error('Error fetching lists:', err);
      Alert.alert('Error', 'Failed to load lists.');
    } finally {
      setLoadingLists(false);
    }
  };

  // Fetch Reviews
  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_URL}/reviews/all/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      Alert.alert('Error', 'Failed to load reviews.');
    } finally {
      setLoadingReviews(false);
    }
  };

  //fetch data  when view changes
  useEffect(() => {
    if (view === 'lists') {
      fetchLists();
    } else {
      fetchReviews();
    }
  }, [view]);

  const createList = async () => {
    if (!newListName.trim()) {
      Alert.alert('Validation', 'List name cannot be empty.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(`${API_URL}/lists/createList?name=${encodeURIComponent(newListName)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setListModalVisible(false);
      setNewListName('');
      fetchLists();
    } catch (err) {
      console.error('Error creating list:', err);
      Alert.alert('Error', err.message || 'Failed to create list.');
    }
  };

  const deleteList = async (listId) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const res = await fetch(`${API_URL}/lists/deleteList/${listId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      fetchLists();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  const removeGame = async (listId, gameId) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const res = await fetch(`${API_URL}/lists/removeGame/${listId}/games/${gameId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      fetchLists();
    } catch (err) {
      console.error('Error removing game:', err);
      Alert.alert('Error', err.message || 'Failed to remove game.');
    }
  };

  const startEditReview = (review) => {
    setEditingReview(review);
    setRating(review.rating.toString());
    setComment(review.comment);
    setReviewModalVisible(true);
  };

  const handleSubmitReview = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      console.log('JWT Token:', token);

      const response = await fetch(`${API_URL}/reviews/edit/${editingReview.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: Number(rating),
          comment: comment,
        }),
      });

      console.log('Edit Review response status:', response.status);

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.log('Failed to parse JSON:', jsonError);
      }

      if (!response.ok) {
        const errorMessage = data?.message || 'Something went wrong';
        throw new Error(errorMessage);
      }

      setReviewModalVisible(false);
      await fetchReviews();
      Alert.alert('Success', 'Review updated successfully!');
    } catch (err) {
      console.error('Error editing review:', err);
      Alert.alert('Error', err.message || 'Failed to edit review.');
    }
  };



  const handleDeleteReview = (reviewId) => {
    console.log('Opening delete confirmation modal for reviewId:', reviewId);
    setReviewIdToDelete(reviewId);
    setConfirmDeleteVisible(true);
  };

  const confirmDeleteReview = async () => {
    if (!reviewIdToDelete) return;
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      console.log('Delete review token:', token);
      console.log('Trying to delete review ID:', reviewIdToDelete);

      const res = await fetch(`${API_URL}/reviews/delete/${reviewIdToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('Delete response status:', res.status);

      let data;
      try {
        data = await res.json();
      } catch (jsonError) {
        console.log('Failed to parse delete response as JSON:', jsonError);
      }

      if (!res.ok) {
        const errorMessage = data?.message || 'Something went wrong during delete';
        throw new Error(errorMessage);
      }

      await fetchReviews();
      Alert.alert('Success', 'Review deleted successfully!');
    } catch (err) {
      console.error('Error deleting review:', err);
      Alert.alert('Error', err.message || 'Failed to delete review.');
    } finally {
      setConfirmDeleteVisible(false);
      setReviewIdToDelete(null);
    }
  };



  return (
    <LinearGradient
      colors={['#3a1c71', '#d76d77', '#ffaf7b']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      <Text style={styles.header}>
        {username
          ? `${username}'s ${view === 'lists' ? 'Lists' : 'Reviews'}`
          : ''}
      </Text>
      <View style={styles.container}>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, view === 'lists' && styles.activeButton]}
            onPress={() => setView('lists')}
          >
            <Text style={[styles.buttonText, view === 'lists' && styles.activeButtonText]}>Lists</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, view === 'reviews' && styles.activeButton]}
            onPress={() => setView('reviews')}
          >
            <Text style={[styles.buttonText, view === 'reviews' && styles.activeButtonText]}>Reviews</Text>
          </TouchableOpacity>
        </View>

        {view === 'lists' ? (
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {loadingLists ? (
              <ActivityIndicator size="large" color="#BB86FC" />
            ) : lists.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>You have no lists yet.</Text>
                <TouchableOpacity style={styles.createListButton} onPress={() => setListModalVisible(true)}>
                  <Text style={styles.createListButtonText}>Create List</Text>
                </TouchableOpacity>
              </View>
            ) : (
              lists.map((list) => (
                <View key={list.id} style={styles.listCard}>
                  <View style={styles.listHeader}>
                    <Text style={styles.listTitle}>{list.name}</Text>
                    <TouchableOpacity onPress={() => deleteList(list.id)}>
                      <Ionicons name="trash" size={20} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                  {list.videoGames && list.videoGames.length > 0 ? (
                    list.videoGames.map((game) => (
                      <View key={game.id} style={styles.gameItem}>
                        <Image source={{ uri: game.imageUrl }} style={styles.gameImage} />
                        <Text style={styles.gameTitle}>{game.title}</Text>
                        <TouchableOpacity onPress={() => removeGame(list.id, game.id)}>
                          <Ionicons name="remove-circle" size={20} color="#FF6B6B" />
                        </TouchableOpacity>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>No games in this list.</Text>
                  )}
                </View>
              ))
            )}

          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {loadingReviews ? (
              <ActivityIndicator size="large" color="#BB86FC" />
            ) : reviews.length === 0 ? (
              <Text style={styles.emptyText}>You have no reviews yet.</Text>
            ) : (
              reviews.map((review) => (
                <View key={review.id} style={styles.listCard}>
                  <Text style={styles.gameTitle}>{review.videoGame.title}</Text>
                  <Text style={styles.ratingText}>Rating: {review.rating} / 5</Text>
                  <Text style={styles.ratingText}>Comment: {review.comment}</Text>
                  <View style={{ flexDirection: 'row', marginTop: 10 }}>
                    <TouchableOpacity onPress={() => startEditReview(review)} style={{ marginRight: 10 }}>
                      <Ionicons name="create" size={24} color="#3a1c71" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {
                      console.log('Trash icon pressed for review id:', review.id);
                      handleDeleteReview(review.id);
                    }}>

                      <Ionicons name="trash" size={24} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {view === 'lists' && lists.length > 0 && (
          <TouchableOpacity style={styles.newListButton} onPress={() => {
            console.log('FAB Pressed');
            setListModalVisible(true);
          }}>
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Create List Modal */}
        <Modal visible={listModalVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create New List</Text>
              <TextInput
                style={styles.input}
                placeholder="List name"
                placeholderTextColor="#fff"
                value={newListName}
                onChangeText={setNewListName}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalButton} onPress={createList}>
                  <Text style={styles.modalButtonText}>Create</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#444' }]} onPress={() => setListModalVisible(false)}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Review Modal */}
        <Modal visible={reviewModalVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Review</Text>
              <TextInput
                style={styles.input}
                placeholder="Rating (1–5)"
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
                <TouchableOpacity style={styles.modalButton} onPress={handleSubmitReview}>
                  <Text style={styles.modalButtonText}>Submit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#444' }]} onPress={() => setReviewModalVisible(false)} >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={confirmDeleteVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Confirm Delete</Text>
              <Text style={{ color: '#fff', marginBottom: 20 }}>Are you sure you want to delete this review?</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalButton} onPress={confirmDeleteReview}>
                  <Text style={styles.modalButtonText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#444' }]} onPress={() => setConfirmDeleteVisible(false)}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>


      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 5,
  },
  buttonRow:
  {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 5,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },
  activeButton: {
    backgroundColor: '#3a1c71',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3a1c71',
  },
  activeButtonText: {
    color: '#fff',
  },
  scrollContainer: {
    paddingTop: 10,
    paddingBottom: 30,
  },
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 30,
    marginBottom: 20,
    elevation: 6,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  listTitle: {
    color: '#3a1c71',
    fontSize: 25,
    fontWeight: 'bold'
  },
  gameItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  gameImage: {
    width: 60,
    height: 60,
    borderRadius: 5,
    marginRight: 10
  },
  gameTitle: {
    color: '#3a1c71',
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold'
  },
  ratingText: {
    color: '#3a1c71',
    flex: 1,
    fontSize: 18
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
    marginTop: 20,
    textAlign: 'center'
  },
  emptyStateContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  createListButton: {
    backgroundColor: '#3a1c71',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },
  createListButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)'
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%'
  },
  modalTitle: {
    color: '#3a1c71',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  input: {
    backgroundColor: 'gray',
    color: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between'
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
  newListButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3a1c71',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },

});
