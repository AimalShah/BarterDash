import { View, ActivityIndicator } from "react-native";
import { COLORS } from "@/constants/colors";

interface LoadingSpinnerProps {
    size?: "small" | "large";
    color?: string;
    fullScreen?: boolean;
}

export default function LoadingSpinner({
    size = "large",
    color = COLORS.textPrimary,
    fullScreen = false,
}: LoadingSpinnerProps) {
    if (fullScreen) {
        return (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: COLORS.luxuryBlack }}>
                <ActivityIndicator size={size} color={color} />
            </View>
        );
    }

    return <ActivityIndicator size={size} color={color} />;
}
