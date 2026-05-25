import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/utils/cn';

const SIGNUP_STEP_COUNT = 4;
const SIGNUP_CURRENT_STEP = 2;

type TermId = 'service' | 'privacy' | 'age' | 'marketing';

interface TermItem {
  id: TermId;
  label: string;
  required: boolean;
}

const TERM_ITEMS: TermItem[] = [
  { id: 'service', label: '서비스 이용약관 [필수]', required: true },
  { id: 'privacy', label: '개인정보 처리방침 [필수]', required: true },
  { id: 'age', label: '만 14세 이상 확인 [필수]', required: true },
  { id: 'marketing', label: '마케팅 정보 수신 동의 [선택]', required: false },
];

const REQUIRED_TERM_IDS = TERM_ITEMS.filter((item) => item.required).map((item) => item.id);

const INITIAL_CHECKED_STATE: Record<TermId, boolean> = {
  service: false,
  privacy: false,
  age: false,
  marketing: false,
};

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
}

function StepIndicator({ totalSteps, currentStep }: StepIndicatorProps) {
  return (
    <View className="flex-row items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, index) => {
        const step = index + 1;
        const isActive = step === currentStep;

        return (
          <View
            key={step}
            className={cn(
              'h-2 rounded-full',
              isActive ? 'w-6 bg-primary' : 'w-2 bg-ink-dim-night/40'
            )}
          />
        );
      })}
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
        'h-6 w-6 items-center justify-center rounded-full border',
        checked ? 'border-primary bg-primary' : 'border-chip-night bg-transparent'
      )}
    >
      {/* 여기에 아이콘 추가할 것!! */}
      {checked ? <Text className="text-xs font-bold text-ink-night">✓</Text> : null}
    </View>
  );
}

interface AgreementRowProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
  onDetailPress?: () => void;
}

function AgreementRow({ label, checked, onToggle, onDetailPress }: AgreementRowProps) {
  return (
    <View className="flex-row items-center gap-3 py-4">
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={onToggle}
        className="flex-1 flex-row items-center gap-3"
      >
        <AgreementCheckbox checked={checked} />
        <Text className="flex-1 text-base text-ink-night">{label}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} 상세 보기`}
        hitSlop={8}
        onPress={onDetailPress}
      >
        {/* 여기에 아이콘 추가할 것!! */}
        <Text className="text-lg text-ink-dim-night">›</Text>
      </Pressable>
    </View>
  );
}

export default function TermsOfServiceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [checkedState, setCheckedState] = useState(INITIAL_CHECKED_STATE);

  const requiredChecked = REQUIRED_TERM_IDS.every((id) => checkedState[id]);
  const allChecked = TERM_ITEMS.every((item) => checkedState[item.id]);
  const isAgreeAllChecked = allChecked;

  const handleToggleTerm = (id: TermId) => {
    setCheckedState((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleToggleAgreeAll = () => {
    const nextValue = !isAgreeAllChecked;
    setCheckedState({
      service: nextValue,
      privacy: nextValue,
      age: nextValue,
      marketing: nextValue,
    });
  };

  const handleContinue = () => {
    if (!requiredChecked) {
      return;
    }
    router.push('/(auth)/signup/info');
  };

  return (
    <View className="flex-1 bg-midnight">
      {/* 배경 이미지 추가할 것 */}
      <View
        className="flex-1 px-6"
        style={{ paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 24) }}
      >
        <View className="pt-4">
          <StepIndicator totalSteps={SIGNUP_STEP_COUNT} currentStep={SIGNUP_CURRENT_STEP} />
        </View>

        <View className="mt-10">
          <Text className="text-3xl font-bold leading-10 text-ink-night">
            먼저 약관에{'\n'}동의해 주세요
          </Text>
          <Text className="mt-3 text-base text-ink-dim-night">
            MIO를 안전하게 이용하기 위한 약관이에요
          </Text>
        </View>

        <View className="mt-8 gap-4">
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isAgreeAllChecked }}
            onPress={handleToggleAgreeAll}
            className="flex-row items-center gap-3 rounded-2xl border border-chip-night bg-panel-night px-4 py-4"
          >
            <AgreementCheckbox checked={isAgreeAllChecked} />
            <Text className="text-base font-semibold text-ink-night">전체 동의하기</Text>
          </Pressable>

          <View className="rounded-2xl border border-chip-night bg-panel-night px-4">
            {TERM_ITEMS.map((item, index) => (
              <View key={item.id}>
                <AgreementRow
                  label={item.label}
                  checked={checkedState[item.id]}
                  onToggle={() => handleToggleTerm(item.id)}
                  onDetailPress={() => {
                    // 약관 상세 화면 이동 나중에 추가
                  }}
                />
                {index < TERM_ITEMS.length - 1 && <View className="h-px bg-chip-night" />}
              </View>
            ))}
          </View>
        </View>

        <View className="mt-auto pt-8">
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !requiredChecked }}
            disabled={!requiredChecked}
            onPress={handleContinue}
            className={cn(
              'h-14 w-full items-center justify-center rounded-2xl',
              requiredChecked ? 'bg-primary' : 'bg-chip-night'
            )}
          >
            <Text className="text-base font-semibold text-ink-night">동의하고 계속하기</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
