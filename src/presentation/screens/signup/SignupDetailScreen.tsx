/**
 * 회원가입 Step 2 - 반려동물 상세 정보
 * Figma: 0_6_회원가입_반려동물_<이전으로>
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
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
  Animated,
  Dimensions,
  Keyboard,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Stepper} from '@presentation/components/common/Stepper';
import {
  useRegistrationStore,
  isValidBirthday,
  type PetGender,
} from '@presentation/stores/registrationStore';
import {colors, fontSize, spacing, borderRadius} from '@shared/styles';
import {useStepperNavigation} from '@shared/hooks/useStepperNavigation';
import {useSignupBackHandler} from '@shared/hooks/useSignupBackHandler';
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

/** 피그마 0_6-2_회원가입_반려동물_몸무게 선택 항목 */
const WEIGHT_OPTIONS = [
  '잘 모르겠어요.',
  '500g 미만',
  '500g 이상 - 1kg 미만 (소동물)',
  '1kg 이상 - 3kg 미만 (일반)',
  '3kg 이상 - 5kg 미만',
  '5kg 이상 - 8kg 미만',
  '8kg 이상 - 10kg 미만',
  '10kg 이상 - 13kg 미만',
  '13kg 이상 - 15kg 미만 (일반)',
  '15kg 이상 - 18kg 미만 (대형 동물)',
  '18kg 이상 - 20kg 미만',
  '20kg 이상 - 24kg 미만',
  '24kg 이상 - 28kg 미만',
  '28kg 이상 - 32kg 미만',
  '32kg 이상 - 37kg 미만',
  '37kg 이상 - 42kg 미만',
  '42kg 이상 - 48kg 미만',
  '48kg 이상 - 55kg 미만',
  '55kg 이상',
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

  useSignupBackHandler(2);

  const handleStepPress = useStepperNavigation({
    currentStep: 2,
    isCurrentStepValid: isStep2Valid,
  });
  const [breedModalVisible, setBreedModalVisible] = useState(false);
  const [breedSearchQuery, setBreedSearchQuery] = useState('');
  const [weightModalVisible, setWeightModalVisible] = useState(false);

  const isValid = isStep2Valid();
  const breedList = BREED_OPTIONS[petType ?? 'other'] ?? BREED_OPTIONS.other;
  const query = breedSearchQuery.trim().toLowerCase();
  const filteredBreedList = React.useMemo(() => {
    const filtered = breedList.filter(name =>
      name.toLowerCase().includes(query),
    );
    if (!query) return filtered;
    return [...filtered].sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      const aStarts = aLower.startsWith(query) ? 1 : 0;
      const bStarts = bLower.startsWith(query) ? 1 : 0;
      if (aStarts !== bStarts) return bStarts - aStarts;
      const aIdx = aLower.indexOf(query);
      const bIdx = bLower.indexOf(query);
      return aIdx - bIdx;
    });
  }, [breedList, query]);

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
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* 스텝퍼 */}
          <Stepper totalSteps={3} currentStep={2} completedUpTo={maxReachedStep} currentStepValid={isValid} onStepPress={handleStepPress} />

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
              onPress={() => { Keyboard.dismiss(); setBreedModalVisible(true); }}
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
            <View style={[
              styles.inputBox,
              petBirthday.length === 8 && !isValidBirthday(petBirthday) && styles.inputBoxError,
            ]}>
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
            {petBirthday.length === 8 && !isValidBirthday(petBirthday) && (
              <Text style={styles.errorText}>올바른 날짜를 입력해주세요</Text>
            )}
          </View>

          {/* 몸무게 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>몸무게를 입력해주세요</Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => { Keyboard.dismiss(); setWeightModalVisible(true); }}
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
                onPress={() => { Keyboard.dismiss(); setPetGender('male'); }}
              />
              <GenderButton
                label="여아"
                icon="♀"
                iconColor="#FF90C0"
                isSelected={petGender === 'female'}
                onPress={() => { Keyboard.dismiss(); setPetGender('female'); }}
              />
            </View>

            {/* 중성화 체크박스 */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => { Keyboard.dismiss(); setIsNeutered(!isNeutered); }}
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

      {/* 종 검색/선택 모달 (피그마: 0_6-1_회원가입_반려동물_종 검색) */}
      <BreedSearchModal
        visible={breedModalVisible}
        title="반려동물 선택"
        searchPlaceholder="반려동물의 종을 선택하거나 입력해주세요."
        options={breedList}
        filteredOptions={filteredBreedList}
        searchQuery={breedSearchQuery}
        onSearchChange={setBreedSearchQuery}
        onSelect={value => {
          setPetBreed(value);
          setBreedModalVisible(false);
          setBreedSearchQuery('');
        }}
        onClose={() => {
          setBreedModalVisible(false);
          setBreedSearchQuery('');
        }}
        insets={insets}
      />

      {/* 몸무게 선택 모달 (피그마 0_6-2: 상단 안내 문구 + 목록) */}
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
        listHeaderComponent={
          <Text style={styles.weightModalNotice}>
            * 무게에 따른 동물 분류는 업체마다 상이할 수 있습니다.
          </Text>
        }
      />
    </KeyboardAvoidingView>
  );
}

