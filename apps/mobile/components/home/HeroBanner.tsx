import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { COLORS } from '@/constants/colors';

export function HeroBanner() {
  return (
    <View className="px-6 pt-2">
      <LinearGradient
        colors={[COLORS.blueLavender, COLORS.softBlue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-3xl p-5"
      >
        <View className="mb-3 w-10 rounded-xl bg-white/70 p-2">
          <Sparkles size={18} color={COLORS.primaryBlue} />
        </View>
        <Text variant="h3">Today&apos;s Live Picks</Text>
        <Text color="secondary" className="mt-2">
          Jump into live streams, discover rare finds, and bid in real time.
        </Text>
      </LinearGradient>
    </View>
  );
}
