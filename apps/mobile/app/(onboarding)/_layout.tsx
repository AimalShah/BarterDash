import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { COLORS } from '../../constants/colors';

export default function OnboardingLayout() {
    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.luxuryBlack} />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="profile-setup" />
                <Stack.Screen name="interests" />
                <Stack.Screen name="age-verification" />
                <Stack.Screen name="notifications" />
                <Stack.Screen name="success" />
            </Stack>
        </>
    );
}
