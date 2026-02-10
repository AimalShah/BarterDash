import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { StreamSession } from '../types';
import { COLORS } from '../constants/colors';

const { width } = Dimensions.get('window');

interface ExploreViewProps {
  streams: StreamSession[];
  onSelectStream: (stream: StreamSession) => void;
}

const ExploreView: React.FC<ExploreViewProps> = ({ streams, onSelectStream }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Rare Gems', 'Timepieces', 'Streetwear', 'Modern Art'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Explore Auctions</Text>
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Search items, sellers, or brands..."
              placeholderTextColor={COLORS.textMuted}
              style={styles.searchInput}
            />
            <View style={styles.searchIcon}>
              <Search size={20} color={COLORS.textMuted} />
            </View>
          </View>
        </View>

        {/* Quick Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((cat, i) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[
                styles.categoryButton,
                activeCategory === cat && styles.categoryButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === cat && styles.categoryTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Live Wall */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Live Right Now</Text>
            <View style={styles.activeIndicator}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>124 Active</Text>
            </View>
          </View>

          <View style={styles.grid}>
            {streams.map((stream) => (
              <TouchableOpacity
                key={stream.id}
                onPress={() => onSelectStream(stream)}
                style={styles.gridItem}
                activeOpacity={0.9}
              >
                <Image
                  source={{
                    uri: stream.thumbnail || 'https://picsum.photos/seed/stream/300/400',
                  }}
                  style={styles.thumbnail}
                />
                <View style={styles.overlay}>
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>Live</Text>
                  </View>

                  <View style={styles.streamInfo}>
                    <Text style={styles.streamTitle} numberOfLines={1}>
                      {stream.title}
                    </Text>
                    <View style={styles.sellerRow}>
                      <Image
                        source={{
                          uri:
                            stream.sellerAvatar ||
                            `https://ui-avatars.com/api/?name=${stream.sellerHandle || 'U'}`,
                        }}
                        style={styles.sellerAvatar}
                      />
                      <Text style={styles.sellerHandle}>
                        @{stream.sellerHandle || 'unknown'}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            {/* Mock Extra Content for Grid */}
            {[3, 4, 5, 6].map((i) => (
              <View key={i} style={styles.placeholderItem}>
                <View style={styles.placeholderLine} />
                <View style={[styles.placeholderLine, { width: '50%', marginTop: 4 }]} />
              </View>
            ))}
          </View>
        </View>

        {/* Featured Collections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ending Soon</Text>
          <View style={styles.endingsList}>
            {[1, 2].map((i) => (
              <View key={i} style={styles.endingCard}>
                <Image
                  source={{ uri: `https://picsum.photos/seed/item${i + 10}/200` }}
                  style={styles.endingImage}
                />
                <View style={styles.endingInfo}>
                  <Text style={styles.endingTime}>Ends in 04:22</Text>
                  <Text style={styles.endingTitle} numberOfLines={1}>
                    Rare Silver Ornament
                  </Text>
                  <Text style={styles.endingPrice}>$1,400</Text>
                </View>
                <TouchableOpacity style={styles.addButton}>
                  <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.luxuryBlack,
  },
  scrollContent: {
    paddingTop: 48,
    paddingBottom: 96,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  searchContainer: {
    position: 'relative',
  },
  searchInput: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.darkBorderLight,
    paddingVertical: 16,
    paddingLeft: 48,
    paddingRight: 16,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  categoriesContainer: {
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 32,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.darkBorderLight,
    backgroundColor: 'transparent',
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primaryGold,
    borderColor: COLORS.primaryGold,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  categoryTextActive: {
    color: COLORS.luxuryBlack,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.successGreen,
  },
  activeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridItem: {
    width: (width - 64) / 2,
    aspectRatio: 3 / 4,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.darkBorderLight,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 12,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.liveIndicator,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 4,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textPrimary,
  },
  liveText: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
  },
  streamInfo: {
    gap: 4,
  },
  streamTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sellerAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primaryGold,
  },
  sellerHandle: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.primaryGold,
  },
  placeholderItem: {
    width: (width - 64) / 2,
    aspectRatio: 3 / 4,
    borderRadius: 24,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.darkBorderLight,
    justifyContent: 'flex-end',
    padding: 12,
  },
  placeholderLine: {
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
    width: '75%',
  },
  endingsList: {
    gap: 16,
  },
  endingCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 24,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: COLORS.darkBorderLight,
    alignItems: 'center',
  },
  endingImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  endingInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  endingTime: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.liveIndicator,
    textTransform: 'uppercase',
  },
  endingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  endingPrice: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.primaryGold,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.darkBorderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});

export default ExploreView;
