import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View className="flex-1 items-center justify-center">
        <Link href="/home" className="text-link">
          홈으로 돌아가기
        </Link>
      </View>
    </>
  );
}
