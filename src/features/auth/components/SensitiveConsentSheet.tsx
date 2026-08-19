import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import { AppModalShadowStyle, BottomSheetClasses, BottomSheetLayout } from '@/constants/theme';
import { TERMS_OF_SERVICE_COPY } from '@/features/auth/constants/termsOfService';

interface SensitiveConsentSheetProps {
  visible: boolean;
  summary: string;
  onConfirm: () => void;
  onClose: () => void;
}

// 민감정보 처리 고지를 하단 시트로 노출
// 약관 상세를 열지 않아도 동의 직전에 처리업체 고지 표시
// 확인 버튼은 고지 확인만 처리하고 최종 진행은 하단 버튼이 담당
export function SensitiveConsentSheet({
  visible,
  summary,
  onConfirm,
  onClose,
}: SensitiveConsentSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View className={BottomSheetClasses.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="닫기"
          className={BottomSheetClasses.backdrop}
          onPress={onClose}
        />

        <View
          className={BottomSheetClasses.surface}
          style={[
            AppModalShadowStyle,
            { paddingBottom: insets.bottom + BottomSheetLayout.bottomInsetMin },
          ]}
        >
          <View className={BottomSheetClasses.grabber} />

          <ThemedText type="smallTitle2" className={BottomSheetClasses.title}>
            {TERMS_OF_SERVICE_COPY.sensitiveSheetTitle}
          </ThemedText>

          <ScrollView
            className={BottomSheetClasses.bodyScroll}
            showsVerticalScrollIndicator={false}
          >
            <ThemedText type="default" className={BottomSheetClasses.body}>
              {summary}
            </ThemedText>
          </ScrollView>

          <View className={BottomSheetClasses.bodyToButtonGap}>
            <Button onPress={onConfirm}>{TERMS_OF_SERVICE_COPY.sensitiveSheetConfirmLabel}</Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
