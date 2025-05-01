import React, { useState } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  Keyboard,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [games, setGames] = useState([]);
  const [users, setUsers] = useState([]);
  const router = useRouter();

  const BASE_URL = 'http://localhost:8080/api';

  const fetchResults = async (searchText: string) => {
    if (!searchText) return;
    try {
      const [gameResponse, userResponse] = await Promise.all([
        fetch(`${BASE_URL}/games/search?query=${encodeURIComponent(searchText)}`),
        fetch(`${BASE_URL}/user/search?query=${encodeURIComponent(searchText)}`),
      ]);

      const gameData = await gameResponse.json();
      const userData = await userResponse.json();

      setGames(gameData);
      setUsers(userData);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleSearch = () => {
    fetchResults(query);
    Keyboard.dismiss();
  };

  const renderGameItem = ({ item }: any) => (
    <View style={styles.resultCard}>
      <Image source={{ uri: item.imageUrl }} style={styles.resultImage} />
      <Text style={styles.resultTitle}>{item.title}</Text>
    </View>
  );

  const renderUserItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => router.push(`/user/${item.id}`)}
    >
      <Text style={styles.resultTitle}>{item.username}</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#3a1c71', '#d76d77', '#ffaf7b']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>Search</Text>
        <TextInput
          style={styles.input}
          placeholder="Search for games or users..."
          placeholderTextColor="rgba(20, 18, 18, 0.87)"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
        />
        <FlatList
          data={games}
          renderItem={renderGameItem}
          keyExtractor={(item, index) => `game-${index}`}
          numColumns={2}
          contentContainerStyle={styles.resultsContainer}
          ListHeaderComponent={
            users.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Users</Text>
                <FlatList
                  data={users}
                  renderItem={renderUserItem}
                  keyExtractor={(item, index) => `user-${index}`}
                  contentContainerStyle={styles.resultsContainer}
                />
                <Text style={styles.sectionTitle}>Games</Text>
              </>
            )
          }
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: {
    padding: 30,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 239, 239, 0.87)',
    alignItems: 'center',
    width: '90%',
    maxWidth: 600,
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'rgba(26, 10, 51, 0.95)',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    height: 45,
    backgroundColor: 'rgba(121, 101, 151, 0.87)',
    color: 'white',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  resultsContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  resultCard: {
    flex: 1,
    margin: 10,
    alignItems: 'center',
    maxWidth: Dimensions.get('window').width / 2 - 30,
  },
  resultImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
  },
  resultTitle: {
    marginTop: 10,
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'rgba(26, 10, 51, 0.95)',
    marginVertical: 10,
  },
});

