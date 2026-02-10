import React, { useState } from "react";
import { Alert, ScrollView, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, Star } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { COLORS } from "@/constants/colors";

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
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

export default function ComponentsPreviewScreen() {
  const [email, setEmail] = useState("name@example.com");
  const [password, setPassword] = useState("password123");
  const [note, setNote] = useState("");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.luxuryBlack }}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 60,
        }}
      >
        <View style={{ paddingTop: 16, paddingBottom: 12 }}>
          <Text
            style={{
              color: COLORS.textPrimary,
              fontSize: 28,
              fontWeight: "900",
            }}
          >
            UI Components Preview
          </Text>
          <Text
            style={{
              color: COLORS.textSecondary,
              marginTop: 6,
              fontSize: 14,
            }}
          >
            Lightweight gallery for quick visual checks.
          </Text>
        </View>

        <Section title="Buttons">
          <View>
            <View style={{ marginBottom: 12 }}>
              <Button label="Primary" onPress={() => Alert.alert("Primary")} />
            </View>
            <View style={{ marginBottom: 12 }}>
              <Button label="Secondary" variant="secondary" onPress={() => Alert.alert("Secondary")} />
            </View>
            <View style={{ marginBottom: 12 }}>
              <Button label="Outline" variant="outline" onPress={() => Alert.alert("Outline")} />
            </View>
            <View style={{ marginBottom: 12 }}>
              <Button label="Ghost" variant="ghost" onPress={() => Alert.alert("Ghost")} />
            </View>
            <View style={{ marginBottom: 12 }}>
              <Button label="Destructive" variant="destructive" onPress={() => Alert.alert("Destructive")} />
            </View>
            <View style={{ marginBottom: 12 }}>
              <Button label="With Icon" onPress={() => Alert.alert("Icon")} icon={<Star size={18} color={COLORS.luxuryBlack} />} />
            </View>
            <View style={{ marginBottom: 12 }}>
              <Button label="Disabled" onPress={() => Alert.alert("Disabled")} disabled />
            </View>
            <Button label="Loading" onPress={() => Alert.alert("Loading")} loading />
          </View>
        </Section>

        <Section title="Inputs">
          <Input
            label="Email"
            placeholder="name@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Bell size={18} color={COLORS.textMuted} />}
          />
          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Input
            label="Notes"
            placeholder="Write something..."
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={4}
          />
          <Input
            label="With Error"
            placeholder="This is invalid"
            value=""
            onChangeText={() => undefined}
            error="Please enter a value"
          />
        </Section>

        <Section title="Cards">
          <Card>
            <CardHeader>
              <CardTitle>Premium Drop</CardTitle>
              <CardDescription>Limited auction item preview</CardDescription>
            </CardHeader>
            <CardContent>
              <Text style={{ color: COLORS.textSecondary, lineHeight: 20 }}>
                This card showcases the dark luxury theme with the current UI palette.
              </Text>
            </CardContent>
            <CardFooter style={{ justifyContent: "space-between", width: "100%" }}>
              <Text style={{ color: COLORS.primaryGold, fontWeight: "700" }}>$1,250</Text>
              <Button label="Bid Now" onPress={() => Alert.alert("Bid")} size="sm" />
            </CardFooter>
          </Card>
        </Section>

        <Section title="Loading">
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ marginRight: 12 }}>
              <LoadingSpinner size="small" />
            </View>
            <LoadingSpinner />
          </View>
        </Section>

        <Section title="Empty State">
          <View style={{ height: 220, borderRadius: 16, overflow: "hidden" }}>
            <EmptyState
              title="No Results"
              description="Try adjusting your filters or search terms."
              actionLabel="Reset Filters"
              onAction={() => Alert.alert("Reset")}
            />
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
