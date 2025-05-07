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
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const API_URL = 'http://localhost:8080/api';

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

  // Fetch current user's info once
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
      console.log('Fetched reviews:', data.reviews);
      setReviews(data.reviews || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      Alert.alert('Error', 'Failed to load reviews.');
    } finally {
      setLoadingReviews(false);
    }
  };

  //fetch data when view changes
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
    // Convert 10-point rating back to 5-star scale
    const starRating = Math.round(review.rating / 2).toString();
    setRating(starRating);
    setComment(review.comment);
    setReviewModalVisible(true);
  };

  const handleSubmitReview = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      
      // Validate star rating
      const starRating = parseInt(rating);
      if (isNaN(starRating) || starRating < 1 || starRating > 5) {
        Alert.alert('Invalid Rating', 'Please select a rating between 1 and 5 stars.');
        return;
      }
      
      // Convert 5-star rating to 10-point scale for API
      const numRating = starRating * 2;
      
      console.log('JWT Token:', token);
      console.log('Submitting review with rating:', numRating);

      const response = await fetch(`${API_URL}/reviews/edit/${editingReview.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: numRating, // Send the converted 10-point rating
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

  // Helper function to render star ratings
  const renderStarRating = (rating) => {
    // Convert 10-point rating to 5-star scale
    const starRating = Math.round(rating / 2);
    
    return (
      <View style={styles.starsRow}>
        {[...Array(5)].map((_, index) => (
          <MaterialIcons
            key={index}
            name={index < starRating ? "star" : "star-border"}
            size={20}
            color="#FFD700"
          />
        ))}
      </View>
    );
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
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, view === 'lists' && styles.activeTab]}
            onPress={() => setView('lists')}
          >
            <Ionicons 
              name="list" 
              size={24} 
              color={view === 'lists' ? '#fff' : '#3a1c71'} 
            />
            <Text style={[styles.tabText, view === 'lists' && styles.activeTabText]}>
              Lists
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, view === 'reviews' && styles.activeTab]}
            onPress={() => setView('reviews')}
          >
            <Ionicons 
              name="star" 
              size={24} 
              color={view === 'reviews' ? '#fff' : '#3a1c71'} 
            />
            <Text style={[styles.tabText, view === 'reviews' && styles.activeTabText]}>
              Reviews
            </Text>
          </TouchableOpacity>
        </View>

        {view === 'lists' ? (
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {loadingLists ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : lists.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="game-controller-outline" size={60} color="#fff" style={{ marginBottom: 20 }} />
                <Text style={styles.emptyStateText}>You have no lists yet</Text>
                <TouchableOpacity 
                  style={styles.createListButton} 
                  onPress={() => setListModalVisible(true)}
                >
                  <Text style={styles.createListButtonText}>Create Your First List</Text>
                </TouchableOpacity>
              </View>
            ) : (
              lists.map((list) => (
                <View key={list.id} style={styles.listCard}>
                  <View style={styles.listHeader}>
                    <Text style={styles.listTitle}>{list.name}</Text>
                    <TouchableOpacity 
                      onPress={() => deleteList(list.id)}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash" size={20} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.divider} />
                  
                  {list.videoGames && list.videoGames.length > 0 ? (
                    list.videoGames.map((game) => (
                      <View key={game.id} style={styles.gameItem}>
                        <Image 
                          source={{ uri: game.imageUrl }} 
                          style={styles.gameImage} 
                        />
                        <Text style={styles.gameTitle}>{game.title}</Text>
                        <TouchableOpacity 
                          onPress={() => removeGame(list.id, game.id)}
                          style={styles.removeButton}
                        >
                          <Ionicons name="remove-circle" size={22} color="#FF6B6B" />
                        </TouchableOpacity>
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyListContainer}>
                      <Ionicons name="game-controller-outline" size={40} color="#ddd" />
                      <Text style={styles.emptyListText}>No games in this list yet</Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {loadingReviews ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : reviews.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="star-outline" size={60} color="#fff" style={{ marginBottom: 20 }} />
                <Text style={styles.emptyStateText}>You haven't written any reviews yet</Text>
                <Text style={styles.emptyStateSubtext}>Your game reviews will appear here</Text>
              </View>
            ) : (
              reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewGameTitle}>{review.videoGame.title}</Text>
                    <View style={styles.reviewActions}>
                      <TouchableOpacity 
                        onPress={() => startEditReview(review)} 
                        style={styles.editButton}
                      >
                        <Ionicons name="create" size={22} color="#3a1c71" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => handleDeleteReview(review.id)}
                        style={styles.deleteReviewButton}
                      >
                        <Ionicons name="trash" size={22} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Star Rating Display */}
                  {renderStarRating(review.rating)}
                  
                  <View style={styles.reviewCommentContainer}>
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {view === 'lists' && (
          <TouchableOpacity 
            style={styles.fabButton} 
            onPress={() => setListModalVisible(true)}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Create List Modal */}
        <Modal visible={listModalVisible} animationType="fade" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create New List</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter list name"
                placeholderTextColor="#999"
                value={newListName}
                onChangeText={setNewListName}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#444' }]} 
                  onPress={() => setListModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalButton} 
                  onPress={createList}
                >
                  <Text style={styles.modalButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Review Modal with Star Rating */}
        <Modal visible={reviewModalVisible} animationType="fade" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Review</Text>
              
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingLabel}>Your Rating</Text>
                <StarRatingSelector rating={rating} setRating={setRating} />
              </View>
              
              <View style={styles.commentContainer}>
                <Text style={styles.commentLabel}>Your Review</Text>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Share your thoughts about this game..."
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#444' }]} 
                  onPress={() => setReviewModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalButton} 
                  onPress={handleSubmitReview}
                >
                  <Text style={styles.modalButtonText}>Update</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Confirm Delete Modal */}
        <Modal visible={confirmDeleteVisible} animationType="fade" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Ionicons name="warning" size={40} color="#FF6B6B" style={styles.warningIcon} />
              <Text style={styles.modalTitle}>Confirm Delete</Text>
              <Text style={styles.confirmText}>
                Are you sure you want to delete this review? This action cannot be undone.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#444' }]} 
                  onPress={() => setConfirmDeleteVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#FF6B6B' }]} 
                  onPress={confirmDeleteReview}
                >
                  <Text style={styles.modalButtonText}>Delete</Text>
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
    padding: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: Platform.OS === 'web' ? 40 : 60,
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#3a1c71',
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3a1c71',
  },
  activeTabText: {
    color: '#fff',
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Platform.OS === 'web' ? 60 : 80,
    padding: 20,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  createListButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  createListButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  // List Card Styles
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3a1c71',
  },
  deleteButton: {
    padding: 6,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(58, 28, 113, 0.1)',
    marginVertical: 12,
  },
  gameItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(58, 28, 113, 0.05)',
  },
  gameImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  gameTitle: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  removeButton: {
    padding: 6,
  },
  emptyListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyListText: {
    color: '#999',
    marginTop: 10,
    fontSize: 14,
  },
  
  // Review Card Styles
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewGameTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3a1c71',
    flex: 1,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    padding: 4,
  },
  deleteReviewButton: {
    padding: 4,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  reviewCommentContainer: {
    marginTop: 8,
  },
  reviewComment: {
    fontSize: 16,
    color: '#444',
    lineHeight: 22,
  },
  
  // FAB Button
  fabButton: {
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: Platform.OS === 'web' ? '40%' : '85%',
    maxWidth: 500,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3a1c71',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(58, 28, 113, 0.05)',
    color: '#333',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(58, 28, 113, 0.1)',
  },
  ratingContainer: {
    marginBottom: 16,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3a1c71',
    marginBottom: 8,
    textAlign: 'center',
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starButton: {
    padding: 4,
  },
  commentContainer: {
    marginBottom: 20,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3a1c71',
    marginBottom: 8,
  },
  commentInput: {
    backgroundColor: 'rgba(58, 28, 113, 0.05)',
    color: '#333',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(58, 28, 113, 0.1)',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#3a1c71',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  warningIcon: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  confirmText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
});