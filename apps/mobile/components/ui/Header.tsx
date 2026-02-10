import { View, Text, TouchableOpacity, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";

interface HeaderProps {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    rightAction?: React.ReactNode;
    onBackPress?: () => void;
}

export function Header({
    title,
    subtitle,
    showBack = true,
    rightAction,
    onBackPress,
}: HeaderProps) {
    const router = useRouter();

    const handleBack = () => {
        if (onBackPress) {
            onBackPress();
        } else {
            router.back();
        }
    };

    return (
        <>
            <StatusBar barStyle="light-content" />
            <SafeAreaView edges={["top"]} style={{ backgroundColor: COLORS.navBackground }}>
                <View 
                    className="px-4 py-4 flex-row items-center justify-between"
                    style={{ borderBottomWidth: 1, borderBottomColor: COLORS.darkBorder }}
                >
                    <View className="flex-row items-center flex-1">
                        {showBack && (
                            <TouchableOpacity
                                onPress={handleBack}
                                className="mr-3 w-10 h-10 items-center justify-center"
                            >
                                <ArrowLeft size={24} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        )}
                        <View className="flex-1">
                            <Text className="text-xl font-bold" style={{ color: COLORS.textPrimary }}>
                                {title}
                            </Text>
                            {subtitle && (
                                <Text className="text-sm" style={{ color: COLORS.textMuted }}>{subtitle}</Text>
                            )}
                        </View>
                    </View>
                    {rightAction && <View className="ml-3">{rightAction}</View>}
                </View>
            </SafeAreaView>
        </>
    );
}
