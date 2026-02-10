import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Platform,
} from "react-native";
import { Calendar } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { COLORS } from "@/constants/colors";

interface StreamFormProps {
    title: string;
    onTitleChange: (text: string) => void;
    description: string;
    onDescriptionChange: (text: string) => void;
    scheduleStart: Date;
    onShowDatePicker: () => void;
    showPicker: boolean;
    onDateChange: (event: any, date?: Date) => void;
}

export const StreamForm = ({
    title,
    onTitleChange,
    description,
    onDescriptionChange,
    scheduleStart,
    onShowDatePicker,
    showPicker,
    onDateChange,
}: StreamFormProps) => {
    const [focusedField, setFocusedField] = useState<string | null>(null);

    return (
        <View style={styles.container}>
            <View style={styles.formGroup}>
                <Text style={styles.label}>STREAM TITLE</Text>
                <TextInput
                    style={[
                        styles.input,
                        focusedField === 'title' && styles.inputFocused
                    ]}
                    placeholder="E.G. VINTAGE PACK OPENING"
                    value={title}
                    onChangeText={onTitleChange}
                    onFocus={() => setFocusedField('title')}
                    onBlur={() => setFocusedField(null)}
                    placeholderTextColor={COLORS.textMuted}
                    cursorColor={COLORS.primaryGold}
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>SCHEDULED START</Text>
                <TouchableOpacity
                    onPress={onShowDatePicker}
                    activeOpacity={0.8}
                    style={styles.dateButton}
                >
                    <Text style={styles.dateText}>
                        {scheduleStart.toLocaleString([], { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Calendar size={20} color={COLORS.primaryGold} />
                </TouchableOpacity>
                <Text style={styles.helperText}>DEFAULT: 1 HOUR FROM NOW.</Text>

                {showPicker && Platform.OS === "ios" && (
                    <DateTimePicker
                        value={scheduleStart}
                        mode="datetime"
                        display="spinner"
                        minimumDate={new Date()}
                        onChange={onDateChange}
                    />
                )}
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>DESCRIPTION</Text>
                <TextInput
                    style={[
                        styles.input,
                        styles.textArea,
                        focusedField === 'description' && styles.inputFocused
                    ]}
                    placeholder="TELL YOUR VIEWERS WHAT TO EXPECT..."
                    value={description}
                    onChangeText={onDescriptionChange}
                    onFocus={() => setFocusedField('description')}
                    onBlur={() => setFocusedField(null)}
                    placeholderTextColor={COLORS.textMuted}
                    cursorColor={COLORS.primaryGold}
                    multiline
                    textAlignVertical="top"
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 24,
    },
    formGroup: {
        marginBottom: 8,
    },
    label: {
        color: COLORS.textPrimary,
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    input: {
        backgroundColor: COLORS.luxuryBlack,
        borderWidth: 1,
        borderColor: COLORS.darkBorder,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textPrimary,
        textTransform: 'uppercase', // Keep input uppercase for style
    },
    textArea: {
        minHeight: 120,
        paddingTop: 16,
    },
    inputFocused: {
        borderColor: COLORS.primaryGold,
        backgroundColor: '#1E1E1E', // Slightly lighter on focus
        shadowColor: COLORS.primaryGold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.luxuryBlack,
        borderWidth: 1,
        borderColor: COLORS.darkBorder,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
    },
    dateText: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    helperText: {
        color: COLORS.textSecondary,
        fontSize: 11,
        fontWeight: '600',
        marginTop: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
