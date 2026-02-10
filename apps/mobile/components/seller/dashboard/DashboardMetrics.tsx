import React from "react";
import { Box, HStack, VStack, Text, Heading } from "@gluestack-ui/themed";
import { DollarSign, TrendingUp, ShoppingCart, Award } from "lucide-react-native";
import { COLORS } from "@/constants/colors";

interface MetricProps {
    label: string;
    value: string;
    icon: any;
    trend?: string;
    color: string;
}

const MetricBox = ({ label, value, icon: Icon, trend }: MetricProps) => (
    <Box
        flex={1}
        bg={COLORS.cardBackground}
        p="$5"
        rounded="$sm"
        borderWidth={1}
        borderColor={COLORS.darkBorder}
    >
        <Box w={40} h={40} rounded="$sm" bg={COLORS.primaryGold} alignItems="center" justifyContent="center" mb="$4">
            <Icon size={20} color={COLORS.luxuryBlack} />
        </Box>
        <Text size="2xs" color={COLORS.textSecondary} fontWeight="$black" textTransform="uppercase" letterSpacing={1}>{label}</Text>
        <Heading size="xl" color={COLORS.textPrimary} fontWeight="$black" mt="$1" style={{ letterSpacing: -0.5 }}>{value}</Heading>
        {trend && <Text size="2xs" color={COLORS.primaryGold} fontWeight="$black" mt="$2">↑ {trend}% VS LAST WEEK</Text>}
    </Box>
);

export const DashboardMetrics = () => {
    return (
        <VStack space="md" mt="$8">
            <HStack space="md">
                <MetricBox
                    label="TOTAL REVENUE"
                    value="$12,450"
                    icon={DollarSign}
                    trend="12"
                    color="#000"
                />
                <MetricBox
                    label="ITEMS SOLD"
                    value="48"
                    icon={ShoppingCart}
                    trend="8"
                    color="#000"
                />
            </HStack>
            <HStack space="md">
                <MetricBox
                    label="AVG. SALE"
                    value="$259"
                    icon={TrendingUp}
                    color="#000"
                />
                <MetricBox
                    label="SELLER RANK"
                    value="#42"
                    icon={Award}
                    color="#000"
                />
            </HStack>
        </VStack>
    );
};
