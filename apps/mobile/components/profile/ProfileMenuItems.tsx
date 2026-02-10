import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ChevronRight } from 'lucide-react-native';
import { COLORS } from "@/constants/colors";

interface MenuItemProps {
    icon: any;
    label: string;
    onPress: () => void;
}

const MenuItem = ({ icon, label, onPress }: MenuItemProps) => (
    <TouchableOpacity
        onPress={onPress}
        style={styles.menuItem}
        activeOpacity={0.7}
    >
        <View style={styles.menuItemLeft}>
            <View style={styles.iconContainer}>
                {icon}
            </View>
            <Text style={styles.menuLabel}>{label}</Text>
        </View>
        <ChevronRight size={18} color={COLORS.textSecondary} />
    </TouchableOpacity>
);

interface ProfileMenuItemsProps {
    menuItems: {
        icon: any;
        label: string;
        onPress: () => void;
    }[];
}

export const ProfileMenuItems = ({ menuItems }: ProfileMenuItemsProps) => {
    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>
                SUPPORT & INFO
            </Text>
            <View style={styles.menuList}>
                {menuItems.map((item, index) => (
                    <MenuItem key={index} icon={item.icon} label={item.label} onPress={item.onPress} />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        marginTop: 32,
    },
    sectionTitle: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    menuList: {
        backgroundColor: COLORS.luxuryBlackLight,
        borderRadius: 16,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: COLORS.darkBorder,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 16,
        // Separator logic handled by View structure or borderBottom
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.03)',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconContainer: {
        height: 36,
        width: 36,
        backgroundColor: COLORS.luxuryBlack,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.darkBorder,
    },
    menuLabel: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
