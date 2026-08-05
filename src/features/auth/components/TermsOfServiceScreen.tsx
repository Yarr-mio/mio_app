import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { CheckboxCheckIcon } from '@/assets/icons';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AuthBackground } from '@/components/themed/AuthBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import {
  FgColors,
  HeaderLayout,
  HomeLayout,
  PressableConfig,
  ScreenSpacing,
  SignupFlowLayout,
  TermsOfServiceClasses,
} from '@/constants/theme';
import { StepIndicator } from '@/features/auth/components/StepIndicator';
import { useTermsOfServiceSubmit } from '@/features/auth/hooks/useTermsOfServiceSubmit';
import { type TermConsentId } from '@/features/auth/utils/buildSignupConsents';
import { cn } from '@/utils/cn';

const SIGNUP_STEP_COUNT = SignupFlowLayout.totalSteps;
const SIGNUP_CURRENT_STEP = SignupFlowLayout.termsCurrentStep;
const AGREEMENT_CARD_HEIGHT = TermsOfServiceClasses.agreementCardHeight;

interface TermItem {
  id: TermConsentId;
  label: string;
  required: boolean;
  hasDetail: boolean;
}

const TERM_ITEMS: TermItem[] = [
  { id: 'age', label: '만 14세 이상 확인', required: true, hasDetail: false },
  { id: 'service', label: '서비스 이용약관', required: true, hasDetail: true },
  { id: 'privacy', label: '개인정보 처리방침', required: true, hasDetail: true },
  { id: 'sensitive', label: '민감정보 수집 및 이용', required: true, hasDetail: true },
  { id: 'marketing', label: '마케팅 정보 수신 동의', required: false, hasDetail: true },
];

const REQUIRED_TERM_IDS = TERM_ITEMS.filter((item) => item.required).map((item) => item.id);

const INITIAL_CHECKED_STATE: Record<TermConsentId, boolean> = {
  age: false,
  service: false,
  privacy: false,
  sensitive: false,
  marketing: false,
};

interface AgreementTabProps {
  selected: boolean;
  children: ReactNode;
  className?: string;
}

function AgreementTab({ selected, children, className }: AgreementTabProps) {
  return (
    <View
      className={cn(
        'rounded-2xl border',
        selected ? 'border-accent/50 bg-accent/10' : 'border-accent/10 bg-accent/5',
        className
      )}
    >
      {children}
    </View>
  );
}

interface AgreementCheckboxProps {
  checked: boolean;
}

function AgreementCheckbox({ checked }: AgreementCheckboxProps) {
  return (
    <View
      className={cn(
        'h-7 w-7 items-center justify-center rounded-md border',
        checked ? 'border-accent bg-accent' : 'border-line-md bg-transparent'
      )}
    >
      {checked ? (
        <CheckboxCheckIcon
          width={HomeLayout.checkboxCheckWidth}
          height={HomeLayout.checkboxCheckHeight}
          color={FgColors.default}
        />
      ) : null}
    </View>
  );
}

interface AgreementRowProps {
  label: string;
  required: boolean;
  checked: boolean;
  hasDetail: boolean;
  onToggle: () => void;
  onDetailPress?: () => void;
}

function AgreementRow({
  label,
  required,
  checked,
  hasDetail,
  onToggle,
  onDetailPress,
}: AgreementRowProps) {
  return (
    <View className={cn('flex-row items-center gap-3 px-4', AGREEMENT_CARD_HEIGHT)}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={onToggle}
        className="flex-1 flex-row items-center gap-4"
      >
        <AgreementCheckbox checked={checked} />
        <ThemedText type="smallTitle" className="text-fg-high">
          {label}
        </ThemedText>
        <ThemedText type="small" className="text-badge">
          {required ? '[필수]' : '[선택]'}
        </ThemedText>
      </Pressable>
      {hasDetail ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} 상세 보기`}
          hitSlop={PressableConfig.hitSlop}
          onPress={onDetailPress}
        >
          <Ionicons
            name="chevron-forward"
            size={HeaderLayout.backHeaderIconSize}
            color={FgColors.muted}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

export default function TermsOfServiceScreen() {
  const { submit, isPending, error, clearError } = useTermsOfServiceSubmit();
  const [checkedState, setCheckedState] = useState(INITIAL_CHECKED_STATE);

  const requiredChecked = REQUIRED_TERM_IDS.every((id) => checkedState[id]);
  const isAgreeAllChecked = TERM_ITEMS.every((item) => checkedState[item.id]);

  const handleToggleTerm = (id: TermConsentId) => {
    clearError();
    setCheckedState((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleToggleAgreeAll = () => {
    clearError();
    const nextValue = !isAgreeAllChecked;
    setCheckedState({
      age: nextValue,
      service: nextValue,
      privacy: nextValue,
      sensitive: nextValue,
      marketing: nextValue,
    });
  };

  const handleContinue = () => {
    if (!requiredChecked) {
      return;
    }

    void submit(checkedState);
  };

  return (
    <View className="flex-1 bg-midnight">
      <AuthBackground />
      <ScreenContainer className="flex-1 px-8" bottomInsetMin={ScreenSpacing.bottomInsetMin}>
        <View className="pt-4 mt-6">
          <StepIndicator totalSteps={SIGNUP_STEP_COUNT} currentStep={SIGNUP_CURRENT_STEP} />
        </View>

        <View className="mt-12">
          <ThemedText type="title" className="text-fg">
            먼저 약관에{'\n'}동의해 주세요
          </ThemedText>
          <ThemedText type="subtitle" className="mt-3 text-subtitle">
            MIO를 안전하게 이용하기 위한 약관이에요
          </ThemedText>
        </View>

        <View className="mt-8 gap-5">
          <AgreementTab selected={isAgreeAllChecked} className="px-3">
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isAgreeAllChecked }}
              onPress={handleToggleAgreeAll}
              className={cn('flex-row items-center gap-4 px-4', AGREEMENT_CARD_HEIGHT)}
            >
              <AgreementCheckbox checked={isAgreeAllChecked} />
              <ThemedText type="smallTitle" className="text-fg-high">
                전체 동의하기
              </ThemedText>
            </Pressable>
          </AgreementTab>

          <View className="mt-4 gap-2">
            {TERM_ITEMS.map((item) => (
              <AgreementTab key={item.id} selected={checkedState[item.id]} className="px-4">
                <AgreementRow
                  label={item.label}
                  required={item.required}
                  checked={checkedState[item.id]}
                  hasDetail={item.hasDetail}
                  onToggle={() => handleToggleTerm(item.id)}
                  onDetailPress={
                    item.hasDetail
                      ? () => {
                          // 약관 상세 화면 이동 예정
                        }
                      : undefined
                  }
                />
              </AgreementTab>
            ))}
          </View>
        </View>

        <View className="mt-auto pt-8 gap-2">
          {error ? <ErrorState message={error} /> : null}
          <Button disabled={!requiredChecked || isPending} onPress={handleContinue}>
            동의하고 계속하기
          </Button>
        </View>
      </ScreenContainer>
    </View>
  );
}
