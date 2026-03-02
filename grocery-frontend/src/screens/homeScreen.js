import React, { useState, useEffect } from 'react'; // Fixed: removed 'use', added 'useEffect'
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';

const HomeScreen = () => {
    const [items, setItems] = useState([]);
    const [text, setText] = useState('');

    // Change this to your computer's actual IP
    const API_URL = 'http://192.168.178.23:3000/groceries';

    // 1. Fetching items from the database
    const fetchItems = async () => {
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            setItems(data); 
        } catch (error) {
            console.error('Error fetching items:', error);
        }
    };

    // Run fetchItems once when the app opens
    useEffect(() => {
        fetchItems();
    }, []);

    // 2. Adding an item to the database
    const addItem = async () => {
        if (text.length > 0) {
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: text }),
                });
                const newItem = await response.json();
                setItems([...items, newItem]); // Update UI with new item from DB
                setText('');
            } catch (error) {
                console.error('Error adding item:', error);
            }
        }
    };

    // 3. Deleting an item (UI only for now)
    const deleteItem = async (idToDelete) => {
        try{
            await fetch(`${API_URL}/${idToDelete}`, { method: 'DELETE',  
        });
        const filteredList = items.filter(item => item.id !== idToDelete);
        setItems(filteredList);
    }catch (error) {
        console.error('Error deleting item:', error);
    }
        // Next step: Add a fetch(..., { method: 'DELETE' }) here!
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Grocery Tracker</Text>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Add an item"
                    value={text}
                    onChangeText={(val) => setText(val)}
                />
                <TouchableOpacity style={styles.addButton} onPress={addItem}>
                    <Text style={styles.buttonText}>+</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={items}
                keyExtractor={(item) => item.id.toString()} // Ensure ID is a string
                renderItem={({ item }) => (
                    <View style={styles.itemCard}>
                        <Text style={styles.itemText}>{item.name}</Text>
                        <TouchableOpacity onPress={() => deleteItem(item.id)}>
                            <Text style={{ color: 'red', fontWeight: 'bold' }}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    );
};

// Fixed the styles hierarchy
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 40,
        backgroundColor: '#f4f4f4',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    inputContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    input: {
        flex: 1,
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        marginRight: 10,
    },
    addButton: {
        backgroundColor: '#28a745',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 24,
    },
    itemCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    itemText: {
        fontSize: 18,
    },
});

export default HomeScreen;