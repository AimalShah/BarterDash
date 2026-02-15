/**
 * Feature Flags Configuration
 * 
 * Control feature availability through environment variables.
 * All flags default to safe values for production.
 */

export interface FeatureFlag {
  enabled: boolean;
  description: string;
}

export const featureFlags = {
  // Payment features
  applePay: {
    enabled: process.env.EXPO_PUBLIC_ENABLE_APPLE_PAY === 'true',
    description: 'Apple Pay integration (requires Apple Developer account)',
  } as FeatureFlag,
  
  googlePay: {
    enabled: process.env.EXPO_PUBLIC_ENABLE_GOOGLE_PAY !== 'false',
    description: 'Google Pay integration',
  } as FeatureFlag,
  
  // Beta mode indicator
  betaMode: {
    enabled: process.env.EXPO_PUBLIC_BETA_MODE === 'true' || __DEV__,
    description: 'Show beta mode indicators',
  } as FeatureFlag,
  
  // Shipping features
  shippingLabels: {
    enabled: true,
    description: 'Shipping label generation (mock in beta)',
  } as FeatureFlag,
  
  // Debug features
  showDebugLogs: {
    enabled: __DEV__,
    description: 'Show debug console logs',
  } as FeatureFlag,
} as const;

export type FeatureFlagKey = keyof typeof featureFlags;

/**
 * Check if a feature is enabled
 * @param flag - Feature flag key
 * @returns boolean indicating if feature is enabled
 */
export const isFeatureEnabled = (flag: FeatureFlagKey): boolean => {
  return featureFlags[flag]?.enabled ?? false;
};

/**
 * Get all enabled features (for debugging)
 * @returns Array of enabled feature names
 */
export const getEnabledFeatures = (): string[] => {
  return Object.entries(featureFlags)
    .filter(([, flag]) => flag.enabled)
    .map(([key]) => key);
};

/**
 * Log feature flags status (development only)
 */
export const logFeatureFlags = (): void => {
  if (__DEV__) {
    console.log('📋 Feature Flags:');
    Object.entries(featureFlags).forEach(([key, flag]) => {
      const status = flag.enabled ? '✅' : '❌';
      console.log(`  ${status} ${key}: ${flag.description}`);
    });
  }
};
