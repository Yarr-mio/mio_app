import ChevronRightIcon from '@/assets/icons/chevron-right.svg';
import { ThemedText, type ThemedTextType } from '@/components/themed/ThemedText';
import { FgColors, HomeCardClasses, HomeLayout } from '@/constants/theme';
import { cn } from '@/utils/cn';
import type { PropsWithChildren } from 'react';
import { Pressable, View } from 'react-native';

interface CardHeaderLinkProps {
  label: string;
  onPress?: () => void;
}

function CardHeaderLink({ label, onPress }: CardHeaderLinkProps) {
  if (!onPress) {
    return (
      <View className="flex-row items-center gap-1">
        <ThemedText type="small" className="text-fg-default">
          {label}
        </ThemedText>
        <ChevronRightIcon
          width={HomeLayout.chevronIconWidth}
          height={HomeLayout.chevronIconHeight}
          color={FgColors.onDefault}
        />
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-1"
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <ThemedText type="small" className="text-fg-default">
        {label}
      </ThemedText>
      <ChevronRightIcon
        width={HomeLayout.chevronIconWidth}
        height={HomeLayout.chevronIconHeight}
        color={FgColors.onDefault}
      />
    </Pressable>
  );
}

export interface HomeCardShellProps extends PropsWithChildren {
  title: string;
  titleCount?: number;
  titleTextType?: ThemedTextType;
  titleClassName?: string;
  headerActionLabel?: string;
  onHeaderActionPress?: () => void;
  contentClassName?: string;
  headerContainerClassName?: string;
}

export function HomeCardShell({
  title,
  titleCount,
  titleTextType = 'smallTitle2',
  titleClassName,
  headerActionLabel,
  onHeaderActionPress,
  contentClassName,
  headerContainerClassName = 'mb-3',
  children,
}: HomeCardShellProps) {
  const showHeaderAction = Boolean(headerActionLabel);
  const accessibilityLabel = titleCount == null ? title : `${title} ${titleCount}`;

  return (
    <View className={HomeCardClasses.container}>
      <View className={cn('flex-row items-center justify-between', headerContainerClassName)}>
        <View
          accessible={true}
          className={HomeCardClasses.titleRow}
          accessibilityRole="header"
          accessibilityLabel={accessibilityLabel}
        >
          <ThemedText type={titleTextType} className={cn('text-fg-default', titleClassName)}>
            {title}
          </ThemedText>
          {titleCount != null ? (
            <ThemedText type={titleTextType} className={HomeCardClasses.titleCount}>
              {titleCount}
            </ThemedText>
          ) : null}
        </View>
        {showHeaderAction ? (
          <CardHeaderLink label={headerActionLabel!} onPress={onHeaderActionPress} />
        ) : null}
      </View>
      <View className={cn(contentClassName)}>{children}</View>
    </View>
  );
}
