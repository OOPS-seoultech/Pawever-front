import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type ExitConfirmationModalProps = {
  onCancel: () => void;
  onConfirm: () => void;
  visible: boolean;
};

export function ExitConfirmationModal({ onCancel, onConfirm, visible }: ExitConfirmationModalProps) {
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.copyBlock}>
            <Text style={styles.title}>로그인을 중단하시겠어요?</Text>
            <Text style={styles.description}>
              지금 앱을 종료하면 처음 화면부터{'\n'}
              다시 시작됩니다.
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <Pressable onPress={onCancel} style={[styles.button, styles.cancelButton]}>
              <Text style={[styles.buttonLabel, styles.cancelLabel]}>취소</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={[styles.button, styles.confirmButton]}>
              <Text style={[styles.buttonLabel, styles.confirmLabel]}>확인</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#F9F9F9',
    borderRadius: 14,
    elevation: 5,
    gap: 16,
    maxWidth: 298,
    paddingHorizontal: 20,
    paddingVertical: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    width: '100%',
  },
  copyBlock: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    color: '#42302A',
    fontFamily: 'sans-serif',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    textAlign: 'center',
  },
  description: {
    color: '#86746E',
    fontFamily: 'sans-serif',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  button: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    height: 48,
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F9F9F9',
    borderColor: '#E1E0DE',
    borderWidth: 2,
  },
  confirmButton: {
    backgroundColor: '#FFA94E',
  },
  buttonLabel: {
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  cancelLabel: {
    color: '#979691',
  },
  confirmLabel: {
    color: '#FFFFFF',
  },
});
