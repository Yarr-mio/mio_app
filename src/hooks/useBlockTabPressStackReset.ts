import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { ParamListBase } from '@react-navigation/native';
import { useFocusEffect, useNavigation } from 'expo-router';
import { useCallback } from 'react';

/**
 * 포커스된 탭을 한 번 더 눌렀을 때 그 탭의 스택이 루트로 되돌아가는 동작을 막는다.
 *
 * 이 동작은 탭 바(`AppTabs`)가 하는 일이 아니다 — expo-router가 Stack마다 부모 탭 내비게이터에
 * `tabPress` 리스너를 달아 `StackActions.popToTop()`을 디스패치한다
 * (`expo-router/build/fork/native-stack/createNativeStackNavigator.js`). 그 액션은 `POP_TO_TOP`이라
 * `beforeRemove`의 POP/GO_BACK 필터를 그대로 통과하므로(그 필터는 `dismissAll()`을 살리려고
 * 열어둔 것이다), 이탈을 막아야 하는 종료 지점 화면에서는 이벤트 단계에서 직접 취소해야 한다.
 *
 * ⚠️ 반드시 포커스된 동안에만 구독한다 — 상시 구독하면 같은 이벤트를 보는 "다른 탭에서 이 탭으로
 * 들어오는 정상 전환"(`!isFocused && !defaultPrevented` 분기)까지 함께 막힌다.
 */
export function useBlockTabPressStackReset() {
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      // 스택 화면의 부모 = 탭 스크린의 navigation. expo-router의 popToTop 리스너가 붙는 것과 같은
      // 이벤트 소스이고, 그 리스너는 requestAnimationFrame 뒤에 defaultPrevented를 확인하므로
      // 구독 순서와 무관하게 preventDefault()가 먹는다
      const tabNavigation = navigation.getParent<BottomTabNavigationProp<ParamListBase>>();

      return tabNavigation?.addListener('tabPress', (e) => e.preventDefault());
    }, [navigation])
  );
}
