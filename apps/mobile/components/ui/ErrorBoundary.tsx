import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button } from "./Button";
import { COLORS } from "@/constants/colors";

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Error caught by boundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.title}>
                        Oops! Something went wrong
                    </Text>
                    <Text style={styles.message}>
                        We're sorry for the inconvenience. Please try again or restart the app.
                    </Text>
                    <Button
                        label="Try Again"
                        onPress={() => this.setState({ hasError: false })}
                        style={{ backgroundColor: COLORS.primaryGold, width: '100%' }}
                    />
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.luxuryBlack,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    title: {
        color: COLORS.textPrimary,
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 16,
    },
    message: {
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 32,
    },
});
