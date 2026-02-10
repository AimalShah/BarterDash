import { Platform, View, Text } from "react-native";
import { Tabs, router } from "expo-router";
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

const CustomTabBarButton = ({ children, onPress }: any) => (
  <Pressable
    onPress={onPress}
    style={{
      top: Platform.OS === "ios" ? -20 : -30,
      justifyContent: "center",
      alignItems: "center",
    }}
    sx={{ ":active": { opacity: 0.8 } }}
  >
    <Center
      w="$16"
      h="$16"
      rounded="$full"
      bg={COLORS.primaryGold}
      alignItems="center"
      justifyContent="center"
      style={{
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
  const isSeller = profile?.role === "SELLER" || profile?.isSeller;

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
          height: Platform.OS === "ios" ? 88 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 28 : 12,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, size }) => <Grid3X3 size={size} color={color} />,
        }}
      />

      {/* Middle Create Button */}
      <Tabs.Screen
        name="sell"
        options={{
          title: "",
          tabBarButton: (props) => (
            <CustomTabBarButton {...props} onPress={handleSellerAction}>
              <Box height={24} width={24} alignItems="center" justifyContent="center">
                <Box height={2.5} width={18} bg="$white" position="absolute" />
                <Box height={18} width={2.5} bg="$white" position="absolute" />
              </Box>
            </CustomTabBarButton>
          ),
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, size }) => <CartIconWithBadge color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
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
