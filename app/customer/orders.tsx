import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, Alert, Platform, Modal, Image, ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import api from '../../src/config/api';

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN', { 
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric' 
  });
};

const getStatusStyle = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return { bg: '#FFFBE6', text: '#FAAD14', icon: 'time-outline', label: 'CHỜ XÁC NHẬN' };
    case 'confirmed':
      return { bg: '#E6F7FF', text: '#1890FF', icon: 'checkmark-circle-outline', label: 'ĐÃ XÁC NHẬN' };
    case 'completed':
      return { bg: '#F6FFED', text: '#52C41A', icon: 'checkmark-done-circle-outline', label: 'HOÀN THÀNH' };
    case 'cancelled':
      return { bg: '#FFF2F0', text: '#FF4D4F', icon: 'close-circle-outline', label: 'ĐÃ HỦY' };
    default:
      return { bg: '#F5F5F5', text: '#555', icon: 'help-circle-outline', label: 'KHÔNG XÁC ĐỊNH' };
  }
};

const getPaymentStyle = (method: string, status: string) => {
  if (method === 'CASH') {
    return { bg: '#F5F5F5', text: '#8C8C8C', label: 'Tiền mặt' };
  }
  return status === 'paid' 
    ? { bg: '#F6FFED', text: '#52C41A', label: 'Đã thanh toán (VNPay)' }
    : { bg: '#FFF1F0', text: '#FF4D4F', label: 'Chưa thanh toán (VNPay)' };
};

export default function CustomerOrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      fetchMyOrders();
    }, [])
  );

  const fetchMyOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders/my');
      setOrders(res.data.data || []);
    } catch (error) {
      console.log('Lỗi tải đơn hàng:', error);
      if (Platform.OS !== 'web') Alert.alert('Lỗi', 'Không thể tải lịch sử đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const openOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const renderOrderCard = ({ item }: any) => {
    const statusInfo = getStatusStyle(item.status);
    const payInfo = getPaymentStyle(item.paymentMethod, item.paymentStatus);
    const shortId = item._id.substring(item._id.length - 6).toUpperCase();

    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.7} 
        onPress={() => openOrderDetails(item)}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderId}>Mã đơn: #{shortId}</Text>
            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={[styles.badge, { backgroundColor: statusInfo.bg, marginBottom: 4 }]}>
              <Ionicons name={statusInfo.icon as any} size={12} color={statusInfo.text} style={{ marginRight: 4 }} />
              <Text style={[styles.badgeText, { color: statusInfo.text }]}>{statusInfo.label}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: payInfo.bg }]}>
              <Text style={[styles.badgeText, { color: payInfo.text, fontSize: 10 }]}>{payInfo.label}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <Text style={styles.itemCount}>{item.items?.length || 0} sản phẩm</Text>
          <Text style={styles.totalAmount}>{item.totalAmount?.toLocaleString()}đ</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#ea580c" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={80} color="#ccc" />
              <Text style={styles.emptyText}>Bạn chưa có đơn hàng nào.</Text>
            </View>
          }
        />
      )}

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết đơn hàng</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedOrder ? (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}><Text style={{ fontWeight: 'bold' }}>SĐT:</Text> {selectedOrder.phone}</Text>
                  <Text style={styles.infoText}><Text style={{ fontWeight: 'bold' }}>Phương thức:</Text> {selectedOrder.paymentMethod}</Text>
                  <Text style={styles.infoText}>
                    <Text style={{ fontWeight: 'bold' }}>Thanh toán:</Text> {selectedOrder.paymentStatus === 'paid' ? 'Đã trả tiền' : 'Chưa trả tiền'}
                  </Text>
                </View>

                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Danh sách món</Text>

                {selectedOrder.items?.map((item: any, index: number) => (
                  <View key={index} style={styles.productRow}>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{item.productId?.name || "Món đã xóa"}</Text>
                      <View style={styles.productPriceRow}>
                        <Text style={styles.productQty}>SL: {item.quantity}</Text>
                        <Text style={styles.productPrice}>{(item.price * item.quantity).toLocaleString()}đ</Text>
                      </View>
                    </View>
                  </View>
                ))}

                <View style={styles.divider} />
                <View style={styles.totalBox}>
                  <Text style={styles.totalLabel}>Tổng cộng:</Text>
                  <Text style={styles.finalTotal}>{selectedOrder.totalAmount?.toLocaleString()}đ</Text>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdf8f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, color: '#888', marginTop: 16 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  orderId: { fontSize: 15, fontWeight: 'bold' },
  orderDate: { fontSize: 12, color: '#888' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemCount: { color: '#666' },
  totalAmount: { fontSize: 17, fontWeight: 'bold', color: '#ea580c' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalBody: { padding: 16 },
  infoBox: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, gap: 4 },
  infoText: { fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  productRow: { marginBottom: 8, padding: 8, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  productInfo: { flex: 1 },
  productName: { fontWeight: 'bold' },
  productPriceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  productQty: { color: '#666' },
  productPrice: { fontWeight: 'bold', color: '#ea580c' },
  totalBox: { alignItems: 'flex-end', marginBottom: 30 },
  totalLabel: { fontSize: 14 },
  finalTotal: { fontSize: 22, fontWeight: 'bold', color: '#ea580c' }
});