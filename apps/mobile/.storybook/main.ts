import type { StorybookConfig } from '@storybook/react-native';

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(ts|tsx|js|jsx)'],
  addons: [
    '@storybook/addon-ondevice-actions',
    '@storybook/addon-ondevice-controls',
    '@storybook/addon-ondevice-backgrounds',
  ],
};

export default config;
