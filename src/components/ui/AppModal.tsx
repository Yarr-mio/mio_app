import { ThemedText } from '@/components/themed/ThemedText';
import { AppModalDefaults, AppModalLayout, AppModalShadowStyle } from '@/constants/theme';
import type { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';

interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  // 아이콘 영역 선택 렌더링함
  icon?: ReactNode;
  iconBgColor?: string;
  iconBorderColor?: string;
  // 취소 버튼 선택 렌더링함
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
  cancelLabel,
  onCancel,
}: AppModalProps) {
  const showIcon = icon != null && iconBgColor != null && iconBorderColor != null;
  const showCancelButton = cancelLabel != null || onCancel != null;
  const resolvedCancelLabel = cancelLabel ?? AppModalDefaults.cancelLabel;

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
          {showIcon ? (
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
          ) : null}

          <ThemedText type="defaultBold" className="mb-3 text-center text-xl text-fg-default">
            {title}
          </ThemedText>

          {typeof description === 'string' ? (
            <ThemedText type="small" className="mb-6 text-center text-subtitle">
              {description}
            </ThemedText>
          ) : (
            <View className="mb-6">{description}</View>
          )}

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

            {showCancelButton ? (
              <Pressable
                onPress={handleCancel}
                accessibilityRole="button"
                accessibilityLabel={resolvedCancelLabel}
                className="items-center justify-center rounded-modal-button bg-btn-disabled"
                style={{ height: AppModalLayout.buttonHeight }}
              >
                <ThemedText type="default" className="text-lg font-bold text-fg">
                  {resolvedCancelLabel}
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}
