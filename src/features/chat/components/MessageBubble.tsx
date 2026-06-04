import { Linking, Pressable, View } from 'react-native';
import { CharacterAvatar } from '@/components/character/CharacterAvatar';
import { ThemedText } from '@/components/themed/ThemedText';
import { Label } from '@/components/ui/Label';
import type { OnboardingCharacterId } from '@/constants/characters';
import { formatCheckinTime } from '@/utils/date';
import type { ChatMessage } from '@/types/chat';

interface MessageBubbleProps {
  message: ChatMessage;
  characterId: OnboardingCharacterId;
  characterName: string;
}

function Timestamp({ timestamp }: { timestamp: string }) {
  return (
    <ThemedText type="smallMedium" className="text-white/40 mt-1">
      {formatCheckinTime(timestamp)}
    </ThemedText>
  );
}

function AiBubble({ message, characterId }: Pick<MessageBubbleProps, 'message' | 'characterId'>) {
  return (
    <View className="flex-row gap-2 pr-12">
      <CharacterAvatar characterId={characterId} size="sm" />
      <View className="shrink">
        <View className="bg-surface-md rounded-2xl px-4 py-3">
          <ThemedText type="default" className="text-white">
            {message.content}
          </ThemedText>
        </View>
        <Timestamp timestamp={message.timestamp} />
      </View>
    </View>
  );
}

function UserBubble({ message }: Pick<MessageBubbleProps, 'message'>) {
  return (
    <View className="flex-row-reverse gap-2 pl-12">
      <View className="shrink">
        <View className="bg-primary rounded-2xl px-4 py-3">
          <ThemedText type="default" className="text-white">
            {message.content}
          </ThemedText>
        </View>
        <Timestamp timestamp={message.timestamp} />
      </View>
    </View>
  );
}

function SocraticBubble({ message, characterId, characterName }: MessageBubbleProps) {
  // TODO: SSE 응답에서 socratic 타입 식별 필드 백엔드 확인 필요 (message_type?: 'socratic')
  return (
    <View className="flex-row gap-2 pr-12">
      <CharacterAvatar characterId={characterId} size="sm" />
      <View className="shrink">
        <Label label={`${characterName}의 질문`} />
        <View className="mt-1 border border-primary/30 bg-primary/10 rounded-2xl px-4 py-3">
          <ThemedText type="default" className="text-white">
            {message.content}
          </ThemedText>
        </View>
        <Timestamp timestamp={message.timestamp} />
      </View>
    </View>
  );
}

function CrisisBubble({
  message,
  characterId,
}: Pick<MessageBubbleProps, 'message' | 'characterId'>) {
  return (
    <View className="flex-row gap-2 pr-12">
      <CharacterAvatar characterId={characterId} size="sm" />
      <View className="shrink gap-2">
        <View className="bg-surface-md rounded-2xl px-4 py-3">
          <ThemedText type="default" className="text-white">
            {message.content}
          </ThemedText>
        </View>
        {message.crisisResources && message.crisisResources.length > 0 && (
          <View className="bg-surface rounded-2xl px-4 py-3 gap-3">
            {message.crisisResources.map((resource) => (
              <View key={resource.number} className="flex-row items-center justify-between">
                <View>
                  <ThemedText type="smallTitle" className="text-white">
                    {resource.name}
                  </ThemedText>
                  <ThemedText type="small" className="text-white/60">
                    {resource.hours}
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() => Linking.openURL(`tel:${resource.number}`)}
                  className="bg-primary rounded-xl px-4 py-2"
                >
                  <ThemedText type="smallBold" className="text-white">
                    {resource.number}
                  </ThemedText>
                </Pressable>
              </View>
            ))}
          </View>
        )}
        <Timestamp timestamp={message.timestamp} />
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
