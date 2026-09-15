const { withAndroidManifest } = require('@expo/config-plugins');

const withReactNativeMaps = (config, { googleMapsApiKey }) => {
  if (!googleMapsApiKey) {
    throw new Error('googleMapsApiKey is required for react-native-maps plugin');
  }

  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const { manifest } = androidManifest;

    if (!manifest.application) {
      manifest.application = [{}];
    }

    const application = manifest.application[0];
    
    if (!application['meta-data']) {
      application['meta-data'] = [];
    }

    // Agregar o actualizar la API key de Google Maps
    const existingApiKey = application['meta-data'].find(
      (item) => item.$ && item.$['android:name'] === 'com.google.android.geo.API_KEY'
    );

    if (existingApiKey) {
      existingApiKey.$['android:value'] = googleMapsApiKey;
    } else {
      application['meta-data'].push({
        $: {
          'android:name': 'com.google.android.geo.API_KEY',
          'android:value': googleMapsApiKey,
        },
      });
    }

    return config;
  });
};

module.exports = withReactNativeMaps;

