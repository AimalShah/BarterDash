import React, { useState, useEffect } from "react";
import { StatusBar, Alert, ScrollView, Image } from "react-native";
import { router } from "expo-router";
import {
    Box,
    Heading,
    HStack,
    VStack,
    Pressable,
    Spinner,
    Button,
    ButtonText,
    Text,
    Input,
    InputField,
    Textarea,
    TextareaInput,
} from "@gluestack-ui/themed";
import { ChevronLeft, Camera, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";
import { supabase } from "../../lib/supabase";
import { productsService } from "../../lib/api/services/products";
import { categoriesService } from "../../lib/api/services/categories";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from '../../constants/colors';

export default function AddProductScreen() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [condition, setCondition] = useState<string>("new");
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [images, setImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const data = await categoriesService.findAll();
            setCategories(data || []);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const pickImage = async () => {
        if (images.length >= 5) {
            Alert.alert("Limit Reached", "Maximum 5 images allowed");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            base64: true,
        });

        if (result.canceled) return;

        const asset = result.assets[0];
        await uploadImage(asset);
    };

    const uploadImage = async (asset: ImagePicker.ImagePickerAsset) => {
        try {
            setUploading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const fileExt = asset.uri.split(".").pop()?.toLowerCase() || "jpg";
            const filePath = `products/${user.id}/${Date.now()}.${fileExt}`;

            if (!asset.base64) throw new Error("Failed to read image data.");

            const { error: uploadError } = await supabase.storage
                .from("products")
                .upload(filePath, decode(asset.base64), {
                    contentType: asset.mimeType ?? "image/jpeg",
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(filePath);
            setImages([...images, publicUrl]);
        } catch (error: any) {
            console.error("Image upload error:", error);
            Alert.alert("Upload Error", error.message || "Failed to upload image.");
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            Alert.alert("Missing Field", "Please enter a product title.");
            return;
        }
        if (!price.trim()) {
            Alert.alert("Missing Field", "Please enter a price.");
            return;
        }

        setLoading(true);
        try {
            await productsService.create({
                title: title.trim(),
                description: description.trim(),
                categoryId: selectedCategory || undefined,
                condition: condition as any,
                buyNowPrice: price,
                images,
            });

            Alert.alert("Success", "Product created successfully!", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error("Error creating product:", error);
            Alert.alert("Error", error.message || "Failed to create product");
        } finally {
            setLoading(false);
        }
    };

    const conditions = [
        { value: "new", label: "New" },
        { value: "like_new", label: "Like New" },
        { value: "good", label: "Good" },
        { value: "fair", label: "Fair" },
    ];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.luxuryBlack }} edges={['top']}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <Box px="$6" py="$4" borderBottomWidth={2} borderColor={COLORS.darkBorder}>
                <HStack alignItems="center" space="md">
                    <Pressable
                        onPress={() => router.back()}
                        h={44}
                        w={44}
                        rounded="$lg"
                        alignItems="center"
                        justifyContent="center"
                        borderWidth={2}
                        borderColor={COLORS.darkBorder}
                        bg={COLORS.luxuryBlack}
                    >
                        <ChevronLeft size={24} color={COLORS.textPrimary} />
                    </Pressable>
                    <Heading color={COLORS.textPrimary} size="xl" fontWeight="$black">
                        Add Product
                    </Heading>
                </HStack>
            </Box>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <Box px="$6" py="$6">
                    <VStack space="xl">
                        {/* Images */}
                        <Box>
                            <Text size="sm" fontWeight="$bold" color={COLORS.textPrimary} mb="$2">
                                PHOTOS
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <HStack space="sm">
                                    {images.map((uri, index) => (
                                        <Box key={index} position="relative">
                                            <Image
                                                source={{ uri }}
                                                style={{ width: 100, height: 100, borderRadius: 8, borderWidth: 2, borderColor: COLORS.darkBorder }}
                                            />
                                            <Pressable
                                                onPress={() => removeImage(index)}
                                                position="absolute"
                                                top={-8}
                                                right={-8}
                                                bg={COLORS.luxuryBlack}
                                                rounded="$full"
                                                w={24}
                                                h={24}
                                                alignItems="center"
                                                justifyContent="center"
                                            >
                                                <X size={14} color={COLORS.textPrimary} />
                                            </Pressable>
                                        </Box>
                                    ))}
                                    <Pressable
                                        onPress={pickImage}
                                        w={100}
                                        h={100}
                                        bg={COLORS.luxuryBlackLight}
                                        rounded="$lg"
                                        borderWidth={2}
                                        borderColor={COLORS.darkBorder}
                                        borderStyle="dashed"
                                        alignItems="center"
                                        justifyContent="center"
                                    >
                                        {uploading ? (
                                            <Spinner size="small" color={COLORS.primaryGold} />
                                        ) : (
                                            <Camera size={32} color={COLORS.textMuted} />
                                        )}
                                    </Pressable>
                                </HStack>
                            </ScrollView>
                        </Box>

                        {/* Title */}
                        <Box>
                            <Text size="sm" fontWeight="$bold" color={COLORS.textPrimary} mb="$2">
                                TITLE
                            </Text>
                            <Input
                                size="lg"
                                borderWidth={2}
                                borderColor={COLORS.darkBorder}
                                rounded="$lg"
                            >
                                <InputField
                                    value={title}
                                    onChangeText={setTitle}
                                    placeholder="Product name"
                                    placeholderTextColor={COLORS.textMuted}
                                    color={COLORS.textPrimary}
                                />
                            </Input>
                        </Box>

                        {/* Description */}
                        <Box>
                            <Text size="sm" fontWeight="$bold" color={COLORS.textPrimary} mb="$2">
                                DESCRIPTION
                            </Text>
                            <Textarea
                                size="lg"
                                borderWidth={2}
                                borderColor={COLORS.darkBorder}
                                rounded="$lg"
                            >
                                <TextareaInput
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="Describe your product..."
                                    placeholderTextColor={COLORS.textMuted}
                                    numberOfLines={4}
                                    color={COLORS.textPrimary}
                                />
                            </Textarea>
                        </Box>

                        {/* Price */}
                        <Box>
                            <Text size="sm" fontWeight="$bold" color={COLORS.textPrimary} mb="$2">
                                PRICE ($)
                            </Text>
                            <Input
                                size="lg"
                                borderWidth={2}
                                borderColor={COLORS.darkBorder}
                                rounded="$lg"
                            >
                                <InputField
                                    value={price}
                                    onChangeText={setPrice}
                                    placeholder="0.00"
                                    placeholderTextColor={COLORS.textMuted}
                                    keyboardType="decimal-pad"
                                    color={COLORS.textPrimary}
                                />
                            </Input>
                        </Box>

                        {/* Condition */}
                        <Box>
                            <Text size="sm" fontWeight="$bold" color={COLORS.textPrimary} mb="$2">
                                CONDITION
                            </Text>
                            <HStack space="sm" flexWrap="wrap">
                                {conditions.map((c) => (
                                    <Pressable
                                        key={c.value}
                                        onPress={() => setCondition(c.value)}
                                        bg={condition === c.value ? COLORS.primaryGold : COLORS.luxuryBlack}
                                        px="$4"
                                        py="$2"
                                        rounded="$full"
                                        borderWidth={2}
                                        borderColor={COLORS.darkBorder}
                                        mb="$2"
                                    >
                                        <Text
                                            size="sm"
                                            fontWeight="$bold"
                                            color={condition === c.value ? COLORS.luxuryBlack : COLORS.textPrimary}
                                        >
                                            {c.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </HStack>
                        </Box>

                        {/* Category */}
                        <Box>
                            <Text size="sm" fontWeight="$bold" color={COLORS.textPrimary} mb="$2">
                                CATEGORY
                            </Text>
                            <HStack space="sm" flexWrap="wrap">
                                {categories.map((cat) => (
                                    <Pressable
                                        key={cat.id}
                                        onPress={() => setSelectedCategory(cat.id)}
                                        bg={selectedCategory === cat.id ? COLORS.primaryGold : COLORS.luxuryBlack}
                                        px="$4"
                                        py="$2"
                                        rounded="$full"
                                        borderWidth={2}
                                        borderColor={COLORS.darkBorder}
                                        mb="$2"
                                    >
                                        <Text
                                            size="sm"
                                            fontWeight="$bold"
                                            color={selectedCategory === cat.id ? COLORS.luxuryBlack : COLORS.textPrimary}
                                        >
                                            {cat.name}
                                        </Text>
                                    </Pressable>
                                ))}
                            </HStack>
                        </Box>

                        {/* Submit Button */}
                        <Button
                            onPress={handleSubmit}
                            isDisabled={loading || uploading}
                            size="xl"
                            bg={COLORS.primaryGold}
                            rounded="$lg"
                            h={56}
                        >
                            {loading ? (
                                <Spinner color={COLORS.luxuryBlack} />
                            ) : (
                                <ButtonText fontWeight="$black" fontSize="$md" color={COLORS.luxuryBlack}>
                                    CREATE PRODUCT
                                </ButtonText>
                            )}
                        </Button>
                    </VStack>
                </Box>
            </ScrollView>
        </SafeAreaView>
    );
}
