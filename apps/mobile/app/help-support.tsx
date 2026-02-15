import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Mail, MessageCircle, Phone, FileText, ExternalLink } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';

interface SupportOption {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action: () => void;
  type: 'email' | 'link' | 'phone';
}

export default function HelpSupportScreen() {
  const supportEmail = 'support@barterdash.com';
  const supportPhone = '+1 (555) 123-4567';
  const faqUrl = 'https://barterdash.com/faq';
  const termsUrl = 'https://barterdash.com/terms';
  const privacyUrl = 'https://barterdash.com/privacy';

  const handleEmailSupport = () => {
    Linking.openURL(`mailto:${supportEmail}`);
  };

  const handlePhoneSupport = () => {
    Linking.openURL(`tel:${supportPhone.replace(/\s/g, '')}`);
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url);
  };

  const supportOptions: SupportOption[] = [
    {
      icon: <Mail size={24} color={COLORS.primaryGold} />,
      title: 'Email Support',
      subtitle: supportEmail,
      action: handleEmailSupport,
      type: 'email',
    },
    {
      icon: <Phone size={24} color={COLORS.primaryGold} />,
      title: 'Phone Support',
      subtitle: supportPhone,
      action: handlePhoneSupport,
      type: 'phone',
    },
    {
      icon: <FileText size={24} color={COLORS.primaryGold} />,
      title: 'FAQ & Help Center',
      subtitle: 'Find answers to common questions',
      action: () => handleOpenLink(faqUrl),
      type: 'link',
    },
  ];

  const legalOptions = [
    {
      icon: <FileText size={24} color={COLORS.textSecondary} />,
      title: 'Terms of Service',
      action: () => handleOpenLink(termsUrl),
    },
    {
      icon: <FileText size={24} color={COLORS.textSecondary} />,
      title: 'Privacy Policy',
      action: () => handleOpenLink(privacyUrl),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Support Info Card */}
        <View style={styles.infoCard}>
          <MessageCircle size={48} color={COLORS.primaryGold} style={styles.infoIcon} />
          <Text style={styles.infoTitle}>We're Here to Help</Text>
          <Text style={styles.infoSubtitle}>
            Have questions or need assistance? Our support team is available Monday-Friday, 9AM-6PM EST.
          </Text>
        </View>

        {/* Support Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          {supportOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionCard}
              onPress={option.action}
              activeOpacity={0.8}
            >
              <View style={styles.iconContainer}>
                {option.icon}
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </View>
              {option.type === 'link' && (
                <ExternalLink size={20} color={COLORS.textMuted} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          {legalOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionCard}
              onPress={option.action}
              activeOpacity={0.8}
            >
              <View style={styles.iconContainer}>
                {option.icon}
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>{option.title}</Text>
              </View>
              <ExternalLink size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View style={styles.appInfoContainer}>
          <Text style={styles.appInfoText}>BarterDash v1.0.0</Text>
          <Text style={styles.appInfoSubtext}>© 2025 BarterDash Inc.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.luxuryBlack,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkBorder,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: COLORS.luxuryBlackLight,
    margin: 16,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    alignItems: 'center',
  },
  infoIcon: {
    marginBottom: 16,
  },
  infoTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.luxuryBlackLight,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    marginBottom: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.luxuryBlack,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  appInfoContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  appInfoText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  appInfoSubtext: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
});
