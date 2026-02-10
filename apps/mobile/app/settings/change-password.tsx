import React, { useState } from 'react';
import { StatusBar, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import {
    Box,
    Heading,
    Text,
    VStack,
    HStack,
    Pressable,
    Center,
    Spinner,
    FormControl,
    FormControlLabel,
    FormControlLabelText,
    Input,
    InputField,
    Button,
    ButtonText
} from "@gluestack-ui/themed";
import { ChevronLeft, Lock } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { COLORS } from '../../constants/colors';

export default function ChangePasswordScreen() {
    const { showSuccess, showError } = useToast();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            showSuccess('Password updated successfully');
            router.back();
        } catch (error: any) {
            console.error(error);
            showError(error.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box flex={1} bg={COLORS.luxuryBlack}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <Box px="$6" py="$4" borderBottomWidth={1} borderColor={COLORS.darkBorder}>
                <HStack alignItems="center">
                    <Pressable onPress={() => router.back()} mr="$4">
                        <ChevronLeft size={24} color={COLORS.textPrimary} />
                    </Pressable>
                    <Heading color={COLORS.textPrimary} size="xl" fontWeight="$bold">Change Password</Heading>
                </HStack>
            </Box>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <Box px="$6" pt="$8" pb="$12">
                    <Center mb="$8">
                        <Center h="$16" w="$16" rounded="$2xl" bg={`${COLORS.primaryGold}30`} mb="$3">
                            <Lock size={32} color={COLORS.primaryGold} />
                        </Center>
                        <Heading color={COLORS.textPrimary} size="lg" fontWeight="$bold">Secure Your Account</Heading>
                        <Text color={COLORS.textSecondary} mt="$1" textAlign="center">Ensure your new password is at least 6 characters long.</Text>
                    </Center>

                    <VStack space="xl">
                        <FormControl>
                            <FormControlLabel mb="$1">
                                <FormControlLabelText color={COLORS.textSecondary} textTransform="uppercase" size="xs" fontWeight="$bold" letterSpacing={0.4}>Current Password</FormControlLabelText>
                            </FormControlLabel>
                            <Input
                                variant="outline"
                                size="md"
                                bg={COLORS.luxuryBlackLight}
                                borderColor={COLORS.darkBorder}
                                rounded="$2xl"
                                h={56}
                            >
                                <InputField
                                    placeholder="••••••••"
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    secureTextEntry
                                    color={COLORS.textPrimary}
                                    placeholderTextColor={COLORS.textMuted}
                                />
                            </Input>
                        </FormControl>

                        <FormControl>
                            <FormControlLabel mb="$1">
                                <FormControlLabelText color={COLORS.textSecondary} textTransform="uppercase" size="xs" fontWeight="$bold" letterSpacing={0.4}>New Password</FormControlLabelText>
                            </FormControlLabel>
                            <Input
                                variant="outline"
                                size="md"
                                bg={COLORS.luxuryBlackLight}
                                borderColor={COLORS.darkBorder}
                                rounded="$2xl"
                                h={56}
                            >
                                <InputField
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry
                                    color={COLORS.textPrimary}
                                    placeholderTextColor={COLORS.textMuted}
                                />
                            </Input>
                        </FormControl>

                        <FormControl>
                            <FormControlLabel mb="$1">
                                <FormControlLabelText color={COLORS.textSecondary} textTransform="uppercase" size="xs" fontWeight="$bold" letterSpacing={0.4}>Confirm New Password</FormControlLabelText>
                            </FormControlLabel>
                            <Input
                                variant="outline"
                                size="md"
                                bg={COLORS.luxuryBlackLight}
                                borderColor={COLORS.darkBorder}
                                rounded="$2xl"
                                h={56}
                            >
                                <InputField
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                    color={COLORS.textPrimary}
                                    placeholderTextColor={COLORS.textMuted}
                                />
                            </Input>
                        </FormControl>

                        <Box mt="$6">
                            <Button
                                onPress={handleChangePassword}
                                isDisabled={loading}
                                h={56}
                                bg={COLORS.primaryGold}
                                rounded="$2xl"
                                sx={{
                                    ":active": { bg: COLORS.secondaryGold },
                                    shadowColor: COLORS.primaryGold,
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.4,
                                    shadowRadius: 10,
                                    elevation: 5
                                }}
                            >
                                {loading ? <Spinner color={COLORS.luxuryBlack} /> : (
                                    <ButtonText fontWeight="$bold" color={COLORS.luxuryBlack}>Update Password</ButtonText>
                                )}
                            </Button>
                        </Box>
                    </VStack>
                </Box>
            </ScrollView>
        </Box>
    );
}
