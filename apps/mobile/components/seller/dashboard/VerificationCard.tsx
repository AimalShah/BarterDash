import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from "react-native";
import { router } from "expo-router";
import { CheckCircle, AlertTriangle, Clock, Shield } from "lucide-react-native";
import { COLORS } from "../../../constants/colors";
import { sellersService } from "../../../lib/api/services/sellers";

interface VerificationCardProps {
  sellerStatus: any;
}

export default function VerificationCard({ sellerStatus }: VerificationCardProps) {
  const [verificationLoading, setVerificationLoading] = useState(false);
  
  const application = sellerStatus?.application;
  const applicationStatus = application?.status as string | undefined;
  const statusLabel = applicationStatus ? applicationStatus.replace(/_/g, " ") : "not started";
  const isStatus = (value: string) => applicationStatus === value;

  const description = (() => {
    if (!applicationStatus) return "Start your seller application to begin verification.";
    if (isStatus("draft") || isStatus("more_info_needed"))
      return "Complete your application and upload the required documents.";
    if (isStatus("submitted"))
      return "Documents submitted. Start identity verification to continue.";
    if (isStatus("in_review")) return "Your identity verification is in review.";
    if (isStatus("approved"))
      return "Your identity has been verified. You are fully approved.";
    if (isStatus("rejected"))
      return "Your verification was rejected. Please contact support or resubmit.";
    return "Check your application status.";
  })();

  const Icon = () => {
    if (isStatus("approved")) return <CheckCircle size={20} color={COLORS.luxuryBlack} />;
    if (isStatus("rejected")) return <AlertTriangle size={20} color={COLORS.luxuryBlack} />;
    if (isStatus("in_review")) return <Clock size={20} color={COLORS.luxuryBlack} />;
    return <Shield size={20} color={COLORS.luxuryBlack} />;
  };

  const iconBg = (() => {
    if (isStatus("approved")) return COLORS.successGreen;
    if (isStatus("rejected")) return COLORS.errorRed;
    if (isStatus("in_review")) return COLORS.warningAmber;
    return COLORS.primaryGold;
  })();

  const handleStartVerification = async () => {
    try {
      setVerificationLoading(true);
      const response = await sellersService.createVerificationSession();
      const supported = await Linking.canOpenURL(response.url);
      if (!supported) {
        Alert.alert("Unable to Open", "Please open the verification link in your browser.");
        return;
      }
      await Linking.openURL(response.url);
    } catch (error: any) {
      console.error("Verification error:", error);
      Alert.alert("Error", error?.message || "Failed to start verification.");
    } finally {
      setVerificationLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>VERIFICATION</Text>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={[styles.icon, { backgroundColor: iconBg }]}>
            <Icon />
          </View>
          <View style={styles.info}>
            <Text style={styles.cardTitle}>Identity Verification</Text>
            <Text style={styles.status}>Status: {statusLabel.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.description}>{description}</Text>
        {(!applicationStatus || isStatus("draft") || isStatus("more_info_needed")) && (
          <TouchableOpacity
            onPress={() => router.push("/seller/register")}
            style={styles.button}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Complete Application</Text>
          </TouchableOpacity>
        )}
        {isStatus("submitted") && (
          <TouchableOpacity
            onPress={handleStartVerification}
            style={styles.button}
            activeOpacity={0.85}
            disabled={verificationLoading}
          >
            <Text style={styles.buttonText}>
              {verificationLoading ? "Starting Verification..." : "Start Verification"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.luxuryBlackLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
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
  status: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  button: {
    backgroundColor: COLORS.primaryGold,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: COLORS.luxuryBlack,
    fontSize: 14,
    fontWeight: "900",
  },
});
