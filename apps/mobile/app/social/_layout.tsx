import { Stack } from 'expo-router';

export default function SocialLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="followers/[id]" />
      <Stack.Screen name="following/[id]" />
    </Stack>
  );
}
