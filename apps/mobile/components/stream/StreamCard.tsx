import React, { memo, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns";
import { getStreamThumbnail, isValidImageUrl } from "@/lib/utils/imageUtils";
import { Bell } from "lucide-react-native";
import { streamsService } from "@/lib/api/services/streams";
import { COLORS } from "@/constants/colors";

const { width } = Dimensions.get("window");

interface StreamCardProps {
  stream: any;
  isLive: boolean;
}

const StreamCard = memo(
  ({ stream, isLive }: StreamCardProps) => {
    const router = useRouter();
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const [notifying, setNotifying] = useState(false);

    const getFormattedTime = () => {
      if (!stream.scheduledStart) return "";
      
      try {
        const date = new Date(stream.scheduledStart);
        
        if (isToday(date)) {
          return `Today at ${format(date, "h:mm a")}`;
        } else if (isTomorrow(date)) {
          return `Tomorrow at ${format(date, "h:mm a")}`;
        } else {
          return format(date, "MMM d, h:mm a");
        }
      } catch (e) {
        return "Scheduled";
      }
    };

    const getRelativeTime = () => {
      if (!stream.scheduledStart) return "";
      
      try {
        return formatDistanceToNow(new Date(stream.scheduledStart), { addSuffix: true });
      } catch (e) {
        return "";
      }
    };

    const sellerId = (stream as any).sellerId ?? (stream.seller as any)?.id;

    // Get validated thumbnail URL using imageUtils
    const thumbnailUrl = getStreamThumbnail(stream);
    const hasValidThumbnail = isValidImageUrl(thumbnailUrl) && !imageError;
    
    // Debug logging
    console.log('StreamCard thumbnail debug:', {
      streamId: stream.id,
      thumbnailUrl,
      hasValidThumbnail,
      streamData: {
        thumbnailUrl: stream.thumbnailUrl,
        thumbnail_url: stream.thumbnail_url,
      }
    });

    const handleImageLoad = useCallback(() => {
      setImageLoading(false);
    }, []);

    const handleImageError = useCallback((error: any) => {
      console.log('StreamCard image error:', {
        streamId: stream.id,
        thumbnailUrl,
        error: error?.nativeEvent || error
      });
      setImageLoading(false);
      setImageError(true);
    }, [thumbnailUrl, stream.id]);

    const handleNotify = async () => {
      if (notifying) return;
      
      setNotifying(true);
      try {
        await streamsService.subscribe(stream.id);
        Alert.alert("Success", "You'll be notified when this stream goes live!");
      } catch (error) {
        Alert.alert("Error", "Failed to subscribe. Please try again.");
      } finally {
        setNotifying(false);
      }
    };

    return (
      <TouchableOpacity
        onPress={() => router.push(`/stream/${stream.id}`)}
        activeOpacity={0.9}
        style={{
          backgroundColor: COLORS.luxuryBlack,
          width: "100%",
        }}
      >
        {/* Seller Info - Top */}
        <TouchableOpacity
          onPress={() => sellerId && router.push(`/user/${sellerId}`)}
          activeOpacity={0.7}
          style={{ 
            flexDirection: "row", 
            alignItems: "center", 
            marginBottom: 8,
            paddingHorizontal: 4,
          }}
        >
          {/* Seller Avatar */}
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              overflow: "hidden",
              backgroundColor: COLORS.darkSurface,
              marginRight: 10,
            }}
          >
            {stream.seller?.avatarUrl ? (
              <Image
                source={{ uri: stream.seller.avatarUrl }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: COLORS.primaryGold,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "bold", color: COLORS.luxuryBlack }}>
                  {(stream.seller?.username || "?").charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Seller Username */}
          <Text
            numberOfLines={1}
            style={{
              color: COLORS.textPrimary,
              fontSize: 13,
              fontWeight: "600",
            }}
          >
            @{stream.seller?.username || "unknown"}
          </Text>
        </TouchableOpacity>

        {/* Image - Rounded, Long Vertical */}
        <View style={{ 
          width: "100%", 
          aspectRatio: 0.6, // Tall vertical image
          position: "relative",
          borderRadius: 16,
          overflow: "hidden",
        }}>
          {hasValidThumbnail ? (
            <>
              <Image
                source={{ uri: thumbnailUrl! }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
              {imageLoading && (
                <View style={{ 
                  position: "absolute", 
                  inset: 0, 
                  alignItems: "center", 
                  justifyContent: "center", 
                  backgroundColor: COLORS.darkSurface 
                }}>
                  <ActivityIndicator size="small" color={COLORS.textPrimary} />
                </View>
              )}
            </>
          ) : (
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=600&fit=crop" }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}

          {/* Live Badge with Count - Format: "live . count" */}
          {isLive && (
            <View
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                backgroundColor: COLORS.overlayStrong,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 6,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View style={{ 
                width: 6, 
                height: 6, 
                backgroundColor: COLORS.liveIndicator, 
                borderRadius: 3, 
                marginRight: 6 
              }} />
              <Text style={{ 
                color: COLORS.textPrimary, 
                fontSize: 11, 
                fontWeight: "700" 
              }}>
                live . {stream.viewerCount || 0}
              </Text>
            </View>
          )}

          {/* Upcoming Badge for Scheduled Streams */}
          {!isLive && (
            <View
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                backgroundColor: COLORS.primaryGold,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 6,
              }}
            >
              <Text style={{ 
                color: COLORS.luxuryBlack, 
                fontSize: 10, 
                fontWeight: "800" 
              }}>
                UPCOMING
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Info Section */}
        <View
          style={{
            paddingTop: 10,
            paddingHorizontal: 4,
          }}
        >
          {/* Stream Title */}
          <Text
            numberOfLines={2}
            style={{
              color: COLORS.textPrimary,
              fontSize: 14,
              fontWeight: "600",
              marginBottom: 4,
            }}
          >
            {stream.title || "Untitled"}
          </Text>

          {/* Category */}
          {stream.category && (
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 11,
                fontWeight: "500",
                marginBottom: 6,
              }}
            >
              {stream.category.name}
            </Text>
          )}

          {/* Scheduled Time & Notify Button */}
          {!isLive && stream.scheduledStart && (
            <View style={{ marginTop: 4 }}>
              <Text
                style={{
                  color: COLORS.textPrimary,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {getFormattedTime()}
              </Text>
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 11,
                  marginTop: 2,
                  marginBottom: 8,
                }}
              >
                {getRelativeTime()}
              </Text>
              
              {/* Notify Button */}
              <TouchableOpacity
                onPress={handleNotify}
                disabled={notifying}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: COLORS.primaryGold,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  marginTop: 4,
                }}
              >
                {notifying ? (
                  <ActivityIndicator size="small" color={COLORS.luxuryBlack} />
                ) : (
                  <>
                    <Bell size={14} color={COLORS.luxuryBlack} style={{ marginRight: 6 }} />
                    <Text style={{ color: COLORS.luxuryBlack, fontSize: 12, fontWeight: "700" }}>
                      Notify Me
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  },
  (prev, next) => {
    return (
      prev.stream.id === next.stream.id &&
      prev.stream.viewerCount === next.stream.viewerCount &&
      prev.stream.status === next.stream.status &&
      prev.isLive === next.isLive
    );
  },
);

StreamCard.displayName = "StreamCard";

export default StreamCard;
