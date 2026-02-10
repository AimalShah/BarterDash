import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, Animated, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, AlertCircle, XCircle, Info } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    showSuccess: (message: string) => void;
    showError: (message: string) => void;
    showWarning: (message: string) => void;
    showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

const TOAST_DURATION = 3000;

const toastConfig: Record<ToastType, { icon: any; bgColor: string; borderColor: string; iconColor: string }> = {
    success: {
        icon: CheckCircle2,
        bgColor: 'rgba(34, 197, 94, 0.15)',
        borderColor: 'rgba(34, 197, 94, 0.3)',
        iconColor: COLORS.successGreen,
    },
    error: {
        icon: XCircle,
        bgColor: 'rgba(239, 68, 68, 0.15)',
        borderColor: 'rgba(239, 68, 68, 0.3)',
        iconColor: COLORS.errorRed,
    },
    warning: {
        icon: AlertCircle,
        bgColor: 'rgba(245, 158, 11, 0.15)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
        iconColor: COLORS.warningAmber,
    },
    info: {
        icon: Info,
        bgColor: 'rgba(244, 197, 66, 0.15)',
        borderColor: 'rgba(244, 197, 66, 0.3)',
        iconColor: COLORS.primaryGold,
    },
};

function ToastComponent({ toast, onHide }: { toast: Toast; onHide: () => void }) {
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const config = toastConfig[toast.type];
    const Icon = config.icon;

    useEffect(() => {
        // Animate in
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();

        // Auto hide
        const timer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: -100,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start(() => onHide());
        }, toast.duration || TOAST_DURATION);

        return () => clearTimeout(timer);
    }, []);

    return (
        <Animated.View
            style={[
                styles.toast,
                {
                    backgroundColor: config.bgColor,
                    borderColor: config.borderColor,
                    transform: [{ translateY }],
                    opacity,
                },
            ]}
        >
            <Icon size={20} color={config.iconColor} />
            <Text style={styles.message} numberOfLines={2}>{toast.message}</Text>
        </Animated.View>
    );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const insets = useSafeAreaInsets();

    const showToast = useCallback((message: string, type: ToastType = 'info', duration = TOAST_DURATION) => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, message, type, duration }]);
    }, []);

    const hideToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showSuccess = useCallback((message: string) => showToast(message, 'success'), [showToast]);
    const showError = useCallback((message: string) => showToast(message, 'error'), [showToast]);
    const showWarning = useCallback((message: string) => showToast(message, 'warning'), [showToast]);
    const showInfo = useCallback((message: string) => showToast(message, 'info'), [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
            {children}
            <View style={[styles.container, { top: insets.top + 10 }]} pointerEvents="box-none">
                {toasts.map((toast) => (
                    <ToastComponent
                        key={toast.id}
                        toast={toast}
                        onHide={() => hideToast(toast.id)}
                    />
                ))}
            </View>
        </ToastContext.Provider>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 16,
        right: 16,
        zIndex: 9999,
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 8,
        shadowColor: COLORS.luxuryBlack,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 8,
    },
    message: {
        flex: 1,
        marginLeft: 12,
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: '500',
    },
});
