import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { decode } from 'base64-arraybuffer';
import { COLORS } from '@/constants/colors';
import { categoriesService, type Category } from '@/lib/api/services/categories';
import { streamsService, type Stream } from '@/lib/api/services/streams';
import { supabase } from '@/lib/supabase';
import {
  StitchCard,
  StitchChip,
  StitchHeader,
  StitchPage,
  StitchPrimaryButton,
} from '@/components/design';

export default function EditStreamScreen() {
  const { id: streamId } = useLocalSearchParams<{ id: string }>();

  const [stream, setStream] = useState<Stream | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [scheduleStart, setScheduleStart] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchStreamAndCategories = useCallback(async () => {
    if (!streamId) {
      setLoading(false);
      return;
    }

    try {
      const [streamData, categoriesData] = await Promise.all([
        streamsService.findById(streamId),
        categoriesService.findAll(),
      ]);

      setStream(streamData);
      setCategories(categoriesData || []);

      setTitle(streamData.title || '');
      setDescription(streamData.description || '');
      setSelectedCategory(streamData.categoryId || null);
      setThumbnailUrl(streamData.thumbnailUrl || null);

      if (streamData.scheduledStart) {
        setScheduleStart(new Date(streamData.scheduledStart));
      }
    } catch (error) {
      console.error('Error fetching stream:', error);
      Alert.alert('Error', 'Failed to load stream details.');
    } finally {
      setLoading(false);
    }
  }, [streamId]);

  useEffect(() => {
    fetchStreamAndCategories();
  }, [fetchStreamAndCategories]);

  const pickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled) {
        return;
      }

      const selectedAsset = result.assets[0];
      if (!selectedAsset?.base64 || !streamId) {
        return;
      }

      setLocalImage(selectedAsset.uri);
      setUploadingImage(true);

      const fileExt = selectedAsset.uri.split('.').pop() || 'jpg';
      const fileName = `${streamId}/thumbnail-${Date.now()}.${fileExt}`;
      const filePath = `stream-thumbnails/${fileName}`;

      const { error } = await supabase.storage
        .from('stream-images')
        .upload(filePath, decode(selectedAsset.base64), {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (error) {
        throw error;
      }

      const { data: urlData } = supabase.storage.from('stream-images').getPublicUrl(filePath);
      setThumbnailUrl(urlData.publicUrl);
    } catch (error) {
      console.error('Error picking/uploading image:', error);
      Alert.alert('Upload Error', 'Failed to upload thumbnail.');
    } finally {
      setUploadingImage(false);
    }
  }, [streamId]);

  const showDatePicker = useCallback(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    DateTimePickerAndroid.open({
      value: scheduleStart,
      mode: 'date',
      minimumDate: new Date(),
      onChange: (event, date) => {
        if (event.type !== 'set' || !date) {
          return;
        }

        DateTimePickerAndroid.open({
          value: date,
          mode: 'time',
          is24Hour: true,
          onChange: (timeEvent, timeDate) => {
            if (timeEvent.type !== 'set' || !timeDate) {
              return;
            }
            setScheduleStart(timeDate);
          },
        });
      },
    });
  }, [scheduleStart]);

  const handleSave = useCallback(async () => {
    if (!streamId) {
      return;
    }

    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a stream title.');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category.');
      return;
    }

    setSaving(true);
    try {
      await streamsService.update(streamId, {
        title: title.trim(),
        description: description.trim(),
        categoryId: selectedCategory,
        scheduledStart: scheduleStart.toISOString(),
        thumbnailUrl: thumbnailUrl || undefined,
      });

      Alert.alert('Success', 'Stream updated successfully.', [
        { text: 'OK', onPress: () => router.replace(`/seller/stream/${streamId}`) },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to update stream.');
    } finally {
      setSaving(false);
    }
  }, [streamId, title, selectedCategory, description, scheduleStart, thumbnailUrl]);

  if (loading) {
    return (
      <StitchPage scroll={false} contentStyle={styles.centerWrap}>
        <Text style={styles.loadingTitle}>Loading Stream...</Text>
        <Text style={styles.loadingSubtitle}>Preparing edit form</Text>
      </StitchPage>
    );
  }

  if (!stream) {
    return (
      <StitchPage scroll={false} contentStyle={styles.centerWrap}>
        <StitchHeader title="Edit Stream" onBack={() => router.back()} />
        <Text style={styles.loadingTitle}>Stream Not Found</Text>
        <Text style={styles.loadingSubtitle}>This stream could not be loaded.</Text>
      </StitchPage>
    );
  }

  return (
    <StitchPage contentStyle={{ paddingBottom: 120 }}>
      <StitchHeader title="Edit Stream" subtitle="Update stream details" onBack={() => router.back()} />

      <ScrollView style={styles.contentPad} showsVerticalScrollIndicator={false}>
        <StitchCard style={styles.cardSpacing}>
          <Text style={styles.label}>Thumbnail</Text>
          <Pressable style={styles.thumbnailWrap} onPress={pickImage}>
            {localImage || thumbnailUrl ? (
              <Image source={{ uri: localImage || (thumbnailUrl as string) }} style={styles.thumbnail} />
            ) : (
              <View style={styles.thumbnailPlaceholder}>
                <Text style={styles.placeholderText}>Tap to add thumbnail</Text>
              </View>
            )}
          </Pressable>
          <Text style={styles.helper}>{uploadingImage ? 'Uploading image...' : '16:9 thumbnail recommended'}</Text>
        </StitchCard>

        <StitchCard style={styles.cardSpacing}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.chipWrap}>
            {categories.map((category) => (
              <StitchChip
                key={category.id}
                label={category.name}
                active={selectedCategory === category.id}
                onPress={() => setSelectedCategory(category.id)}
              />
            ))}
          </View>
        </StitchCard>

        <StitchCard style={styles.cardSpacing}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Enter stream title"
            placeholderTextColor={COLORS.lightGrey}
            style={styles.input}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your stream"
            placeholderTextColor={COLORS.lightGrey}
            style={[styles.input, styles.textArea]}
            multiline
          />

          <Text style={styles.label}>Schedule</Text>
          <Pressable style={styles.scheduleButton} onPress={showDatePicker}>
            <Text style={styles.scheduleText}>
              {scheduleStart.toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </Pressable>
          <Text style={styles.helper}>Tap to change schedule (Android)</Text>
        </StitchCard>

        <StitchPrimaryButton
          label={saving ? 'Saving...' : 'Save Changes'}
          onPress={handleSave}
          disabled={saving || uploadingImage}
        />
      </ScrollView>
    </StitchPage>
  );
}

const styles = StyleSheet.create({
  centerWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingTitle: {
    color: COLORS.primaryText,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  loadingSubtitle: {
    marginTop: 8,
    color: COLORS.lightGrey,
    fontSize: 14,
    textAlign: 'center',
  },
  contentPad: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  cardSpacing: {
    marginBottom: 12,
  },
  label: {
    color: COLORS.primaryText,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.7,
  },
  thumbnailWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D8E0EB',
    backgroundColor: '#EEF2F7',
  },
  thumbnail: {
    width: '100%',
    height: 180,
  },
  thumbnailPlaceholder: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: COLORS.lightGrey,
    fontSize: 14,
  },
  helper: {
    marginTop: 6,
    color: COLORS.lightGrey,
    fontSize: 12,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#D8E0EB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    color: COLORS.primaryText,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  scheduleButton: {
    height: 44,
    borderWidth: 1,
    borderColor: '#D8E0EB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  scheduleText: {
    color: COLORS.primaryText,
    fontSize: 14,
    fontWeight: '500',
  },
});
