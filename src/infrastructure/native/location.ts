import Geolocation from '@react-native-community/geolocation';

Geolocation.setRNConfiguration({
  authorizationLevel: 'whenInUse',
  enableBackgroundLocationUpdates: false,
  locationProvider: 'auto',
  skipPermissionRequests: true,
});

export type DeviceCoordinates = {
  latitude: number;
  longitude: number;
};

export const getCurrentDeviceCoordinates = () =>
  new Promise<DeviceCoordinates>((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      error => {
        reject(error);
      },
      {
        enableHighAccuracy: false,
        maximumAge: 60 * 1000,
        timeout: 10 * 1000,
      },
    );
  });
