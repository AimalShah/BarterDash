import * as React from 'react';
import { Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { COLORS } from "@/constants/colors";

interface ButtonProps {
    label: string;
    onPress: () => void;
    variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    fullWidth?: boolean;
    className?: string;
    labelClasses?: string;
}

export const Button = ({
    label,
    onPress,
    variant = "primary",
    size = "md",
    disabled = false,
    loading = false,
    icon,
    fullWidth = false,
    className = "",
    labelClasses = "",
}: ButtonProps) => {
    const getVariantStyles = () => {
        switch (variant) {
            case "secondary":
                return "";
            case "outline":
                return "";
            case "ghost":
                return "";
            case "destructive":
                return "";
            default:
                return "";
        }
    };

    const getVariantColors = () => {
        switch (variant) {
            case "secondary":
                return { backgroundColor: COLORS.luxuryBlackLighter, borderWidth: 1, borderColor: COLORS.darkBorder };
            case "outline":
                return { backgroundColor: 'transparent', borderWidth: 2, borderColor: COLORS.primaryGold };
            case "ghost":
                return { backgroundColor: 'transparent' };
            case "destructive":
                return { backgroundColor: COLORS.errorRed };
            default:
                return { backgroundColor: COLORS.primaryGold };
        }
    };

    const getTextStyles = () => {
        switch (variant) {
            case "secondary":
            case "ghost":
                return { color: COLORS.textSecondary };
            case "outline":
                return { color: COLORS.primaryGold };
            default:
                return { color: COLORS.luxuryBlack };
        }
    };

    const getSizeStyles = () => {
        switch (size) {
            case "sm":
                return "h-10 px-4";
            case "lg":
                return "h-14 px-8";
            default:
                return "h-12 px-6";
        }
    };

    const getTextSizeStyles = () => {
        switch (size) {
            case "sm":
                return "text-sm";
            case "lg":
                return "text-lg";
            default:
                return "text-base";
        }
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            className={`rounded-2xl items-center justify-center flex-row ${getSizeStyles()} ${fullWidth ? "w-full" : ""
                } ${disabled ? "opacity-50" : ""} ${className}`}
            style={getVariantColors()}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={variant === "outline" || variant === "ghost" ? COLORS.primaryGold : COLORS.textPrimary}
                />
            ) : (
                <>
                    {icon && <View className="mr-2">{icon}</View>}
                    <Text
                        className={`${getTextSizeStyles()} font-bold ${labelClasses}`}
                        style={getTextStyles()}
                    >
                        {label}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};
