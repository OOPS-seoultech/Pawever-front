import { Platform } from 'react-native';
import {
  type PermissionStatus,
  PERMISSIONS,
  RESULTS,
  openSettings,
  request,
} from 'react-native-permissions';

export type AppPermissionRequestResult = {
  blocked: boolean;
  granted: boolean;
  limited: boolean;
  status: PermissionStatus;
};

const toPermissionResult = (status: PermissionStatus): AppPermissionRequestResult => ({
  blocked: status === RESULTS.BLOCKED,
  granted: status === RESULTS.GRANTED || status === RESULTS.LIMITED,
  limited: status === RESULTS.LIMITED,
  status,
});

const requestPermission = async (
  iosPermission: string | null,
  androidPermission: string | null,
): Promise<AppPermissionRequestResult> => {
  const permission = Platform.select({
    android: androidPermission,
    ios: iosPermission,
    default: null,
  });

  if (!permission) {
    return toPermissionResult(RESULTS.UNAVAILABLE);
  }

  return toPermissionResult(await request(permission as never));
};

export const requestCameraPermission = () =>
  requestPermission(
    PERMISSIONS.IOS.CAMERA,
    PERMISSIONS.ANDROID.CAMERA,
  );

export const requestPhotoLibraryPermission = () => {
  if (Platform.OS === 'android') {
    return Promise.resolve(toPermissionResult(RESULTS.GRANTED));
  }

  return requestPermission(PERMISSIONS.IOS.PHOTO_LIBRARY, null);
};

export const requestMicrophonePermission = () =>
  requestPermission(
    PERMISSIONS.IOS.MICROPHONE,
    PERMISSIONS.ANDROID.RECORD_AUDIO,
  );

export const requestLocationPermission = () =>
  requestPermission(
    PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
    PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
  );

export const openAppSettings = () => openSettings();
