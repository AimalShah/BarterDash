import React from "react";
import { View, Text } from "react-native";
import { COLORS } from "@/constants/colors";

export default function ViewerStreamViewStream() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.luxuryBlack,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Text
        style={{
          color: COLORS.textPrimary,
          fontSize: 18,
          fontWeight: "800",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        Live stream preview isn’t available on web
      </Text>
      <Text
        style={{
          color: COLORS.textSecondary,
          fontSize: 14,
          textAlign: "center",
        }}
      >
        Use iOS/Android to view live streams. This keeps the web preview fast and stable.
      </Text>
    </View>
  );
}
