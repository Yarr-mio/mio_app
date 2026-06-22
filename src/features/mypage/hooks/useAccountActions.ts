import { useLogout } from '@/features/auth/hooks/useAuth';

export function useAccountActions() {
  const { mutate: logout, isPending: isLogoutPending } = useLogout();

  const handleLogout = () => {
    logout();
  };

  return {
    handleLogout,
    isLogoutPending,
  };
}
