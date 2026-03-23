import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, 
  TouchableOpacity, TextInput, Alert, Platform, ActivityIndicator, ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../src/config/api';
import { useCart } from '../../src/context/CartContext';
import * as WebBrowser from 'expo-web-browser';

export default function CartScreen() {
  const { cart, updateQuantity, removeItem, clearCart, cartTotal } = useCart();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  
  // State mới để lưu phương thức thanh toán ('CASH' hoặc 'VNPAY')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'VNPAY'>('CASH');

  // Sửa lại hàm handleCheckout:
  const handleCheckout = async () => {
  if (cart.length === 0) return;

  if (!phone.trim()) {
    const msg = 'Vui lòng nhập số điện thoại để nhà hàng liên hệ!';
    return Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Lỗi', msg);
  }

  if (!/^[0-9]{9,11}$/.test(phone)) {
    const msg = 'Số điện thoại không hợp lệ (cần 9-11 số)!';
    return Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Lỗi', msg);
  }

  try {
    setLoading(true);

    const payload = {
      phone,
      paymentMethod,
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    };

    const response = await api.post('/orders', payload);
    console.log("BACKEND trả về: ", response.data);

    if (paymentMethod === 'VNPAY' && response.data.paymentUrl) {
      await WebBrowser.openBrowserAsync(response.data.paymentUrl);

      // Với VNPay: chưa clear cart ngay
      const msg = 'Bạn đã đóng trang thanh toán. Vui lòng kiểm tra trạng thái đơn hàng.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Thông báo', msg);

      router.push('/customer/orders' as any);
      return;
    }

    // CASH
    clearCart();
    setPhone('');

    const successMsg = 'Đặt hàng thành công! Đang chờ nhà hàng xác nhận.';
    if (Platform.OS === 'web') window.alert(successMsg);
    else Alert.alert('Thành công', successMsg);

    router.push('/customer/orders' as any);

  } catch (error: any) {
    console.log('LỖI ĐẶT HÀNG:', error);
    const errMsg = error.response?.data?.message || 'Lỗi không thể đặt hàng';
    if (Platform.OS === 'web') window.alert(errMsg);
    else Alert.alert('Lỗi', errMsg);
  } finally {
    setLoading(false);
  }
};

  const renderCartItem = ({ item }: any) => {
    return (
      <View style={styles.cartItem}>
        {item.image?.url ? (
          <Image source={{ uri: item.image.url }} style={styles.itemImg} resizeMode="cover" />
        ) : (
          <View style={[styles.itemImg, styles.imgPlaceholder]}>
            <Ionicons name="fast-food-outline" size={24} color="#aaa" />
          </View>
        )}

        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.itemPrice}>{(item.price * item.quantity).toLocaleString()}đ</Text>
          
          <View style={styles.actionRow}>
            <View style={styles.qtyBox}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.productId, 'dec')}>
                <Ionicons name="remove" size={16} color="#333" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.productId, 'inc')}>
                <Ionicons name="add" size={16} color="#333" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.deleteBtn} onPress={() => removeItem(item.productId)}>
              <Ionicons name="trash-outline" size={18} color="#ff4d4f" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={100} color="#ccc" />
        <Text style={styles.emptyText}>Giỏ hàng của bạn đang trống</Text>
        <TouchableOpacity style={styles.goHomeBtn} onPress={() => router.push('/customer/home' as any)}>
          <Text style={styles.goHomeText}>Đi chọn món ngay</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cart}
        keyExtractor={(item) => item.productId}
        renderItem={renderCartItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <View style={styles.phoneBox}>
          <Ionicons name="call-outline" size={20} color="#888" style={{ marginRight: 8 }} />
          <TextInput 
            style={[styles.phoneInput, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
            placeholder="Nhập SĐT nhận hàng (Bắt buộc)..."
            value={phone}
            onChangeText={setPhone}
            keyboardType="numeric"
            maxLength={11}
          />
        </View>

        {/* --- KHU VỰC CHỌN PHƯƠNG THỨC THANH TOÁN --- */}
        <Text style={styles.paymentTitle}>Phương thức thanh toán:</Text>
        <View style={styles.paymentMethods}>
          {/* Nút Tiền mặt */}
          <TouchableOpacity 
            style={[styles.paymentBtn, paymentMethod === 'CASH' && styles.paymentBtnActive]}
            onPress={() => setPaymentMethod('CASH')}
          >
            <Ionicons name="cash-outline" size={20} color={paymentMethod === 'CASH' ? '#ea580c' : '#666'} />
            <Text style={[styles.paymentText, paymentMethod === 'CASH' && styles.paymentTextActive]}>Tiền mặt</Text>
            {paymentMethod === 'CASH' && <Ionicons name="checkmark-circle" size={18} color="#ea580c" style={styles.checkIcon} />}
          </TouchableOpacity>

          {/* Nút VNPay */}
          <TouchableOpacity 
            style={[styles.paymentBtn, paymentMethod === 'VNPAY' && styles.paymentBtnActive]}
            onPress={() => setPaymentMethod('VNPAY')}
          >
            <Ionicons name="card-outline" size={20} color={paymentMethod === 'VNPAY' ? '#ea580c' : '#666'} />
            <Text style={[styles.paymentText, paymentMethod === 'VNPAY' && styles.paymentTextActive]}>VNPay</Text>
            {paymentMethod === 'VNPAY' && <Ionicons name="checkmark-circle" size={18} color="#ea580c" style={styles.checkIcon} />}
          </TouchableOpacity>
        </View>
        {/* ------------------------------------------ */}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
          <Text style={styles.totalValue}>{cartTotal.toLocaleString()}đ</Text>
        </View>

        <TouchableOpacity 
          style={[styles.checkoutBtn, loading && styles.checkoutBtnDisabled]} 
          onPress={handleCheckout}
          disabled={loading}
        >
          {loading ? (
             <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.checkoutBtnText}>ĐẶT HÀNG NGAY</Text>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdf8f5' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fdf8f5' },
  emptyText: { fontSize: 18, color: '#888', marginTop: 16, marginBottom: 24 },
  goHomeBtn: { backgroundColor: '#ea580c', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  goHomeText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  listContainer: { padding: 16, paddingBottom: 20 },
  cartItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1 },
  itemImg: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#f5f5f5' },
  imgPlaceholder: { justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  itemInfo: { flex: 1, marginLeft: 16, justifyContent: 'space-between' },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  itemPrice: { fontSize: 16, fontWeight: 'bold', color: '#ea580c', marginTop: 4 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  qtyBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8, paddingHorizontal: 4, paddingVertical: 2 },
  qtyBtn: { padding: 4 },
  qtyText: { marginHorizontal: 12, fontSize: 16, fontWeight: 'bold' },
  deleteBtn: { padding: 6, backgroundColor: '#fffbfb', borderWidth: 1, borderColor: '#ffe8e6', borderRadius: 6 },
  
  footer: { backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#eee', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1 },
  phoneBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, height: 48, marginBottom: 12 },
  phoneInput: { flex: 1, fontSize: 15 },
  
  // Styles mới cho khu vực thanh toán
  paymentTitle: { fontSize: 14, fontWeight: 'bold', color: '#444', marginBottom: 8 },
  paymentMethods: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  paymentBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: '#f9f9f9', position: 'relative' },
  paymentBtnActive: { borderColor: '#ea580c', backgroundColor: '#fff5f0' },
  paymentText: { marginLeft: 6, fontSize: 14, color: '#666', fontWeight: '500' },
  paymentTextActive: { color: '#ea580c', fontWeight: 'bold' },
  checkIcon: { position: 'absolute', right: 8 },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  totalLabel: { fontSize: 16, color: '#555', fontWeight: 'bold' },
  totalValue: { fontSize: 22, color: '#d9363e', fontWeight: 'bold' },
  checkoutBtn: { backgroundColor: '#ea580c', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  checkoutBtnDisabled: { opacity: 0.7 },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});