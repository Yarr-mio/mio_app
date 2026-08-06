import { BackHeader } from '@/components/layout/BackHeader';
import { ThemedText } from '@/components/themed/ThemedText';
import { DefaultBackground } from '@/components/ui/DefaultBackground';
import {
  getLegalDocument,
  LEGAL_DOCUMENT_BULLET_MARK,
  type LegalBlock,
  type LegalDocumentId,
} from '@/constants/legalDocuments';
import { LegalDocumentClasses } from '@/constants/theme';
import { ScrollView, View } from 'react-native';

interface LegalDocumentScreenProps {
  documentId: LegalDocumentId;
}

interface LegalBlockViewProps {
  block: LegalBlock;
}

function LegalBlockView({ block }: LegalBlockViewProps) {
  if (block.type === 'heading') {
    return (
      <ThemedText type="smallTitle" className={LegalDocumentClasses.heading}>
        {block.text}
      </ThemedText>
    );
  }

  if (block.type === 'bullet') {
    return (
      <View className={LegalDocumentClasses.bulletRow}>
        <ThemedText type="small" className={LegalDocumentClasses.body}>
          {LEGAL_DOCUMENT_BULLET_MARK}
        </ThemedText>
        <ThemedText type="small" className={LegalDocumentClasses.bulletText}>
          {block.text}
        </ThemedText>
      </View>
    );
  }

  return (
    <ThemedText type="small" className={LegalDocumentClasses.body}>
      {block.text}
    </ThemedText>
  );
}

export function LegalDocumentScreen({ documentId }: LegalDocumentScreenProps) {
  const document = getLegalDocument(documentId);

  return (
    <View className={LegalDocumentClasses.root}>
      <DefaultBackground />
      <BackHeader title={document.title} />
      <ScrollView
        className={LegalDocumentClasses.scroll}
        contentContainerClassName={LegalDocumentClasses.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {document.blocks.map((block, index) => (
          <LegalBlockView key={`${block.type}-${index}`} block={block} />
        ))}
      </ScrollView>
    </View>
  );
}
