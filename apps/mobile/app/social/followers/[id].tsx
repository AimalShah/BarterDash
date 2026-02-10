import React, { useEffect, useState } from "react";
import { StatusBar, FlatList, RefreshControl } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Pressable,
  Center,
  Spinner,
  Image,
} from "@gluestack-ui/themed";
import { ChevronLeft } from "lucide-react-native";
import { socialService } from "@/lib/api/services/social";
import { COLORS } from "@/constants/colors";

type SocialUser = { id: string; username: string; avatar_url?: string };

export default function FollowersListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [list, setList] = useState<SocialUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (!id) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await socialService.getFollowers(id);
      const users = Array.isArray(data?.followers) ? data.followers : [];
      setList(users);
    } catch (e) {
      console.error("Followers list error:", e);
      setList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  return (
    <Box flex={1} bg={COLORS.luxuryBlack}>
      <StatusBar barStyle="light-content" />
      <Box h="$10" />

      {/* Header */}
      <Box px="$6" py="$4" borderBottomWidth={1} borderColor={COLORS.darkBorder}>
        <HStack alignItems="center">
          <Pressable
            onPress={() => router.back()}
            h={44}
            w={44}
            rounded={500}
            alignItems="center"
            justifyContent="center"
            bg={COLORS.luxuryBlackLight}
            mr="$3"
            sx={{ ":active": { bg: COLORS.luxuryBlackLighter } }}
          >
            <ChevronLeft size={24} color={COLORS.textPrimary} />
          </Pressable>
          <Heading color={COLORS.textPrimary} size="xl" fontWeight="$black">Followers</Heading>
        </HStack>
      </Box>

      {loading && !refreshing ? (
        <Center flex={1}>
          <Spinner size="large" color={COLORS.textPrimary} />
        </Center>
      ) : (
        <FlatList
          data={list}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={COLORS.textPrimary} />
          }
          ListEmptyComponent={
            <Center py="$16" px="$6">
              <Text color={COLORS.textSecondary} textAlign="center" fontWeight="$medium">No followers yet.</Text>
            </Center>
          }
        />
      )}
    </Box>
  );
}

const renderItem = ({ item }: { item: SocialUser }) => (
  <Pressable
    onPress={() => router.push(`/user/${item.id}`)}
    px="$6"
    py="$4"
    borderBottomWidth={1}
    borderColor={COLORS.darkBorder}
    sx={{ ":active": { bg: COLORS.luxuryBlackLighter } }}
  >
    <HStack alignItems="center">
      {item.avatar_url ? (
        <Image
          source={{ uri: item.avatar_url }}
          alt={item.username}
          w={48}
          h={48}
          rounded={500}
          bg={COLORS.luxuryBlackLighter}
        />
      ) : (
        <Center w={48} h={48} rounded={500} bg={COLORS.luxuryBlackLighter}>
          <Text color={COLORS.textPrimary} fontWeight="$black">{item.username?.[0]?.toUpperCase() ?? "?"}</Text>
        </Center>
      )}
      <Text color={COLORS.textPrimary} fontWeight="$bold" ml="$4" flex={1}>@{item.username || "user"}</Text>
    </HStack>
  </Pressable>
);
