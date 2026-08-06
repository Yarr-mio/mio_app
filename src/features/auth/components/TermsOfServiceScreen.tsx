import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { CheckboxCheckIcon } from '@/assets/icons';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AuthBackground } from '@/components/themed/AuthBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import { LEGAL_DOCUMENT_IDS } from '@/constants/legalDocuments';
import { AUTH_ROUTES } from '@/constants/routes';
import {
  FgColors,
  HeaderLayout,
  HomeLayout,
  PressableConfig,
  ScreenSpacing,
  SignupFlowClasses,
  SignupFlowLayout,
  TermsOfServiceClasses,
} from '@/constants/theme';
import { StepIndicator } from '@/features/auth/components/StepIndicator';
import {
  INITIAL_CHECKED_STATE,
  REQUIRED_TERM_IDS,
  TERM_ITEMS,
  TERMS_OF_SERVICE_COPY,
} from '@/features/auth/constants/termsOfService';
import { useTermsOfServiceSubmit } from '@/features/auth/hooks/useTermsOfServiceSubmit';
import { type TermConsentId } from '@/features/auth/utils/buildSignupConsents';
import { cn } from '@/utils/cn';

const SIGNUP_STEP_COUNT = SignupFlowLayout.totalSteps;
const SIGNUP_CURRENT_STEP = SignupFlowLayout.termsCurrentStep;
const AGREEMENT_CARD_HEIGHT = TermsOfServiceClasses.agreementCardHeight;
const STEP_INDICATOR_WRAP = SignupFlowClasses.stepIndicatorWrap;

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
          {required ? TERMS_OF_SERVICE_COPY.requiredBadge : TERMS_OF_SERVICE_COPY.optionalBadge}
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
  const router = useRouter();
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

  const handleDetailPress = (item: (typeof TERM_ITEMS)[number]) => {
    if (!item.documentId) {
      return;
    }

    router.push({
      pathname: AUTH_ROUTES.signupLegalDocument,
      params: { documentId: item.documentId },
    });
  };

  const handlePrivacyPolicyPress = () => {
    router.push({
      pathname: AUTH_ROUTES.signupLegalDocument,
      params: { documentId: LEGAL_DOCUMENT_IDS.privacyPolicy },
    });
  };

  return (
    <View className="flex-1 bg-midnight">
      <AuthBackground />
      <ScreenContainer className="flex-1 px-8" bottomInsetMin={ScreenSpacing.bottomInsetMin}>
        <View className={STEP_INDICATOR_WRAP}>
          <StepIndicator totalSteps={SIGNUP_STEP_COUNT} currentStep={SIGNUP_CURRENT_STEP} />
        </View>

        <View className="mt-12">
          <ThemedText type="title" className="text-fg">
            {TERMS_OF_SERVICE_COPY.pageTitle}
          </ThemedText>
          <ThemedText type="subtitle" className="mt-3 text-subtitle">
            {TERMS_OF_SERVICE_COPY.pageSubtitle}
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
                {TERMS_OF_SERVICE_COPY.agreeAllLabel}
              </ThemedText>
            </Pressable>
          </AgreementTab>

          <View className={TermsOfServiceClasses.termList}>
            {TERM_ITEMS.map((item) => (
              <AgreementTab key={item.id} selected={checkedState[item.id]} className="px-4">
                <AgreementRow
                  label={item.label}
                  required={item.required}
                  checked={checkedState[item.id]}
                  hasDetail={item.hasDetail}
                  onToggle={() => handleToggleTerm(item.id)}
                  onDetailPress={item.hasDetail ? () => handleDetailPress(item) : undefined}
                />
              </AgreementTab>
            ))}
          </View>
        </View>

        <View className={TermsOfServiceClasses.footer}>
          {error ? (
            <View className={TermsOfServiceClasses.footerError}>
              <ErrorState message={error} />
            </View>
          ) : null}
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={TERMS_OF_SERVICE_COPY.privacyPolicyLinkLabel}
            onPress={handlePrivacyPolicyPress}
            hitSlop={PressableConfig.hitSlop}
            className={TermsOfServiceClasses.privacyPolicyLink}
          >
            <ThemedText type="smallRegular" className={TermsOfServiceClasses.privacyPolicyLinkText}>
              {TERMS_OF_SERVICE_COPY.privacyPolicyLinkLabel}
            </ThemedText>
          </Pressable>
          <Button disabled={!requiredChecked || isPending} onPress={handleContinue}>
            {TERMS_OF_SERVICE_COPY.continueLabel}
          </Button>
        </View>
      </ScreenContainer>
    </View>
  );
}
