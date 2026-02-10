import React from "react";
import {
    Box,
    HStack,
    VStack,
    Text,
    Button,
    ButtonText,
    ButtonIcon,
} from "@gluestack-ui/themed";
import { Play, Video, Mic, MicOff, Camera, Settings } from "lucide-react-native";
import { COLORS } from "@/constants/colors";

interface StreamControlsProps {
    isLive: boolean;
    onGoLive: () => void;
    onToggleCam: () => void;
    onToggleMic: () => void;
    isMicMuted: boolean;
    onSettings: () => void;
}

export const StreamControls = ({
    isLive,
    onGoLive,
    onToggleCam,
    onToggleMic,
    isMicMuted,
    onSettings,
}: StreamControlsProps) => {
    return (
        <Box bg={COLORS.cardBackground} p="$8" rounded="$sm" borderWidth={1} borderColor={COLORS.darkBorder}>
            <VStack space="xl">
                <VStack>
                    <Text size="2xs" fontWeight="$black" color={COLORS.textSecondary} textTransform="uppercase" letterSpacing={1.5}>STREAM CONTROL</Text>
                    <Text size="xl" fontWeight="$black" color={COLORS.textPrimary} style={{ letterSpacing: -0.5 }}>{isLive ? "CURRENTLY LIVE" : "READY TO BROADCAST"}</Text>
                </VStack>

                <HStack space="md">
                    <Button
                        flex={1}
                        variant="outline"
                        borderColor={COLORS.darkBorder}
                        rounded="$sm"
                        h={56}
                        borderWidth={1}
                        onPress={onToggleCam}
                    >
                        <ButtonIcon as={Camera} color={COLORS.textPrimary} />
                    </Button>
                    <Button
                        flex={1}
                        variant="outline"
                        borderColor={COLORS.darkBorder}
                        rounded="$sm"
                        h={56}
                        borderWidth={1}
                        onPress={onToggleMic}
                    >
                        <ButtonIcon as={isMicMuted ? MicOff : Mic} color={COLORS.textPrimary} />
                    </Button>
                    <Button
                        flex={1}
                        variant="outline"
                        borderColor={COLORS.darkBorder}
                        rounded="$sm"
                        h={56}
                        borderWidth={1}
                        onPress={onSettings}
                    >
                        <ButtonIcon as={Settings} color={COLORS.textPrimary} />
                    </Button>
                </HStack>
                <Button
                    size="xl"
                    bg={isLive ? COLORS.errorRed : COLORS.primaryGold}
                    rounded="$sm"
                    h={60}
                    onPress={onGoLive}
                >
                    <ButtonIcon as={Play} mr="$3" color={isLive ? COLORS.textPrimary : COLORS.luxuryBlack} />
                    <ButtonText fontWeight="$black" color={isLive ? COLORS.textPrimary : COLORS.luxuryBlack} textTransform="uppercase">{isLive ? "END STREAM" : "GO LIVE"}</ButtonText>
                </Button>
            </VStack>
        </Box>
    );
};
