import { useEffect, useState } from 'react'; import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import { router } from 'expo-router';
import { Camera, Plus, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { categoriesService } from '@/lib/api/services/categories';
import { productsService } from '@/lib/api/services/products';
import { supabase } from '@/lib/supabase';
import { COLORS } from '@/constants/colors';
import { StitchHeader, StitchPage, StitchPrimaryButton, StitchSecondaryButton } from '@/components/design';

export default function AddProductScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('new');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const data = await categoriesService.findAll();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      setCategories([]);
    }
  }

  async function pickImage() {
    if (images.length >= 5) {
      Alert.alert('Image limit', 'You can upload up to 5 images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (result.canceled) return;

    await uploadImage(result.assets[0]);
  }

  async function uploadImage(asset: ImagePicker.ImagePickerAsset) {
    if (!asset.base64) return;

    try {
      setUploading(true);
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error('You must be logged in.');

      const ext = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `products/${data.user.id}/${Date.now()}.${ext}`;

      const { error } = await supabase.storage.from('products').upload(path, decode(asset.base64), {
        contentType: asset.mimeType || 'image/jpeg',
        upsert: true,
      });

      if (error) throw error;

      const { data: publicData } = supabase.storage.from('products').getPublicUrl(path);
      setImages((current) => [...current, publicData.publicUrl]);
    } catch (error: any) {
      Alert.alert('Upload error', error?.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index: number) {
    setImages((current) => current.filter((_, idx) => idx !== index));
  }

  async function saveProduct() {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please add a product title.');
      return;
    }

    if (!price.trim()) {
      Alert.alert('Missing price', 'Please add a product price.');
      return;
    }

    setSaving(true);
    try {
      await productsService.create({
        title: title.trim(),
        description: description.trim(),
        categoryId: selectedCategory || undefined,
        condition: condition as any,
        buyNowPrice: price,
        images,
      });

      Alert.alert('Product created', 'Your item is now ready for listing.', [
        { text: 'View inventory', onPress: () => router.replace('/seller/inventory') },
      ]);
    } catch (error: any) {
      Alert.alert('Unable to save product', error?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <StitchPage contentStyle={{ paddingBottom: 120 }}>
      <StitchHeader title="List New Item" onBack={() => router.back()} />

      <View style={styles.contentPad}>
        <Text style={styles.sectionTitle}>Add up to 5 photos</Text>
        <Text style={styles.sectionSubtitle}>The first image becomes your cover photo.</Text>

        <View style={styles.imageRow}>
          {images.map((uri, index) => (
            <View key={`${uri}-${index}`} style={styles.imageTile}>
              <Image source={{ uri }} style={styles.imagePreview} />
              <Pressable style={styles.removeBtn} onPress={() => removeImage(index)}>
                <X size={12} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}

          {images.length < 5 ? (
            <Pressable style={styles.imageUpload} onPress={pickImage}>
              {uploading ? <Text style={styles.uploadingText}>...</Text> : <Camera size={20} color={COLORS.primaryBlue} />}
              <Text style={styles.uploadLabel}>{uploading ? 'Uploading' : 'Add'}</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>What are you bartering?</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Vintage Nikon F3 Camera"
            placeholderTextColor={COLORS.lightGrey}
            style={styles.input}
          />

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {categories.map((category) => {
              const active = String(category.id) === selectedCategory;
              return (
                <Pressable
                  key={String(category.id)}
                  style={[styles.categoryChip, active ? styles.categoryChipActive : undefined]}
                  onPress={() => setSelectedCategory(String(category.id))}
                >
                  <Text style={[styles.categoryChipText, active ? styles.categoryChipTextActive : undefined]}>
                    {category.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.label}>Starting bid value</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder="150.00"
            placeholderTextColor={COLORS.lightGrey}
            keyboardType="decimal-pad"
            style={styles.input}
          />

          <Text style={styles.label}>Condition</Text>
          <View style={styles.conditionRow}>
            {['new', 'like_new', 'good', 'fair'].map((value) => {
              const active = value === condition;
              return (
                <Pressable
                  key={value}
                  style={[styles.conditionChip, active ? styles.conditionChipActive : undefined]}
                  onPress={() => setCondition(value)}
                >
                  <Text style={[styles.conditionChipText, active ? styles.conditionChipTextActive : undefined]}>
                    {value.replace('_', ' ')}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            placeholder="Describe condition, accessories, and what you're looking to trade for..."
            placeholderTextColor={COLORS.lightGrey}
            style={styles.textarea}
          />
        </View>

        <View style={styles.footerActions}>
          <View style={styles.actionHalf}><StitchSecondaryButton label="Save Draft" /></View>
          <View style={styles.actionHalf}>
            <StitchPrimaryButton label={saving ? 'Posting...' : 'Post Item Live'} onPress={saveProduct} disabled={saving} />
          </View>
        </View>
      </View>
    </StitchPage>
  );
}

const styles = StyleSheet.create({
  contentPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    color: COLORS.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: COLORS.lightGrey,
    fontSize: 12,
    marginTop: 3,
    marginBottom: 10,
  },
  imageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 10,
  },
  imageTile: {
    width: 94,
    height: 94,
    borderRadius: 12,
    marginHorizontal: 4,
    marginBottom: 8,
    overflow: 'hidden',
    backgroundColor: '#E5EAF4',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    right: 6,
    top: 6,
    height: 20,
    width: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
  },
  imageUpload: {
    width: 94,
    height: 94,
    borderRadius: 12,
    marginHorizontal: 4,
    marginBottom: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#BFDBFE',
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  uploadLabel: {
    color: COLORS.primaryBlue,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  uploadingText: {
    color: COLORS.primaryBlue,
    fontSize: 18,
    fontWeight: '700',
  },
  formCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 12,
  },
  label: {
    marginTop: 10,
    marginBottom: 6,
    color: COLORS.lightGrey,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCE4F1',
    backgroundColor: '#F8FAFF',
    paddingHorizontal: 12,
    color: COLORS.primaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  categoryRow: {
    paddingBottom: 4,
  },
  categoryChip: {
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#DCE4F1',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  categoryChipActive: {
    borderColor: COLORS.primaryBlue,
    backgroundColor: COLORS.primaryBlue,
  },
  categoryChipText: {
    color: COLORS.primaryText,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  conditionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  conditionChip: {
    marginHorizontal: 4,
    marginBottom: 8,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCE4F1',
    paddingHorizontal: 10,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  conditionChipActive: {
    borderColor: COLORS.primaryBlue,
    backgroundColor: '#ECF4FF',
  },
  conditionChipText: {
    color: COLORS.primaryText,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  conditionChipTextActive: {
    color: COLORS.primaryBlue,
    fontWeight: '700',
  },
  textarea: {
    minHeight: 120,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCE4F1',
    backgroundColor: '#F8FAFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.primaryText,
    fontSize: 14,
    fontWeight: '500',
    textAlignVertical: 'top',
  },
  footerActions: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionHalf: {
    width: '48%',
  },
});
