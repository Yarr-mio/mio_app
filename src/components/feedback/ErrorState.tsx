import { ThemedText } from '@/components/themed/ThemedText';
import { cn } from '@/utils/cn';

interface ErrorStateProps {
  message: string;
  className?: string;
}

export function ErrorState({ message, className }: ErrorStateProps) {
  return (
    <ThemedText type="small" className={cn('text-center text-danger', className)}>
      {message}
    </ThemedText>
  );
}
