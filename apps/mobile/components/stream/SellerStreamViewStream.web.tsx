import React from "react";
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { COLORS } from "@/constants/colors";

export default function SellerStreamViewStream() {
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
        Live seller streaming isn’t available on web
      </Text>
      <Text
        style={{
          color: COLORS.textSecondary,
          fontSize: 14,
          textAlign: "center",
        }}
      >
        Use iOS/Android to go live. The web preview skips native video dependencies.
      </Text>
    </View>
  );
}
