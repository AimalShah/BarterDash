import React from 'react';
import { View, Text, TextInput, StyleSheet } from "react-native";
import { COLORS } from "@/constants/colors";

interface ProfileFormProps {
    fullName: string;
    username: string;
    bio: string;
    errors: {
        fullName?: string;
        username?: string;
        bio?: string;
    };
    onFullNameChange: (text: string) => void;
    onUsernameChange: (text: string) => void;
    onBioChange: (text: string) => void;
}

export const ProfileForm = ({
    fullName,
    username,
    bio,
    errors,
    onFullNameChange,
    onUsernameChange,
    onBioChange,
}: ProfileFormProps) => {
    const [focusedField, setFocusedField] = React.useState<string | null>(null);

    return (
        <View style={styles.container}>
            <View style={styles.formGroup}>
                <Text style={styles.label}>
                    Full Name <Text style={styles.optional}>(optional)</Text>
                </Text>
                <TextInput
                    style={[
                        styles.input,
                        focusedField === 'fullName' && styles.inputFocused,
                        errors.fullName && styles.inputError
                    ]}
                    placeholder="What should we call you?"
                    value={fullName}
                    onChangeText={onFullNameChange}
                    onFocus={() => setFocusedField('fullName')}
                    onBlur={() => setFocusedField(null)}
                    placeholderTextColor={COLORS.textMuted}
                    selectionColor={COLORS.primaryGold}
                />
                {errors.fullName && (
                    <Text style={styles.errorText}>{errors.fullName}</Text>
                )}
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Username *</Text>
                <TextInput
                    style={[
                        styles.input,
                        focusedField === 'username' && styles.inputFocused,
                        errors.username && styles.inputError
                    ]}
                    placeholder="Choose a unique username"
                    value={username}
                    onChangeText={onUsernameChange}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    autoCapitalize="none"
                    placeholderTextColor={COLORS.textMuted}
                    selectionColor={COLORS.primaryGold}
                />
                {errors.username && (
                    <Text style={styles.errorText}>{errors.username}</Text>
                )}
                <Text style={styles.helperText}>
                    Only letters, numbers, and underscores.
                </Text>
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>
                    Bio <Text style={styles.optional}>(optional)</Text>
                </Text>
                <TextInput
                    style={[
                        styles.textArea,
                        focusedField === 'bio' && styles.inputFocused,
                        errors.bio && styles.inputError
                    ]}
                    placeholder="Tell us a bit about yourself..."
                    value={bio}
                    onChangeText={onBioChange}
                    onFocus={() => setFocusedField('bio')}
                    onBlur={() => setFocusedField(null)}
                    placeholderTextColor={COLORS.textMuted}
                    multiline
                    numberOfLines={3}
                    maxLength={160}
                    selectionColor={COLORS.primaryGold}
                    textAlignVertical="top"
                />
                <View style={styles.bioFooter}>
                    {errors.bio ? (
                        <Text style={styles.errorText}>{errors.bio}</Text>
                    ) : (
                        <Text style={styles.helperText}>
                            Share your interests or expertise
                        </Text>
                    )}
                    <Text style={styles.charCount}>
                        {bio.length}/160
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 24,
    },
    // ... rest of styles
    formGroup: {
        marginBottom: 4,
    },
    label: {
        color: COLORS.textPrimary,
        fontWeight: "700",
        fontSize: 14,
        marginBottom: 8,
    },
    optional: {
        color: COLORS.textMuted,
        fontSize: 12,
        fontWeight: "400",
    },
    input: {
        backgroundColor: COLORS.luxuryBlackLighter,
        borderWidth: 1,
        borderColor: COLORS.darkBorder,
        borderRadius: 16,
        height: 56,
        paddingHorizontal: 16,
        color: COLORS.textPrimary,
        fontSize: 16,
    },
    textArea: {
        backgroundColor: COLORS.luxuryBlackLighter,
        borderWidth: 1,
        borderColor: COLORS.darkBorder,
        borderRadius: 16,
        height: 100,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: COLORS.textPrimary,
        fontSize: 16,
    },
    inputError: {
        borderColor: COLORS.errorRed,
    },
    inputFocused: {
        borderColor: COLORS.primaryGold,
        backgroundColor: COLORS.luxuryBlack,
        // Glow effect
        shadowColor: COLORS.primaryGold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 2,
    },
    errorText: {
        color: COLORS.errorRed,
        fontSize: 12,
        marginTop: 6,
        marginLeft: 4,
    },
    helperText: {
        color: COLORS.textSecondary,
        fontSize: 11,
        marginTop: 6,
        marginLeft: 4,
    },
    bioFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginTop: 6,
    },
    charCount: {
        color: COLORS.textMuted,
        fontSize: 11,
    }
});
