import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';

// This "Interface" tells TypeScript what a Grocery item looks like
interface GroceryItem {
  id: number;
  name: string;
}

const HomeScreen = () => {
  // We tell useState that it will hold an array of GroceryItem objects
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [text, setText] = useState<string>('');

  // USE YOUR IP ADDRESS HERE
  const API_URL = 'http://192.168.178.23:3000/groceries';

  const fetchItems = async () => {
    try {
      const response = await fetch(API_URL);
      const data: GroceryItem[] = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const addItem = async () => {
    if (text.length > 0) {
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: text }),
        });
        const newItem: GroceryItem = await response.json();
        setItems([...items, newItem]);
        setText('');
      } catch (error) {
        console.error('Error adding item:', error);
      }
    }
  };

  const deleteItem = async (idToDelete: number) => {
    try {
      await fetch(`${API_URL}/${idToDelete}`, { method: 'DELETE' });
      const filteredList = items.filter(item => item.id !== idToDelete);
      setItems(filteredList);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
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
        keyExtractor={(item) => item.id.toString()}
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

const styles = StyleSheet.create({
  container: { flex: 1, padding: 40, backgroundColor: '#f4f4f4' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  inputContainer: { flexDirection: 'row', marginBottom: 20 },
  input: { flex: 1, padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc', marginRight: 10 },
  addButton: { backgroundColor: '#28a745', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 24 },
  itemCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10 },
  itemText: { fontSize: 18 },
});

export default HomeScreen;