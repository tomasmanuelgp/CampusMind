import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Re-Fluye', slug: 'refluye', version: '0.3.0', scheme: 'refluye',
  orientation: 'default', userInterfaceStyle: 'light', platforms: ['android', 'web'],
  android: {
    package: 'co.refluye.campo', versionCode: 3, allowBackup: false,
    permissions: ['android.permission.BLUETOOTH', 'android.permission.BLUETOOTH_ADMIN',
      'android.permission.BLUETOOTH_SCAN', 'android.permission.BLUETOOTH_CONNECT',
      'android.permission.ACCESS_FINE_LOCATION'],
    blockedPermissions: ['android.permission.RECORD_AUDIO', 'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_MEDIA_VIDEO', 'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.READ_EXTERNAL_STORAGE', 'android.permission.SYSTEM_ALERT_WINDOW'],
  },
  plugins: ['expo-router', 'expo-sqlite', './plugins/with-permisos-campo'],
  web: { bundler: 'metro', output: 'single' },
};
export default config;
