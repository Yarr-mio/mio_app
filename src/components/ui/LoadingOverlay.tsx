import { ButtonColors } from '@/constants/theme';
import { ActivityIndicator, Modal, View } from 'react-native';

interface LoadingOverlayProps {
  visible: boolean;
}

export function LoadingOverlay({ visible }: LoadingOverlayProps) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={() => {}}>
      <View className="flex-1 items-center justify-center bg-modal-overlay">
        <ActivityIndicator color={ButtonColors.spinnerLight} size="large" />
      </View>
    </Modal>
  );
}
