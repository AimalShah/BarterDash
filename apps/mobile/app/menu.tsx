import React from 'react';
import { StatusBar, ScrollView } from 'react-native';
import { router } from 'expo-router';
import {
    Box,
    Heading,
    Text,
    VStack,
    HStack,
    Pressable,
    Center,
    Button,
    ButtonText
} from '@gluestack-ui/themed';
import { X, Settings, Store, CircleHelp, LogOut, ChevronRight, Home } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { COLORS } from '../constants/colors';

export default function MenuScreen() {
    const { signOut } = useAuthStore();

    const handleLogout = async () => {
        await signOut();
        router.replace('/(auth)/landing');
    };

    return (
        <Box flex={1} bg={COLORS.luxuryBlack} p="$8" safeAreaTop>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <HStack alignItems="center" justifyContent="space-between" mb="$10">
                <Heading color={COLORS.textPrimary} size="3xl" fontWeight="$black">Menu</Heading>
                <Pressable
                    onPress={() => router.back()}
                    h={44}
                    w={44}
                    alignItems="center"
                    justifyContent="center"
                    rounded={500}
                    bg={COLORS.luxuryBlackLight}
                    sx={{ ":active": { bg: COLORS.darkSurface } }}
                >
                    <X size={24} color={COLORS.textPrimary} />
                </Pressable>
            </HStack>

            {/* Menu Items */}
            <ScrollView flex={1} showsVerticalScrollIndicator={false}>
                <VStack space="lg" mb="$12">
                    <MenuItem
                        label="Settings"
                        onPress={() => router.push('/settings')}
                    />
                    <MenuItem
                        label="Seller Dashboard"
                        onPress={() => router.push('/seller/dashboard')}
                    />
                    <MenuItem
                        label="Help & Support"
                        onPress={() => { }}
                    />
                    <MenuItem
                        label="Terms & Privacy"
                        onPress={() => { }}
                    />
                </VStack>

                {/* Log Out Button */}
                <Box mt="$6">
                    <Button
                        size="xl"
                        variant="solid"
                        onPress={handleLogout}
                        bg={COLORS.luxuryBlackLight}
                        rounded={500}
                        h={56}
                        sx={{ ":active": { opacity: 0.8 } }}
                    >
                        <ButtonText color={COLORS.errorRed} fontWeight="$bold" size="md">Log Out</ButtonText>
                    </Button>
                </Box>
            </ScrollView>
        </Box>
    );
}

const MenuItem = ({ label, onPress }: { label: string, onPress: () => void }) => (
    <Pressable
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        py="$4"
        px="$2"
        borderBottomWidth={1}
        borderColor={COLORS.darkBorder}
        sx={{ ":active": { opacity: 0.6 } }}
        onPress={onPress}
    >
        <Text color={COLORS.textPrimary} size="lg" fontWeight="$bold">{label}</Text>
        <ChevronRight size={20} color={COLORS.textSecondary} />
    </Pressable>
);
