import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const projectId = config.extra?.eas?.projectId;
  const bundleIdentifier = process.env.IOS_BUNDLE_IDENTIFIER;
  const isCloudBuild = process.env.EAS_BUILD === 'true';
  if (
    isCloudBuild &&
    (!projectId || !bundleIdentifier || !process.env.EXPO_PUBLIC_API_URL?.startsWith('https://'))
  ) {
    throw new Error(
      'Before an EAS build, link this EAS project, configure the registered IOS_BUNDLE_IDENTIFIER, and set an HTTPS EXPO_PUBLIC_API_URL.',
    );
  }
  return {
    ...config,
    name: 'TickerBrief',
    slug: 'tickerbrief',
    version: '0.1.0',
    scheme: 'tickerbrief',
    owner: 'jeppy22',
    icon: './assets/brand/icon.png',
    ios: {
      ...config.ios,
      bundleIdentifier,
      appleTeamId: '98BBY4NN94',
      supportsTablet: false,
      infoPlist: { ITSAppUsesNonExemptEncryption: false },
    },
    extra: { ...config.extra, ...(projectId ? { eas: { projectId } } : {}) },
  };
};
