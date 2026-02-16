/**
 * 회원가입 Step 2 - 반려동물 상세 정보
 * Figma: 0_6_회원가입_반려동물_<이전으로>
 */

import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Stepper} from '@presentation/components/common/Stepper';
import {
  useRegistrationStore,
  type PetGender,
} from '@presentation/stores/registrationStore';
import {colors, fontSize, spacing, borderRadius} from '@shared/styles';
import {useStepperNavigation} from '@shared/hooks/useStepperNavigation';
import type {RootStackParamList} from '@presentation/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/** 임시 견종/묘종 목록 (실제로는 서버에서 받아올 데이터) */
const BREED_OPTIONS: Record<string, string[]> = {
  dog: ['골든 리트리버', '래브라도 리트리버', '푸들', '말티즈', '시츄', '포메라니안', '비숑 프리제', '웰시 코기', '치와와', '비글', '닥스훈트', '사모예드', '시베리안 허스키', '진돗개', '믹스견', '기타'],
  cat: ['러시안 블루', '페르시안', '브리티쉬 숏헤어', '스코티쉬 폴드', '먼치킨', '벵갈', '샴', '랙돌', '아비시니안', '메인쿤', '코리안 숏헤어', '믹스묘', '기타'],
  hamster: ['골든 햄스터', '드워프 햄스터', '로보롭스키', '캠벨', '기타'],
  bird: ['앵무새', '잉꼬', '카나리아', '십자매', '기타'],
  fish: ['금붕어', '베타', '구피', '네온 테트라', '기타'],
  turtle: ['붉은귀거북', '레오파드 거북', '러시안 거북', '기타'],
  reptile: ['레오파드 게코', '크레스티드 게코', '비어디 드래곤', '볼파이썬', '기타'],
  other: ['기타'],
};

const WEIGHT_OPTIONS = [
  '1kg 미만', '1~3kg', '3~5kg', '5~7kg', '7~10kg',
  '10~15kg', '15~20kg', '20~25kg', '25~30kg', '30kg 이상',
];

