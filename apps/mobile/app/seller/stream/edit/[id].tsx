import React, { useState, useEffect } from "react";
import { StatusBar, Alert, ScrollView, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Box,
  Center,
  Heading,
  HStack,
  Pressable,
  Spinner,
  Button,
  ButtonText,
  VStack,
  Input,
  InputField,
  Textarea,
} from "@gluestack-ui/themed";
import { streamsService, Stream } from "../../../../lib/api/services/streams";
import { categoriesService } from "../../../../lib/api/services/categories";
import { ChevronLeft } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { ThumbnailUpload } from "../../../../components/seller/ThumbnailUpload";
import { CategoryPicker } from "../../../../components/seller/CategoryPicker";
import { COLORS } from "../../../../constants/colors";

export default function EditStreamScreen() {
  const { id: streamId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

   const [stream, setStream] = useState<Stream | null>(null);

  useEffect(() => {
    if (streamId) {
      fetchStreamAndCategories();
    }
  }, [streamId]);

  const fetchStreamAndCategories = async () => {
    try {
      const [streamData, categoriesData] = await Promise.all([
        streamsService.findById(streamId),
        categoriesService.findAll(),
      ]);

      setStream(streamData);
      setCategories(categoriesData || []);

      // Set form values
      setTitle(streamData.title || "");
      setDescription(streamData.description || "");
      setSelectedCategory(streamData.categoryId);
      setThumbnailUrl(streamData.thumbnailUrl);
      if (streamData.scheduledStart) {
        setScheduleStart(new Date(streamData.scheduledStart));
      }
    } catch (error) {
      console.error("Error fetching stream:", error);
      Alert.alert("Error", "Failed to load stream details");
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      if (event.type === "set" && selectedDate) {
        setScheduleStart(selectedDate);
      }
    } else {
      if (selectedDate) {
        setScheduleStart(selectedDate);
      }
    }
  };

  const showDatePicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: scheduleStart,
        onChange: (event, date) => {
          if (event.type === "set" && date) {
            DateTimePickerAndroid.open({
              value: date,
              onChange: (tEvent, tDate) => {
                if (tEvent.type === "set" && tDate) {
                  setScheduleStart(tDate);
                }
              },
              mode: "time",
              is24Hour: true,
            });
          }
        },
        mode: "date",
        minimumDate: new Date(),
      });
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
      base64: true,
    });

    if (result.canceled) return;

    const selectedAsset = result.assets[0];
    if (selectedAsset.base64) {
      setLocalImage(selectedAsset.uri);
      // TODO: Upload to Supabase storage and get URL
      // For now, we'll just use the local image
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a stream title");
      return;
    }

    if (!selectedCategory) {
      Alert.alert("Error", "Please select a category");
      return;

      setSaving(true);
      try {
        await streamsService.update(streamId, {
          title: title.trim(),
          description: description.trim(),
          categoryId: selectedCategory,
          scheduledStart: scheduleStart.toISOString(),
          thumbnailUrl: thumbnailUrl || undefined,
        });

        Alert.alert("Success", "Stream updated successfully", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } catch (error: any) {
        Alert.alert("Error", error.message || "Failed to update stream");
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <Box flex={1} bg={COLORS.luxuryBlack}>
        <Center flex={1}>
          <VStack space="lg" alignItems="center">
            <Spinner size="large" color={COLORS.primaryGold} />
            <Text fontWeight="$bold" color={COLORS.textSecondary}>
              Loading Stream...
            </Text>
          </VStack>
        </Center>
      </Box>
    );
  }

  if (!stream) {
    return (
      <Box flex={1} bg={COLORS.luxuryBlack}>
        <Center flex={1} px="$10">
          <VStack space="2xl" alignItems="center">
            <Heading color={COLORS.textPrimary} size="2xl">
              Stream Not Found
            </Heading>
            <Text color={COLORS.textSecondary} textAlign="center">
              The stream you're looking for could not be found.
            </Text>
            <Button
              size="lg"
              onPress={() => router.back()}
              bg={COLORS.primaryGold}
            >
              <ButtonText color={COLORS.luxuryBlack}>Go Back</ButtonText>
            </Button>
          </VStack>
        </Center>
      </Box>
    );
  }

  return (
    <Box flex={1} bg={COLORS.luxuryBlack}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <Box px="$6" py="$4" borderBottomWidth={1} borderColor={COLORS.darkBorder}>
        <HStack alignItems="center" space="sm">
          <Pressable
            onPress={() => router.back()}
            h={44}
            w={44}
            rounded="$sm"
            alignItems="center"
            justifyContent="center"
            borderWidth={1}
            borderColor={COLORS.primaryGold}
            bg={COLORS.luxuryBlackLight}
          >
            <ChevronLeft size={24} color={COLORS.primaryGold} />
          </Pressable>
          <VStack>
            <Heading size="md" color={COLORS.textPrimary}>
              Edit Stream
            </Heading>
            <Text size="xs" color={COLORS.textMuted}>
              Update your stream details
            </Text>
          </VStack>
        </HStack>
      </Box>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <VStack space="xl" p="$6">
          {/* Thumbnail Upload */}
          <ThumbnailUpload
            thumbnailUrl={thumbnailUrl}
            localImage={localImage}
            onPickImage={pickImage}
          />

          {/* Category Picker */}
          <CategoryPicker
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
          />

          {/* Stream Title */}
          <VStack space="sm">
            <Text fontWeight="$bold" color={COLORS.textPrimary} size="sm">
              Stream Title *
            </Text>
            <Input
              variant="outline"
              size="lg"
              borderColor={COLORS.darkBorder}
              borderWidth={1}
              rounded="$lg"
              bg={COLORS.luxuryBlackLight}
            >
              <InputField
                placeholder="Enter a catchy title for your stream"
                value={title}
                onChangeText={setTitle}
                fontSize={16}
                color={COLORS.textPrimary}
                placeholderTextColor={COLORS.textMuted}
              />
            </Input>
          </VStack>

          {/* Description */}
          <VStack space="sm">
            <Text fontWeight="$bold" color={COLORS.textPrimary} size="sm">
              Description
            </Text>
            <Textarea
              size="lg"
              borderColor={COLORS.darkBorder}
              borderWidth={1}
              rounded="$lg"
              h={120}
              bg={COLORS.luxuryBlackLight}
            >
              <TextareaInput
                placeholder="Describe what you'll be streaming about..."
                value={description}
                onChangeText={setDescription}
                fontSize={16}
                multiline
                color={COLORS.textPrimary}
                placeholderTextColor={COLORS.textMuted}
              />
            </Textarea>
          </VStack>

          {/* Schedule */}
          <VStack space="sm">
            <Text fontWeight="$bold" color={COLORS.textPrimary} size="sm">
              Schedule
            </Text>
            <Pressable
              onPress={showDatePicker}
              p="$4"
              borderWidth={1}
              borderColor={COLORS.darkBorder}
              rounded="$lg"
              bg={COLORS.luxuryBlackLight}
            >
              <Text color={COLORS.textPrimary}>
                {scheduleStart.toLocaleString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Text>
            </Pressable>
          </VStack>

          {/* Save Button */}
          <Button
            size="xl"
            onPress={handleSave}
            bg={COLORS.primaryGold}
            rounded="$sm"
            h={56}
            isDisabled={saving}
            mt="$4"
          >
            <ButtonText fontWeight="$black" size="md" color={COLORS.luxuryBlack}>
              {saving ? "Saving..." : "Save Changes"}
            </ButtonText>
          </Button>
        </VStack>
      </ScrollView>
    </Box>
  );
}
