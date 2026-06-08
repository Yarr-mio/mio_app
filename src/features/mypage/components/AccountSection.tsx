import { DeleteAccountIcon, LogoutIcon } from '@/assets/icons';
import { ThemedText } from '@/components/themed/ThemedText';
import { AppModal } from '@/components/ui/AppModal';
import { BaseCard } from '@/components/ui/BaseCard';
import { getPartnerByKey } from '@/constants/characters';
import { AccountModalColors, AppModalLayout } from '@/constants/theme';
import { usePartnerStore } from '@/features/mypage/store/partnerStore';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

type AccountActionId = 'logout' | 'withdraw';

interface AccountActionItem {
  id: AccountActionId;
  label: string;
}

const ACCOUNT_ACTION_ITEMS: AccountActionItem[] = [
  { id: 'logout', label: '로그아웃' },
  { id: 'withdraw', label: '회원 탈퇴' },
];

const LOGOUT_MODAL = {
  title: '정말 로그아웃 하시겠어요?',
  description: '로그아웃 후 다시 로그인하시면\n이전 기록들을 그대로 이어 보실 수 있어요',
  confirmLabel: '로그아웃',
} as const;

const WITHDRAW_MODAL = {
  title: (partnerName: string) => `정말 ${partnerName}와 헤어지시겠어요?`,
  description: (partnerName: string) =>
    `탈퇴하시면 그동안 ${partnerName}와 함께 나눈\n소중한 대화와 마음 기록들이\n모두 삭제되며 이를 복구할 수 없어요`,
  confirmLabel: '탈퇴하기',
} as const;

interface AccountActionRowProps {
  label: string;
  onPress: () => void;
}

function AccountActionRow({ label, onPress }: AccountActionRowProps) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <BaseCard className="flex-row items-center px-6 py-6">
        <ThemedText type="smallTitle" className="text-settings-account">
          {label}
        </ThemedText>
      </BaseCard>
    </Pressable>
  );
}

export function AccountSection() {
  const [activeModal, setActiveModal] = useState<AccountActionId | null>(null);
  const selectedPartner = usePartnerStore((state) => state.selectedPartner);
  const partnerName = getPartnerByKey(selectedPartner).name;

  const closeModal = () => setActiveModal(null);

  return (
    <>
      <View className="gap-2">
        {ACCOUNT_ACTION_ITEMS.map((item) => (
          <AccountActionRow
            key={item.id}
            label={item.label}
            onPress={() => setActiveModal(item.id)}
          />
        ))}
      </View>

      <AppModal
        visible={activeModal === 'logout'}
        onClose={closeModal}
        icon={
          <LogoutIcon
            width={AppModalLayout.iconSize}
            height={AppModalLayout.iconSize}
            color={AccountModalColors.icon}
          />
        }
        iconBgColor={AccountModalColors.iconBg}
        iconBorderColor={AccountModalColors.iconBorder}
        title={LOGOUT_MODAL.title}
        description={LOGOUT_MODAL.description}
        confirmLabel={LOGOUT_MODAL.confirmLabel}
        onConfirm={() => {
          console.log('로그아웃');
          closeModal();
        }}
      />

      <AppModal
        visible={activeModal === 'withdraw'}
        onClose={closeModal}
        icon={
          <DeleteAccountIcon
            width={AppModalLayout.iconSize}
            height={AppModalLayout.iconSize}
            color={AccountModalColors.icon}
          />
        }
        iconBgColor={AccountModalColors.iconBg}
        iconBorderColor={AccountModalColors.iconBorder}
        title={WITHDRAW_MODAL.title(partnerName)}
        description={WITHDRAW_MODAL.description(partnerName)}
        confirmLabel={WITHDRAW_MODAL.confirmLabel}
        onConfirm={() => {
          console.log('회원탈퇴');
          closeModal();
        }}
      />
    </>
  );
}
