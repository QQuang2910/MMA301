import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, 
  TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform, ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import api from '../../src/config/api';

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

export default function ManageCustomersScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState(''); // Rỗng là Tất cả

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [])
  );

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data.data || []);
    } catch (error) {
      console.log('Lỗi lấy khách hàng:', error);
      if (Platform.OS !== 'web') Alert.alert('Lỗi', 'Không thể tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    const confirmDelete = async () => {
      try {
        await api.delete(`/users/${id}`);
        setUsers(prev => prev.filter(u => u._id !== id));
        if (Platform.OS === 'web') window.alert('Đã xóa tài khoản thành công!');
        else Alert.alert('Thành công', 'Đã xóa tài khoản!');
      } catch (error) {
        if (Platform.OS === 'web') window.alert('Không thể xóa tài khoản này');
        else Alert.alert('Lỗi', 'Không thể xóa tài khoản này');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Bạn có chắc chắn muốn xóa khách hàng "${name}" không?`)) confirmDelete();
    } else {
      Alert.alert('Xác nhận xóa', `Bạn có chắc chắn muốn xóa khách hàng "${name}" không?`, [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: confirmDelete }
      ]);
    }
  };

  // Logic lọc kết hợp (Tìm Tên/Email và Lọc Role) - Sao chép y hệt web của bạn
  const filteredUsers = users.filter((item) => {
    const keyword = searchQuery.toLowerCase();
    const matchesSearch = 
      item.name?.toLowerCase().includes(keyword) || 
      item.email?.toLowerCase().includes(keyword);
    
    const matchesRole = roleFilter === '' || item.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const renderUserRow = ({ item }: any) => {
    const isAdmin = item.role === 'admin';

    return (
      <View style={styles.tableRow}>
        <Text style={[styles.cell, styles.colName, { fontWeight: 'bold' }]}>{item.name}</Text>
        <Text style={[styles.cell, styles.colUsername, { color: '#888' }]}>@{item.username}</Text>
        <Text style={[styles.cell, styles.colEmail]}>{item.email}</Text>
        
        <View style={styles.colRole}>
          <View style={[styles.badge, { backgroundColor: isAdmin ? '#FFF7E6' : '#E6F7FF' }]}>
            <Ionicons name={isAdmin ? "star" : "person"} size={12} color={isAdmin ? "#FA8C16" : "#1890FF"} style={{ marginRight: 4 }} />
            <Text style={[styles.badgeText, { color: isAdmin ? '#FA8C16' : '#1890FF' }]}>
              {item.role?.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={[styles.cell, styles.colTime]}>{formatDate(item.createdAt)}</Text>
        
        <View style={styles.colAction}>
          {!isAdmin ? (
            <TouchableOpacity style={styles.iconBtnTrash} onPress={() => handleDelete(item._id, item.name)}>
              <Ionicons name="trash-outline" size={18} color="#ff4d4f" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 32, height: 32 }} /> /* Giữ chỗ trống để không bị xô lệch cột */
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color="#ea580c" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.topControls}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#888" style={{ marginLeft: 12 }} />
          <TextInput 
            style={[styles.searchInput, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
            placeholder="Tìm theo tên hoặc email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterGroup}>
          {[
            { id: '', label: 'Tất cả vai trò' },
            { id: 'customer', label: 'Khách hàng' },
            { id: 'admin', label: 'Quản trị viên' }
          ].map(f => (
            <TouchableOpacity 
              key={f.id} 
              style={[styles.filterBtn, roleFilter === f.id && styles.filterBtnActive]}
              onPress={() => setRoleFilter(f.id)}
            >
              <Text style={[styles.filterBtnText, roleFilter === f.id && styles.filterBtnTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView horizontal contentContainerStyle={styles.scrollX}>
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.colName]}>Tên khách hàng</Text>
            <Text style={[styles.headerCell, styles.colUsername]}>Tên đăng nhập</Text>
            <Text style={[styles.headerCell, styles.colEmail]}>Email</Text>
            <Text style={[styles.headerCell, styles.colRole]}>Vai trò</Text>
            <Text style={[styles.headerCell, styles.colTime]}>Ngày tham gia</Text>
            <Text style={[styles.headerCell, styles.colAction]}>Hành động</Text>
          </View>

          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item._id}
            renderItem={renderUserRow}
            ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 30, color: '#888' }}>Không tìm thấy khách hàng nào!</Text>}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  
  topControls: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  searchBox: { flexDirection: 'row', backgroundColor: '#fff', alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', width: 300, height: 40 },
  searchInput: { flex: 1, paddingHorizontal: 10 },
  filterGroup: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#f9f9f9' },
  filterBtnActive: { borderColor: '#ea580c', backgroundColor: '#fff5f0' },
  filterBtnText: { color: '#666', fontSize: 13 },
  filterBtnTextActive: { color: '#ea580c', fontWeight: 'bold' },

  scrollX: { paddingBottom: 20 },
  tableContainer: { minWidth: 900, flex: 1 }, 
  
  tableHeader: { flexDirection: 'row', backgroundColor: '#FFE8D6', paddingVertical: 14, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  headerCell: { color: '#D9534F', fontWeight: 'bold', fontSize: 14 },
  
  tableRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingVertical: 14 },
  cell: { color: '#333', fontSize: 14 },
  
  colName: { flex: 1.5, paddingLeft: 16 },
  colUsername: { flex: 1 },
  colEmail: { flex: 2 },
  colRole: { flex: 1, flexDirection: 'row' },
  colTime: { flex: 1 },
  colAction: { flex: 0.8 },

  badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  iconBtnTrash: { padding: 6, borderWidth: 1, borderColor: '#ffe8e6', borderRadius: 4, backgroundColor: '#fffbfb', alignSelf: 'flex-start' }
});