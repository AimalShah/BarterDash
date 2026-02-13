import React, { useState, useEffect } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
    Box,
    Heading,
    Text,
    VStack,
    Input,
    InputField,
    Button,
    ButtonText,
    Center,
    Pressable,
    FormControl,
    FormControlLabel,
    FormControlLabelText,
} from '@gluestack-ui/themed';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';

export default function UpdatePasswordScreen() {
    const insets = useSafeAreaInsets();
    const { access_token } = useLocalSearchParams<{ access_token?: string }>();
    const { setSession } = useAuthStore();
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);

    // Set up session from access token if provided
    useEffect(() => {
        const setupSession = async () => {
            if (access_token) {
                try {
                    console.log('Setting session from access token');
                    // Try to get current session first
                    const { data: { session: currentSession } } = await supabase.auth.getSession();
                    
                    if (!currentSession) {
                        // If no session, we need to exchange the code for a session
                        // The session should already be set by the deep link handler
                        // But if user refreshes or opens directly, we need to handle it
                        console.log('No active session, redirecting to forgot password');
                        Alert.alert(
                            'Session Expired',
                            'Your password reset link has expired. Please request a new one.',
                            [{ text: 'OK', onPress: () => router.replace('/(auth)/forgot-password') }]
                        );
                        return;
                    }
                    
                    console.log('Session active, ready for password update');
                } catch (error: any) {
                    console.error('Session setup error:', error);
                    Alert.alert(
                        'Error',
                        'Failed to validate reset link. Please try again.',
                        [{ text: 'OK', onPress: () => router.replace('/(auth)/forgot-password') }]
                    );
                    return;
                }
            }
            setInitializing(false);
        };

        setupSession();
    }, [access_token]);

    const handleUpdatePassword = async () => {
        if (!password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            Alert.alert(
                'Success',
                'Your password has been updated successfully. Please sign in with your new password.',
                [{ 
                    text: 'OK', 
                    onPress: () => {
                        // Sign out to ensure clean state
                        supabase.auth.signOut();
                        router.replace('/(auth)/login');
                    } 
                }]
            );
        } catch (error: any) {
            console.error('Password update error:', error);
            Alert.alert(
                'Error',
                error.message || 'Failed to update password. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    if (initializing) {
        return (
            <Box flex={1} bg={COLORS.luxuryBlack} justifyContent="center" alignItems="center">
                <StatusBar barStyle="light-content" />
                <ActivityIndicator size="large" color={COLORS.primaryGold} />
                <Text color={COLORS.textSecondary} mt="$4">
                    Validating reset link...
                </Text>
            </Box>
        );
    }

    return (
        <Box flex={1} bg={COLORS.luxuryBlack}>
            <StatusBar barStyle="light-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
            >
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        flexGrow: 1,
                        paddingBottom: Math.max(insets.bottom, 16) + 24,
                    }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Box px="$8" flex={1} justifyContent="center">
                        <VStack space="xl" w="$full">
                            {/* Header */}
                            <VStack space="xs" mb="$4" alignItems="center">
                                <Heading
                                    size="3xl"
                                    color={COLORS.textPrimary}
                                    fontWeight="$black"
                                    textAlign="center"
                                >
                                    Update Password
                                </Heading>
                                <Text color={COLORS.textSecondary} size="md" textAlign="center">
                                    Enter your new password below
                                </Text>
                            </VStack>

                            <VStack space="xl">
                                <FormControl>
                                    <FormControlLabel mb="$2">
                                        <FormControlLabelText
                                            color={COLORS.textPrimary}
                                            fontWeight="$bold"
                                            size="sm"
                                        >
                                            New Password
                                        </FormControlLabelText>
                                    </FormControlLabel>
                                    <Input
                                        variant="outline"
                                        h={56}
                                        borderColor={COLORS.darkBorder}
                                        rounded="$xl"
                                        mb="$2"
                                        justifyContent="center"
                                        bg={COLORS.luxuryBlackLight}
                                        sx={{ ':focus': { borderColor: COLORS.primaryGold } }}
                                    >
                                        <InputField
                                            placeholder="••••••••"
                                            color={COLORS.textPrimary}
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry
                                            autoCapitalize="none"
                                            placeholderTextColor={COLORS.textMuted}
                                            style={{ paddingLeft: 16 }}
                                        />
                                    </Input>
                                </FormControl>

                                <FormControl>
                                    <FormControlLabel mb="$2">
                                        <FormControlLabelText
                                            color={COLORS.textPrimary}
                                            fontWeight="$bold"
                                            size="sm"
                                        >
                                            Confirm Password
                                        </FormControlLabelText>
                                    </FormControlLabel>
                                    <Input
                                        variant="outline"
                                        h={56}
                                        borderColor={COLORS.darkBorder}
                                        rounded="$xl"
                                        justifyContent="center"
                                        bg={COLORS.luxuryBlackLight}
                                        sx={{ ':focus': { borderColor: COLORS.primaryGold } }}
                                    >
                                        <InputField
                                            placeholder="••••••••"
                                            color={COLORS.textPrimary}
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            secureTextEntry
                                            autoCapitalize="none"
                                            placeholderTextColor={COLORS.textMuted}
                                            style={{ paddingLeft: 16 }}
                                        />
                                    </Input>
                                </FormControl>

                                <Button
                                    size="xl"
                                    variant="solid"
                                    isDisabled={loading}
                                    onPress={handleUpdatePassword}
                                    bg={COLORS.primaryGold}
                                    rounded="$full"
                                    h={56}
                                    flex={1}
                                    justifyContent="center"
                                    mt="$4"
                                    p="$1"
                                    sx={{ ':active': { opacity: 0.9 } }}
                                >
                                    <ButtonText
                                        fontWeight="$bold"
                                        color={COLORS.luxuryBlack}
                                        textAlign="center"
                                    >
                                        {loading ? 'Updating...' : 'Update Password'}
                                    </ButtonText>
                                </Button>
                            </VStack>

                            <Center flexDirection="row" mt="$8">
                                <Pressable onPress={() => router.replace('/(auth)/login')}>
                                    <Text color={COLORS.primaryGold} fontWeight="$bold" size="sm">
                                        Back to Login
                                    </Text>
                                </Pressable>
                            </Center>
                        </VStack>
                    </Box>
                </ScrollView>
            </KeyboardAvoidingView>
        </Box>
    );
}
