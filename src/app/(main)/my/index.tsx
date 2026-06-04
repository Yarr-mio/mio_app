import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ThemedText } from '@/components/themed/ThemedText';
import { MemoryActionSheet } from '@/features/mypage/components/MemoryActionSheet';
import { MemoryCard } from '@/features/mypage/components/MemoryCard';
import { MemoryDeleteModal } from '@/features/mypage/components/MemoryDeleteModal';
import { MemoryEditModal } from '@/features/mypage/components/MemoryEditModal';
import {
  useDeleteMemoryRecord,
  useMemoryList,
  useUpdateMemoryRecord,
} from '@/features/mypage/hooks/useMemory';
import { FgColors } from '@/constants/theme';
import type { MemoryRecord } from '@/types/memory';
import { useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';

export default function MyScreen() {
  const { data: records, isLoading } = useMemoryList();
  const { mutate: deleteRecord, isPending: isDeleting } = useDeleteMemoryRecord();
  const { mutate: updateRecord, isPending: isUpdating } = useUpdateMemoryRecord();

  const [selectedRecord, setSelectedRecord] = useState<MemoryRecord | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  function handleLongPress(record: MemoryRecord) {
    setSelectedRecord(record);
    setShowActionSheet(true);
  }

  function handleEditPress() {
    setShowActionSheet(false);
    setShowEditModal(true);
  }

  function handleDeletePress() {
    setShowActionSheet(false);
    setShowDeleteModal(true);
  }

  function handleDeleteConfirm() {
    if (!selectedRecord) return;
    deleteRecord(selectedRecord.id, {
      onSuccess: () => {
        setShowDeleteModal(false);
        setSelectedRecord(null);
      },
    });
  }

  function handleSave(description: string) {
    if (!selectedRecord) return;
    updateRecord(
      { id: selectedRecord.id, description },
      {
        onSuccess: () => {
          setShowEditModal(false);
          setSelectedRecord(null);
        },
      }
    );
  }

  return (
    <ScreenContainer className="bg-midnight">
      <FlatList
        data={records ?? []}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-5 pb-8 gap-3"
        ListHeaderComponent={
          <View className="pt-6 mb-4 items-center">
            <ThemedText type="title">나의 기억</ThemedText>
            <View className="h-[139px] justify-center px-8">
              <ThemedText type="captionCenter">
                {
                  'Mio와 함께 했던 기억 조각을 확인해 볼까요?\n기억을 길게 누르면 세부적인 관리를 할 수 있어요'
                }
              </ThemedText>
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={FgColors.default} className="mt-8" />
          ) : (
            <ThemedText type="captionCenter" className="text-fg-ghost mt-8">
              아직 저장된 기억이 없어요
            </ThemedText>
          )
        }
        renderItem={({ item }) => (
          <MemoryCard record={item} onLongPress={() => handleLongPress(item)} />
        )}
      />

      <MemoryActionSheet
        visible={showActionSheet}
        record={selectedRecord}
        onClose={() => setShowActionSheet(false)}
        onEdit={handleEditPress}
        onDelete={handleDeletePress}
      />

      <MemoryDeleteModal
        visible={showDeleteModal}
        record={selectedRecord}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
      />

      <MemoryEditModal
        visible={showEditModal}
        record={selectedRecord}
        isLoading={isUpdating}
        onSave={handleSave}
        onClose={() => setShowEditModal(false)}
      />
    </ScreenContainer>
  );
}
