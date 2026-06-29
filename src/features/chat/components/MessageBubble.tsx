import { QuestionCircleIcon } from '@/assets/icons';
import { CharacterAvatar } from '@/components/character/CharacterAvatar';
import { ThemedText } from '@/components/themed/ThemedText';
import type { OnboardingCharacterId } from '@/constants/characters';
import { PrimaryColors } from '@/constants/theme';
import type { ChatMessage } from '@/types/chat';
import { formatCheckinTime } from '@/utils/date';
import { Alert, Linking, Pressable, View } from 'react-native';

interface MessageBubbleProps {
  message: ChatMessage;
  characterId: OnboardingCharacterId;
  characterName: string;
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

function AiBubble({ message, characterId }: Pick<MessageBubbleProps, 'message' | 'characterId'>) {
  return (
    <View className="flex-row gap-2 pr-12">
      <CharacterAvatar characterId={characterId} size="sm" background />
      <View className="shrink">
        <View className="border border-primary/20 bg-primary/10 rounded-2xl rounded-tl-sm px-4 py-3">
          <ThemedText type="default" className="text-fg font-normal">
            {message.content}
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
        <View className="bg-primary rounded-2xl rounded-tr-sm px-4 py-3">
          <ThemedText type="default" className="text-fg font-normal">
            {message.content}
          </ThemedText>
        </View>
        <Timestamp timestamp={message.timestamp} align="right" />
      </View>
    </View>
  );
}

function SocraticBubble({ message, characterId, characterName }: MessageBubbleProps) {
  return (
    <View className="flex-row gap-2 pr-12">
      <CharacterAvatar characterId={characterId} size="sm" background />
      <View className="shrink">
        <View className="border border-primary/30 bg-primary/20 rounded-2xl rounded-tl-sm px-4 py-3">
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
        <View className="bg-surface-md rounded-2xl rounded-tl-sm px-4 py-3">
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

export function MessageBubble({ message, characterId, characterName }: MessageBubbleProps) {
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
  return <AiBubble message={message} characterId={characterId} />;
}
