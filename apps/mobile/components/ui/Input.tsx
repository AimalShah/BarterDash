import { View, TextInput, Text, TouchableOpacity } from "react-native";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react-native";
import { cn } from "../../lib/utils";
import { COLORS } from "@/constants/colors";

interface InputProps {
    label?: string;
    placeholder?: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
    keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
    error?: string;
    disabled?: boolean;
    multiline?: boolean;
    numberOfLines?: number;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    className?: string;
    autoCapitalize?: "none" | "sentences" | "words" | "characters";
    placeholderTextColor?: string;
}

export function Input({
    label,
    placeholder,
    value,
    onChangeText,
    secureTextEntry = false,
    keyboardType = "default",
    error,
    disabled = false,
    multiline = false,
    numberOfLines = 1,
    leftIcon,
    rightIcon,
    className = "",
    autoCapitalize,
    placeholderTextColor = COLORS.textMuted,
}: InputProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <View className="w-full mb-4">
            {label && (
                <Text className="text-sm font-bold mb-2 uppercase tracking-wider" style={{ color: COLORS.textSecondary }}>
                    {label}
                </Text>
            )}
            <View
                className={cn(
                    "flex-row items-center border rounded-2xl px-4",
                    disabled && "opacity-50",
                    className
                )}
                style={{ 
                    backgroundColor: COLORS.luxuryBlackLighter,
                    borderColor: error ? COLORS.errorRed : COLORS.darkBorder
                }}
            >
                {leftIcon && <View className="mr-3">{leftIcon}</View>}

                <TextInput
                    className={cn(
                        "flex-1 text-base",
                        multiline ? "py-3 min-h-[100px]" : "h-14"
                    )}
                    style={{ color: COLORS.textPrimary }}
                    placeholder={placeholder}
                    placeholderTextColor={placeholderTextColor}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secureTextEntry && !showPassword}
                    keyboardType={keyboardType}
                    editable={!disabled}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                    textAlignVertical={multiline ? "top" : "center"}
                    autoCapitalize={autoCapitalize}
                />

                {secureTextEntry && (
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        className="ml-3"
                    >
                        {showPassword ? (
                            <EyeOff size={20} color={COLORS.textMuted} />
                        ) : (
                            <Eye size={20} color={COLORS.textMuted} />
                        )}
                    </TouchableOpacity>
                )}

                {rightIcon && <View className="ml-3">{rightIcon}</View>}
            </View>

            {error && (
                <Text className="text-xs mt-1 font-medium" style={{ color: COLORS.errorRed }}>{error}</Text>
            )}
        </View>
    );
}
