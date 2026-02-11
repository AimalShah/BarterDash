import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Video, Calendar, ChevronRight } from "lucide-react-native";
import { COLORS } from "../../../constants/colors";

interface Stream {
  id: string;
  title: string;
  status: string;
  scheduledStart?: string;
}

interface StreamSummaryProps {
  streams: Stream[];
}

export default function StreamSummary({ streams }: StreamSummaryProps) {
  const liveStreamsCount = streams.filter((s) => s.status === "live").length;
  const scheduledStreamsCount = streams.filter((s) => s.status === "scheduled").length;
  const nextScheduledStream = streams
    .filter((s) => s.status === "scheduled" && s.scheduledStart)
    .sort((a, b) => new Date(a.scheduledStart!).getTime() - new Date(b.scheduledStart!).getTime())[0];

  const formatShortDate = (dateString?: string) => {
    if (!dateString) return "Not scheduled";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>STREAMS</Text>
        <TouchableOpacity onPress={() => router.push("/seller/streams")}>
          <Text style={styles.manageText}>Manage</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/seller/streams")}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Video size={18} color={COLORS.primaryGold} />
          </View>
          <View style={styles.info}>
            <Text style={styles.cardTitle}>Stream Control</Text>
            <Text style={styles.subtitle}>
              {liveStreamsCount} live · {scheduledStreamsCount} scheduled
            </Text>
          </View>
          <ChevronRight size={18} color={COLORS.textSecondary} />
        </View>
        <View style={styles.nextRow}>
          <Calendar size={14} color={COLORS.textSecondary} />
          <Text style={styles.nextText}>
            {nextScheduledStream
              ? `Next: ${nextScheduledStream.title} · ${formatShortDate(nextScheduledStream.scheduledStart)}`
              : "No upcoming streams scheduled"}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  manageText: {
    color: COLORS.primaryGold,
    fontSize: 13,
    fontWeight: "700",
  },
  card: {
    backgroundColor: COLORS.luxuryBlackLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${COLORS.primaryGold}20`,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  nextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.darkBorder,
  },
  nextText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    flex: 1,
  },
});
