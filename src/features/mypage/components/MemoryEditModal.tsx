import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import { ONBOARDING_CHARACTERS } from '@/constants/characters';
import { InputColors } from '@/constants/theme';
import type { MemoryRecord } from '@/types/memory';
import { formatMemoryDate } from '@/utils/date';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, TextInput, View } from 'react-native';

interface MemoryEditModalProps {
  visible: boolean;
  record: MemoryRecord | null;
  isLoading: boolean;
  onSave: (description: string) => void;
  onClose: () => void;
}

const mioImage = ONBOARDING_CHARACTERS[0].image;

export function MemoryEditModal({
  visible,
  record,
  isLoading,
  onSave,
  onClose,
}: MemoryEditModalProps) {
  const [text, setText] = useState(record?.description ?? '');

  useEffect(() => {
    if (visible && record) {
      setText(record.description);
    }
  }, [visible, record]);

  if (!record) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScreenContainer className="bg-midnight" withBottomInset={false}>
          {/* 헤더 */}
          <View className="flex-row items-center px-5 pb-4 pt-4 border-b border-line">
            <Pressable onPress={onClose} className="mr-4">
              <ThemedText type="default" className="text-fg-sub">
                취소
              </ThemedText>
            </Pressable>
            <ThemedText type="smallTitle" className="flex-1 text-center">
              나의 기억 수정
            </ThemedText>
            <View className="w-10" />
          </View>

          {/* 카드 편집 영역 */}
          <View className="mx-5 mt-5 bg-surface rounded-2xl p-4 border border-line">
            <View className="flex-row justify-between items-center mb-2">
              <ThemedText type="smallMedium" className="text-fg-dim">
                {formatMemoryDate(record.created_at)}
              </ThemedText>
              <ThemedText type="smallMedium" className="text-fg-dim">
                {record.category_label}
              </ThemedText>
            </View>

            <ThemedText type="smallBold" className="mb-3">
              {record.title}
            </ThemedText>

            <View className="flex-row gap-3 items-start">
              <Image
                source={mioImage}
                style={{ width: 44, height: 44, borderRadius: 22 }}
                contentFit="cover"
              />
              <TextInput
                value={text}
                onChangeText={setText}
                multiline
                className="text-fg-dim text-xs flex-1 leading-5 min-h-[72px]"
                placeholderTextColor={InputColors.placeholder}
                placeholder="내용을 입력하세요..."
              />
            </View>
          </View>

          <View className="mx-5 mt-4">
            <Button loading={isLoading} onPress={() => onSave(text)}>
              저장하기
            </Button>
          </View>
        </ScreenContainer>
      </KeyboardAvoidingView>
    </Modal>
  );
}
