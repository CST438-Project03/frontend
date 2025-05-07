import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  Keyboard,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useRouter } from 'expo-router';

// Define constants
const isWeb = Platform.OS === 'web';
const isSmallScreen = Dimensions.get('window').width < 375;

type Game = {
  rawgId: string;
  title: string;
  imageUrl: string;
};

type User = {
  id: string;
  username: string;
};

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [games, setGames] = useState<Game[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const BASE_URL = 'http://localhost:8080/api';

  const fetchResults = async (searchText: string) => {
    if (!searchText) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Search both games and users simultaneously
      const [gameResponse, userResponse] = await Promise.all([
        fetch(`${BASE_URL}/games/search?query=${encodeURIComponent(searchText)}`),
        fetch(`${BASE_URL}/user/search?query=${encodeURIComponent(searchText)}`),
      ]);

      if (!gameResponse.ok) {
        throw new Error('Failed to fetch games');
      }
      
      const gameData = await gameResponse.json();
      const userData = await userResponse.json();

      setGames(gameData);
      setUsers(userData);
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to fetch results. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGamePress = (game: Game) => {
    console.log('Game clicked:', game.title);
    router.push(`/game/${game.rawgId}`);
  };

  const handleUserPress = (user: User) => {
    console.log('User clicked:', user.username);
    router.push({ pathname: '/user/[id]', params: { id: user.id } });
  };

  const handleSearch = () => {
    if (query.trim()) {
      fetchResults(query.trim());
      Keyboard.dismiss();
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    setGames([]);
    setUsers([]);
    setError(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#3a1c71', '#d76d77', '#ffaf7b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.mainContainer}>
          <View style={styles.content}>
            <Text style={styles.title}>Search</Text>
            
            <View style={styles.searchRow}>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="search" size={20} color="#3a1c71" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Search for games or users..."
                  placeholderTextColor="#999"
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                  autoCapitalize="none"
                />
                {query.length > 0 && (
                  <TouchableOpacity onPress={handleClearSearch}>
                    <MaterialIcons name="close" size={20} color="#666" style={styles.clearIcon} />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={[styles.searchButton, (!query.trim() || isLoading) && styles.searchButtonDisabled]}
                onPress={handleSearch}
                disabled={!query.trim() || isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.searchButtonText}>Search</Text>
                )}
              </TouchableOpacity>
            </View>

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3a1c71" />
                  <Text style={styles.loadingText}>Searching...</Text>
                </View>
              ) : (
                <>
                  {/* Users Section */}
                  {users.length > 0 && (
                    <View style={styles.sectionContainer}>
                      <Text style={styles.sectionTitle}>Users</Text>
                      {users.map((user, index) => (
                        <TouchableOpacity
                          key={`user-${user.id}-${index}`}
                          style={styles.userCard}
                          onPress={() => handleUserPress(user)}
                          activeOpacity={0.8}
                        >
                          <MaterialIcons name="person" size={24} color="#3a1c71" style={styles.userIcon} />
                          <Text style={styles.userName}>{user.username}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Games Section */}
                  {games.length > 0 && (
                    <View style={styles.sectionContainer}>
                      <Text style={styles.sectionTitle}>Games</Text>
                      <View style={styles.gameGrid}>
                        {games.map((game, index) => (
                          <TouchableOpacity
                            key={`game-${game.rawgId}-${index}`}
                            style={styles.gameCard}
                            onPress={() => handleGamePress(game)}
                            activeOpacity={0.8}
                          >
                            <View style={styles.imageContainer}>
                              <Image 
                                source={{ uri: game.imageUrl }} 
                                style={styles.gameImage} 
                                resizeMode="cover"
                              />
                            </View>
                            <Text style={styles.gameTitle} numberOfLines={1} ellipsizeMode="tail">
                              {game.title}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* No Results State */}
                  {users.length === 0 && games.length === 0 && (
                    <View style={styles.noResultsContainer}>
                      {query.trim() ? (
                        <>
                          <MaterialIcons name="search-off" size={64} color="#d76d77" />
                          <Text style={styles.noResultsText}>No results found</Text>
                          <Text style={styles.noResultsSubtext}>Try a different search term</Text>
                        </>
                      ) : (
                        <>
                          <MaterialIcons name="search" size={64} color="#3a1c71" />
                          <Text style={styles.initialStateText}>
                            Search for games and users
                          </Text>
                        </>
                      )}
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  mainContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: isWeb ? 900 : 600,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 20,
    height: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 15,
      },
      web: {
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)'
      }
    }),
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#3a1c71',
    textAlign: 'center',
    marginVertical: 20,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    marginRight: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)'
      }
    }),
  },
  inputIcon: {
    marginLeft: 15,
    marginRight: 5,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#333',
  },
  clearIcon: {
    marginRight: 15,
  },
  searchButton: {
    backgroundColor: '#3a1c71',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#3a1c71',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 12px rgba(58, 28, 113, 0.3)',
        cursor: 'pointer',
      }
    }),
  },
  searchButtonDisabled: {
    backgroundColor: 'rgba(58, 28, 113, 0.6)',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff6b6b',
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3a1c71',
    marginBottom: 10,
    paddingLeft: 5,
  },
  gameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  gameCard: {
    width: isWeb ? '20%' : '45%',
    padding: 8,
    marginBottom: 15,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 3/4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      }
    }),
  },
  gameImage: {
    width: '100%',
    height: '100%',
  },
  gameTitle: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
      }
    }),
  },
  userIcon: {
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  initialStateText: {
    fontSize: 18,
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
  },
});