export function SignupDetailScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const {
    petName,
    petType,
    petBreed,
    petBirthday,
    petWeight,
    petGender,
    isNeutered,
    setPetBreed,
    setPetBirthday,
    setPetWeight,
    setPetGender,
    setIsNeutered,
    isStep2Valid,
    advanceToStep,
    maxReachedStep,
  } = useRegistrationStore();

  const handleStepPress = useStepperNavigation();
  const [breedModalVisible, setBreedModalVisible] = useState(false);
  const [weightModalVisible, setWeightModalVisible] = useState(false);

  const isValid = isStep2Valid();
  const breedList = BREED_OPTIONS[petType ?? 'other'] ?? BREED_OPTIONS.other;

  const handlePrev = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleNext = useCallback(() => {
    if (!isValid) {
      return;
    }
    advanceToStep(3);
    navigation.navigate('SignupProfile');
  }, [isValid, advanceToStep, navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={[styles.container, {paddingTop: insets.top}]}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* 스텝퍼 */}
          <Stepper totalSteps={3} currentStep={2} completedUpTo={maxReachedStep} onStepPress={handleStepPress} />

          {/* 헤더 */}
          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>
              {`${petName || '우리 아이'}는\n어떤 아이인가요?`}
            </Text>
          </View>

          {/* 세부 종 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>세부 종을 등록해주세요</Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => setBreedModalVisible(true)}
              activeOpacity={0.7}>
              <Text style={[styles.selectText, petBreed && styles.selectTextFilled]}>
                {petBreed || '종을 선택해주세요.'}
              </Text>
              <Text style={styles.selectArrow}>▾</Text>
            </TouchableOpacity>
          </View>

          {/* 생일 입력 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>생일을 입력해주세요</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.inputText}
                placeholder="8자리로 작성해주세요. ex) 20170415"
                placeholderTextColor={colors.brandBeige}
                value={petBirthday}
                onChangeText={setPetBirthday}
                keyboardType="number-pad"
                maxLength={8}
              />
            </View>
          </View>

          {/* 몸무게 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>몸무게를 입력해주세요</Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => setWeightModalVisible(true)}
              activeOpacity={0.7}>
              <Text style={[styles.selectText, petWeight && styles.selectTextFilled]}>
                {petWeight || '몸무게를 선택해주세요.'}
              </Text>
              <Text style={styles.selectArrow}>▾</Text>
            </TouchableOpacity>
          </View>

          {/* 성별 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>성별을 선택해주세요</Text>
            <View style={styles.genderRow}>
              <GenderButton
                label="남아"
                icon="♂"
                iconColor="#5B9BD5"
                isSelected={petGender === 'male'}
                onPress={() => setPetGender('male')}
              />
              <GenderButton
                label="여아"
                icon="♀"
                iconColor="#FF90C0"
                isSelected={petGender === 'female'}
                onPress={() => setPetGender('female')}
              />
            </View>

            {/* 중성화 체크박스 */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setIsNeutered(!isNeutered)}
              activeOpacity={0.7}>
              <View style={[styles.checkbox, isNeutered && styles.checkboxChecked]}>
                {isNeutered && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>중성화 수술을 했나요?</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={[styles.bottomSection, {paddingBottom: insets.bottom + spacing.lg}]}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.prevButton}
            onPress={handlePrev}
            activeOpacity={0.8}>
            <Text style={styles.prevButtonText}>이전</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextButton, isValid && styles.nextButtonActive]}
            onPress={handleNext}
            disabled={!isValid}
            activeOpacity={0.8}>
            <Text style={[styles.nextButtonText, isValid && styles.nextButtonTextActive]}>
              다음으로
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 종 선택 모달 */}
      <PickerModal
        visible={breedModalVisible}
        title="종을 선택해주세요"
        options={breedList}
        selected={petBreed}
        onSelect={value => {
          setPetBreed(value);
          setBreedModalVisible(false);
        }}
        onClose={() => setBreedModalVisible(false)}
      />

      {/* 몸무게 선택 모달 */}
      <PickerModal
        visible={weightModalVisible}
        title="몸무게를 선택해주세요"
        options={WEIGHT_OPTIONS}
        selected={petWeight}
        onSelect={value => {
          setPetWeight(value);
          setWeightModalVisible(false);
        }}
        onClose={() => setWeightModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

/** 성별 선택 버튼 */
function GenderButton({
  label,
  icon,
  iconColor,
  isSelected,
  onPress,
}: {
  label: string;
  icon: string;
  iconColor: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.genderButton, isSelected && styles.genderButtonSelected]}
      onPress={onPress}
      activeOpacity={0.7}>
      <Text style={[styles.genderIcon, {color: isSelected ? iconColor : colors.brandBeige}]}>
        {icon}
      </Text>
      <Text style={[styles.genderLabel, isSelected && styles.genderLabelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/** 선택 모달 (종/몸무게) */
function PickerModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose} activeOpacity={1}>
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{title}</Text>
          <FlatList
            data={options}
            keyExtractor={item => item}
            showsVerticalScrollIndicator={false}
            style={styles.modalList}
            renderItem={({item}) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  item === selected && styles.modalItemSelected,
                ]}
                onPress={() => onSelect(item)}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.modalItemText,
                    item === selected && styles.modalItemTextSelected,
                  ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },

  /** 헤더 */
  headerSection: {
    marginTop: 32,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.brandBrown,
    letterSpacing: 0.48,
    lineHeight: 29,
  },

  /** 섹션 */
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.brandBrown,
    lineHeight: 17,
  },

  /** 셀렉트 박스 (드롭다운) */
  selectBox: {
    marginTop: 12,
    height: 50,
    borderWidth: 1,
    borderColor: colors.middleGray,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  selectText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.brandBeige,
  },
  selectTextFilled: {
    color: colors.brandBrown,
  },
  selectArrow: {
    fontSize: 14,
    color: colors.brandBeige,
  },

  /** 인풋 박스 */
  inputBox: {
    marginTop: 12,
    height: 50,
    borderWidth: 1,
    borderColor: colors.middleGray,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  inputText: {
    fontSize: fontSize.xs,
    color: colors.brandBrown,
    padding: 0,
  },

  /** 성별 선택 */
  genderRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  genderButton: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderColor: colors.middleGray,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  genderButtonSelected: {
    borderColor: colors.brandOrange,
    borderWidth: 2,
    backgroundColor: colors.primaryLight,
  },
  genderIcon: {
    fontSize: 16,
  },
  genderLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.brandBeige,
  },
  genderLabelSelected: {
    color: colors.brandBrown,
  },

  /** 중성화 체크박스 */
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  checkbox: {
    width: 17,
    height: 17,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.middleGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.brandOrange,
    borderColor: colors.brandOrange,
  },
  checkMark: {
    fontSize: 11,
    color: colors.white,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: fontSize.xs,
    color: colors.brandBeige,
  },

  /** 하단 버튼 */
  bottomSection: {
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 14,
  },
  prevButton: {
    width: 106,
    height: 52,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.middleGray,
  },
  prevButtonText: {
    fontSize: fontSize.base,
    fontWeight: '800',
    color: '#494844',
  },
  nextButton: {
    flex: 1,
    height: 52,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.middleGray,
  },
  nextButtonActive: {
    backgroundColor: colors.brandOrange,
  },
  nextButtonText: {
    fontSize: fontSize.base,
    fontWeight: '800',
    color: '#979691',
  },
  nextButtonTextActive: {
    color: colors.white,
  },

  /** 모달 */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.middleGray,
    alignSelf: 'center',
    marginTop: 12,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.brandBrown,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  modalList: {
    paddingHorizontal: 20,
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  modalItemSelected: {
    backgroundColor: colors.primaryLight,
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderBottomColor: 'transparent',
  },
  modalItemText: {
    fontSize: fontSize.md,
    color: colors.brandBrown,
  },
  modalItemTextSelected: {
    fontWeight: '700',
    color: colors.brandOrange,
  },
});
