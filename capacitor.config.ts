import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.coffeeops.cafeapp',
  appName: 'CoffeeOps Cafe Operations',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
