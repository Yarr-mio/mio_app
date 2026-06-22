import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable } from 'react-native';

import { CategoryIcon, HomeIcon, HomeTrendUpIcon, MessageTextIcon } from '@/assets/icons';
import { ThemedText } from '@/components/themed/ThemedText';
import { TabBarColors, TabBarLayout, TabBarShadowStyle } from '@/constants/theme';
import { cn } from '@/utils/cn';
import { SafeAreaView } from 'react-native-safe-area-context';

const TAB_ICONS = {
  home: HomeIcon,
  chat: MessageTextIcon,
  report: HomeTrendUpIcon,
  explore: CategoryIcon,
} as const;

type TabRouteName = keyof typeof TAB_ICONS;

export default function AppTabs({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <SafeAreaView
      edges={['bottom']}
      className="flex-row overflow-visible bg-tab-bar"
      style={TabBarShadowStyle}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const IconComponent = TAB_ICONS[route.name as TabRouteName];

        if (!IconComponent) return null;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            className="flex-1 items-center justify-center py-5 gap-1"
          >
            <IconComponent
              width={TabBarLayout.iconSize}
              height={TabBarLayout.iconSize}
              color={isFocused ? TabBarColors.iconActive : TabBarColors.iconInactive}
            />
            <ThemedText
              type="smallMedium"
              className={cn('mt-1', isFocused ? 'text-primary' : 'text-label/70')}
            >
              {typeof options.tabBarLabel === 'string'
                ? options.tabBarLabel
                : (options.title ?? route.name)}
            </ThemedText>
          </Pressable>
        );
      })}
    </SafeAreaView>
  );
}
