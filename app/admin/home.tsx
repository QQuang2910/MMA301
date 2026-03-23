import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, 
  TouchableOpacity, TextInput, Switch, ActivityIndicator, Alert, Platform, ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import api from '../../src/config/api';

const getImageUrl = (imageObj: any) => {
  if (!imageObj) return '';
  return imageObj.url || ''; 
};

export default function ManageProductScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); 

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [])
  );

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products'); 
      setProducts(response.data.data || []); 
    } catch (error) {
      console.log('Lỗi lấy món ăn:', error);
      if (Platform.OS !== 'web') Alert.alert('Lỗi', 'Không thể tải danh sách món ăn');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    const confirmDelete = async () => {
      try {
        await api.delete(`/products/${id}`); 
        setProducts(prev => prev.filter(item => item._id !== id)); 
        if (Platform.OS === 'web') window.alert('Đã xóa thành công!');
        else Alert.alert('Thành công', 'Đã xóa món ăn!');
      } catch (error) {
        if (Platform.OS === 'web') window.alert('Không thể xóa món này');
        else Alert.alert('Lỗi', 'Không thể xóa món ăn này');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Bạn có chắc chắn muốn xóa món "${name}" không?`)) confirmDelete();
    } else {
      Alert.alert('Xác nhận xóa', `Bạn có chắc chắn muốn xóa món "${name}" không?`, [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: confirmDelete }
      ]);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean, name: string) => {
    const newStatus = !currentStatus;
    
    setProducts(prev => prev.map(item => 
      item._id === id ? { ...item, isAvailable: newStatus } : item
    ));

    try {
      await api.put(`/products/${id}`, { isAvailable: newStatus });
      const message = newStatus ? `Món "${name}" CÒN HÀNG` : `Món "${name}" HẾT HÀNG`;
      if (Platform.OS === 'web') window.alert(message);
      else Alert.alert('Cập nhật trạng thái', message);
    } catch (error) {
      setProducts(prev => prev.map(item => 
        item._id === id ? { ...item, isAvailable: currentStatus } : item
      ));
      if (Platform.OS === 'web') window.alert('Lỗi cập nhật trạng thái');
      else Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
    }
  };

  const filteredProducts = products.filter((item) => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const itemCat = item.category?.toLowerCase() || 'food';
    const matchesFilter = activeFilter === 'ALL' || itemCat === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const renderProductRow = ({ item }: any) => {
    const finalImageUrl = getImageUrl(item.image);
    const isFood = item.category !== 'drink';
    const isActive = item.isAvailable !== undefined ? item.isAvailable : true;

    return (
      <View style={styles.tableRow}>
        <View style={[styles.colImage, { paddingLeft: 16 }]}>
          {finalImageUrl ? (
            <Image source={{ uri: finalImageUrl }} style={styles.imgThumb} />
          ) : (
            <View style={[styles.imgThumb, styles.imgPlaceholder]}>
              <Ionicons name="fast-food-outline" size={20} color="#aaa" />
            </View>
          )}
        </View>

        <Text style={[styles.cell, styles.colName, { fontWeight: 'bold' }]} numberOfLines={2}>
          {item.name}
        </Text>
        
        <Text style={[styles.cell, styles.colPrice]}>
          {item.price?.toLocaleString()}đ
        </Text>
        
        <View style={styles.colCategory}>
          <View style={[styles.badge, { backgroundColor: isFood ? '#FFF7E6' : '#E6F7FF' }]}>
            <Text style={[styles.badgeText, { color: isFood ? '#FA8C16' : '#1890FF' }]}>
              {isFood ? 'FOOD' : 'DRINK'}
            </Text>
          </View>
        </View>

        <View style={styles.colStatus}>
          <Switch 
            value={isActive} 
            onValueChange={() => handleToggleStatus(item._id, isActive, item.name)}
            trackColor={{ false: '#d9d9d9', true: '#ea580c' }}
            thumbColor={'#fff'}
          />
        </View>

        <View style={styles.colAction}>
          <TouchableOpacity 
            style={styles.iconBtn}
            onPress={() => router.push(`/admin/productForm?id=${item._id}` as any)}
          >
            <Ionicons name="pencil-outline" size={18} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconBtnTrash} 
            onPress={() => handleDelete(item._id, item.name)}
          >
            <Ionicons name="trash-outline" size={18} color="#ff4d4f" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color="#ea580c" /></View>;
  }

  return (
    <View style={styles.container}>
      {/* TOOLBAR */}
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/admin/productForm' as any)}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Thêm món mới</Text>
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#888" style={{ marginLeft: 12 }} />
          <TextInput 
            style={[styles.searchInput, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
            placeholder="Tìm tên món..." 
            value={searchQuery} 
            onChangeText={setSearchQuery} 
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterGroup}>
          {[
            { id: 'ALL', label: 'Tất cả danh mục' }, 
            { id: 'food', label: 'Foods (Đồ ăn)' }, 
            { id: 'drink', label: 'Drinks (Đồ uống)' }
          ].map(f => (
            <TouchableOpacity 
              key={f.id}
              style={[styles.filterBtn, activeFilter === f.id && styles.filterBtnActive]}
              onPress={() => setActiveFilter(f.id)}
            >
              <Text style={[styles.filterBtnText, activeFilter === f.id && styles.filterBtnTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* TABLE */}
      <ScrollView horizontal contentContainerStyle={styles.scrollX}>
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.colImage, { paddingLeft: 16 }]}>Ảnh</Text>
            <Text style={[styles.headerCell, styles.colName]}>Tên món</Text>
            <Text style={[styles.headerCell, styles.colPrice]}>Giá bán</Text>
            <Text style={[styles.headerCell, styles.colCategory]}>Danh mục</Text>
            <Text style={[styles.headerCell, styles.colStatus]}>Trạng thái</Text>
            <Text style={[styles.headerCell, styles.colAction]}>Hành động</Text>
          </View>

          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item._id}
            renderItem={renderProductRow}
            ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 30, color: '#888' }}>Không tìm thấy món ăn nào!</Text>}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  
  topControls: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  addBtn: { flexDirection: 'row', backgroundColor: '#ea580c', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 6 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  
  searchBox: { flexDirection: 'row', backgroundColor: '#fff', alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', width: 250, height: 40 },
  searchInput: { flex: 1, paddingHorizontal: 10 },
  
  filterGroup: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#f9f9f9' },
  filterBtnActive: { borderColor: '#ea580c', backgroundColor: '#fff5f0' },
  filterBtnText: { color: '#666', fontSize: 13 },
  filterBtnTextActive: { color: '#ea580c', fontWeight: 'bold' },

  scrollX: { paddingBottom: 20 },
  tableContainer: { minWidth: 900, flex: 1 }, 
  
  tableHeader: { flexDirection: 'row', backgroundColor: '#FFE8D6', paddingVertical: 14, borderTopLeftRadius: 8, borderTopRightRadius: 8, alignItems: 'center' },
  headerCell: { color: '#D9534F', fontWeight: 'bold', fontSize: 14 },
  
  tableRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingVertical: 12 },
  cell: { color: '#333', fontSize: 14 },
  
  colImage: { flex: 0.8 },
  colName: { flex: 2, paddingRight: 10 },
  colPrice: { flex: 1 },
  colCategory: { flex: 1 },
  colStatus: { flex: 1 },
  colAction: { flex: 1, flexDirection: 'row', gap: 8 },

  imgThumb: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#f5f5f5' },
  imgPlaceholder: { justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  
  iconBtn: { padding: 6, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 4, backgroundColor: '#fff' },
  iconBtnTrash: { padding: 6, borderWidth: 1, borderColor: '#ffe8e6', borderRadius: 4, backgroundColor: '#fffbfb' }
});