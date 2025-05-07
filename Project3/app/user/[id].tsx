import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

export default function UserProfile() {
  const { id } = useLocalSearchParams();
  const [user, setUser] = useState(null);
  const [lists, setLists] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        if (!token) throw new Error('Authentication token is missing');

        const [userResponse, listsResponse, reviewsResponse] = await Promise.all([
          fetch(`http://localhost:8080/api/user/${id}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`http://localhost:8080/api/lists/getUserLists`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`http://localhost:8080/api/reviews/all/user`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!userResponse.ok || !listsResponse.ok || !reviewsResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const userData = await userResponse.json();
        const listsData = await listsResponse.json();
        const reviewsData = await reviewsResponse.json();

        setUser(userData);
        setLists(listsData.lists || []);
        setReviews(reviewsData.reviews || []);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  if (loading) {
    return (
      <LinearGradient colors={['#3a1c71', '#d76d77', '#ffaf7b']} style={styles.container}>
        <ActivityIndicator size="large" color="#BB86FC" />
      </LinearGradient>
    );
  }

  if (!user) {
    return (
      <LinearGradient colors={['#3a1c71', '#d76d77', '#ffaf7b']} style={styles.container}>
        <Text style={styles.errorText}>User not found.</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#3a1c71', '#d76d77', '#ffaf7b']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.profileContainer}>
          <Image
            source={{ uri: user.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}` }}
            style={styles.profileImage}
          />
          <Text style={styles.title}>{user.username}</Text>
          <Text style={styles.info}>Email: {user.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lists</Text>
          {lists.length > 0 ? (
            lists.map((list) => (
              <View key={list.id} style={styles.listCard}>
                <Text style={styles.listTitle}>{list.name}</Text>
                {list.videoGames.map((game) => (
                  <View key={game.id} style={styles.gameItem}>
                    <Image source={{ uri: game.imageUrl }} style={styles.gameImage} />
                    <Text style={styles.gameTitle}>{game.title}</Text>
                  </View>
                ))}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No lists available.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <Text style={styles.reviewGameTitle}>{review.videoGame.title}</Text>
                <Text style={styles.reviewRating}>Rating: {review.rating}/10</Text>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No reviews available.</Text>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { padding: 20 },
  profileContainer: { alignItems: 'center', marginBottom: 20 },
  profileImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#fff' },
  info: { fontSize: 16, marginBottom: 5, color: '#fff' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#fff' },
  listCard: { backgroundColor: 'rgba(245, 239, 239, 0.87)', padding: 10, borderRadius: 8, marginBottom: 10 },
  listTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5, color: '#3a1c71' },
  gameItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  gameImage: { width: 40, height: 40, borderRadius: 5, marginRight: 10 },
  gameTitle: { fontSize: 16, color: '#3a1c71' },
  reviewCard: { backgroundColor: 'rgba(245, 239, 239, 0.87)', padding: 10, borderRadius: 8, marginBottom: 10 },
  reviewGameTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5, color: '#3a1c71' },
  reviewRating: { fontSize: 16, marginBottom: 5, color: '#3a1c71' },
  reviewComment: { fontSize: 14, fontStyle: 'italic', color: '#3a1c71' },
  emptyText: { fontSize: 16, color: '#999', fontStyle: 'italic' },
  errorText: { fontSize: 18, color: 'red' },
});
