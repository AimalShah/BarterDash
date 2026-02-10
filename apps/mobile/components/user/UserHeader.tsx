import React from 'react';
import { Box, HStack, VStack, Heading, Text, Pressable, Image } from "@gluestack-ui/themed";
import { ChevronLeft, Share2, MessageSquare, BadgeCheck } from 'lucide-react-native';
import { COLORS } from "@/constants/colors";

interface UserHeaderProps {
    isSeller: boolean;
    username: string;
    displayName: string;
    avatarUrl?: string;
    onBack: () => void;
    onShare?: () => void;
    onMessage?: () => void;
    isOwnProfile?: boolean;
}

export const UserHeader = ({
    isSeller,
    username,
    displayName,
    avatarUrl,
    onBack,
    onShare,
    onMessage,
    isOwnProfile,
}: UserHeaderProps) => {
    if (isSeller) {
        return (
            <>
                <Box position="relative">
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2574&auto=format&fit=crop' }}
                        alt="Cover"
                        w="100%"
                        h={176}
                        opacity={0.6}
                        resizeMode="cover"
                        bg={COLORS.luxuryBlackLighter}
                    />
                    <Box position="absolute" top="$0" left="$0" right="$0" sx={{ "@base": { pt: "$12" } }}>
                        <Box px="$6" pt="$2">
                            <Pressable
                                onPress={onBack}
                                h={44}
                                w={44}
                                bg={COLORS.luxuryBlack}
                                rounded="$full"
                                alignItems="center"
                                justifyContent="center"
                                sx={{ ":active": { bg: COLORS.luxuryBlackLighter },
                                    shadowColor: COLORS.luxuryBlack,
                                    shadowOpacity: 0.1,
                                    shadowRadius: 4,
                                    elevation: 2,
                                }}
                            >
                                <ChevronLeft size={24} color={COLORS.textPrimary} />
                            </Pressable>
                        </Box>
                    </Box>
                </Box>
                <Box px="$6" mt={-48}>
                    <HStack alignItems="flex-end" justifyContent="space-between">
                        <Box
                            h={96}
                            w={96}
                            rounded={32}
                            bg={COLORS.luxuryBlack}
                            borderWidth={4}
                            borderColor={COLORS.luxuryBlack}
                            overflow="hidden"
                            alignItems="center"
                            justifyContent="center"
                            sx={{
                                shadowColor: COLORS.luxuryBlack,
                                shadowOpacity: 0.1,
                                shadowRadius: 8,
                                elevation: 4,
                            }}
                        >
                            {avatarUrl ? (
                                <Image
                                    source={{ uri: avatarUrl }}
                                    alt={username}
                                    w="100%"
                                    h="100%"
                                />
                            ) : (
                                <Heading size="3xl" color={COLORS.textPrimary}>
                                    {username.charAt(0).toUpperCase()}
                                </Heading>
                            )}
                        </Box>
                        <HStack space="sm">
                            <Pressable
                                onPress={onShare}
                                h={44}
                                w={44}
                                bg={COLORS.luxuryBlack}
                                rounded="$full"
                                alignItems="center"
                                justifyContent="center"
                                borderWidth={1}
                                borderColor={COLORS.darkBorder}
                                sx={{ ":active": { bg: COLORS.luxuryBlackLighter } }}
                            >
                                <Share2 size={20} color={COLORS.textPrimary} />
                            </Pressable>
                            {!isOwnProfile && (
                                <Pressable
                                    onPress={onMessage}
                                    h={44}
                                    w={44}
                                    bg={COLORS.primaryGold}
                                    rounded="$full"
                                    alignItems="center"
                                    justifyContent="center"
                                    sx={{ ":active": { opacity: 0.9 } }}
                                >
                                    <MessageSquare size={20} color={COLORS.luxuryBlack} />
                                </Pressable>
                            )}
                        </HStack>
                    </HStack>
                    <Box mt="$4">
                        <HStack alignItems="center" space="xs">
                            <Heading size="2xl" color={COLORS.textPrimary} fontWeight="$black">{displayName}</Heading>
                            <BadgeCheck size={24} color={COLORS.primaryGold} />
                        </HStack>
                        <Text color={COLORS.textSecondary} size="lg">@{username}</Text>
                        <Box
                            bg={COLORS.primaryGold}
                            alignSelf="flex-start"
                            px="$3"
                            py="$1"
                            rounded="$full"
                            mt="$2"
                        >
                            <Text color={COLORS.luxuryBlack} size="2xs" fontWeight="$bold" textTransform="uppercase" letterSpacing={0.8}>Seller · Store</Text>
                        </Box>
                    </Box>
                </Box>
            </>
        );
    }

    return (
        <>
            <Box sx={{ "@base": { pt: "$10" } }}>
                <HStack px="$6" pt="$2" pb="$4" alignItems="center" justifyContent="space-between">
                    <Pressable
                        onPress={onBack}
                        h={44}
                        w={44}
                        rounded="$full"
                        alignItems="center"
                        justifyContent="center"
                        bg={COLORS.luxuryBlackLighter}
                        sx={{ ":active": { bg: COLORS.darkSurface } }}
                    >
                        <ChevronLeft size={24} color={COLORS.textPrimary} />
                    </Pressable>
                    <HStack space="sm">
                        <Pressable
                            onPress={onShare}
                            h={40}
                            w={40}
                            bg={COLORS.luxuryBlack}
                            rounded="$full"
                            alignItems="center"
                            justifyContent="center"
                            borderWidth={1}
                            borderColor={COLORS.darkBorder}
                            sx={{ ":active": { bg: COLORS.luxuryBlackLighter } }}
                        >
                            <Share2 size={18} color={COLORS.textPrimary} />
                        </Pressable>
                        {!isOwnProfile && (
                            <Pressable
                                onPress={onMessage}
                                h={40}
                                w={40}
                                bg={COLORS.primaryGold}
                                rounded="$full"
                                alignItems="center"
                                justifyContent="center"
                                sx={{ ":active": { opacity: 0.9 } }}
                            >
                                <MessageSquare size={18} color={COLORS.luxuryBlack} />
                            </Pressable>
                        )}
                    </HStack>
                </HStack>
            </Box>
            <Box px="$6" pb="$6" borderBottomWidth={1} borderColor={COLORS.darkBorder}>
                <HStack alignItems="center" space="md">
                    <Box
                        h={80}
                        w={80}
                        rounded={24}
                        bg={COLORS.luxuryBlackLighter}
                        borderWidth={1}
                        borderColor={COLORS.darkBorder}
                        overflow="hidden"
                        alignItems="center"
                        justifyContent="center"
                    >
                        {avatarUrl ? (
                            <Image
                                source={{ uri: avatarUrl }}
                                alt={username}
                                w="100%"
                                h="100%"
                            />
                        ) : (
                            <Heading size="2xl" color={COLORS.textSecondary}>
                                {username.charAt(0).toUpperCase()}
                            </Heading>
                        )}
                    </Box>
                    <VStack flex={1}>
                        <Heading color={COLORS.textPrimary} size="xl" fontWeight="$black">{displayName}</Heading>
                        <Text color={COLORS.textSecondary} size="md">@{username}</Text>
                        <Box
                            bg={COLORS.luxuryBlackLighter}
                            alignSelf="flex-start"
                            px="$3"
                            py="$1"
                            rounded={8}
                            mt="$1.5"
                            borderWidth={1}
                            borderColor={COLORS.darkBorder}
                        >
                            <Text color={COLORS.textSecondary} size="2xs" fontWeight="$bold" textTransform="uppercase" letterSpacing={0.8}>Member</Text>
                        </Box>
                    </VStack>
                </HStack>
            </Box>
        </>
    );
};
