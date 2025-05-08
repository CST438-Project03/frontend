import React, { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define types
type Game = {
  rawgId: string;
  title: string;
  imageUrl: string;
};

type Review = {
  id: number;
  user: {
    id: number;
    username: string;
  };
  videoGame: {
    rawgId: string;
    title: string;
    imageUrl: string;
  };
  rating: number;
  comment: string;
};

type GameList = {
  id: number;
  name: string;
  user: {
    id: number;
    username: string;
  };
  games: Game[];
};

export default function HomeScreen() {
  const [games, setGames] = useState<Game[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userLists, setUserLists] = useState<GameList[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const gamesPerPage = 18; // 6 games per row, 3 rows per page
  const router = useRouter();
  const isWeb = Platform.OS === 'web';

  // Function to add to debug log
  const addToDebugLog = (message: string) => {
    console.log(message);
    setDebugLog(prev => [...prev, message]);
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      // Create a counter to track API fetches
      let fetchesCompleted = 0;
      const totalFetches = 3; // games, reviews, user lists
      
      const checkAllFetchesCompleted = () => {
        fetchesCompleted++;
        if (fetchesCompleted >= totalFetches) {
          setIsLoading(false);
        }
      };

      try {
        // Fetch games with improved error handling
        try {
          addToDebugLog('Fetching games...');
          const gamesResponse = await fetch(
            `https://cst438-project3-2224023aed89.herokuapp.com/api/games/fetchFromRawg?page=${currentPage}&pageSize=${gamesPerPage}`
          );
          
          if (!gamesResponse.ok) {
            addToDebugLog(`Failed to fetch games: ${gamesResponse.status} ${gamesResponse.statusText}`);
          } else {
            const responseText = await gamesResponse.text();
            addToDebugLog(`Games response text: ${responseText.substring(0, 100)}...`);
            
            try {
              const gamesData = JSON.parse(responseText);
              
              // Check if the data structure is what we expect
              if (gamesData && gamesData.games && Array.isArray(gamesData.games)) {
                setGames(gamesData.games);
                setTotalPages(gamesData.totalPages || 1);
                addToDebugLog(`Found ${gamesData.games.length} games in expected format`);
              } else if (Array.isArray(gamesData)) {
                // If the API returns an array directly
                setGames(gamesData);
                setTotalPages(1);
                addToDebugLog(`Found ${gamesData.length} games in array format`);
              } else {
                addToDebugLog(`Unexpected games data structure`);
                setGames([]);
              }
            } catch (parseError) {
              addToDebugLog(`Error parsing games response: ${parseError}`);
              setGames([]);
            }
          }
        } catch (gameError) {
          addToDebugLog(`Error in games fetch: ${gameError}`);
          setGames([]);
        } finally {
          checkAllFetchesCompleted();
        }

        // Fetch reviews with improved error handling
        try {
          addToDebugLog('Fetching reviews...');
          const reviewsResponse = await fetch('https://cst438-project3-2224023aed89.herokuapp.com/public/reviews/recent');
          
          if (!reviewsResponse.ok) {
            addToDebugLog(`Failed to fetch reviews: ${reviewsResponse.status} ${reviewsResponse.statusText}`);
          } else {
            const responseText = await reviewsResponse.text();
            addToDebugLog(`Reviews response text: ${responseText.substring(0, 100)}...`);
            
            try {
              const reviewsData = JSON.parse(responseText);
              
              if (reviewsData && reviewsData.reviews && Array.isArray(reviewsData.reviews)) {
                setReviews(reviewsData.reviews);
                addToDebugLog(`Found ${reviewsData.reviews.length} reviews in expected format`);
              } else if (Array.isArray(reviewsData)) {
                setReviews(reviewsData);
                addToDebugLog(`Found ${reviewsData.length} reviews in array format`);
              } else {
                addToDebugLog(`Unexpected reviews data structure`);
                setReviews([]);
              }
            } catch (parseError) {
              addToDebugLog(`Error parsing reviews response: ${parseError}`);
              setReviews([]);
            }
          }
        } catch (reviewError) {
          addToDebugLog(`Error in reviews fetch: ${reviewError}`);
          setReviews([]);
        } finally {
          checkAllFetchesCompleted();
        }

        // Fetch user lists with improved error handling
        try {
          const token = isWeb 
            ? localStorage.getItem('jwtToken') 
            : await AsyncStorage.getItem('jwtToken');
          
          if (token) {
            addToDebugLog('Fetching user lists...');
            const listsResponse = await fetch('https://cst438-project3-2224023aed89.herokuapp.com/api/lists/getUserLists', {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (!listsResponse.ok) {
              addToDebugLog(`Failed to fetch lists: ${listsResponse.status} ${listsResponse.statusText}`);
            } else {
              const responseText = await listsResponse.text();
              addToDebugLog(`Lists response text: ${responseText.substring(0, 100)}...`);
              
              try {
                const listsData = JSON.parse(responseText);
                
                if (listsData && listsData.lists && Array.isArray(listsData.lists)) {
                  setUserLists(listsData.lists);
                  addToDebugLog(`Found ${listsData.lists.length} lists in expected format`);
                } else if (Array.isArray(listsData)) {
                  setUserLists(listsData);
                  addToDebugLog(`Found ${listsData.length} lists in array format`);
                } else {
                  addToDebugLog(`Unexpected lists data structure`);
                  setUserLists([]);
                }
              } catch (parseError) {
                addToDebugLog(`Error parsing lists response: ${parseError}`);
                setUserLists([]);
              }
            }
          } else {
            addToDebugLog('No JWT token found, skipping lists fetch');
          }
        } catch (listsError) {
          addToDebugLog(`Error in lists fetch: ${listsError}`);
          setUserLists([]);
        } finally {
          checkAllFetchesCompleted();
        }
      } catch (err) {
        console.error('Overall error in fetchData:', err);
        setError('Failed to load content. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentPage]);

  // Show error alert if there's an error
  useEffect(() => {
    if (error) {
      Alert.alert('Error Loading Content', error);
    }
  }, [error]);

  const renderGameItem = ({ item }: { item: Game }) => {
    // Defensive checks for undefined or null values
    if (!item) {
      console.warn('Received undefined item in renderGameItem');
      return null;
    }
    
    return (
      <TouchableOpacity
        key={item.rawgId || 'unknown'}
        style={styles.gameCard}
        onPress={() => item.rawgId ? router.push(`/game/${item.rawgId}`) : null}
      >
        <Image 
          source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }} 
          style={styles.gameImage}
          onError={(e) => console.error('Image load error:', e.nativeEvent.error)}
        />
        <Text style={styles.gameTitle}>{item.title || 'Unknown Game'}</Text>
      </TouchableOpacity>
    );
  };

  const renderReviewItem = ({ item }: { item: Review }) => {
    // Defensive checks for undefined or null values
    if (!item || !item.videoGame) {
      console.warn('Received undefined item or videoGame in renderReviewItem');
      return null;
    }
    
    return (
      <TouchableOpacity
        style={styles.reviewCard}
        onPress={() => item.videoGame?.rawgId ? router.push(`/game/${item.videoGame.rawgId}`) : null}
      >
        <Image
          source={{ uri: item.videoGame?.imageUrl || 'https://via.placeholder.com/150' }}
          style={styles.reviewGameImage}
        />
        <View style={styles.reviewContent}>
          <Text style={styles.reviewGameTitle}>{item.videoGame?.title || 'Unknown Game'}</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <MaterialIcons
                key={star}
                name={Math.round((item.rating || 0) / 2) >= star ? "star" : "star-border"}
                size={16}
                color="#FFD700"
              />
            ))}
          </View>
          <Text style={styles.reviewText} numberOfLines={2}>{item.comment || 'No comment'}</Text>
          <Text style={styles.reviewUser}>by {item.user?.username || 'Anonymous'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderListItem = ({ item }: { item: GameList }) => {
    // Defensive checks for undefined or null values
    if (!item || !item.games) {
      console.warn('Received undefined item or games in renderListItem');
      return null;
    }
    
    return (
      <TouchableOpacity
        style={styles.listCard}
        onPress={() => item.id ? router.push(`/list/${item.id}`) : null}
      >
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>{item.name || 'Unnamed List'}</Text>
          <Text style={styles.listGameCount}>{(item.games?.length || 0)} games</Text>
        </View>

        <View style={styles.listThumbnails}>
          {(item.games || []).slice(0, 3).map((game, index) => (
            <Image
              key={index}
              source={{ uri: game?.imageUrl || 'https://via.placeholder.com/60x80' }}
              style={styles.listThumbnail}
            />
          ))}
          {(item.games?.length || 0) > 3 && (
            <View style={styles.moreGamesIndicator}>
              <Text style={styles.moreGamesText}>+{(item.games?.length || 0) - 3}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const getPaginationRange = () => {
    const range = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  };

  if (isLoading) {
    return (
      <LinearGradient
        colors={['#3a1c71', '#d76d77', '#ffaf7b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading content...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Debug panel in development mode */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Debug Info:</Text>
          <Text style={styles.debugText}>Games: {games ? games.length : 'undefined'}</Text>
          <Text style={styles.debugText}>Reviews: {reviews ? reviews.length : 'undefined'}</Text>
          <Text style={styles.debugText}>Lists: {userLists ? userLists.length : 'undefined'}</Text>
          <ScrollView style={{ maxHeight: 100 }}>
            {debugLog.map((log, index) => (
              <Text key={index} style={styles.debugLogText}>{log}</Text>
            ))}
          </ScrollView>
          {error && <Text style={styles.debugError}>{error}</Text>}
          <TouchableOpacity 
            style={styles.debugButton}
            onPress={() => {
              console.log('Games:', games);
              console.log('Reviews:', reviews);
              console.log('UserLists:', userLists);
            }}
          >
            <Text style={{ color: 'white' }}>Log Data to Console</Text>
          </TouchableOpacity>
        </View>
      )}

      <LinearGradient
        colors={['#3a1c71', '#d76d77', '#ffaf7b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.container}>
            <Text style={styles.title}>Welcome to GameStack!</Text>

            {/* Featured Games Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Featured Games</Text>
              {games && games.length > 0 ? (
                <FlatList
                  data={games}
                  renderItem={renderGameItem}
                  keyExtractor={(item) => item?.rawgId || Math.random().toString()}
                  numColumns={Platform.OS === 'web' ? 6 : 3}
                  scrollEnabled={false}
                  contentContainerStyle={styles.gamesContainer}
                />
              ) : (
                <Text style={styles.noContentText}>No games available</Text>
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

            {/* Recent Reviews Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Reviews</Text>
              {reviews && reviews.length > 0 ? (
                <FlatList
                  data={reviews}
                  renderItem={renderReviewItem}
                  keyExtractor={(item) => (item?.id?.toString() || Math.random().toString())}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.reviewsContainer}
                />
              ) : (
                <Text style={styles.noContentText}>No reviews yet</Text>
              )}
            </View>

            {/* User Lists Section - Only shown if user is logged in and has lists */}
            {userLists && userLists.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Game Lists</Text>
                <FlatList
                  data={userLists}
                  renderItem={renderListItem}
                  keyExtractor={(item) => (item?.id?.toString() || Math.random().toString())}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.listsContainer}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const isWeb = Platform.OS === 'web';
const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  section: {
    width: '100%',
    maxWidth: isWeb ? 1200 : '95%',
    marginVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
      }
    }),
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    marginLeft: 10,
  },
  gamesContainer: {
    justifyContent: 'center',
    paddingBottom: 10,
  },
  gameCard: {
    margin: 10,
    alignItems: 'center',
    width: isWeb ? (screenWidth / 8) : (screenWidth / 3.5),
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
  noContentText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  paginationContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  paginationButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    gap: 10,
  },
  pageButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  activePageButton: {
    backgroundColor: '#3a1c71',
  },
  pageText: {
    color: '#3a1c71',
    fontWeight: 'normal',
  },
  activePageText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Review styles
  reviewsContainer: {
    paddingBottom: 10,
  },
  reviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginRight: 15,
    width: 280,
    flexDirection: 'row',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 3px 8px rgba(0, 0, 0, 0.15)',
      }
    }),
  },
  reviewGameImage: {
    width: 80,
    height: 110,
    borderRadius: 8,
  },
  reviewContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  reviewGameTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  reviewText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    lineHeight: 20,
  },
  reviewUser: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  // Lists styles
  listsContainer: {
    paddingBottom: 10,
  },
  listCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginRight: 15,
    width: 220,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 3px 8px rgba(0, 0, 0, 0.15)',
      }
    }),
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  listTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  listGameCount: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  listThumbnails: {
    flexDirection: 'row',
    height: 80,
  },
  listThumbnail: {
    width: 60,
    height: 80,
    borderRadius: 6,
    marginRight: 5,
  },
  moreGamesIndicator: {
    width: 30,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreGamesText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  // Debug panel styles
  debugContainer: {
    position: 'absolute',
    top: 40,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
    maxWidth: 300,
    zIndex: 1000,
  },
  debugTitle: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  debugText: {
    color: 'white',
  },
  debugLogText: {
    color: '#aaa',
    fontSize: 10,
  },
  debugError: {
    color: '#ff6666',
    fontWeight: 'bold',
  },
  debugButton: {
    backgroundColor: '#3a1c71',
    padding: 5,
    borderRadius: 5,
    marginTop: 5,
    alignItems: 'center',
  },
});