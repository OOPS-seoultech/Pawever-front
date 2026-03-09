import { BackHandler, Platform } from 'react-native';
import { useEffect, useState } from 'react';

export function useExitConfirmation() {
  const [isExitConfirmationVisible, setIsExitConfirmationVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isExitConfirmationVisible) {
        setIsExitConfirmationVisible(false);
        return true;
      }

      setIsExitConfirmationVisible(true);
      return true;
    });

    return () => {
      subscription.remove();
    };
  }, [isExitConfirmationVisible]);

  const closeExitConfirmation = () => {
    setIsExitConfirmationVisible(false);
  };

  const confirmExit = () => {
    setIsExitConfirmationVisible(false);

    if (Platform.OS === 'android') {
      BackHandler.exitApp();
    }
  };

  return {
    closeExitConfirmation,
    confirmExit,
    isExitConfirmationVisible,
  };
}
