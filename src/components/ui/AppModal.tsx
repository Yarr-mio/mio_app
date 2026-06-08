import { ThemedText } from '@/components/themed/ThemedText';
import { AppModalDefaults, AppModalLayout, AppModalShadowStyle } from '@/constants/theme';
import type { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';

interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  icon: ReactNode;
  iconBgColor: string;
  iconBorderColor: string;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  cancelLabel?: string;
  onCancel?: () => void;
}

export function AppModal({
  visible,
  onClose,
  icon,
  iconBgColor,
  iconBorderColor,
  title,
  description,
  confirmLabel,
  onConfirm,
  cancelLabel = AppModalDefaults.cancelLabel,
  onCancel,
}: AppModalProps) {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }
    onClose();
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center px-6">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="모달 닫기"
          className="absolute inset-0 bg-modal-overlay"
          onPress={onClose}
        />

        <View
          className="z-10 w-full rounded-base-card border border-modal-border bg-modal-surface px-6 pb-6 pt-8"
          style={AppModalShadowStyle}
        >
          <View className="mb-4 items-center">
            <View
              className="items-center justify-center"
              style={{
                width: AppModalLayout.iconCircleSize,
                height: AppModalLayout.iconCircleSize,
                borderRadius: AppModalLayout.iconCircleSize / 2,
                backgroundColor: iconBgColor,
                borderWidth: 1,
                borderColor: iconBorderColor,
              }}
            >
              {icon}
            </View>
          </View>

          <ThemedText type="defaultBold" className="mb-3 text-center text-xl text-fg-default">
            {title}
          </ThemedText>

          <ThemedText type="small" className="mb-6 text-center text-subtitle">
            {description}
          </ThemedText>

          <View className="gap-3">
            <Pressable
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              className="items-center justify-center rounded-modal-button bg-white"
              style={{ height: AppModalLayout.buttonHeight }}
            >
              <ThemedText type="default" className="text-lg font-bold text-modal-confirm-text">
                {confirmLabel}
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={handleCancel}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              className="items-center justify-center rounded-modal-button bg-btn-disabled"
              style={{ height: AppModalLayout.buttonHeight }}
            >
              <ThemedText type="default" className="text-lg font-bold text-fg">
                {cancelLabel}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
