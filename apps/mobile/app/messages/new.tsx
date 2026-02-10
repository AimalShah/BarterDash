import React, { useEffect } from "react";
import { StatusBar } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Center, Spinner, Text, Box } from "@gluestack-ui/themed";
import { messagesService } from "@/lib/api/services/messages";
import { useToast } from "@/context/ToastContext";
import { handleApiError } from "@/lib/api/errorHandle";
import { COLORS } from "../../constants/colors";

export default function NewConversationScreen() {
    const router = useRouter();
    const { userId } = useLocalSearchParams<{ userId: string }>();
    const { showError } = useToast();

    useEffect(() => {
        if (!userId) {
            router.back();
            return;
        }

        startNewChat();
    }, [userId]);

    const startNewChat = async () => {
        try {
            const conversation = await messagesService.startConversation(userId!);
            // Redirect to the actual conversation screen
            router.replace(`/messages/${conversation.id}`);
        } catch (error) {
            console.error("Error starting conversation:", error);
            const message = handleApiError(error, { context: "Messaging", showAlert: false });
            showError(message);
            router.back();
        }
    };

    return (
        <Box flex={1} bg={COLORS.luxuryBlack}>
            <StatusBar barStyle="light-content" />
            <Center flex={1}>
                <Spinner size="large" color={COLORS.primaryGold} />
                <Text mt="$4" color={COLORS.textSecondary}>Starting conversation...</Text>
            </Center>
        </Box>
    );
}
