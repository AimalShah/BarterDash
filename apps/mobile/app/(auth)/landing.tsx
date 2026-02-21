import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ShoppingBag } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { COLORS } from '@/constants/colors';

export default function LandingScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-between px-6 pb-10 pt-12">
        <View className="items-center">
          <LinearGradient
            colors={[COLORS.primaryBlue, COLORS.blueLavender]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: 84, height: 84, borderRadius: 24 }}
            className="items-center justify-center"
          >
            <ShoppingBag size={34} color="#FFFFFF" />
          </LinearGradient>

          <Text variant="h1" className="mt-7 text-center">
            BarterDash
          </Text>
          <Text color="secondary" className="mt-3 text-center">
            Live auctions, products, and real-time shopping in one place.
          </Text>
        </View>

        <View>
          <Button
            variant="primary"
            size="lg"
            label="Sign In"
            onPress={() => router.push('/(auth)/login')}
            className="rounded-2xl"
          />
          <Button
            variant="outline"
            size="lg"
            label="Create Account"
            onPress={() => router.push('/(auth)/register')}
            className="mt-3 rounded-2xl"
          />

          <Text color="muted" className="mt-7 text-center">
            By continuing, you agree to our Terms and Privacy Policy.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
