import { create } from 'zustand';

interface AuthStoreState {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;

  onAuthInvalid: (() => void) | null;
  setOnAuthInvalid: (handler: (() => void) | null) => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  accessToken: null,
  setAccessToken: (token) => set({ accessToken: token }),

  onAuthInvalid: null,
  setOnAuthInvalid: (handler) => set({ onAuthInvalid: handler }),
}));
