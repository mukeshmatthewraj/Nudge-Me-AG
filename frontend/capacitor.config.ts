import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nudgeme.app',
  appName: 'NudgeMe',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_nudge',
      iconColor: '#6366F1',
      sound: 'beep.wav',
    },
    Geolocation: {
      // Background location permissions configuration
    }
  }
};

export default config;
