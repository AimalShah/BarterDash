import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { COLORS } from '../../constants/colors';

export default function AuthLayout() {
    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.luxuryBlack} />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="landing" />
                <Stack.Screen name="login" />
                <Stack.Screen name="register" />
                <Stack.Screen name="forgot-password" />
            </Stack>
        </>
    );
}
