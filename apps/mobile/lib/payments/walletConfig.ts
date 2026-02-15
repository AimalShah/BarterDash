import { Platform } from "react-native";
import { isFeatureEnabled } from "../config/featureFlags";

const DEFAULT_MERCHANT_COUNTRY_CODE = "US";

const parseBooleanEnv = (
  value: string | undefined,
  fallback: boolean
): boolean => {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
};

const merchantCountryCode = (
  process.env.EXPO_PUBLIC_STRIPE_MERCHANT_COUNTRY_CODE ||
  DEFAULT_MERCHANT_COUNTRY_CODE
).toUpperCase();

const googlePayTestEnv = parseBooleanEnv(
  process.env.EXPO_PUBLIC_STRIPE_GOOGLE_PAY_TEST_ENV,
  __DEV__
);

interface WalletPaymentSheetParams {
  applePay?: {
    merchantCountryCode: string;
  };
  googlePay?: {
    merchantCountryCode: string;
    testEnv: boolean;
  };
}

/**
 * Adds wallet options for Stripe PaymentSheet.
 * Apple Pay and Google Pay are controlled by feature flags.
 */
export const getWalletPaymentSheetParams = (): WalletPaymentSheetParams => {
  const walletParams: WalletPaymentSheetParams = {};

  // Apple Pay - controlled by feature flag (requires Apple Developer account)
  if (Platform.OS === "ios" && isFeatureEnabled("applePay")) {
    walletParams.applePay = {
      merchantCountryCode,
    };
  }

  // Google Pay - controlled by feature flag
  if (Platform.OS === "android" && isFeatureEnabled("googlePay")) {
    walletParams.googlePay = {
      merchantCountryCode,
      testEnv: googlePayTestEnv,
    };
  }

  return walletParams;
};
