import { appFlowScreens } from './appFlowScreens';
import { useAppSessionStore } from '../stores/AppSessionStore';

export function RootNavigator() {
  const { appFlow } = useAppSessionStore();
  const Screen = appFlowScreens[appFlow];

  return <Screen />;
}
