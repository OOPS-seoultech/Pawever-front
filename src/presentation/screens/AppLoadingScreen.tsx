import { Image, StatusBar, StyleSheet, Text, View } from 'react-native';

const pawMarkAssetUri = 'https://www.figma.com/api/mcp/asset/51adb77a-4b60-4189-9655-eaffb6a37860';
const wordmarkAssetUri = 'https://www.figma.com/api/mcp/asset/f62bb94d-d5e0-4ca5-a9b3-844bcf0b149b';
const loadingBackground = '#FFA94E';
const loadingForeground = '#FFFBEB';

export function AppLoadingScreen() {
  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={loadingBackground} barStyle="light-content" />
      <View style={styles.center}>
        <View style={styles.markFrame}>
          <View style={styles.markFallback}>
            <View style={styles.toeRow}>
              <View style={styles.toe} />
              <View style={styles.toe} />
            </View>
            <View style={styles.toeRowOuter}>
              <View style={styles.toeSmall} />
              <View style={styles.pad} />
              <View style={styles.toeSmall} />
            </View>
          </View>
          <Image resizeMode="contain" source={{ uri: pawMarkAssetUri }} style={styles.markImage} />
        </View>

        <View style={styles.wordmarkFrame}>
          <Text style={styles.wordmarkFallback}>PAWEVER</Text>
          <Image resizeMode="contain" source={{ uri: wordmarkAssetUri }} style={styles.wordmarkImage} />
        </View>

        <Text style={styles.description}>
          후회없는 시간을 위해{'\n'}
          펫로스 통합 지원 서비스, 포에버가 함께합니다
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    backgroundColor: loadingBackground,
    flex: 1,
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    gap: 16,
    justifyContent: 'center',
    marginTop: -10,
    width: '100%',
  },
  markFrame: {
    alignItems: 'center',
    height: 114,
    justifyContent: 'center',
    width: 92,
  },
  markFallback: {
    alignItems: 'center',
    height: 114,
    justifyContent: 'center',
    width: 92,
  },
  markImage: {
    height: 114,
    position: 'absolute',
    width: 92,
  },
  toeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  toeRowOuter: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  toe: {
    backgroundColor: loadingForeground,
    borderRadius: 999,
    height: 22,
    width: 22,
  },
  toeSmall: {
    backgroundColor: loadingForeground,
    borderRadius: 999,
    height: 18,
    marginTop: 24,
    width: 18,
  },
  pad: {
    backgroundColor: '#F3EFDF',
    borderRadius: 18,
    height: 54,
    marginTop: 14,
    transform: [{ rotate: '45deg' }],
    width: 54,
  },
  wordmarkFrame: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    marginTop: 4,
    width: 175,
  },
  wordmarkFallback: {
    color: loadingForeground,
    fontFamily: 'sans-serif',
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -1.1,
    lineHeight: 30,
  },
  wordmarkImage: {
    height: 30,
    position: 'absolute',
    width: 175,
  },
  description: {
    color: loadingForeground,
    fontFamily: 'sans-serif',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
    width: 245,
  },
});
