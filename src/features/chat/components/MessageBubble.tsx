import { QuestionCircleIcon } from '@/assets/icons';
import { CharacterAvatar } from '@/components/character/CharacterAvatar';
import { ThemedText } from '@/components/themed/ThemedText';
import type { OnboardingCharacterId } from '@/constants/characters';
import { CHAT_CHUNK_FADE_DURATION_MS } from '@/constants/config';
import { PrimaryColors } from '@/constants/theme';
import { useStreamingChunks } from '@/features/chat/hooks/useStreamingChunks';
import type { ChatMessage } from '@/types/chat';
import { formatCheckinTime } from '@/utils/date';
import { useEffect } from 'react';
import { Alert, Linking, Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface MessageBubbleProps {
  message: ChatMessage;
  characterId: OnboardingCharacterId;
  characterName: string;
  isStreaming: boolean;
}

function Timestamp({ timestamp, align = 'left' }: { timestamp: string; align?: 'left' | 'right' }) {
  return (
    <ThemedText
      type="smallMedium"
      className={`text-fg-faint font-normal mt-1 ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      {formatCheckinTime(timestamp)}
    </ThemedText>
  );
}

function FadeInChunkText({ text }: { text: string }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: CHAT_CHUNK_FADE_DURATION_MS });
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.Text style={animatedStyle}>{text}</Animated.Text>;
}

function AiBubble({
  message,
  characterId,
  isStreaming,
}: Pick<MessageBubbleProps, 'message' | 'characterId' | 'isStreaming'>) {
  const chunks = useStreamingChunks(message.content, isStreaming);

  return (
    <View className="flex-row gap-2 pr-12">
      <CharacterAvatar characterId={characterId} size="sm" background />
      <View className="shrink">
        <View className="border border-primary/20 bg-primary/10 rounded-2xl rounded-tl-md px-4 py-3">
          <ThemedText type="default" className="text-fg font-normal">
            {chunks.map((chunk) => (
              <FadeInChunkText key={chunk.key} text={chunk.text} />
            ))}
          </ThemedText>
        </View>
        <Timestamp timestamp={message.timestamp} align="left" />
      </View>
    </View>
  );
}

function UserBubble({ message }: Pick<MessageBubbleProps, 'message'>) {
  return (
    <View className="flex-row-reverse gap-2 pl-12">
      <View className="shrink">
        <View className="bg-primary rounded-2xl rounded-tr-md px-4 py-3">
          <ThemedText type="default" className="text-fg font-normal">
            {message.content}
          </ThemedText>
        </View>
        <Timestamp timestamp={message.timestamp} align="right" />
      </View>
    </View>
  );
}

function SocraticBubble({
  message,
  characterId,
  characterName,
}: Pick<MessageBubbleProps, 'message' | 'characterId' | 'characterName'>) {
  return (
    <View className="flex-row gap-2 pr-12">
      <CharacterAvatar characterId={characterId} size="sm" background />
      <View className="shrink">
        <View className="border border-primary/30 bg-primary/20 rounded-2xl rounded-tl-md px-4 py-3">
          <View className="flex-row items-center gap-1 mb-3">
            <QuestionCircleIcon width={14} height={14} color={PrimaryColors.DEFAULT} />
            <ThemedText type="smallMedium" className="text-primary font-normal">
              {`${characterName}의 질문`}
            </ThemedText>
          </View>
          <ThemedText type="default" className="text-fg font-normal">
            {message.content}
          </ThemedText>
        </View>
        <Timestamp timestamp={message.timestamp} align="left" />
      </View>
    </View>
  );
}

async function handleCallResource(number: string) {
  const url = `tel:${number}`;
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert(
        '전화 연결 실패',
        `이 기기에서는 전화를 걸 수 없어요. ${number}로 직접 연락해 주세요.`
      );
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      '전화 연결 실패',
      `이 기기에서는 전화를 걸 수 없어요. ${number}로 직접 연락해 주세요.`
    );
  }
}

function CrisisBubble({
  message,
  characterId,
}: Pick<MessageBubbleProps, 'message' | 'characterId'>) {
  return (
    <View className="flex-row gap-2 pr-12">
      <CharacterAvatar characterId={characterId} size="sm" background />
      <View className="shrink gap-2">
        <View className="bg-surface-md rounded-2xl rounded-tl-md px-4 py-3">
          <ThemedText type="default" className="text-fg font-normal">
            {message.content}
          </ThemedText>
        </View>
        {message.crisisResources && message.crisisResources.length > 0 && (
          <View className="bg-surface rounded-2xl px-4 py-3 gap-3">
            {message.crisisResources.map((resource) => (
              <View key={resource.number} className="flex-row items-center justify-between">
                <View>
                  <ThemedText type="smallTitle" className="text-fg font-medium">
                    {resource.name}
                  </ThemedText>
                  <ThemedText type="small" className="text-fg-dim font-normal">
                    {resource.hours}
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() => handleCallResource(resource.number)}
                  className="bg-primary rounded-xl px-4 py-2"
                >
                  <ThemedText type="smallBold" className="text-fg font-medium">
                    {resource.number}
                  </ThemedText>
                </Pressable>
              </View>
            ))}
          </View>
        )}
        <Timestamp timestamp={message.timestamp} align="left" />
      </View>
    </View>
  );
}

export function MessageBubble({
  message,
  characterId,
  characterName,
  isStreaming,
}: MessageBubbleProps) {
  if (message.role === 'user') {
    return <UserBubble message={message} />;
  }
  if (message.type === 'socratic') {
    return (
      <SocraticBubble message={message} characterId={characterId} characterName={characterName} />
    );
  }
  if (message.type === 'crisis') {
    return <CrisisBubble message={message} characterId={characterId} />;
  }
  return <AiBubble message={message} characterId={characterId} isStreaming={isStreaming} />;
}
