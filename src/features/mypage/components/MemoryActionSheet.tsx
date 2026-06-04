import { ONBOARDING_CHARACTERS } from '@/constants/characters';
import type { MemoryRecord } from '@/types/memory';
import { formatMemoryDate } from '@/utils/date';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed/ThemedText';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MemoryActionSheetProps {
  visible: boolean;
  record: MemoryRecord | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const mioImage = ONBOARDING_CHARACTERS[0].image;

export function MemoryActionSheet({
  visible,
  record,
  onClose,
  onEdit,
  onDelete,
}: MemoryActionSheetProps) {
  const { bottom } = useSafeAreaInsets();

  if (!record) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="flex-1" onPress={onClose} />

        <View
          className="bg-midnight rounded-t-3xl px-5 pt-5"
          style={{ paddingBottom: bottom + 16 }}
        >
          {/* 선택 카드 미리보기 */}
          <View className="flex-row items-center gap-3 mb-5 pb-5 border-b border-line">
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

          {/* 수정하기 */}
          <Pressable
            onPress={onEdit}
            className="flex-row items-center gap-4 bg-surface-md rounded-2xl px-4 py-4 mb-3"
          >
            <View className="w-10 h-10 rounded-xl items-center justify-center bg-primary/20">
              <ThemedText type="default" className="text-primary">
                ✎
              </ThemedText>
            </View>
            <View>
              <ThemedText type="small">수정하기</ThemedText>
              <ThemedText type="smallMedium" className="text-fg-muted mt-0.5">
                기억 내용을 편집해요
              </ThemedText>
            </View>
          </Pressable>

          {/* 삭제하기 */}
          <Pressable
            onPress={onDelete}
            className="flex-row items-center gap-4 bg-surface-md rounded-2xl px-4 py-4"
          >
            <View className="w-10 h-10 rounded-xl items-center justify-center bg-danger/15">
              <ThemedText type="default">🗑</ThemedText>
            </View>
            <View>
              <ThemedText type="small" className="text-danger">
                삭제하기
              </ThemedText>
              <ThemedText type="smallMedium" className="text-fg-muted mt-0.5">
                이 기억을 영구 삭제해요
              </ThemedText>
            </View>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
