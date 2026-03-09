import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type InviteCodePromptModalProps = {
  errorMessage?: string | null;
  isSubmitting?: boolean;
  onChangeText: (value: string) => void;
  onRequestClose?: () => void;
  onSkip: () => void;
  onSubmit: () => void;
  value: string;
  visible: boolean;
};

export function InviteCodePromptModal({
  errorMessage = null,
  isSubmitting = false,
  onChangeText,
  onRequestClose,
  onSkip,
  onSubmit,
  value,
  visible,
}: InviteCodePromptModalProps) {
  return (
    <Modal animationType="fade" onRequestClose={onRequestClose ?? onSkip} visible={visible}>
      <View style={styles.root}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <View style={styles.copyBlock}>
              <Text style={styles.title}>
                잠깐!
                {'\n'}
                친구에게 받은 초대 코드가 있나요?
              </Text>
              <Text style={styles.description}>
                초대코드로 아이를 함께 기록하세요
                {'\n'}
                {'\n'}
                설정에서 우리 아이를 공유하면,
                {'\n'}
                다른 사람도 함께 기록할 수 있습니다!
              </Text>
            </View>

            <View style={styles.inputBlock}>
              <TextInput
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!isSubmitting}
                maxLength={8}
                onChangeText={onChangeText}
                onSubmitEditing={onSubmit}
                placeholder="영문 포함 8자리를 입력하세요."
                placeholderTextColor="#86746E"
                returnKeyType="done"
                selectionColor="#FFA94E"
                style={styles.input}
                value={value}
              />
              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            </View>

            <View style={styles.actionGroup}>
              <View style={styles.buttonRow}>
                <Pressable disabled={isSubmitting} onPress={onSkip} style={[styles.button, styles.skipButton]}>
                  <Text style={[styles.buttonLabel, styles.skipLabel]}>아니요</Text>
                </Pressable>
                <Pressable
                  disabled={isSubmitting}
                  onPress={onSubmit}
                  style={[styles.button, styles.submitButton, isSubmitting ? styles.buttonDisabled : null]}
                >
                  <Text style={[styles.buttonLabel, styles.submitLabel]}>
                    {isSubmitting ? '확인 중...' : '입력완료'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
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
    maxWidth: 312,
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
    color: '#352622',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    textAlign: 'center',
  },
  description: {
    color: '#86746E',
    fontFamily: 'sans-serif',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  inputBlock: {
    gap: 10,
    width: '100%',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E1E0DE',
    borderRadius: 12,
    borderWidth: 1,
    color: '#42302A',
    fontFamily: 'sans-serif',
    fontSize: 12,
    minHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  errorText: {
    color: '#A33C33',
    fontFamily: 'sans-serif',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'left',
  },
  actionGroup: {
    position: 'relative',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  button: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    flex: 1,
    height: 48,
    justifyContent: 'center',
  },
  skipButton: {
    borderColor: '#E1E0DE',
    backgroundColor: '#F9F9F9',
  },
  submitButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFA94E',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonLabel: {
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  skipLabel: {
    color: '#979691',
  },
  submitLabel: {
    color: '#FFA94E',
  },
});
