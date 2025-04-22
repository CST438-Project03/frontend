import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function GameDetails() {
  const { id } = useLocalSearchParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: game.imageUrl }} style={styles.gameImage} />
      <Text style={styles.title}>{game.title}</Text>
      <Text style={styles.genre}>Genre: {game.genre}</Text>
      <Text style={styles.info}>Release Date: {game.releaseDate}</Text>
      <Text style={styles.info}>Rating: {game.rating}</Text>
      <Text style={styles.info}>Platforms: {game.platforms}</Text>
      <Text style={styles.info}>Developers: {game.developers}</Text>
      <Text style={styles.description}>{game.description}</Text>
    </ScrollView>
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
});
