const { withAndroidManifest, withGradleProperties } = require('expo/config-plugins');
module.exports = config => {
  config = withGradleProperties(config, config => {
    const propiedad = config.modResults.find(p => p.type === 'property' && p.key === 'expo.useLegacyPackaging');
    if (propiedad) propiedad.value = 'true';
    else config.modResults.push({type:'property',key:'expo.useLegacyPackaging',value:'true'});
    return config;
  });
  return withAndroidManifest(config, config => {
  const manifiesto = config.modResults.manifest;
  for (const permiso of manifiesto['uses-permission'] || []) {
    const nombre = permiso.$['android:name'];
    if (['android.permission.BLUETOOTH', 'android.permission.BLUETOOTH_ADMIN',
      'android.permission.ACCESS_FINE_LOCATION'].includes(nombre)) permiso.$['android:maxSdkVersion'] = '30';
    if (nombre === 'android.permission.BLUETOOTH_SCAN') permiso.$['android:usesPermissionFlags'] = 'neverForLocation';
  }
  return config;
  });
};
