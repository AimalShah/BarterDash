import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Calendar, Package, Play, Radio, Trash2 } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import {
  Stream,
  StreamProduct,
  streamsService,
} from '@/lib/api/services/streams';
import {
  StitchCard,
  StitchEmpty,
  StitchHeader,
  StitchPage,
  StitchPrimaryButton,
  StitchSecondaryButton,
  StitchSectionTitle,
} from '@/components/design';

function formatDate(value: string | null | undefined) {
  if (!value) {
    return 'Not scheduled';
  }

  const date = new Date(value);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function statusLabel(status: Stream['status']) {
  if (status === 'live') {
    return 'LIVE';
  }
  if (status === 'scheduled') {
    return 'SCHEDULED';
  }
  if (status === 'ended') {
    return 'ENDED';
  }
  return 'CANCELLED';
}

export default function StreamManagementScreen() {
  const { id: streamId } = useLocalSearchParams<{ id: string }>();
  const [stream, setStream] = useState<Stream | null>(null);
  const [products, setProducts] = useState<StreamProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async (isRefreshing = false) => {
    if (!streamId) {
      setLoading(false);
      return;
    }

    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [streamData, streamProducts] = await Promise.all([
        streamsService.findById(streamId),
        streamsService.getProducts(streamId),
      ]);

      setStream(streamData);
      setProducts(Array.isArray(streamProducts) ? streamProducts : []);
    } catch (error) {
      console.error('Error fetching stream details:', error);
      Alert.alert('Error', 'Failed to load stream details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [streamId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isScheduled = stream?.status === 'scheduled';
  const isLive = stream?.status === 'live';
  const isEnded = stream?.status === 'ended';

  const orderedProducts = useMemo(
    () => [...products].sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0)),
    [products]
  );

  const handleGoLive = useCallback(() => {
    if (!streamId || !stream) {
      return;
    }

    if (stream.status === 'ended') {
      Alert.alert('Stream Ended', 'This stream has already ended.');
      return;
    }

    router.push({ pathname: '/seller/go-live', params: { streamId } });
  }, [stream, streamId]);

  const handleEditStream = useCallback(() => {
    if (!streamId || !stream) {
      return;
    }

    if (stream.status === 'live' || stream.status === 'ended') {
      Alert.alert('Not Allowed', 'Only scheduled streams can be edited.');
      return;
    }

    router.push(`/seller/stream/edit/${streamId}`);
  }, [stream, streamId]);

  const handleCancelStream = useCallback(() => {
    if (!streamId || !stream) {
      return;
    }

    if (stream.status !== 'scheduled') {
      Alert.alert('Not Allowed', 'Only scheduled streams can be cancelled.');
      return;
    }

    Alert.alert('Cancel Stream?', 'This action cannot be undone.', [
      { text: 'Keep Stream', style: 'cancel' },
      {
        text: 'Cancel Stream',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await streamsService.cancel(streamId);
            Alert.alert('Success', 'Stream cancelled successfully.');
            router.replace('/seller/streams');
          } catch (error: any) {
            Alert.alert('Error', error?.message || 'Failed to cancel stream.');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }, [stream, streamId]);

  const handleAddProduct = useCallback(() => {
    if (!streamId) {
      return;
    }

    router.push(`/seller/stream/add-product/${streamId}`);
  }, [streamId]);

  const handleRemoveProduct = useCallback(
    (streamProductId: string, productTitle: string) => {
      if (!streamId) {
        return;
      }

      Alert.alert('Remove Product?', `Remove "${productTitle}" from this stream?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await streamsService.removeProduct(streamId, streamProductId);
              setProducts((previous) => previous.filter((item) => item.id !== streamProductId));
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to remove product.');
            }
          },
        },
      ]);
    },
    [streamId]
  );

  if (loading) {
    return (
      <StitchPage scroll={false} contentStyle={styles.centerWrap}>
        <Text style={styles.loadingTitle}>Loading Stream...</Text>
        <Text style={styles.loadingSubtitle}>Preparing control panel</Text>
      </StitchPage>
    );
  }

  if (!stream) {
    return (
      <StitchPage scroll={false} contentStyle={styles.centerWrap}>
        <StitchHeader title="Stream Manager" subtitle="Not found" onBack={() => router.back()} />
        <View style={styles.emptyWrap}>
          <StitchEmpty
            title="Stream Not Found"
            subtitle="This stream may have been removed or is no longer available."
          />
          <View style={styles.singleButtonWrap}>
            <StitchPrimaryButton label="Back to Streams" onPress={() => router.replace('/seller/streams')} />
          </View>
        </View>
      </StitchPage>
    );
  }

  return (
    <StitchPage
      contentStyle={{ paddingBottom: 130 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchData(true)}
          tintColor={COLORS.primaryBlue}
        />
      }
    >
      <StitchHeader
        title="Stream Management"
        subtitle={`Status: ${statusLabel(stream.status)}`}
        onBack={() => router.back()}
      />

      <View style={styles.contentPad}>
        <StitchCard style={styles.cardSpacing}>
          <View style={styles.titleRow}>
            <Text style={styles.streamTitle} numberOfLines={2}>
              {stream.title}
            </Text>
            <View style={[styles.statusPill, isLive ? styles.statusLive : undefined]}>
              <Text style={styles.statusText}>{statusLabel(stream.status)}</Text>
            </View>
          </View>

          {stream.description ? (
            <Text style={styles.streamDescription} numberOfLines={3}>
              {stream.description}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <Calendar size={14} color={COLORS.lightGrey} />
            <Text style={styles.metaText}>{formatDate(stream.scheduledStart)}</Text>
          </View>

          {stream.status === 'live' ? (
            <View style={styles.metaRow}>
              <Radio size={14} color="#DC2626" />
              <Text style={styles.metaText}>{stream.viewerCount || 0} viewers watching</Text>
            </View>
          ) : null}
        </StitchCard>

        <StitchCard style={styles.cardSpacing}>
          <View style={styles.actionGrid}>
            <View style={styles.actionItem}>
              <StitchPrimaryButton
                label={isLive ? 'Join Live' : 'Go Live'}
                onPress={handleGoLive}
                disabled={isEnded}
              />
            </View>
            <View style={styles.actionItem}>
              <StitchSecondaryButton
                label="Edit"
                onPress={handleEditStream}
                disabled={!isScheduled}
              />
            </View>
          </View>

          <View style={styles.cancelWrap}>
            <StitchSecondaryButton
              label={deleting ? 'Cancelling...' : 'Cancel Stream'}
              onPress={handleCancelStream}
              disabled={deleting || !isScheduled}
            />
          </View>
        </StitchCard>

        <View style={styles.sectionTop}>
          <StitchSectionTitle title="Product Lineup" actionLabel="Add" onActionPress={handleAddProduct} />
        </View>

        {orderedProducts.length ? (
          orderedProducts.map((item, index) => (
            <StitchCard key={item.id} style={styles.cardSpacing}>
              <View style={styles.productHead}>
                <View style={styles.productOrderBadge}>
                  <Text style={styles.productOrderText}>{index + 1}</Text>
                </View>

                <View style={styles.productInfo}>
                  <Text style={styles.productTitle} numberOfLines={1}>
                    {item.product?.title || 'Untitled Product'}
                  </Text>
                  <Text style={styles.productMeta} numberOfLines={1}>
                    {item.product?.condition || 'Condition n/a'}
                  </Text>
                  <Text style={styles.productPrice}>${Number(item.product?.price || 0).toFixed(2)}</Text>
                </View>

                <Pressable
                  style={styles.removeButton}
                  onPress={() => handleRemoveProduct(item.id, item.product?.title || 'this product')}
                >
                  <Trash2 size={14} color="#DC2626" />
                </Pressable>
              </View>
            </StitchCard>
          ))
        ) : (
          <StitchCard>
            <StitchEmpty title="No Products Added" subtitle="Add products before going live." />
            <StitchPrimaryButton label="Add Product" onPress={handleAddProduct} />
          </StitchCard>
        )}

        <View style={styles.footerSpace} />
      </View>
    </StitchPage>
  );
}

const styles = StyleSheet.create({
  centerWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTitle: {
    color: COLORS.primaryText,
    fontSize: 24,
    fontWeight: '700',
  },
  loadingSubtitle: {
    marginTop: 8,
    color: COLORS.lightGrey,
    fontSize: 14,
  },
  emptyWrap: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  singleButtonWrap: {
    marginTop: 14,
  },
  contentPad: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  cardSpacing: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  streamTitle: {
    flex: 1,
    color: COLORS.primaryText,
    fontSize: 18,
    fontWeight: '700',
  },
  statusPill: {
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusLive: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  streamDescription: {
    marginTop: 8,
    color: COLORS.lightGrey,
    fontSize: 13,
    lineHeight: 18,
  },
  metaRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: COLORS.lightGrey,
    fontSize: 12,
    fontWeight: '500',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  actionItem: {
    flex: 1,
  },
  cancelWrap: {
    marginTop: 8,
  },
  sectionTop: {
    marginBottom: 8,
  },
  productHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  productOrderBadge: {
    height: 34,
    width: 34,
    borderRadius: 10,
    backgroundColor: '#E8F1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productOrderText: {
    color: COLORS.primaryBlue,
    fontSize: 13,
    fontWeight: '700',
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    color: COLORS.primaryText,
    fontSize: 14,
    fontWeight: '700',
  },
  productMeta: {
    color: COLORS.lightGrey,
    fontSize: 12,
    marginTop: 2,
  },
  productPrice: {
    color: COLORS.primaryBlue,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  removeButton: {
    height: 32,
    width: 32,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerSpace: {
    height: 24,
  },
});
