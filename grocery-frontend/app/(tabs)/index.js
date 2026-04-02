import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert } from 'react-native';

export default function HomeScreen() {
    const [items, setItems] = useState([]);
    const [text, setText] = useState('');
    const [category, setCategory] = useState('General');
    const categories = ['Produce', 'Dairy', 'Pantry', 'Frozen', 'General'];

    const API_URL = 'http://192.168.178.23:3000/items';

    const fetchItems = async () => {
        try {
            const response = await fetch(API_URL);
            const jsonData = await response.json();
            setItems(jsonData);
        } catch (error) {
            console.error('Fetch Error:', error);
        }
    };

    useEffect(() => { fetchItems(); }, []);

    const addItem = async () => {
        if (text.trim().length === 0) return;
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: text, category: category }),
            });
            const newItem = await response.json();
            setItems([...items, newItem]);
            setText('');
        } catch (error) { console.error(error); }
    };

    const deleteItem = async (id) => {
        try {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            setItems(items.filter(i => i.id !== id));
        } catch (error) { console.error(error); }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Grocery Tracker</Text>

            <View style={styles.inputContainer}>
                <TextInput 
                    style={styles.input} 
                    placeholder="Add an item" 
                    value={text} 
                    onChangeText={setText} 
                />
                <TouchableOpacity style={styles.addButton} onPress={addItem}>
                    <Text style={{color: 'white', fontSize: 24}}>+</Text>
                </TouchableOpacity>
            </View>

            {/* CATEGORY SELECTOR UI */}
            <View style={styles.chipContainer}>
                {categories.map((cat) => (
                    <TouchableOpacity
                        key={cat}
                        onPress={() => setCategory(cat)}
                        style={[styles.chip, { backgroundColor: category === cat ? '#28a745' : '#E5E5EA' }]}
                    >
                        <Text style={{ color: category === cat ? 'white' : 'black' }}>{cat}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={items}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.itemCard}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.itemText}>{item.name}</Text>
                            <Text style={styles.categoryLabel}>{item.category}</Text>
                        </View>
                        <TouchableOpacity onPress={() => deleteItem(item.id)}>
                            <Text style={{ color: 'red' }}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa', paddingTop: 60 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
    inputContainer: { flexDirection: 'row', marginBottom: 15 },
    input: { flex: 1, backgroundColor: 'white', padding: 15, borderRadius: 10, marginRight: 10 },
    addButton: { backgroundColor: '#28a745', width: 55, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    chipContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8, marginBottom: 8 },
    itemCard: { flexDirection: 'row', backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, alignItems: 'center' },
    itemText: { fontSize: 18, fontWeight: '500' },
    categoryLabel: { fontSize: 12, color: '#28a745', fontWeight: 'bold' }
});