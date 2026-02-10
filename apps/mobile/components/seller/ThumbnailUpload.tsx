import React from "react";
import { Box, Text, Pressable, Center, Image, Spinner } from "@gluestack-ui/themed";
import { Image as ImageIcon } from "lucide-react-native";
import { COLORS } from "@/constants/colors";

interface ThumbnailUploadProps {
    localImage: string | null;
    uploading: boolean;
    onPickImage: () => void;
}

export const ThumbnailUpload = ({
    localImage,
    uploading,
    onPickImage,
}: ThumbnailUploadProps) => {
    return (
        <Box>
            <Text
                color={COLORS.textPrimary}
                size="2xs"
                fontWeight="$black"
                mb="$4"
                textTransform="uppercase"
                letterSpacing={1.5}
            >
                STREAM THUMBNAIL
            </Text>
            <Pressable
                onPress={onPickImage}
                disabled={uploading}
                aspectRatio={16 / 9}
                bg={COLORS.cardBackground}
                rounded="$sm"
                alignItems="center"
                justifyContent="center"
                borderWidth={1}
                borderColor={COLORS.darkBorder}
                overflow="hidden"
            >
                {localImage ? (
                    <Box w="100%" h="100%">
                        <Image
                            source={{ uri: localImage }}
                            alt="Thumbnail"
                            w="100%"
                            h="100%"
                            resizeMode="cover"
                        />
                        {uploading && (
                            <Center
                                position="absolute"
                                top={0}
                                left={0}
                                right={0}
                                bottom={0}
                                bg={COLORS.overlayStrong}
                            >
                                <Spinner color={COLORS.primaryGold} />
                            </Center>
                        )}
                    </Box>
                ) : (
                    <Center>
                        <ImageIcon size={40} color={COLORS.textPrimary} />
                        <Text color={COLORS.textPrimary} mt="$4" fontWeight="$black" size="xs" textTransform="uppercase">
                            {uploading ? "UPLOADING..." : "SELECT THUMBNAIL"}
                        </Text>
                    </Center>
                )}
            </Pressable>
        </Box>
    );
};
