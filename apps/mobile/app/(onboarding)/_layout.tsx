import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { COLORS } from '../../constants/colors';

export default function OnboardingLayout() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.mainBackground} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.mainBackground },
        }}
      >
        <Stack.Screen name="profile-setup" />
        <Stack.Screen name="interests" />
        <Stack.Screen name="age-verification" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="success" />
      </Stack>
    </>
  );
}
