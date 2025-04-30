import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
type Game = {
  rawgId: string;
  title: string;
  imageUrl: string;
};
export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [games, setGames] = useState<Game[]>([]);

  const BASE_URL = 'http://localhost:8080/api/games/search';

  const fetchGames = async (searchText: string) => {
    if (!searchText) return;
    try {
      const response = await fetch(`${BASE_URL}?query=${encodeURIComponent(searchText)}`);
      const data = await response.json();
      setGames((prevGames) => [...prevGames, ...data]);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleGamePress = (game: any) => {
    console.log('Game clicked:', game.title);
    // Optionally navigate:
    router.push(`/game/${game.rawgId}`);
  };
  const handleSearch = () => {
    fetchGames(query);
    Keyboard.dismiss();
  };

  const renderGameItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.gameCard}
      onPress={() => handleGamePress(item)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.gameImage} />
      <Text style={styles.gameTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#3a1c71', '#d76d77', '#ffaf7b']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}style={styles.container}>
      <View style={styles.overlay}>
        <Text style={styles.title}>Search Games</Text>
        <TextInput
          
          style={styles.input}
          placeholder="Enter a game name..."
          placeholderTextColor='rgba(20, 18, 18, 0.87)'
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
        />
        <FlatList
          data={games}
          renderItem={renderGameItem}
          keyExtractor={(item, index) => index.toString()}
          numColumns={2}
          contentContainerStyle={styles.gamesContainer}
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
  gamesContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  gameCard: {
    flex: 1,
    margin: 10,
    alignItems: 'center',
    maxWidth: Dimensions.get('window').width / 2 - 30,
  },
  gameImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
  },
  gameTitle: {
    marginTop: 10,
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
  },
});

