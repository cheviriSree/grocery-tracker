import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import BarcodeScannerModal from '../../components/BarcodeScannerModal';
import ExpiryBadge from '../../components/ExpiryBadge';

const BASE_URL = 'http://192.168.178.23:3000';
const API_URL = `${BASE_URL}/groceries`;

export default function HomeScreen() {
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  const [category, setCategory] = useState('General');
  const categories = ['Produce', 'Dairy', 'Pantry', 'Frozen', 'General'];

  // Expiry date for the add form
  const [expiryDate, setExpiryDate] = useState(null);
  const [showAddDatePicker, setShowAddDatePicker] = useState(false);
  // Pending date state for iOS (confirm on Done press)
  const [pendingAddDate, setPendingAddDate] = useState(null);

  // Barcode scanner
  const [showScanner, setShowScanner] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Editing expiry on an existing item
  const [editingExpiry, setEditingExpiry] = useState(null); // { itemId, currentDate }
  const [pendingEditDate, setPendingEditDate] = useState(null);

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
      const body = { name: text, category };
      if (expiryDate) {
        body.expiry_date = expiryDate.toISOString().split('T')[0];
      }
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const newItem = await response.json();
      setItems([...items, newItem]);
      setText('');
      setExpiryDate(null);
    } catch (error) { console.error(error); }
  };

  const deleteItem = async (id) => {
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      setItems(items.filter(i => i.id !== id));
    } catch (error) { console.error(error); }
  };

  const toggleItem = async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/items/${id}/toggle`, { method: 'PATCH' });
      const updatedItem = await response.json();
      setItems(items.map(item => item.id === id ? updatedItem : item));
    } catch (error) { console.error('Toggle Error:', error); }
  };

  const updateExpiry = async (itemId, newDate) => {
    try {
      const expiry_date = newDate ? newDate.toISOString().split('T')[0] : null;
      const response = await fetch(`${API_URL}/${itemId}/expiry`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiry_date }),
      });
      const updatedItem = await response.json();
      setItems(items.map(i => i.id === itemId ? updatedItem : i));
    } catch (error) {
      console.error('Update expiry error:', error);
      Alert.alert('Error', 'Failed to save expiry date. Please try again.');
    } finally {
      setEditingExpiry(null);
      setPendingEditDate(null);
    }
  };

  const handleBarcodeScan = async (barcodeValue) => {
    setShowScanner(false);
    setIsLookingUp(true);
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcodeValue}.json`
      );
      const data = await response.json();
      const productName = data.product?.product_name?.trim();
      if (data.status === 1 && productName) {
        setText(productName);
      } else {
        Alert.alert(
          'Product Not Found',
          'No product name found for this barcode. You can type the name manually.'
        );
      }
    } catch {
      Alert.alert('Network Error', 'Could not reach the product database. Please check your connection.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const formatDate = (date) =>
    date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  const openEditExpiry = (item) => {
    const currentDate = item.expiry_date
      ? new Date(item.expiry_date + 'T00:00:00')
      : new Date();
    setEditingExpiry({ itemId: item.id, currentDate });
    setPendingEditDate(currentDate);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Grocery Tracker</Text>

      {/* Input row */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add an item"
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => setShowScanner(true)}
          disabled={isLookingUp}
        >
          {isLookingUp
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.scanButtonText}>Scan</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={addItem}>
          <Text style={{ color: 'white', fontSize: 24 }}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Expiry date selector for add form */}
      <TouchableOpacity
        style={styles.expirySelector}
        onPress={() => {
          setPendingAddDate(expiryDate || new Date());
          setShowAddDatePicker(true);
        }}
      >
        {expiryDate ? (
          <View style={styles.expirySelectorRow}>
            <Text style={styles.expirySelectorActive}>Expiry: {formatDate(expiryDate)}</Text>
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); setExpiryDate(null); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.expiryClear}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.expirySelectorPlaceholder}>Set expiry date (optional)</Text>
        )}
      </TouchableOpacity>

      {/* iOS: inline date picker + Done button in a modal */}
      {showAddDatePicker && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide">
          <View style={styles.iosPickerBackdrop}>
            <View style={styles.iosPickerContainer}>
              <View style={styles.iosPickerHeader}>
                <TouchableOpacity onPress={() => setShowAddDatePicker(false)}>
                  <Text style={styles.iosPickerCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  setExpiryDate(pendingAddDate);
                  setShowAddDatePicker(false);
                }}>
                  <Text style={styles.iosPickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={pendingAddDate || new Date()}
                mode="date"
                display="spinner"
                onChange={(_, selected) => { if (selected) setPendingAddDate(selected); }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Android: dialog-style picker */}
      {showAddDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={pendingAddDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selected) => {
            setShowAddDatePicker(false);
            if (selected) setExpiryDate(selected);
          }}
        />
      )}

      {/* Category chips */}
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

      {/* Item list */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <TouchableOpacity onPress={() => toggleItem(item.id)} style={{ flex: 1 }}>
              <Text style={[
                styles.itemText,
                item.is_completed && { textDecorationLine: 'line-through', color: '#aaa' },
              ]}>
                {item.name}
              </Text>
              <View style={styles.itemMeta}>
                <Text style={styles.categoryLabel}>{item.category}</Text>
                <ExpiryBadge expiry_date={item.expiry_date} />
              </View>
              <TouchableOpacity
                onPress={() => openEditExpiry(item)}
                style={styles.editExpiryButton}
              >
                <Text style={styles.editExpiryText}>
                  {item.expiry_date ? 'Edit expiry' : 'Set expiry'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => deleteItem(item.id)} style={styles.deleteButton}>
              <Text style={{ color: 'red', fontWeight: 'bold' }}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Edit expiry picker — iOS */}
      {editingExpiry && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide">
          <View style={styles.iosPickerBackdrop}>
            <View style={styles.iosPickerContainer}>
              <View style={styles.iosPickerHeader}>
                <TouchableOpacity onPress={() => { setEditingExpiry(null); setPendingEditDate(null); }}>
                  <Text style={styles.iosPickerCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => updateExpiry(editingExpiry.itemId, pendingEditDate)}>
                  <Text style={styles.iosPickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={pendingEditDate || new Date()}
                mode="date"
                display="spinner"
                onChange={(_, selected) => { if (selected) setPendingEditDate(selected); }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Edit expiry picker — Android */}
      {editingExpiry && Platform.OS === 'android' && (
        <DateTimePicker
          value={editingExpiry.currentDate}
          mode="date"
          display="default"
          onChange={({ type }, selected) => {
            if (type === 'dismissed') {
              setEditingExpiry(null);
              setPendingEditDate(null);
            } else if (selected) {
              updateExpiry(editingExpiry.itemId, selected);
            }
          }}
        />
      )}

      {/* Barcode scanner full-screen modal */}
      {showScanner && (
        <BarcodeScannerModal
          onBarcodeScanned={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa', paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },

  inputContainer: { flexDirection: 'row', marginBottom: 10 },
  input: { flex: 1, backgroundColor: 'white', padding: 15, borderRadius: 10, marginRight: 8 },
  scanButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  scanButtonText: { color: 'white', fontWeight: '600', fontSize: 14 },
  addButton: { backgroundColor: '#28a745', width: 55, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  expirySelector: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 12,
  },
  expirySelectorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  expirySelectorActive: { color: '#333', fontSize: 14, fontWeight: '500' },
  expiryClear: { color: '#999', fontSize: 16, fontWeight: '600' },
  expirySelectorPlaceholder: { color: '#aaa', fontSize: 14 },

  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8, marginBottom: 8 },

  itemCard: { flexDirection: 'row', backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, alignItems: 'flex-start' },
  itemText: { fontSize: 18, fontWeight: '500' },
  itemMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 4, gap: 8 },
  categoryLabel: { fontSize: 12, color: '#28a745', fontWeight: 'bold' },
  editExpiryButton: { marginTop: 6 },
  editExpiryText: { fontSize: 12, color: '#007AFF', fontWeight: '500' },
  deleteButton: { paddingLeft: 12, justifyContent: 'center' },

  iosPickerBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  iosPickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  iosPickerCancel: { color: '#999', fontSize: 16 },
  iosPickerDone: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
});
