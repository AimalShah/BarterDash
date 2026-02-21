import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import type { Preview } from '@storybook/react-native';
import { GluestackUIProvider } from '@/components/ui/reusables';

const preview: Preview = {
  decorators: [
    (Story: React.ComponentType) => (
      <SafeAreaView style={styles.safeArea}>
        <GluestackUIProvider>
          <View style={styles.canvas}>
            <Story />
          </View>
        </GluestackUIProvider>
      </SafeAreaView>
    ),
  ],
  parameters: {
    controls: {
      expanded: true,
      sort: 'requiredFirst',
    },
    backgrounds: {
      default: 'App Surface',
      values: [
        { name: 'App Surface', value: '#F5F7F8' },
        { name: 'White', value: '#FFFFFF' },
        { name: 'Slate', value: '#E2E8F0' },
      ],
    },
  },
};

export default preview;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7F8',
  },
  canvas: {
    flex: 1,
    padding: 16,
  },
});
