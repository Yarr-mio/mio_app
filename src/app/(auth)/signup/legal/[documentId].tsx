import { LegalDocumentScreen } from '@/components/legal/LegalDocumentScreen';
import { isLegalDocumentId } from '@/constants/legalDocuments';
import { AUTH_ROUTES } from '@/constants/routes';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function SignupLegalDocumentRoute() {
  const { documentId } = useLocalSearchParams<{ documentId: string }>();

  if (!documentId || !isLegalDocumentId(documentId)) {
    return <Redirect href={AUTH_ROUTES.termsOfService} />;
  }

  return <LegalDocumentScreen documentId={documentId} />;
}
