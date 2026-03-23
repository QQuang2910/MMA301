import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, 
  TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform, ScrollView, Modal, Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import api from '../../src/config/api';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN', { 
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric' 
  });
};

const getStatusBadge = (status: string) => {
  const s = status?.toLowerCase();
  switch(s) {
    case 'completed': return { bg: '#F6FFED', text: '#52C41A', label: 'COMPLETED' };
    case 'cancelled': return { bg: '#FFF2F0', text: '#FF4D4F', label: 'CANCELLED' };
    case 'confirmed': return { bg: '#E6F7FF', text: '#1890FF', label: 'CONFIRMED' };
    default: return { bg: '#FFFBE6', text: '#FAAD14', label: 'PENDING' };
  }
};

export default function ManageOrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useFocusEffect(useCallback(() => { fetchOrders(); }, []));

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders');
      setOrders(res.data.data || []);
    } catch (error) {
      if (Platform.OS !== 'web') Alert.alert('Lỗi', 'Không tải được đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = (orderId: string, currentStatus: string) => {
    const updateStatus = async (newStatus: string) => {
      try {
        await api.put(`/orders/${orderId}/status`, { status: newStatus });
        fetchOrders(); // Refresh data
        if (Platform.OS === 'web') window.alert('Thành công!');
      } catch (error: any) {
        Alert.alert('Lỗi', error.response?.data?.message || 'Lỗi cập nhật');
      }
    };

    Alert.alert('Cập nhật trạng thái', 'Chọn trạng thái mới:', [
      { text: 'Confirmed', onPress: () => updateStatus('confirmed') },
      { text: 'Completed', onPress: () => updateStatus('completed') },
      { text: 'Cancelled', onPress: () => updateStatus('cancelled'), style: 'destructive' },
      { text: 'Hủy', style: 'cancel' }
    ]);
  };

  const filteredOrders = orders.filter((item) => {
    const matchesPhone = item.phone?.includes(searchQuery);
    const matchesStatus = statusFilter === '' || item.status === statusFilter;
    return matchesPhone && matchesStatus;
  });

  const renderOrderRow = ({ item }: any) => {
    const badge = getStatusBadge(item.status);
    const isPaid = item.paymentStatus === 'paid';
    const shortId = item._id.substring(item._id.length - 6).toUpperCase();

    return (
      <View style={styles.tableRow}>
        <Text style={[styles.colId, { fontWeight: 'bold' }]}>{shortId}</Text>
        <Text style={styles.colName}>{item.userId?.name || 'Guest'}</Text>
        <Text style={styles.colPhone}>{item.phone}</Text>
        <Text style={styles.colTime}>{formatDate(item.createdAt)}</Text>
        <Text style={styles.colTotal}>{item.totalAmount?.toLocaleString()}đ</Text>
        
        <View style={styles.colPay}>
           <Text style={{ 
             fontSize: 11, fontWeight: 'bold', 
             color: isPaid ? '#52C41A' : (item.paymentMethod === 'VNPAY' ? '#FF4D4F' : '#888') 
           }}>
             {isPaid ? 'PAID' : (item.paymentMethod === 'VNPAY' ? 'UNPAID' : 'CASH')}
           </Text>
        </View>

        <View style={styles.colStatus}>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        <View style={styles.colAction}>
          <TouchableOpacity onPress={() => { setSelectedOrder(item); setModalVisible(true); }}>
            <Ionicons name="eye-outline" size={20} color="#1890FF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleChangeStatus(item._id, item.status)}>
            <Ionicons name="ellipsis-vertical" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topControls}>
        <TextInput 
          style={styles.searchInput}
          placeholder="Tìm SĐT..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 40 }}>
          {['', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
            <TouchableOpacity key={f} onPress={() => setStatusFilter(f)} style={[styles.filterBtn, statusFilter === f && styles.filterBtnActive]}>
              <Text style={{ color: statusFilter === f ? '#ea580c' : '#666' }}>{f || 'Tất cả'}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView horizontal>
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.colId]}>ID</Text>
            <Text style={[styles.headerCell, styles.colName]}>Khách</Text>
            <Text style={[styles.headerCell, styles.colPhone]}>SĐT</Text>
            <Text style={[styles.headerCell, styles.colTime]}>Thời gian</Text>
            <Text style={[styles.headerCell, styles.colTotal]}>Tổng</Text>
            <Text style={[styles.headerCell, styles.colPay]}>Thanh toán</Text>
            <Text style={[styles.headerCell, styles.colStatus]}>Trạng thái</Text>
            <Text style={[styles.headerCell, styles.colAction]}>Hành động</Text>
          </View>
          <FlatList data={filteredOrders} keyExtractor={(item) => item._id} renderItem={renderOrderRow} />
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={{fontWeight:'bold'}}>Chi tiết đơn</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24}/></TouchableOpacity>
          </View>
          <ScrollView style={{padding:16}}>
            <Text>Khách: {selectedOrder?.userId?.name}</Text>
            <Text>SĐT: {selectedOrder?.phone}</Text>
            <Text>Thanh toán: {selectedOrder?.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</Text>
          </ScrollView>
        </View></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 10 },
  topControls: { marginBottom: 15 },
  searchInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8, marginBottom: 10 },
  filterBtn: { padding: 8, marginRight: 8, borderWidth: 1, borderColor: '#ddd', borderRadius: 6 },
  filterBtnActive: { borderColor: '#ea580c', backgroundColor: '#fff5f0' },
  tableContainer: { minWidth: 1100 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f5f5f5', padding: 12 },
  headerCell: { fontWeight: 'bold', color: '#333' },
  tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  colId: { width: 80 }, colName: { width: 150 }, colPhone: { width: 120 }, colTime: { width: 180 }, colTotal: { width: 120 }, colPay: { width: 120 }, colStatus: { width: 130 }, colAction: { width: 100, flexDirection: 'row', gap: 10 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#fff', borderRadius: 10, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' }
});