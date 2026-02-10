import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from "react-native";
import { X, Plus } from "lucide-react-native";
import { categoriesService, Category } from "../../lib/api/services/categories";
import { COLORS } from "../../constants/colors";

interface CategoryDrawerProps {
    visible: boolean;
    onClose: () => void;
    onCategoryCreated: (category: Category) => void;
}

export function CategoryDrawer({
    visible,
    onClose,
    onCategoryCreated,
}: CategoryDrawerProps) {
    const [categoryName, setCategoryName] = useState("");
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
        if (!categoryName.trim()) {
            Alert.alert("Error", "Please enter a category name");
            return;
        }

        try {
            setCreating(true);
            const newCategory = await categoriesService.create({
                name: categoryName.trim(),
                parentId: null,
            });

            // Reset and close
            setCategoryName("");
            onCategoryCreated(newCategory);
            onClose();

            Alert.alert("Success", `Category "${newCategory.name}" created successfully`);
        } catch (error: any) {
            console.error("Failed to create category:", error);
            Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to create category. Please try again."
            );
        } finally {
            setCreating(false);
        }
    };

    const handleClose = () => {
        setCategoryName("");
        onClose();
    };

    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <TouchableOpacity
                style={styles.backdrop}
                onPress={handleClose}
                activeOpacity={1}
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
            >
                <View style={styles.drawer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Add New Category</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <X size={24} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    {/* Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>CATEGORY NAME</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter category name"
                            value={categoryName}
                            onChangeText={setCategoryName}
                            autoFocus
                            maxLength={50}
                            placeholderTextColor={COLORS.textMuted}
                        />
                        <Text style={styles.hint}>
                            {categoryName.length}/50 characters
                        </Text>
                    </View>

                    {/* Create Button */}
                    <TouchableOpacity
                        style={[
                            styles.createButton,
                            (creating || !categoryName.trim()) && styles.createButtonDisabled,
                        ]}
                        onPress={handleCreate}
                        disabled={creating || !categoryName.trim()}
                    >
                        {creating ? (
                            <ActivityIndicator color={COLORS.luxuryBlack} />
                        ) : (
                            <>
                                <Plus size={20} color={COLORS.luxuryBlack} style={styles.buttonIcon} />
                                <Text style={styles.buttonText}>Create Category</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
    },
    backdrop: {
        flex: 1,
        backgroundColor: COLORS.overlayMedium,
    },
    container: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
    },
    drawer: {
        backgroundColor: COLORS.cardBackground,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === "ios" ? 40 : 24,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.textPrimary,
    },
    closeButton: {
        padding: 4,
    },
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.textSecondary,
        marginBottom: 8,
        letterSpacing: 1,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.darkBorder,
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.textPrimary,
        backgroundColor: COLORS.luxuryBlack,
    },
    hint: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 4,
        textAlign: "right",
    },
    createButton: {
        backgroundColor: COLORS.primaryGold,
        borderRadius: 8,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    createButtonDisabled: {
        backgroundColor: COLORS.textMuted,
    },
    buttonIcon: {
        marginRight: 8,
    },
    buttonText: {
        color: COLORS.luxuryBlack,
        fontSize: 16,
        fontWeight: "bold",
    },
});
