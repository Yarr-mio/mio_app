import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CategoryIcon,
  HomeIcon,
  HomeTrendUpIcon,
  MessageTextIcon,
  SecurityUserIcon,
} from '@/assets/icons';
import { TabBarColors } from '@/constants/theme';

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
    <View className="flex-row bg-midnight border-t border-line" style={{ paddingBottom: bottom }}>
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
            className="flex-1 items-center justify-center py-3"
          >
            <IconComponent
              width={24}
              height={24}
              color={isFocused ? TabBarColors.iconActive : TabBarColors.iconInactive}
            />
            <Text className={`text-xs mt-1 ${isFocused ? 'text-fg' : 'text-fg-ghost'}`}>
              {options.title ?? route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
