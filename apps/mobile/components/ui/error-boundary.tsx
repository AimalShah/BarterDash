import React from 'react';
import { View } from 'react-native';
import { Button } from './button';
import { Text } from './text';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text variant="h2" className="text-center">
          Something went wrong
        </Text>
        <Text color="secondary" className="mt-3 text-center">
          Please try again. If this keeps happening, restart the app.
        </Text>
        <Button
          variant="primary"
          onPress={this.handleRetry}
          label="Try Again"
          className="mt-6 w-full max-w-72"
        />
      </View>
    );
  }
}
