import { Button } from '@/components/ui/Button';
import { ONBOARDING_CHARACTERS } from '@/constants/characters';
import type { MemoryRecord } from '@/types/memory';
import { formatMemoryDate } from '@/utils/date';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed/ThemedText';
import { Modal, View } from 'react-native';

interface MemoryDeleteModalProps {
  visible: boolean;
  record: MemoryRecord | null;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const mioImage = ONBOARDING_CHARACTERS[0].image;

export function MemoryDeleteModal({
  visible,
  record,
  isLoading,
  onConfirm,
  onCancel,
}: MemoryDeleteModalProps) {
  if (!record) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 justify-center items-center px-6 bg-canvas-night/70">
        <View className="w-full bg-midnight rounded-3xl p-6">
          <ThemedText type="defaultBold" className="text-xl text-center mb-2">
            선택한 기억을 삭제할까요?
          </ThemedText>
          <ThemedText type="captionCenter" className="mb-5">
            삭제된 기억은 복구할 수 없어요.
          </ThemedText>

          {/* 카드 미리보기 */}
          <View className="bg-surface-md rounded-2xl px-4 py-3 mb-6 flex-row items-center gap-3">
            <Image
              source={mioImage}
              style={{ width: 40, height: 40, borderRadius: 20 }}
              contentFit="cover"
            />
            <View className="flex-1">
              <ThemedText type="smallBold" numberOfLines={1}>
                {record.title}
              </ThemedText>
              <ThemedText type="smallMedium" className="text-fg-dim mt-0.5">
                {formatMemoryDate(record.created_at)} · {record.category_label}
              </ThemedText>
            </View>
          </View>

          {/* 삭제하기 버튼 */}
          <Button variant="white" loading={isLoading} onPress={onConfirm} className="mb-3">
            삭제하기
          </Button>

          {/* 취소 버튼 */}
          <Button variant="ghost" size="md" onPress={onCancel} disabled={isLoading}>
            취소
          </Button>
        </View>
      </View>
    </Modal>
  );
}
