import { useUserStore } from '@/store/userStore';
import type { AuthUser } from '@/types/auth';

export function hydrateUserStoreFromAuthUser(user: AuthUser): void {
  useUserStore.getState().hydrateFromAuthUser(user);
}
