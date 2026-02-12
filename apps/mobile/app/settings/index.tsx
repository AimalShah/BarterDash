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
    Icon,
} from "@gluestack-ui/themed";
import {
    ChevronLeft,
    ChevronRight,
    User,
    Bell,
    Lock,
    Shield,
    HelpCircle,
    Info,
    Mail,
    LogOut,
    Eye
} from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/context/ToastContext';
import { COLORS } from '../../constants/colors';

export default function SettingsScreen() {
    const { signOut } = useAuthStore();
    const { showSuccess } = useToast();

    const handleLogout = async () => {
        await signOut();
        router.replace('/(auth)/landing');
        showSuccess('Signed out successfully');
    };

    return (
        <Box flex={1} bg={COLORS.luxuryBlack}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <Box px="$6" py="$4" borderBottomWidth={1} borderColor={COLORS.darkBorder}>
                <HStack alignItems="center">
                    <Pressable onPress={() => router.back()} mr="$4" h={40} w={40} rounded={500} alignItems="center" justifyContent="center" bg={COLORS.luxuryBlackLight} sx={{ ":active": { bg: COLORS.darkSurface } }}>
                        <ChevronLeft size={22} color={COLORS.textPrimary} />
                    </Pressable>
                    <Heading color={COLORS.textPrimary} size="xl" fontWeight="$bold">Settings</Heading>
                </HStack>
            </Box>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <VStack px="$6" pt="$8" space="xl" pb="$12">
                    <Box>
                        <Text color={COLORS.textMuted} size="xs" fontWeight="$bold" textTransform="uppercase" letterSpacing={1.2} mb="$4">
                            Account
                        </Text>
                        <VStack space="md">
                            <SettingsItem
                                icon={<User size={20} color={COLORS.textPrimary} />}
                                label="Profile Information"
                                onPress={() => { }}
                            />
                            <SettingsItem
                                icon={<Mail size={20} color={COLORS.textPrimary} />}
                                label="Email Settings"
                                onPress={() => { }}
                            />
                            <SettingsItem
                                icon={<Lock size={20} color={COLORS.textPrimary} />}
                                label="Change Password"
                                onPress={() => router.push('/settings/change-password')}
                            />
                        </VStack>
                    </Box>

                    <Box mt="$2">
                        <Text color={COLORS.textMuted} size="xs" fontWeight="$bold" textTransform="uppercase" letterSpacing={1.2} mb="$4">
                            Preferences
                        </Text>
                        <VStack space="md">
                            <SettingsItem
                                icon={<Bell size={20} color={COLORS.textPrimary} />}
                                label="Notifications"
                                onPress={() => { }}
                            />
                            <SettingsItem
                                icon={<Eye size={20} color={COLORS.textPrimary} />}
                                label="Privacy & Visibility"
                                onPress={() => router.push('/settings/privacy')}
                            />
                        </VStack>
                    </Box>

                    <Box mt="$2">
                        <Text color={COLORS.textMuted} size="xs" fontWeight="$bold" textTransform="uppercase" letterSpacing={1.2} mb="$4">
                            Support
                        </Text>
                        <VStack space="md">
                            <SettingsItem
                                icon={<Shield size={20} color={COLORS.textPrimary} />}
                                label="Security Center"
                                onPress={() => { }}
                            />
                            <SettingsItem
                                icon={<HelpCircle size={20} color={COLORS.textPrimary} />}
                                label="Help & Support"
                                onPress={() => { }}
                            />
                            <SettingsItem
                                icon={<Info size={20} color={COLORS.textPrimary} />}
                                label="About BarterDash"
                                onPress={() => { }}
                            />
                        </VStack>
                    </Box>

                    <Box mt="$6" pb="$10">
                        <Pressable
                            onPress={handleLogout}
                            px="$5"
                            py="$4"
                            bg={COLORS.luxuryBlackLight}
                            rounded={24}
                            borderWidth={1}
                            borderColor={COLORS.darkBorder}
                            sx={{ ":active": { bg: COLORS.darkSurface } }}
                        >
                            <HStack alignItems="center" space="md">
                                <Center h="$10" w="$10" rounded={12} bg={`${COLORS.errorRed}20`}>
                                    <LogOut size={20} color={COLORS.errorRed} />
                                </Center>
                                <Text color={COLORS.errorRed} fontWeight="$bold" size="md">Sign Out</Text>
                            </HStack>
                        </Pressable>
                        <Center mt="$8">
                            <Text color={COLORS.textMuted} size="2xs">BarterDash v1.1.0 • Stable</Text>
                        </Center>
                    </Box>
                </VStack>
            </ScrollView>
        </Box>
    );
}

const SettingsItem = ({ icon, label, value, onPress }: { icon: any, label: string, value?: string, onPress: () => void }) => (
    <Pressable
        onPress={onPress}
        px="$5"
        py="$4"
        bg={COLORS.luxuryBlackLight}
        rounded={24}
        borderWidth={1}
        borderColor={COLORS.darkBorder}
        sx={{
            ":active": { bg: COLORS.darkSurface, transform: [{ scale: 0.98 }] },
            shadowColor: COLORS.luxuryBlack,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.02,
            shadowRadius: 5,
            elevation: 2
        }}
    >
        <HStack alignItems="center" justifyContent="space-between">
            <HStack alignItems="center" space="md">
                <Center h={44} w={44} rounded={16} bg={COLORS.luxuryBlackLighter}>
                    {icon}
                </Center>
                <VStack>
                    <Text color={COLORS.textPrimary} fontWeight="$bold" size="md">{label}</Text>
                    {value && <Text color={COLORS.textMuted} size="xs" mt="$0.5">{value}</Text>}
                </VStack>
            </HStack>
            <ChevronRight size={18} color={COLORS.textMuted} />
        </HStack>
    </Pressable>
);
