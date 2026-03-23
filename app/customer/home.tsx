import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, 
  TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import api from '../../src/config/api';
import { useCart } from '../../src/context/CartContext'; // Kéo Giỏ hàng vào xài

export default function CustomerHomeScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('food'); // Mặc định là 'food' giống web của bạn

  // Lôi "bảo bối" Thêm vào giỏ từ Context ra
  const { addToCart } = useCart();

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [])
  );

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      // CHỈ LẤY CÁC MÓN ĐANG MỞ BÁN (isAvailable === true)
      const availableProducts = (res.data.data || []).filter((p: any) => p.isAvailable === true);
      setProducts(availableProducts);
    } catch (error) {
      console.log('Lỗi lấy menu:', error);
      if (Platform.OS !== 'web') Alert.alert('Lỗi', 'Không thể tải danh sách món ăn');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item: any) => {
    addToCart(item); // Ném vào giỏ
    // Hiện thông báo nhỏ gọn (Web xài alert tạm, Mobile thì badge là đủ hiểu)
    if (Platform.OS === 'web') {
      // Để tránh spam thông báo trên web mỗi lần ấn thêm, có thể comment dòng dưới lại nếu muốn mượt
      // window.alert(`Đã thêm ${item.name} vào giỏ hàng`); 
    }
  };

  // Lọc theo Category + Tìm kiếm tên
  const filteredProducts = products.filter(p => 
    p.category === activeCategory &&
    p.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render từng Thẻ món ăn (dạng Lưới 2 cột)
  const renderProductCard = ({ item }: any) => {
    return (
      <View style={styles.card}>
        {item.image?.url ? (
          <Image source={{ uri: item.image.url }} style={styles.cardImg} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImg, styles.imgPlaceholder]}>
            <Ionicons name="fast-food-outline" size={40} color="#ccc" />
          </View>
        )}

        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description || 'Món ăn cực ngon'}</Text>
          
          <View style={styles.cardFooter}>
            <Text style={styles.cardPrice}>{item.price?.toLocaleString()}đ</Text>
            
            <TouchableOpacity 
              style={styles.addBtn} 
              onPress={() => handleAddToCart(item)}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color="#ea580c" /></View>;
  }

  return (
    <View style={styles.container}>
      {/* KHUNG TÌM KIẾM & LỌC DANH MỤC */}
      <View style={styles.headerArea}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#888" style={{ marginLeft: 12 }} />
          <TextInput 
            style={[styles.searchInput, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
            placeholder="Bạn muốn ăn gì hôm nay?"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.categoryRow}>
          <TouchableOpacity 
            style={[styles.catBtn, activeCategory === 'food' && styles.catBtnActive]}
            onPress={() => setActiveCategory('food')}
          >
            <Ionicons name="fast-food" size={18} color={activeCategory === 'food' ? '#fff' : '#666'} />
            <Text style={[styles.catBtnText, activeCategory === 'food' && styles.catBtnTextActive]}>Đồ ăn</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.catBtn, activeCategory === 'drink' && styles.catBtnActive]}
            onPress={() => setActiveCategory('drink')}
          >
            <Ionicons name="cafe" size={18} color={activeCategory === 'drink' ? '#fff' : '#666'} />
            <Text style={[styles.catBtnText, activeCategory === 'drink' && styles.catBtnTextActive]}>Đồ uống</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* DANH SÁCH MÓN (LƯỚI 2 CỘT) */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item._id}
        renderItem={renderProductCard}
        numColumns={2} // Chia 2 cột
        columnWrapperStyle={styles.rowWrapper} // Căn đều 2 cột
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, color: '#888', fontSize: 16 }}>Hiện chưa có món nào trong mục này!</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdf8f5' },
  
  headerArea: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  searchBox: { flexDirection: 'row', backgroundColor: '#f5f5f5', alignItems: 'center', borderRadius: 12, height: 48, marginBottom: 16 },
  searchInput: { flex: 1, paddingHorizontal: 12, fontSize: 16 },
  
  categoryRow: { flexDirection: 'row', gap: 12 },
  catBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#f5f5f5', gap: 8 },
  catBtnActive: { backgroundColor: '#ea580c' },
  catBtnText: { fontSize: 16, fontWeight: 'bold', color: '#666' },
  catBtnTextActive: { color: '#fff' },

  listContainer: { padding: 16, paddingBottom: 40 },
  rowWrapper: { justifyContent: 'space-between', marginBottom: 16 }, // Đẩy 2 thẻ ra 2 bên lề
  
  card: { 
    width: '48%', // Chiếm gần nửa màn hình
    backgroundColor: '#fff', 
    borderRadius: 16, 
    overflow: 'hidden',
    elevation: 3, 
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1 
  },
  cardImg: { width: '100%', aspectRatio: 1, backgroundColor: '#f5f5f5' },
  imgPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  
  cardBody: { padding: 12 },
  cardName: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  cardDesc: { fontSize: 12, color: '#888', marginBottom: 12, minHeight: 34 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardPrice: { fontSize: 16, fontWeight: 'bold', color: '#ea580c' },
  addBtn: { backgroundColor: '#ea580c', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }
});