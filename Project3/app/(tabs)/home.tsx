import React, { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, StyleSheet, Image, FlatList, Dimensions } from 'react-native';

export default function HomeScreen() {
  const [games, setGames] = useState([]);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/games/fetchFromRawg');
        const data = await response.json();
        setGames(data);
      } catch (error) {
        console.error('Error fetching games:', error);
      }
    };

    fetchGames();
  }, []);

  const renderGameItem = ({ item }) => (
    <View style={styles.gameCard}>
      <Image source={{ uri: item.imageUrl }} style={styles.gameImage} />
      <Text style={styles.gameTitle}>{item.title}</Text>
    </View>
  );

  return (
    <LinearGradient colors={['#121212', '#2a2a2a']} style={styles.container}>
      <View style={styles.overlay}>
        <Text style={styles.title}>Welcome to the home page!</Text>
        <FlatList
          data={games}
          renderItem={renderGameItem}
          keyExtractor={(item) => item.rawgId}
          numColumns={2}
          contentContainerStyle={styles.gamesContainer}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    padding: 30,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    width: '90%',
    maxWidth: 600,
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  gamesContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  gameCard: {
    flex: 1,
    margin: 10,
    alignItems: 'center',
    maxWidth: Dimensions.get('window').width / 2 - 30, // Adjust for 2 columns
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