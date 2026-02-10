import React from 'react';
import {
    Box,
    Text,
    VStack,
    HStack,
    Pressable,
    Button,
    ButtonText,
} from "@gluestack-ui/themed";
import {
    Shield,
    Clock,
    CheckCircle,
    AlertTriangle,
    DollarSign,
    RefreshCw,
    XCircle,
} from 'lucide-react-native';
import { EscrowTransaction } from '../../lib/api/services/escrow';
import { COLORS } from '@/constants/colors';

interface EscrowStatusCardProps {
    escrow: EscrowTransaction | null;
    isBuyer: boolean;
    onConfirmDelivery?: () => void;
    onRequestRefund?: () => void;
    loading?: boolean;
}

export default function EscrowStatusCard({
    escrow,
    isBuyer,
    onConfirmDelivery,
    onRequestRefund,
    loading = false,
}: EscrowStatusCardProps) {
    if (!escrow) {
        return null;
    }

    const getStatusConfig = () => {
        switch (escrow.status) {
            case 'pending':
                return {
                    icon: <Clock size={20} color={COLORS.warningAmber} />,
                    bgColor: 'rgba(245, 158, 11, 0.1)',
                    borderColor: COLORS.warningAmber,
                    title: 'Payment Pending',
                    description: 'Waiting for payment confirmation',
                    color: COLORS.warningAmber,
                };
            case 'held':
                return {
                    icon: <Shield size={20} color={COLORS.primaryGold} />,
                    bgColor: 'rgba(244, 197, 66, 0.1)',
                    borderColor: COLORS.primaryGold,
                    title: 'Funds in Escrow',
                    description: isBuyer
                        ? 'Your payment is protected until you confirm delivery'
                        : 'Payment secured. Ship the item to receive funds.',
                    color: COLORS.primaryGold,
                };
            case 'releasing':
                return {
                    icon: <RefreshCw size={20} color={COLORS.primaryGold} />,
                    bgColor: 'rgba(244, 197, 66, 0.1)',
                    borderColor: COLORS.primaryGold,
                    title: 'Releasing Payment',
                    description: 'Transferring funds to seller...',
                    color: COLORS.primaryGold,
                };
            case 'released':
                return {
                    icon: <CheckCircle size={20} color={COLORS.successGreen} />,
                    bgColor: 'rgba(34, 197, 94, 0.1)',
                    borderColor: COLORS.successGreen,
                    title: 'Payment Released',
                    description: isBuyer
                        ? 'Payment sent to seller. Transaction complete!'
                        : 'You received the payment!',
                    color: COLORS.successGreen,
                };
            case 'refunding':
                return {
                    icon: <RefreshCw size={20} color={COLORS.warningAmber} />,
                    bgColor: 'rgba(245, 158, 11, 0.1)',
                    borderColor: COLORS.warningAmber,
                    title: 'Processing Refund',
                    description: 'Returning funds to buyer...',
                    color: COLORS.warningAmber,
                };
            case 'refunded':
                return {
                    icon: <DollarSign size={20} color={COLORS.successGreen} />,
                    bgColor: 'rgba(34, 197, 94, 0.1)',
                    borderColor: COLORS.successGreen,
                    title: 'Refunded',
                    description: isBuyer
                        ? 'Your refund has been processed'
                        : 'Order was refunded to buyer',
                    color: COLORS.successGreen,
                };
            case 'disputed':
                return {
                    icon: <AlertTriangle size={20} color={COLORS.errorRed} />,
                    bgColor: 'rgba(239, 68, 68, 0.1)',
                    borderColor: COLORS.errorRed,
                    title: 'Under Dispute',
                    description: 'This transaction is being reviewed',
                    color: COLORS.errorRed,
                };
            case 'cancelled':
                return {
                    icon: <XCircle size={20} color={COLORS.textMuted} />,
                    bgColor: COLORS.luxuryBlackLight,
                    borderColor: COLORS.darkBorder,
                    title: 'Cancelled',
                    description: 'This transaction was cancelled',
                    color: COLORS.textMuted,
                };
            default:
                return {
                    icon: <Clock size={20} color={COLORS.textMuted} />,
                    bgColor: COLORS.luxuryBlackLight,
                    borderColor: COLORS.darkBorder,
                    title: 'Unknown Status',
                    description: '',
                    color: COLORS.textMuted,
                };
        }
    };

    const config = getStatusConfig();
    const showConfirmButton = isBuyer && escrow.status === 'held';
    const showRefundButton = isBuyer && escrow.status === 'held';

    // Calculate auto-release info
    const autoReleaseDate = escrow.releaseScheduledAt
        ? new Date(escrow.releaseScheduledAt)
        : null;
    const daysUntilRelease = autoReleaseDate
        ? Math.max(0, Math.ceil((autoReleaseDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;

    return (
        <Box
            bg={config.bgColor}
            p="$4"
            rounded="$xl"
            borderWidth={2}
            borderColor={config.borderColor}
        >
            <HStack alignItems="center" space="md" mb="$3">
                <Box bg={COLORS.luxuryBlack} p="$2.5" rounded="$full">
                    {config.icon}
                </Box>
                <VStack flex={1}>
                    <Text fontWeight="$bold" color={COLORS.textPrimary}>{config.title}</Text>
                    <Text size="xs" color={COLORS.textSecondary}>{config.description}</Text>
                </VStack>
            </HStack>

            {/* Amount Info */}
            <Box bg={COLORS.luxuryBlack} p="$3" rounded="$lg" mb="$3">
                <HStack justifyContent="space-between" alignItems="center">
                    <Text size="sm" color={COLORS.textSecondary}>
                        {isBuyer ? 'Amount Paid' : 'You\'ll Receive'}
                    </Text>
                    <Text fontWeight="$black" color={COLORS.primaryGold} size="lg">
                        ${isBuyer ? escrow.amount : escrow.sellerAmount}
                    </Text>
                </HStack>
                {!isBuyer && escrow.status === 'held' && (
                    <Text size="2xs" color={COLORS.textMuted} mt="$1">
                        Platform fee: ${escrow.platformFee}
                    </Text>
                )}
            </Box>

            {/* Auto-release countdown */}
            {escrow.status === 'held' && daysUntilRelease !== null && (
                <Box bg={COLORS.luxuryBlack} p="$3" rounded="$lg" mb="$3">
                    <HStack alignItems="center" space="sm">
                        <Clock size={14} color={COLORS.textMuted} />
                        <Text size="xs" color={COLORS.textSecondary} flex={1}>
                            {daysUntilRelease === 0
                                ? 'Auto-releases today'
                                : `Auto-releases in ${daysUntilRelease} day${daysUntilRelease > 1 ? 's' : ''}`
                            }
                        </Text>
                    </HStack>
                </Box>
            )}

            {/* Action Buttons */}
            {(showConfirmButton || showRefundButton) && (
                <VStack space="sm">
                    {showConfirmButton && onConfirmDelivery && (
                        <Button
                            bg={COLORS.successGreen}
                            onPress={onConfirmDelivery}
                            isDisabled={loading}
                        >
                            <CheckCircle size={18} color={COLORS.textPrimary} style={{ marginRight: 8 }} />
                            <ButtonText>Confirm Delivery</ButtonText>
                        </Button>
                    )}
                    {showRefundButton && onRequestRefund && (
                        <Pressable
                            onPress={onRequestRefund}
                            p="$2"
                            alignSelf="center"
                        >
                            <Text size="sm" color={COLORS.errorRed} fontWeight="$medium">
                                Request Refund
                            </Text>
                        </Pressable>
                    )}
                </VStack>
            )}

            {/* Timestamps */}
            {escrow.releasedAt && (
                <Text size="2xs" color={COLORS.textMuted} mt="$2" textAlign="center">
                    Released on {new Date(escrow.releasedAt).toLocaleDateString()}
                </Text>
            )}
            {escrow.refundedAt && (
                <Text size="2xs" color={COLORS.textMuted} mt="$2" textAlign="center">
                    Refunded on {new Date(escrow.refundedAt).toLocaleDateString()}
                </Text>
            )}
        </Box>
    );
}
