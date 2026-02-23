import { Tabs, router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Grid3X3, Home, Plus, ShoppingCart, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { COLORS } from '@/constants/colors';
import { Text } from '@/components/ui/text';
import { useAuthStore } from '@/store/authStore';
import { cartService } from '@/lib/api/services/cart';
import { queryKeys } from '@/lib/api/queryKeys';

interface SellButtonProps {
  children: ReactNode;
  onPress?: () => void;
}

const sellButtonShadowStyle = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 8,
  elevation: 8,
} as const;

function SellButton({ children, onPress }: SellButtonProps) {
  return (
    <Pressable onPress={onPress} className="-mt-3 items-center justify-center">
      <View
        style={sellButtonShadowStyle}
        className="h-14 w-14 items-center justify-center rounded-full bg-primary"
      >
        {children}
      </View>
    </Pressable>
  );
}

function CartIconWithBadge({ color, size }: { color: string; size: number }) {
  const { data = 0 } = useQuery({
    queryKey: [...queryKeys.cart, 'count'],
    queryFn: cartService.getItemCount,
  });
  const itemCount = data;

  return (
    <View>
      <ShoppingCart size={size} color={color} />
      {itemCount > 0 ? (
        <View className="absolute -right-2 -top-1 min-w-4 rounded-full bg-error px-1 py-0.5">
          <Text className="text-[10px] text-white">{itemCount > 99 ? '99+' : itemCount}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((state) => state.profile);
  const isSeller =
    profile?.role === 'SELLER' || profile?.is_seller === true;

  const handleSellerAction = () => {
    if (!profile) {
      router.push('/(auth)/landing');
      return;
    }

    if (isSeller) {
      router.push('/seller/dashboard');
      return;
    }

    router.push('/seller/register');
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.primaryBlue,
        tabBarInactiveTintColor: COLORS.lightGrey,
        tabBarStyle: {
          backgroundColor: COLORS.cardWhite,
          borderTopColor: COLORS.darkBorderLight,
          height: 64 + Math.max(insets.bottom, 6),
          paddingBottom: Math.max(insets.bottom, 6),
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color }) => <Grid3X3 size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: '',
          tabBarButton: (props) => (
            <SellButton {...props} onPress={handleSellerAction}>
              <Plus size={24} color="#FFFFFF" />
            </SellButton>
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color }) => <CartIconWithBadge color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={20} color={color} />,
        }}
      />
      <Tabs.Screen name="inbox" options={{ href: null }} />
      <Tabs.Screen name="checkout" options={{ href: null }} />
      <Tabs.Screen name="search" options={{ href: null }} />
      <Tabs.Screen name="my-bids" options={{ href: null }} />
    </Tabs>
  );
}
