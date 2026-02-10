import React from 'react';
import { View, Image, ActivityIndicator, TouchableOpacity, Text, StyleSheet } from "react-native";
import { User, Camera } from "lucide-react-native";
import { COLORS } from "@/constants/colors";

interface AvatarUploadProps {
    avatarUrl: string;
    uploading: boolean;
    onPickImage: () => void;
}

export const AvatarUpload = ({ avatarUrl, uploading, onPickImage }: AvatarUploadProps) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={onPickImage}
                disabled={uploading}
                activeOpacity={0.8}
            >
                <View style={styles.avatarContainer}>
                    {avatarUrl ? (
                        <Image
                            source={{ uri: avatarUrl }}
                            style={styles.avatarImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <User size={48} color={COLORS.textPrimary} strokeWidth={1.5} />
                    )}

                    {uploading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color={COLORS.primaryGold} />
                        </View>
                    )}
                </View>

                {/* Camera button with yellow accent */}
                <View style={styles.cameraButton}>
                    <Camera size={16} color={COLORS.luxuryBlack} />
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={onPickImage}
                disabled={uploading}
                style={styles.labelButton}
            >
                <Text style={styles.labelText}>
                    {uploading
                        ? "Uploading..."
                        : avatarUrl
                            ? "Change Photo"
                            : "Add Photo"}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLORS.primaryGold, // Gold border
        backgroundColor: COLORS.luxuryBlackLight,
        overflow: 'hidden',
        // Shadow for glowing effect
        shadowColor: COLORS.primaryGold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 5,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.primaryGold,
        padding: 10,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: COLORS.luxuryBlack,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
    },
    labelButton: {
        marginTop: 16,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: COLORS.luxuryBlackLighter,
    },
    labelText: {
        color: COLORS.primaryGold,
        fontWeight: "600",
        fontSize: 14,
    }
});
