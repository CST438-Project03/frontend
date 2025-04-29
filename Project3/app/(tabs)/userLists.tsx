import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Modal,
    Alert,
    ActivityIndicator,
    Image,
    Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = 'http://localhost:8080/api';

export default function UserLists() {
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newListName, setNewListName] = useState('');
    const [modalVisible, setModalVisible] = useState(false);

    const fetchLists = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('jwtToken');
            const response = await fetch(`${API_URL}/lists/getUserLists`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            setLists(data.lists || []);
        } catch (err) {
            console.error('Error fetching lists:', err);
            Alert.alert('Error', 'Failed to load lists.');
        } finally {
            setLoading(false);
        }
    };

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
            setModalVisible(false);
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
      
          const res = await fetch(`http://localhost:8080/api/lists/deleteList/${listId}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
      
          const data = await res.json();
      
          if (!res.ok) {
            Alert.alert('Error', data.message || 'Failed to delete list');
          } else {
            //showToast('List deleted successfully');
            fetchLists(); 
          }
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

    useEffect(() => {
        fetchLists();
    }, []);

    return (
        <LinearGradient colors={['#3a1c71', '#d76d77', '#ffaf7b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }} style={styles.container}>
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {loading ? (
                    <ActivityIndicator size="large" color="#BB86FC" />
                ) : lists.length === 0 ? (
                    <View style={styles.emptyStateContainer}>
                        <Text style={styles.emptyStateText}>You have no lists yet.</Text>
                        <TouchableOpacity style={styles.createListButton} onPress={() => setModalVisible(true)}>
                            <Text style={styles.createListButtonText}>Create List</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    lists.map((list) => (
                        <View key={list.id} style={styles.listCard}>
                            <View style={styles.listHeader}>
                                <Text style={styles.listTitle}>{list.name}</Text>
                                <TouchableOpacity onPress={() => deleteList(list.id)}>
                                    <Ionicons name="trash" size={20} color="#FF6B6B" />
                                </TouchableOpacity>
                            </View>
                            {list.videoGames && list.videoGames.length > 0 ? (
                                list.videoGames.map((game) => (
                                    <View key={game.id} style={styles.gameItem}>
                                        <Image source={{ uri: game.imageUrl }} style={styles.gameImage} />
                                        <Text style={styles.gameTitle}>{game.title}</Text>
                                        <TouchableOpacity onPress={() => removeGame(list.id, game.id)}>
                                            <Ionicons name="remove-circle" size={20} color="#FF6B6B" />
                                        </TouchableOpacity>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.emptyText}>No games in this list.</Text>
                            )}
                        </View>
                    ))
                )}
            </ScrollView>

            {lists.length > 0 && (
                <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                    <Ionicons name="add" size={28} color="#fff" />
                </TouchableOpacity>
            )}

            {/* Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Create New List</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="List name"
                            placeholderTextColor="#999"
                            value={newListName}
                            onChangeText={setNewListName}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalButton} onPress={createList}>
                                <Text style={styles.modalButtonText}>Create</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#444' }]} onPress={() => setModalVisible(false)}>
                                <Text style={styles.modalButtonText}>Cancel</Text>
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
    container: { flex: 1, },
    scrollContainer: { padding: 20 },
    listCard: {
        backgroundColor: 'rgba(245, 239, 239, 0.87)',
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    listTitle: { color: '#BB86FC', fontSize: 18, fontWeight: 'bold' },
    gameItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    gameImage: { width: 40, height: 40, borderRadius: 5, marginRight: 10 },
    gameTitle: { color: '#fff', flex: 1 },
    emptyText: { color: '#999', fontStyle: 'italic' },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 30,
        backgroundColor: '#BB86FC',
        borderRadius: 30,
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    modalContent: {
        backgroundColor: '#222',
        padding: 20,
        borderRadius: 10,
        width: '80%',
    },
    modalTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#333',
        color: '#fff',
        padding: 10,
        borderRadius: 8,
        marginBottom: 15,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        backgroundColor: '#BB86FC',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    modalButtonText: { color: '#121212', fontWeight: 'bold' },
    emptyStateContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyStateText: {
        color: '#aaa',
        fontSize: 18,
        marginBottom: 20,
    },
    createListButton: {
        backgroundColor: '#BB86FC',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 10,
    },
    createListButtonText: {
        color: '#121212',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
