import { StatusBar } from 'react-native';

import { RootNavigator } from './presentation/navigation/RootNavigator';
import { AppProviders } from './shared/providers/AppProviders';
import { theme } from './shared/styles/theme';

function App() {
  return (
    <AppProviders>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.canvas} />
      <RootNavigator />
    </AppProviders>
  );
}

export default App;
