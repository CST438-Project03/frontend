import React, { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, FlatList } from 'react-native';
//import { Pagination } from '@mantine/core';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const [games, setGames] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const gamesPerPage = 18; // 6 games per row, 3 rows per page
  const router = useRouter();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        console.log(`Fetching games for page ${currentPage} with pageSize ${gamesPerPage}`);
        const response = await fetch(`https://cst438-project3-2224023aed89.herokuapp.com/api/games/fetchFromRawg?page=${currentPage}&pageSize=${gamesPerPage}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch games: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Fetched games:', data);
        setGames(data.games || []); // Fallback to an empty array if "games" is undefined
        setTotalPages(data.totalPages || 1); // Fallback to 1 if "totalPages" is undefined
      } catch (error) {
        console.error('Error fetching games:', error);
        setGames([]); // Fallback to an empty array on error
      }
    };

    fetchGames();
  }, [currentPage]);

  const renderGameItem = ({ item }) => (
    <TouchableOpacity
      key={item.rawgId}
      style={styles.gameCard}
      onPress={() => router.push(`/game/${item.rawgId}`)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.gameImage} />
      <Text style={styles.gameTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  const getPaginationRange = () => {
    const range = [];
    const start = Math.max(1, currentPage - 2); // Show 2 pages before the current page
    const end = Math.min(totalPages, currentPage + 2); // Show 2 pages after the current page
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  };

  return (
    <LinearGradient
      colors={['#3a1c71', '#d76d77', '#ffaf7b']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to GameStack!</Text>
        {games.length > 0 ? (
          <FlatList
            data={games}
            renderItem={renderGameItem}
            keyExtractor={(item) => item.rawgId}
            numColumns={6} // 6 games per row
            contentContainerStyle={styles.gamesContainer}
          />
        ) : (
          <Text style={styles.noGamesText}>No games available</Text>
        )}
        <View style={styles.paginationContainer}>
          <View style={styles.paginationButtons}>
            {getPaginationRange().map((page) => (
              <TouchableOpacity
                key={page}
                onPress={() => setCurrentPage(page)}
                style={[
                  styles.pageButton,
                  page === currentPage && styles.activePageButton,
                ]}
              >
                <Text
                  style={page === currentPage ? styles.activePageText : styles.pageText}
                >
                  {page}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

        </View>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.85)', // Darker background for better contrast
    alignItems: 'center',
    width: '90%',
    maxWidth: 1200,
    flex: 1,
    marginTop: 50, // Move the overlay lower on the screen
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 5,
  },
  gamesContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  gameCard: {
    margin: 10,
    alignItems: 'center',
    width: Dimensions.get('window').width / 6 - 30, // Adjust for 6 columns
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
  noGamesText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
  },
  paginationContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  paginationButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 10, // if using RN < 0.71, use marginRight on children instead
  },
  pageButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  activePageButton: {
    backgroundColor: '#3a1c71', // purple
  },
  pageText: {
    color: '#3a1c71',
    fontWeight: 'normal',
  },
  activePageText: {
    color: 'white',
    fontWeight: 'bold',
  },
  
});