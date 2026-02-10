import React, { useState } from 'react';
import { Alert, StatusBar } from 'react-native';
import { router } from 'expo-router';
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
    FormControl,
    FormControlLabel,
    FormControlLabelText,
} from '@gluestack-ui/themed';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants/colors';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'barterdash://auth/update-password',
            });

            if (error) throw error;
            Alert.alert('Success', 'Check your email for the password reset link.');
            router.back();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box flex={1} bg={COLORS.luxuryBlack} justifyContent="center" p="$4">
            <StatusBar barStyle="light-content" />
            <Box w="$full" maxWidth={380} alignSelf="center">
                <Box
                    bg={COLORS.luxuryBlackLight}
                    p="$6"
                    rounded="$xl"
                    borderWidth={1}
                    borderColor={COLORS.darkBorder}
                    sx={{
                        shadowColor: COLORS.luxuryBlack,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 10,
                        elevation: 5,
                    }}
                >
                    <VStack space="md">
                        <Heading size="xl" color={COLORS.textPrimary} textAlign="center" mb="$2">Forgot Password?</Heading>
                        <Text color={COLORS.textSecondary} textAlign="center" mb="$4" size="sm">
                            Enter your email address and we'll send you a link to reset your password.
                        </Text>

                        <FormControl>
                            <FormControlLabel mb="$1">
                                <FormControlLabelText color={COLORS.textSecondary}>Email</FormControlLabelText>
                            </FormControlLabel>
                            <Input
                                variant="outline"
                                size="md"
                                isDisabled={false}
                                isInvalid={false}
                                isReadOnly={false}
                                borderColor={COLORS.darkBorder}
                                bg={COLORS.luxuryBlackLighter}
                            >
                                <InputField
                                    placeholder="name@example.com"
                                    color={COLORS.textPrimary}
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    placeholderTextColor={COLORS.textMuted}
                                />
                            </Input>
                        </FormControl>

                        <Button
                            size="lg"
                            variant="solid"
                            action="primary"
                            isDisabled={loading}
                            isFocusVisible={false}
                            onPress={handleReset}
                            bg={COLORS.primaryGold}
                            mt="$2"
                            sx={{ ":active": { bg: COLORS.secondaryGold } }}
                        >
                            <ButtonText fontWeight="$bold" color={COLORS.luxuryBlack}>
                                {loading ? "Sending..." : "Send Reset Link"}
                            </ButtonText>
                        </Button>

                        <Button
                            size="md"
                            variant="link"
                            action="secondary"
                            isFocusVisible={false}
                            onPress={() => router.back()}
                            mt="$2"
                        >
                            <ButtonText color={COLORS.textSecondary}>Back to Login</ButtonText>
                        </Button>
                    </VStack>
                </Box>
            </Box>
        </Box>
    );
}
