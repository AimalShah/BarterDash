import { InitPaymentSheetParams } from "@stripe/stripe-react-native";
import { Platform } from "react-native";

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

/**
 * Adds wallet options for Stripe PaymentSheet.
 * Apple Pay is enabled on iOS and Google Pay on Android.
 */
export const getWalletPaymentSheetParams = (): Pick<
  InitPaymentSheetParams,
  "applePay" | "googlePay"
> => {
  const walletParams: Pick<InitPaymentSheetParams, "applePay" | "googlePay"> =
    {};

  if (Platform.OS === "ios") {
    walletParams.applePay = {
      merchantCountryCode,
    };
  }

  if (Platform.OS === "android") {
    walletParams.googlePay = {
      merchantCountryCode,
      testEnv: googlePayTestEnv,
    };
  }

  return walletParams;
};
