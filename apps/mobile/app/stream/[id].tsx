import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import ViewerStreamViewStream from "../../components/stream/ViewerStreamViewStream";
import { useStream } from "../../hooks/useStream";
import { COLORS } from "../../constants/colors";

function WatchStreamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { stream, loading } = useStream(id);

  if (loading || !stream) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryGold} />
        <Text style={styles.loadingText}>Connecting to stream...</Text>
      </View>
    );
  }

  return <ViewerStreamViewStream streamId={stream.id} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.luxuryBlack,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: COLORS.textPrimary,
    marginTop: 16,
    fontSize: 16,
  },
});

export default WatchStreamScreen;
