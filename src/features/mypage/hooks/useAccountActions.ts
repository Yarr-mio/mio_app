import { useLogout, useWithdraw } from '@/features/auth/hooks/useAuth';

export function useAccountActions() {
  const { mutate: logout, isPending: isLogoutPending } = useLogout();
  const { mutate: withdraw, isPending: isWithdrawPending } = useWithdraw();

  const handleLogout = () => {
    logout();
  };

  const handleWithdraw = () => {
    withdraw();
  };

  return {
    handleLogout,
    handleWithdraw,
    isLogoutPending,
    isWithdrawPending,
  };
}
