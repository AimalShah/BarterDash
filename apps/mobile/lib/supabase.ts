
import { AppState, AppStateStatus } from 'react-native';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration - MUST be set via environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Missing Supabase environment variables!');
  console.error('Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in .env');
  console.error('Then restart with: npx expo start --clear');
}

console.log('[AUTH DEBUG] Initializing Supabase client...');
console.log('[AUTH DEBUG] Supabase URL:', supabaseUrl);

// Custom storage adapter for better reliability and debugging
const SupabaseStorage = {
	getItem: async (key: string) => {
		try {
			const value = await AsyncStorage.getItem(key);
			if (__DEV__) {
				console.log('[AUTH DEBUG] Getting item:', key, value ? 'Found' : 'Not found');
			}
			return value;
		} catch (error) {
			console.error('[AUTH DEBUG] Error getting item:', error);
			return null;
		}
	},
	setItem: async (key: string, value: string) => {
		try {
			if (__DEV__) {
				console.log('[AUTH DEBUG] Setting item:', key);
			}
			await AsyncStorage.setItem(key, value);
		} catch (error) {
			console.error('[AUTH DEBUG] Error setting item:', error);
		}
	},
	removeItem: async (key: string) => {
		try {
			if (__DEV__) {
				console.log('[AUTH DEBUG] Removing item:', key);
			}
			await AsyncStorage.removeItem(key);
		} catch (error) {
			console.error('[AUTH DEBUG] Error removing item:', error);
		}
	},
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		storage: SupabaseStorage,
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: false,
	},
});

// Handle app state changes for session refresh
let appStateSubscription: any = null;

const handleAppStateChange = (nextAppState: AppStateStatus) => {
	if (__DEV__) {
		console.log('[AUTH DEBUG] App state changed:', nextAppState);
	}
	if (nextAppState === 'active') {
		supabase.auth.startAutoRefresh();
		if (__DEV__) {
			console.log('[AUTH DEBUG] Started auto-refresh');
		}
	} else {
		supabase.auth.stopAutoRefresh();
		if (__DEV__) {
			console.log('[AUTH DEBUG] Stopped auto-refresh');
		}
	}
};

// Set up app state listener
appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

// Start auto-refresh on initialization
supabase.auth.startAutoRefresh();
console.log('[AUTH DEBUG] Supabase client initialized');