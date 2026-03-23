import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Image, Switch, ScrollView, Alert, ActivityIndicator, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api from '../../src/config/api';

export default function ProductFormScreen() {
  const { id } = useLocalSearchParams(); 
  const isEditing = !!id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState(''); 
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('food'); 
  const [isAvailable, setIsAvailable] = useState(true); 
  
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [webFile, setWebFile] = useState<any>(null); 
  const [existingImage, setExistingImage] = useState<any>({ public_id: '', url: '' }); 
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // BỘ DỌN RÁC TỰ ĐỘNG ĐƯỢC THÊM VÀO ĐÂY
  useEffect(() => {
    if (isEditing && id) {
      // Nếu có ID -> Đang Sửa -> Gọi API lấy dữ liệu cũ đổ vào
      fetchProductDetails();
    } else {
      // Nếu KHÔNG có ID -> Đang Thêm mới -> Xóa trắng mọi thứ!
      setName('');
      setDescription('');
      setPrice('');
      setCategory('food');
      setIsAvailable(true);
      setImageUri(null);
      setWebFile(null);
      setExistingImage({ public_id: '', url: '' });
    }
  }, [id, isEditing]); // Chạy lại hàm này mỗi khi URL có sự thay đổi ID

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products/${id}`);
      const product = res.data.data || res.data;
      
      setName(product.name);
      setDescription(product.description || '');
      setPrice(product.price.toString());
      setCategory(product.category || 'food');
      setIsAvailable(product.isAvailable !== undefined ? product.isAvailable : true);
      
      if (product.image) {
        setExistingImage(product.image);
      }
    } catch (error) {
      console.log('Lỗi lấy dữ liệu sửa:', error);
      if (Platform.OS === 'web') window.alert('Không thể lấy thông tin món ăn');
      else Alert.alert('Lỗi', 'Không thể lấy thông tin món ăn');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      if (Platform.OS === 'web' && result.assets[0].file) {
        setWebFile(result.assets[0].file);
      }
    }
  };

  const handleSave = async () => {
    if (!name || !price) {
      if (Platform.OS === 'web') window.alert('Vui lòng nhập tên và giá món ăn!');
      else Alert.alert('Lỗi', 'Vui lòng nhập tên và giá món ăn!');
      return;
    }

    try {
      setSaving(true);
      
      let finalImage = { ...existingImage };

      if (imageUri) {
        const formData = new FormData();
        if (Platform.OS === 'web' && webFile) {
          formData.append('file', webFile);
        } else {
          formData.append('file', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'upload.jpg',
          } as any); 
        }

        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        finalImage = {
          public_id: uploadRes.data.public_id,
          url: uploadRes.data.secure_url || uploadRes.data.url
        };
      }

      const productData = {
        name,
        description,
        price: Number(price),
        category, 
        isAvailable,
        image: finalImage, 
      };

      if (isEditing) {
        await api.put(`/products/${id}`, productData);
        if (Platform.OS === 'web') window.alert('Cập nhật thành công!');
        else Alert.alert('Thành công', 'Đã cập nhật món ăn!');
      } else {
        await api.post('/products', productData);
        if (Platform.OS === 'web') window.alert('Thêm món mới thành công!');
        else Alert.alert('Thành công', 'Đã thêm món mới!');
      }
      
      router.replace('/admin/home');

    } catch (error: any) {
      console.log('Lỗi khi Save:', error);
      const errMsg = error.response?.data?.message || 'Có lỗi xảy ra khi lưu món ăn';
      if (Platform.OS === 'web') window.alert(errMsg);
      else Alert.alert('Lỗi', errMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#ea580c" style={{ flex: 1 }} />;
  
  const displayImageUrl = imageUri || existingImage?.url || (existingImage?.public_id ? `https://res.cloudinary.com/dpjpdeql3/image/upload/c_scale,w_500/${existingImage.public_id}` : '');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Cập nhật món' : 'Thêm món mới'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.formContainer}>
        <View style={styles.imageSection}>
          <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
            {displayImageUrl ? (
              <Image source={{ uri: displayImageUrl }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderBox}>
                <Ionicons name="camera-outline" size={40} color="#aaa" />
                <Text style={styles.placeholderText}>Bấm để chọn ảnh</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tên món ăn <Text style={{color: 'red'}}>*</Text></Text>
          <TextInput style={styles.input} placeholder="VD: Matcha Latte" value={name} onChangeText={setName} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Giá tiền (VNĐ) <Text style={{color: 'red'}}>*</Text></Text>
          <TextInput style={styles.input} placeholder="VD: 50000" value={price} onChangeText={setPrice} keyboardType="numeric" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mô tả</Text>
          <TextInput 
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
            placeholder="Nhập mô tả món ăn..." 
            value={description} 
            onChangeText={setDescription} 
            multiline 
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Danh mục</Text>
          <View style={styles.categoryRow}>
            <TouchableOpacity style={[styles.catBtn, category === 'food' && styles.catBtnActive]} onPress={() => setCategory('food')}>
              <Text style={[styles.catText, category === 'food' && styles.catTextActive]}>Đồ ăn</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.catBtn, category === 'drink' && styles.catBtnActive]} onPress={() => setCategory('drink')}>
              <Text style={[styles.catText, category === 'drink' && styles.catTextActive]}>Đồ uống</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.inputGroup, styles.statusRow]}>
          <View>
            <Text style={styles.label}>Trạng thái</Text>
            <Text style={styles.subLabel}>{isAvailable ? 'Đang mở bán' : 'Hết hàng / Tạm ẩn'}</Text>
          </View>
          <Switch value={isAvailable} onValueChange={setIsAvailable} trackColor={{ false: '#d9d9d9', true: '#ea580c' }} thumbColor={'#fff'} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{isEditing ? 'Lưu thay đổi' : 'Tạo món mới'}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#333' },
  formContainer: { padding: 20, paddingBottom: 100 },
  imageSection: { alignItems: 'center', marginBottom: 24 },
  imagePickerBtn: { width: 150, height: 150, borderRadius: 16, overflow: 'hidden', backgroundColor: '#f5f5f5', borderWidth: 2, borderColor: '#eee', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholderBox: { alignItems: 'center' },
  placeholderText: { color: '#888', marginTop: 8, fontWeight: '500' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  subLabel: { fontSize: 13, color: '#888', marginTop: 2 },
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 14, fontSize: 16 },
  categoryRow: { flexDirection: 'row', gap: 12 },
  catBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0', alignItems: 'center', backgroundColor: '#f9f9f9' },
  catBtnActive: { backgroundColor: '#ea580c', borderColor: '#ea580c' },
  catText: { fontSize: 15, fontWeight: 'bold', color: '#666' },
  catTextActive: { color: '#fff' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 16, borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', elevation: 10 },
  saveBtn: { backgroundColor: '#ea580c', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});