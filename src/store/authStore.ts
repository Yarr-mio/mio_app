import { create } from 'zustand';

interface AuthStoreState {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;

  splashDone: boolean;
  setSplashDone: (done: boolean) => void;

  onAuthInvalid: (() => void) | null;
  setOnAuthInvalid: (handler: (() => void) | null) => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  accessToken: null,
  setAccessToken: (token) => set({ accessToken: token }),

  splashDone: false,
  setSplashDone: (done) => set({ splashDone: done }),

  onAuthInvalid: null,
  setOnAuthInvalid: (handler) => set({ onAuthInvalid: handler }),
}));
