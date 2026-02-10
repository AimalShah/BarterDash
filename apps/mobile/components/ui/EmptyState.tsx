import { View, Text } from "react-native";
import { Button } from "./Button";
import { COLORS } from "@/constants/colors";

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export default function EmptyState({
    icon,
    title,
    description,
    actionLabel,
    onAction,
}: EmptyStateProps) {
    return (
        <View className="flex-1 items-center justify-center p-6" style={{ backgroundColor: COLORS.luxuryBlack }}>
            {icon && <View className="mb-4">{icon}</View>}
            <Text className="text-lg font-extrabold text-center mb-2 uppercase tracking-tighter" style={{ color: COLORS.textPrimary }}>
                {title}
            </Text>
            {description && (
                <Text className="text-sm text-center mb-10 font-medium" style={{ color: COLORS.textSecondary }}>
                    {description}
                </Text>
            )}
            {actionLabel && onAction && (
                <Button label={actionLabel} onPress={onAction} className="w-full" style={{ backgroundColor: COLORS.primaryGold }} />
            )}
        </View>
    );
}
