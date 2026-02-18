import { Platform, View, Text } from "react-native";
import { Tabs, router } from "expo-router";
import type { ReactNode } from "react";
import {
  Home,
  Grid3X3,
  MessageCircle,
  ShoppingBag,
  User,
  ShoppingCart,
} from "lucide-react-native";
import { Box, Pressable, Center } from "@gluestack-ui/themed";
import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";
import { COLORS } from "../../constants/colors";
import { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";

const CustomTabBarButton = ({
  children,
  onPress,
  lift,
  size,
}: {
  children: ReactNode;
  onPress?: () => void;
  lift: number;
  size: number;
}) => (
  <Pressable
    onPress={onPress}
    style={{
      top: -lift,
      justifyContent: "center",
      alignItems: "center",
    }}
    sx={{ ":active": { opacity: 0.8 } }}
  >
    <Center
      bg={COLORS.primaryGold}
      alignItems="center"
      justifyContent="center"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        shadowColor: COLORS.luxuryBlack,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 5,
      }}
    >
      {children}
    </Center>
  </Pressable>
);

// Cart Badge Component
const CartIconWithBadge = ({ color, size }: { color: string; size: number }) => {
  const { itemCount, fetchCartCount } = useCartStore();

  useEffect(() => {
    fetchCartCount();
  }, []);

  return (
    <View style={{ position: "relative" }}>
      <ShoppingCart size={size} color={color} />
      {itemCount > 0 && (
        <View
          style={{
            position: "absolute",
            top: -6,
            right: -8,
            backgroundColor: COLORS.liveIndicator,
            borderRadius: 10,
            minWidth: 18,
            height: 18,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: COLORS.navBackground,
          }}
        >
          <Text
            style={{
              color: COLORS.textPrimary,
              fontSize: 10,
              fontWeight: "bold",
            }}
          >
            {itemCount > 99 ? "99+" : itemCount}
          </Text>
        </View>
      )}
    </View>
  );
};

export default function TabLayout() {
  const { profile } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { isSmallPhone, isTablet } = useResponsiveLayout();
  const legacyProfile = profile as any;
  const isSeller =
    profile?.role === "SELLER" ||
    profile?.is_seller === true ||
    legacyProfile?.isSeller === true;

  const handleSellerAction = () => {
    if (!profile) {
      router.push("/(auth)/landing");
      return;
    }

    if (isSeller) {
      router.push("/seller/dashboard");
    } else {
      router.push("/seller/register");
    }
  };

  const tabBarHeight = (isTablet ? 76 : 64) + Math.max(insets.bottom, 8);
  const tabBarPaddingBottom = Math.max(insets.bottom, isTablet ? 14 : 10);
  const tabBarPaddingTop = isTablet ? 10 : 8;
  const tabLabelSize = isSmallPhone ? 9 : 10;
  const floatingButtonSize = isTablet ? 68 : 60;
  const floatingButtonLift =
    (Platform.OS === "ios" ? 18 : 22) + Math.max(insets.bottom - 6, 0) * 0.35;
  const iconSize = isTablet ? 24 : 22;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.primaryGold,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.navBackground,
          borderTopWidth: 1,
          borderTopColor: COLORS.darkBorder,
          height: tabBarHeight,
          paddingTop: tabBarPaddingTop,
          paddingBottom: tabBarPaddingBottom,
        },
        tabBarLabelStyle: {
          fontSize: tabLabelSize,
          fontWeight: "600",
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home size={iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: "Discover",
          tabBarIcon: ({ color }) => <Grid3X3 size={iconSize} color={color} />,
        }}
      />

      {/* Middle Create Button */}
      <Tabs.Screen
        name="sell"
        options={{
          title: "",
          tabBarButton: (props) => (
            <CustomTabBarButton
              {...props}
              onPress={handleSellerAction}
              lift={floatingButtonLift}
              size={floatingButtonSize}
            >
              <Box
                height={iconSize}
                width={iconSize}
                alignItems="center"
                justifyContent="center"
              >
                <Box height={2.5} width={iconSize - 4} bg="$white" position="absolute" />
                <Box height={iconSize - 4} width={2.5} bg="$white" position="absolute" />
              </Box>
            </CustomTabBarButton>
          ),
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color }) => <CartIconWithBadge color={color} size={iconSize} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User size={iconSize} color={color} />,
        }}
      />
      {/* Hidden screens */}
      <Tabs.Screen
        name="inbox"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="checkout"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="my-bids"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
