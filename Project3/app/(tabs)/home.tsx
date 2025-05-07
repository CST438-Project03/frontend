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
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

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
  
  const gamesPerPage = 18; // 6 games per row, 3 rows per page
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch games
        const gamesResponse = await fetch(
          `http://localhost:8080/api/games/fetchFromRawg?page=${currentPage}&pageSize=${gamesPerPage}`
        );
        if (!gamesResponse.ok) {
          throw new Error(`Failed to fetch games: ${gamesResponse.statusText}`);
        }
        const gamesData = await gamesResponse.json();
        setGames(gamesData.games || []);
        setTotalPages(gamesData.totalPages || 1);
        
        // Fetch recent reviews
        const reviewsResponse = await fetch('http://localhost:8080/public/reviews/recent');
        if (!reviewsResponse.ok) {
          throw new Error(`Failed to fetch reviews: ${reviewsResponse.statusText}`);
        }
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData.reviews || []);
        
        // Fetch user lists (if authenticated)
        try {
          const listsResponse = await fetch('http://localhost:8080/api/lists/getUserLists', {
            credentials: 'include', // Include cookies for authentication
          });
          
          if (listsResponse.ok) {
            const listsData = await listsResponse.json();
            setUserLists(listsData.lists || []);
          }
          // If not authenticated or other issue, we just won't show lists section
        } catch (listsError) {
          console.log('User not authenticated or error fetching lists');
          // Not setting an error here as this is optional
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load content. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentPage]);

  const renderGameItem = ({ item }: { item: Game }) => (
    <TouchableOpacity
      key={item.rawgId}
      style={styles.gameCard}
      onPress={() => router.push(`/game/${item.rawgId}`)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.gameImage} />
      <Text style={styles.gameTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  const renderReviewItem = ({ item }: { item: Review }) => (
    <TouchableOpacity
      style={styles.reviewCard}
      onPress={() => router.push(`/game/${item.videoGame.rawgId}`)}
    >
      <Image 
        source={{ uri: item.videoGame.imageUrl }} 
        style={styles.reviewGameImage} 
      />
      <View style={styles.reviewContent}>
        <Text style={styles.reviewGameTitle}>{item.videoGame.title}</Text>
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <MaterialIcons
              key={star}
              name={star <= item.rating ? "star" : "star-border"}
              size={16}
              color="#FFD700"
            />
          ))}
        </View>
        <Text style={styles.reviewText} numberOfLines={2}>{item.comment}</Text>
        <Text style={styles.reviewUser}>by {item.user.username}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderListItem = ({ item }: { item: GameList }) => (
    <TouchableOpacity
      style={styles.listCard}
      onPress={() => router.push(`/list/${item.id}`)}
    >
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>{item.name}</Text>
        <Text style={styles.listGameCount}>{item.games.length} games</Text>
      </View>
      
      <View style={styles.listThumbnails}>
        {item.games.slice(0, 3).map((game, index) => (
          <Image 
            key={index}
            source={{ uri: game.imageUrl }} 
            style={styles.listThumbnail} 
          />
        ))}
        {item.games.length > 3 && (
          <View style={styles.moreGamesIndicator}>
            <Text style={styles.moreGamesText}>+{item.games.length - 3}</Text>
          </View>
        )}
      </View>
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
              {games.length > 0 ? (
                <FlatList
                  data={games}
                  renderItem={renderGameItem}
                  keyExtractor={(item) => item.rawgId}
                  numColumns={Platform.OS === 'web' ? 6 : 3} // Adjust for mobile
                  scrollEnabled={false} // Disable scroll within FlatList since we're in a ScrollView
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
              {reviews.length > 0 ? (
                <FlatList
                  data={reviews}
                  renderItem={renderReviewItem}
                  keyExtractor={(item) => item.id.toString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.reviewsContainer}
                />
              ) : (
                <Text style={styles.noContentText}>No reviews yet</Text>
              )}
            </View>
            
            {/* User Lists Section - Only shown if user is logged in and has lists */}
            {userLists.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Game Lists</Text>
                <FlatList
                  data={userLists}
                  renderItem={renderListItem}
                  keyExtractor={(item) => item.id.toString()}
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
});