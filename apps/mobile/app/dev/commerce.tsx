import React, { useMemo, useState } from "react";
import { Alert, ScrollView, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/stream/ProductCard";
import ProductFeedCard from "@/components/stream/ProductFeedCard";
import { PaymentMethodManager } from "@/components/payment/PaymentMethodManager";
import { PaymentMethodValidation } from "@/components/payment/PaymentMethodValidation";
import { PaymentStatusTracker, PaymentStatus } from "@/components/payment/PaymentStatusTracker";
import { EnhancedCheckout, OrderSummary } from "@/components/payment/EnhancedCheckout";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={{ marginBottom: 32 }}>
    <Text
      style={{
        color: COLORS.textPrimary,
        fontSize: 18,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 1,
      }}
    >
      {title}
    </Text>
    <View style={{ marginTop: 12 }}>{children}</View>
  </View>
);

export default function CommercePreviewScreen() {
  const [statusStage, setStatusStage] = useState<PaymentStatus["stage"]>("initiated");

  const orderSummary: OrderSummary = useMemo(
    () => ({
      orderId: "order_demo_123",
      items: [
        { id: "item_1", name: "Vintage Watch", price: 820, quantity: 1 },
        { id: "item_2", name: "Collector Card Pack", price: 120, quantity: 2 },
      ],
      subtotal: 1060,
      shipping: 25,
      tax: 86,
      platformFee: 19,
      total: 1190,
      currency: "usd",
    }),
    [],
  );

  const statusPresets: Record<PaymentStatus["stage"], PaymentStatus> = {
    initiated: { stage: "initiated", message: "Ready to process payment" },
    processing: { stage: "processing", message: "Processing payment..." },
    requires_action: {
      stage: "requires_action",
      message: "3D Secure verification required",
      actionRequired: {
        type: "3d_secure",
        instructions: "Complete verification to continue.",
      },
    },
    succeeded: { stage: "succeeded", message: "Payment successful!" },
    failed: {
      stage: "failed",
      message: "Payment failed",
      error: {
        code: "card_declined",
        message: "Your card was declined.",
        type: "card_error",
      },
    },
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.luxuryBlack }}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>
        <View style={{ paddingTop: 16, paddingBottom: 12 }}>
          <Text style={{ color: COLORS.textPrimary, fontSize: 28, fontWeight: "900" }}>
            Commerce + Payments Preview
          </Text>
          <Text style={{ color: COLORS.textSecondary, marginTop: 6, fontSize: 14 }}>
            Product buy UI, checkout surfaces, and payment components.
          </Text>
        </View>

        <Section title="Product Buying">
          <ProductCard
            title="Vintage Chronograph"
            price={1299}
            image="https://picsum.photos/seed/vintage-watch/300/300"
            onBid={() => Alert.alert("Bid")}
            onBuy={() => Alert.alert("Buy")}
          />
          <View style={{ marginTop: 16 }}>
            <ProductFeedCard
              product={{
                id: "prod_demo_1",
                title: "Streetwear Limited Drop",
                price: 480,
                condition: "new",
                images: ["https://picsum.photos/seed/streetwear/400/600"],
                seller: { id: "seller_1", username: "dropmaster" },
              }}
            />
          </View>
        </Section>

        <Section title="Checkout UI">
          <Card>
            <CardHeader>
              <CardTitle style={{ color: COLORS.textPrimary, fontSize: 16 }}>
                Checkout Summary (Preview)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Text style={{ color: COLORS.textSecondary, marginBottom: 8 }}>
                Items: {orderSummary.items.length}
              </Text>
              <Text style={{ color: COLORS.textSecondary, marginBottom: 8 }}>
                Total: ${orderSummary.total}
              </Text>
              <Button label="Continue to Payment" onPress={() => Alert.alert("Checkout")} />
            </CardContent>
          </Card>

          <View style={{ marginTop: 16 }}>
            <EnhancedCheckout
              orderSummary={orderSummary}
              onSuccess={() => Alert.alert("Payment Success")}
              onError={() => Alert.alert("Payment Error")}
              onCancel={() => Alert.alert("Payment Cancelled")}
              allowSavedMethods={false}
              showOrderSummary={true}
            />
          </View>
        </Section>

        <Section title="Payment Methods">
          <PaymentMethodManager userId="preview-user" showAddButton={false} />
          <View style={{ marginTop: 16 }}>
            <PaymentMethodValidation onValidationChange={() => undefined} />
          </View>
        </Section>

        <Section title="Payment Status">
          <View style={{ marginBottom: 12 }}>
            <PaymentStatusTracker
              paymentIntentId="pi_preview_123"
              currentStatus={statusPresets[statusStage]}
              showProgressBar={true}
              showTimestamp={false}
            />
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            <View style={{ marginRight: 10, marginBottom: 10 }}>
              <Button label="Initiated" size="sm" onPress={() => setStatusStage("initiated")} />
            </View>
            <View style={{ marginRight: 10, marginBottom: 10 }}>
              <Button label="Processing" size="sm" onPress={() => setStatusStage("processing")} />
            </View>
            <View style={{ marginRight: 10, marginBottom: 10 }}>
              <Button label="Action" size="sm" onPress={() => setStatusStage("requires_action")} />
            </View>
            <View style={{ marginRight: 10, marginBottom: 10 }}>
              <Button label="Success" size="sm" onPress={() => setStatusStage("succeeded")} />
            </View>
            <Button label="Failed" size="sm" onPress={() => setStatusStage("failed")} />
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
