import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PetWeightBottomSheetProps = {
  onClose: () => void;
  onSelect: (value: string) => void;
  options: string[];
  selectedValue: string;
  visible: boolean;
};

export function PetWeightBottomSheet({
  onClose,
  onSelect,
  options,
  selectedValue,
  visible,
}: PetWeightBottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.root}>
        <Pressable onPress={onClose} style={styles.overlay} />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.handleBlock}>
            <View style={styles.handle} />
          </View>

          <Text style={styles.noticeText}>* 무게에 따른 동물 분류는 업체마다 상이할 수 있습니다.</Text>
          <View style={styles.divider} />

          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {options.map((option, index) => (
              <View key={option}>
                <Pressable
                  onPress={() => onSelect(option)}
                  style={[styles.row, selectedValue === option ? styles.rowSelected : null]}
                >
                  <Text style={styles.rowLabel}>{option}</Text>
                </Pressable>
                {index < options.length - 1 ? <View style={styles.divider} /> : null}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '82%',
    overflow: 'hidden',
    paddingTop: 20,
  },
  handleBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  handle: {
    backgroundColor: '#D9D9D9',
    borderRadius: 999,
    height: 5,
    width: 70,
  },
  noticeText: {
    color: '#FD7E14',
    fontFamily: 'sans-serif',
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 15,
  },
  divider: {
    backgroundColor: '#E1E0DE',
    height: 1,
    width: '100%',
  },
  row: {
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  rowSelected: {
    backgroundColor: '#EFEFEE',
  },
  rowLabel: {
    color: '#352622',
    fontFamily: 'sans-serif',
    fontSize: 12,
    lineHeight: 16,
  },
});