/** 검색어와 겹치는 부분을 강조한 라벨 (리스트 항목용). 모달에서는 선택 상태 없음 */
function BreedSearchItemLabel({
  item,
  searchQuery,
}: {
  item: string;
  searchQuery: string;
}) {
  const q = searchQuery.trim().toLowerCase();
  if (!q) {
    return <Text style={styles.breedSearchItemText}>{item}</Text>;
  }
  const segments: {text: string; highlight: boolean}[] = [];
  let remaining = item;
  let remainingLower = item.toLowerCase();
  let pos = remainingLower.indexOf(q);
  while (pos !== -1) {
    segments.push({text: remaining.slice(0, pos), highlight: false});
    segments.push({text: remaining.slice(pos, pos + q.length), highlight: true});
    remaining = remaining.slice(pos + q.length);
    remainingLower = remainingLower.slice(pos + q.length);
    pos = remainingLower.indexOf(q);
  }
  segments.push({text: remaining, highlight: false});

  return (
    <Text style={styles.breedSearchItemText}>
      {segments.map((seg, i) =>
        seg.highlight ? (
          <Text key={i} style={styles.breedSearchItemTextHighlight}>
            {seg.text}
          </Text>
        ) : (
          seg.text
        ),
      )}
    </Text>
  );
}

