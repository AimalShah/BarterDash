import { AxiosError } from 'axios';
import { Alert } from 'react-native';

export interface ApiErrorResponse {
    statusCode: number;
    message: string | string[];
    error?: string;
}

export interface HandleErrorOptions {
    showAlert?: boolean;
    fallbackMessage?: string;
    context?: string;
}

/**
 * Extract a user-friendly error message from various error types
 */
export function getErrorMessage(error: unknown): string {
    // Handle Axios errors
    if (error instanceof AxiosError) {
        const data = error.response?.data as ApiErrorResponse | undefined;

        // Check for structured API error response
        if (data?.message) {
            if (Array.isArray(data.message)) {
                return data.message[0]; // Return first validation error
            }
            return data.message;
        }

        // Map HTTP status codes to user-friendly messages
        switch (error.response?.status) {
            case 400:
                return 'Invalid request. Please check your input.';
            case 401:
                return 'Session expired. Please sign in again.';
            case 403:
                return 'You don\'t have permission to do this.';
            case 404:
                return 'The requested resource was not found.';
            case 409:
                return 'This action conflicts with existing data.';
            case 422:
                return 'Invalid data provided. Please check your input.';
            case 429:
                return 'Too many requests. Please wait a moment.';
            case 500:
                return 'Something went wrong on our end. Please try again.';
            case 502:
            case 503:
            case 504:
                return 'Server is temporarily unavailable. Please try again later.';
            default:
                break;
        }

        // Handle network errors
        if (error.code === 'ERR_NETWORK') {
            return 'No internet connection. Please check your network.';
        }

        if (error.code === 'ECONNABORTED') {
            return 'Request timed out. Please try again.';
        }

        if (error.message) {
            return error.message;
        }
    }

    // Handle standard Error objects
    if (error instanceof Error) {
        return error.message;
    }

    // Handle string errors
    if (typeof error === 'string') {
        return error;
    }

    // Default fallback
    return 'An unexpected error occurred. Please try again.';
}

/**
 * Handle an API error with optional alert display
 */
export function handleApiError(
    error: unknown,
    options: HandleErrorOptions = {}
): string {
    const { showAlert = true, fallbackMessage, context } = options;

    const message = getErrorMessage(error) || fallbackMessage || 'Something went wrong';
    const title = context ? `${context} Error` : 'Error';

    // Log the full error for debugging
    if (__DEV__) {
        console.error(`[${context || 'API'}] Error:`, error);
    }

    if (showAlert) {
        Alert.alert(title, message);
    }

    return message;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
    if (error instanceof AxiosError) {
        return error.code === 'ERR_NETWORK' || !error.response;
    }
    return false;
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
    if (error instanceof AxiosError) {
        return error.response?.status === 401;
    }
    return false;
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: unknown): boolean {
    if (error instanceof AxiosError) {
        return error.response?.status === 400 || error.response?.status === 422;
    }
    return false;
}

/**
 * Wrap an async function with error handling
 */
export function withErrorHandling<T>(
    fn: () => Promise<T>,
    options: HandleErrorOptions = {}
): Promise<T | null> {
    return fn().catch((error) => {
        handleApiError(error, options);
        return null;
    });
}
