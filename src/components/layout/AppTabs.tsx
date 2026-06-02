import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CategoryIcon,
  HomeIcon,
  HomeTrendUpIcon,
  MessageTextIcon,
  SecurityUserIcon,
} from '@/assets/icons';
import { ThemedText } from '@/components/themed/ThemedText';
import { TabBarColors, TabBarShadowStyle } from '@/constants/theme';
import { cn } from '@/utils/cn';

const TAB_ICONS = {
  home: HomeIcon,
  chat: MessageTextIcon,
  report: HomeTrendUpIcon,
  my: SecurityUserIcon,
  explore: CategoryIcon,
} as const;

type TabRouteName = keyof typeof TAB_ICONS;

export default function AppTabs({ state, descriptors, navigation }: BottomTabBarProps) {
  const { bottom } = useSafeAreaInsets();

  return (
    <View
      className="flex-row overflow-visible bg-tab-bar"
      style={[{ paddingBottom: bottom }, TabBarShadowStyle]}
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
              width={24}
              height={24}
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
    </View>
  );
}