/** 종 검색/선택 풀스크린 모달 (피그마 0_6-1: 헤더 + 검색창 + 리스트, 입력 시 필터) */
function BreedSearchModal({
  visible,
  title,
  searchPlaceholder,
  filteredOptions,
  searchQuery,
  onSearchChange,
  onSelect,
  onClose,
  insets,
}: {
  visible: boolean;
  title: string;
  searchPlaceholder: string;
  options: string[];
  filteredOptions: string[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelect: (value: string) => void;
  onClose: () => void;
  insets: {top: number; bottom: number};
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.breedSearchContainer, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
        {/* 헤더: X + 타이틀 (피그마 Head bar) */}
        <View style={styles.breedSearchHeader}>
          <TouchableOpacity
            style={styles.breedSearchCloseBtn}
            onPress={onClose}
            hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
            activeOpacity={0.7}>
            <Text style={styles.breedSearchCloseText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.breedSearchTitle}>{title}</Text>
          <View style={styles.breedSearchCloseBtn} />
        </View>
        {/* 검색창 (피그마 bar). 한국어: 에뮬레이터는 IME 설정 확인 필요 */}
        <View style={styles.breedSearchBar}>
          <TextInput
            style={styles.breedSearchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.brandBeige}
            value={searchQuery}
            onChangeText={onSearchChange}
          />
          <Text style={styles.breedSearchIcon}>🔍</Text>
        </View>
        {/* 리스트: 목록 항목만 검색·선택 가능 (임의 값 등록 없음) */}
        <FlatList
          data={filteredOptions}
          keyExtractor={item => item}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.breedSearchList}
          contentContainerStyle={styles.breedSearchListContent}
          ListEmptyComponent={
            searchQuery.trim() ? (
              <Text style={styles.breedSearchEmpty}>검색 결과가 없어요. 목록에 있는 항목만 선택할 수 있어요.</Text>
            ) : (
              <Text style={styles.breedSearchEmpty}>목록에서 선택하거나 검색어를 입력해주세요.</Text>
            )
          }
          renderItem={({item}) => (
            <TouchableOpacity
              style={styles.breedSearchItem}
              onPress={() => onSelect(item)}
              activeOpacity={0.7}>
              <BreedSearchItemLabel
                item={item}
                searchQuery={searchQuery}
              />
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.breedSearchItemLine} />}
        />
      </View>
    </Modal>
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

/** 선택 모달 (종/몸무게) — 배경 fade + 컨텐츠 slide up */
const SCREEN_HEIGHT = Dimensions.get('window').height;

function PickerModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
  listHeaderComponent,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  listHeaderComponent?: React.ReactElement | null;
}) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);
  const listRef = useRef<FlatList<string>>(null);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible, fadeAnim, slideAnim]);

  useEffect(() => {
    if (visible && modalVisible) {
      const t = setTimeout(() => listRef.current?.flashScrollIndicators(), 400);
      return () => clearTimeout(t);
    }
  }, [visible, modalVisible]);

  return (
    <Modal visible={modalVisible} transparent animationType="none">
      <View style={styles.modalWrapper}>
        <Animated.View style={[styles.modalOverlay, {opacity: fadeAnim}]}>
          <TouchableOpacity style={styles.modalOverlayTouch} onPress={onClose} activeOpacity={1} />
        </Animated.View>
        <Animated.View style={[styles.modalContent, {transform: [{translateY: slideAnim}]}]}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{title}</Text>
          <FlatList
            ref={listRef}
            data={options}
            keyExtractor={item => item}
            showsVerticalScrollIndicator={true}
            persistentScrollbar={true}
            style={styles.modalList}
            contentContainerStyle={styles.modalListContent}
            ListHeaderComponent={listHeaderComponent ?? undefined}
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
        </Animated.View>
      </View>
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
  inputBoxError: {
    borderColor: '#E53E3E',
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: '#E53E3E',
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
  modalWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalOverlayTouch: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 40,
  },
  modalListContent: {
    paddingBottom: 24,
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
  weightModalNotice: {
    fontSize: 12,
    fontWeight: '400',
    color: '#FD7E14',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 16,
    lineHeight: 16,
  },
  modalList: {
    paddingHorizontal: 20,
    flexGrow: 0,
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

  /** 종 검색 모달 (피그마 0_6-1) */
  breedSearchContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },
  breedSearchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 46,
    marginBottom: 24,
  },
  breedSearchCloseBtn: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breedSearchCloseText: {
    fontSize: 18,
    color: colors.brandBrown,
    fontWeight: '600',
  },
  breedSearchTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.brandBrown,
  },
  breedSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderColor: '#E1E0DE',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  breedSearchInput: {
    flex: 1,
    fontSize: 12,
    color: colors.brandBrown,
    padding: 0,
  },
  breedSearchIcon: {
    fontSize: 16,
    marginLeft: 8,
  },
  breedSearchList: {
    flex: 1,
  },
  breedSearchListContent: {
    paddingBottom: 24,
  },
  breedSearchItem: {
    paddingVertical: 16,
    justifyContent: 'center',
  },
  breedSearchItemText: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.brandBrown,
  },
  breedSearchItemTextSelected: {
    fontWeight: '700',
    color: colors.brandOrange,
  },
  breedSearchItemTextHighlight: {
    fontSize: 12,
    color: colors.brandOrange,
    fontWeight: '700',
  },
  breedSearchEmpty: {
    fontSize: 12,
    color: colors.brandBeige,
    textAlign: 'center',
    paddingVertical: 24,
  },
  breedSearchItemLine: {
    height: 1,
    backgroundColor: '#E1E0DE',
  },
});
