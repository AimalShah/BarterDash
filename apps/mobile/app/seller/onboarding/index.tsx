import React, { useEffect, useState } from 'react';
import { View, ScrollView, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Text } from '../../../components/ui/Text';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Check, Circle } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { COLORS } from '@/constants/colors';

const STEPS = ['Business Info', 'Verification', 'Payouts', 'Review'];

export default function SellerOnboardingScreen() {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const { profile, isOnboarded } = useAuthStore();

    useEffect(() => {
        const checkOnboarding = async () => {
            if (!isOnboarded()) {
                Alert.alert(
                    'Complete Setup First',
                    'Please finish setting up your profile before becoming a seller.',
                    [
                        { 
                            text: 'Continue Setup', 
                            onPress: () => router.replace('/(onboarding)/profile-setup') 
                        },
                        { 
                            text: 'Go Home', 
                            onPress: () => router.replace('/(tabs)'),
                            style: 'cancel' 
                        },
                    ]
                );
            }
            setLoading(false);
        };

        checkOnboarding();
    }, [profile, isOnboarded]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primaryGold} />
            </View>
        );
    }

    const handleNext = () => {
        if (step < STEPS.length - 1) {
            setStep(step + 1);
        } else {
            router.replace('/seller/dashboard');
        }
    };

    return (
        <ScrollView className="flex-1 bg-background p-4">
            {/* Progress Steps */}
            <View className="flex-row justify-between mb-8 px-2">
                {STEPS.map((s, i) => (
                    <View key={s} className="items-center">
                        <View className={`h-8 w-8 rounded-full items-center justify-center mb-1 ${i <= step ? 'bg-primary' : 'bg-secondary'}`}>
                            {i < step ? <Check size={16} color="#000" /> : <Text className={`font-bold ${i === step ? 'text-black' : 'text-muted-foreground'}`}>{i + 1}</Text>}
                        </View>
                        <Text className={`text-[10px] ${i <= step ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>{s}</Text>
                    </View>
                ))}
            </View>

            <Card>
                <CardHeader>
                    <CardTitle>{STEPS[step]}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {step === 0 && (
                        <>
                            <Input label="Business Name" placeholder="LLC or Display Name" />
                            <Input label="Tax ID / SSN" placeholder="XXX-XX-XXXX" />
                            <Input label="Address" placeholder="Street Address" />
                        </>
                    )}
                    {step === 1 && (
                        <>
                            <Text className="text-muted-foreground mb-4">
                                Keep the marketplace safe. We need to verify your identity.
                            </Text>
                            <Button variant="outline" label="Upload Government ID" />
                            <Button variant="outline" label="Verify Phone Number" className="mt-2" />
                        </>
                    )}
                    {step === 2 && (
                        <>
                            <Text className="text-muted-foreground mb-4">
                                Where should we send your earnings?
                            </Text>
                            <Input label="Bank Routing Number" placeholder="XXXXXXXXX" keyboardType="numeric" />
                            <Input label="Account Number" placeholder="XXXXXXXXXXXX" keyboardType="numeric" />
                        </>
                    )}
                    {step === 3 && (
                        <>
                            <Text className="mb-4">
                                By clicking Submit, you agree to our Seller Terms of Service and Commission Structure (10% + $0.30/txn).
                            </Text>
                            <View className="bg-secondary p-4 rounded-md">
                                <View className="flex-row justify-between mb-2">
                                    <Text className="text-muted-foreground">Business</Text>
                                    <Text className="font-semibold">Sneaker Empire LLC</Text>
                                </View>
                                <View className="flex-row justify-between">
                                    <Text className="text-muted-foreground">Bank</Text>
                                    <Text className="font-semibold">Chase ****4432</Text>
                                </View>
                            </View>
                        </>
                    )}

                    <Button
                        label={step === STEPS.length - 1 ? "Submit Application" : "Continue"}
                        onPress={handleNext}
                        className="mt-6 bg-primary"
                    />
                </CardContent>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.luxuryBlack,
    },
});
