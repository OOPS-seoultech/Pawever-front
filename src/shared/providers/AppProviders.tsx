import type { PropsWithChildren } from 'react';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppSessionProvider } from '../../presentation/stores/AppSessionStore';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <AppSessionProvider>{children}</AppSessionProvider>
    </SafeAreaProvider>
  );
}
