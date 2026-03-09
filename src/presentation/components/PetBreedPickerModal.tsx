import { Fragment } from 'react';

import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const closeIcon = 'https://www.figma.com/api/mcp/asset/075fc4a7-3390-4e0e-bc49-1ad071f797e2';
const searchIcon = 'https://www.figma.com/api/mcp/asset/44ea0eee-e753-44eb-9ad0-ee866f97eac3';

type PetBreedPickerModalProps = {
  options: string[];
  onChangeQuery: (value: string) => void;
  onClose: () => void;
  onSelect: (value: string) => void;
  query: string;
  visible: boolean;
};

const renderHighlightedLabel = (label: string, query: string) => {
  if (!query.trim()) {
    return <Text style={styles.listItemLabel}>{label}</Text>;
  }

  const lowerLabel = label.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerLabel.indexOf(lowerQuery);

  if (matchIndex === -1) {
    return <Text style={styles.listItemLabel}>{label}</Text>;
  }

  const start = label.slice(0, matchIndex);
  const match = label.slice(matchIndex, matchIndex + query.length);
  const end = label.slice(matchIndex + query.length);

  return (
    <Text style={styles.listItemLabel}>
      {start ? <Text>{start}</Text> : null}
      <Text style={styles.listItemLabelHighlight}>{match}</Text>
      {end ? <Text>{end}</Text> : null}
    </Text>
  );
};

export function PetBreedPickerModal({
  options,
  onChangeQuery,
  onClose,
  onSelect,
  query,
  visible,
}: PetBreedPickerModalProps) {
  const insets = useSafeAreaInsets();
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter(option => option.toLowerCase().includes(normalizedQuery))
    : options;

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
      <View style={styles.root}>
        <View style={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.headerBlock}>
            <View style={styles.header}>
              <Pressable hitSlop={8} onPress={onClose} style={styles.closeButton}>
                <Image source={{ uri: closeIcon }} style={styles.closeIcon} />
              </Pressable>
              <Text style={styles.headerTitle}>반려동물 선택</Text>
              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.searchField}>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                onChangeText={onChangeQuery}
                placeholder="반려동물의 종을 선택하거나 입력해주세요."
                placeholderTextColor="#A79189"
                selectionColor="#FFA94E"
                style={styles.searchInput}
                value={query}
              />
              <Image source={{ uri: searchIcon }} style={styles.searchIcon} />
            </View>
          </View>

          {filteredOptions.length ? (
            <ScrollView
              bounces={false}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {filteredOptions.map((option, index) => (
                <Fragment key={option}>
                  <Pressable onPress={() => onSelect(option)} style={styles.listItem}>
                    {renderHighlightedLabel(option, query)}
                  </Pressable>
                  {index < filteredOptions.length - 1 ? <View style={styles.listDivider} /> : null}
                </Fragment>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                ‘{query || '검색어'}’에 대한
                {'\n'}
                검색 결과가 없습니다.
              </Text>
              <Text style={styles.emptyDescription}>찾으시는 종을 다시 입력해주세요.</Text>
            </View>
          )}
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerBlock: {
    gap: 24,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 46,
    justifyContent: 'space-between',
  },
  closeButton: {
    alignItems: 'center',
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  closeIcon: {
    height: 20,
    width: 20,
  },
  headerTitle: {
    color: '#352622',
    fontFamily: 'sans-serif',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  headerSpacer: {
    width: 20,
  },
  searchField: {
    alignItems: 'center',
    borderColor: '#E1E0DE',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    height: 50,
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  searchInput: {
    color: '#352622',
    flex: 1,
    fontFamily: 'sans-serif',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
    paddingVertical: 0,
  },
  searchIcon: {
    height: 20,
    tintColor: '#D8D4CD',
    width: 20,
  },
  listContent: {
    paddingTop: 16,
  },
  listItem: {
    justifyContent: 'center',
    minHeight: 40,
    paddingVertical: 12,
  },
  listItemLabel: {
    color: '#352622',
    fontFamily: 'sans-serif',
    fontSize: 12,
    lineHeight: 16,
  },
  listItemLabelHighlight: {
    color: '#FD7E14',
    fontWeight: '800',
  },
  listDivider: {
    backgroundColor: '#E1E0DE',
    height: 1,
    width: '100%',
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 140,
  },
  emptyTitle: {
    color: '#352622',
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
    textAlign: 'center',
  },
  emptyDescription: {
    color: '#86746E',
    fontFamily: 'sans-serif',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 15,
    textAlign: 'center',
  },
});
