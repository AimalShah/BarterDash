import React, { useState } from 'react';
import { StatusBar, Alert, Linking } from 'react-native';
import { Box, VStack, Text, Pressable, HStack, Spinner, ScrollView } from '@gluestack-ui/themed';
import { Download, Shield, Eye, Clock, ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { usersService } from '@/lib/api/services/users';
import { COLORS } from '../../constants/colors';

export default function PrivacySettingsScreen() {
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<Date | null>(null);

  const handleExportData = async () => {
    Alert.alert(
      'Download Your Data',
      "We'll prepare a copy of all your data. This may take a few minutes.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Export',
          onPress: async () => {
            setIsExporting(true);
            try {
              const result = await usersService.exportData();
              setLastExport(new Date());
              
              Alert.alert(
                'Export Ready',
                'Your data is ready for download. The link expires in 1 hour.',
                [
                  {
                    text: 'Download Now',
                    onPress: () => Linking.openURL(result.download_url),
                  },
                  { text: 'Later' },
                ]
              );
            } catch (error: any) {
              if (error.response?.data?.error?.code === 'RATE_LIMITED') {
                Alert.alert(
                  'Please Wait',
                  'You can only request one export per 24 hours.',
                );
              } else {
                Alert.alert('Error', 'Failed to export data. Please try again.');
              }
            } finally {
              setIsExporting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Box flex={1} bg={COLORS.luxuryBlack}>
      <StatusBar barStyle="light-content" />
      
      <Box px="$6" py="$4" borderBottomWidth={1} borderColor={COLORS.darkBorder}>
        <HStack alignItems="center">
          <Pressable onPress={() => router.back()} mr="$4" h={40} w={40} rounded={500} alignItems="center" justifyContent="center" bg={COLORS.luxuryBlackLight} sx={{ ":active": { bg: COLORS.darkSurface } }}>
            <ChevronLeft size={22} color={COLORS.textPrimary} />
          </Pressable>
          <Text color={COLORS.textPrimary} fontWeight="$bold" size="xl">Privacy & Visibility</Text>
        </HStack>
      </Box>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <VStack p="$6" space="lg">
          <Box bg={COLORS.luxuryBlackLight} p="$5" rounded="$2xl" borderWidth={1} borderColor={COLORS.darkBorder}>
            <HStack alignItems="center" space="md" mb="$4">
              <Box h={44} w={44} rounded={16} bg={COLORS.primaryGold + '20'} alignItems="center" justifyContent="center">
                <Download size={24} color={COLORS.primaryGold} />
              </Box>
              <Text color={COLORS.textPrimary} fontWeight="$bold" size="lg">
                Download Your Data
              </Text>
            </HStack>
            <Text color={COLORS.textSecondary} size="sm" mb="$4">
              Get a copy of all your personal data stored in BarterDash, including your profile, orders, bids, messages, and more.
            </Text>
            <Pressable
              onPress={handleExportData}
              disabled={isExporting}
              bg={COLORS.primaryGold}
              py="$4"
              rounded="$xl"
              alignItems="center"
              sx={{ ":active": { opacity: 0.8 } }}
            >
              {isExporting ? (
                <HStack space="sm" alignItems="center">
                  <Spinner size="small" color={COLORS.luxuryBlack} />
                  <Text color={COLORS.luxuryBlack} fontWeight="$bold">Preparing Export...</Text>
                </HStack>
              ) : (
                <Text color={COLORS.luxuryBlack} fontWeight="$bold">Request Data Export</Text>
              )}
            </Pressable>
            {lastExport && (
              <HStack alignItems="center" space="xs" mt="$3" justifyContent="center">
                <Clock size={14} color={COLORS.textMuted} />
                <Text color={COLORS.textMuted} size="xs">
                  Last export: {lastExport.toLocaleDateString()}
                </Text>
              </HStack>
            )}
          </Box>

          <VStack space="md">
            <InfoCard
              icon={<Eye size={20} color={COLORS.textSecondary} />}
              title="What's Included"
              description="Profile, orders, bids, products, messages, social connections, and financial records"
            />
            <InfoCard
              icon={<Shield size={20} color={COLORS.textSecondary} />}
              title="Privacy First"
              description="Exports are generated on-demand and the download link expires after 1 hour"
            />
          </VStack>
        </VStack>
      </ScrollView>
    </Box>
  );
}

function InfoCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Box bg={COLORS.luxuryBlackLight} p="$4" rounded="$xl" borderWidth={1} borderColor={COLORS.darkBorder}>
      <HStack space="md">
        {icon}
        <VStack flex={1}>
          <Text color={COLORS.textPrimary} fontWeight="$bold" size="sm">{title}</Text>
          <Text color={COLORS.textSecondary} size="xs" mt="$1">{description}</Text>
        </VStack>
      </HStack>
    </Box>
  );
}
