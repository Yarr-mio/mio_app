import { create } from 'zustand';

import type { SignupStep } from '@/types/auth';

interface AuthStoreState {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;

  signupStep: SignupStep | null;
  setSignupStep: (step: SignupStep | null) => void;

  splashDone: boolean;
  setSplashDone: (done: boolean) => void;

  onAuthInvalid: (() => void) | null;
  setOnAuthInvalid: (handler: (() => void) | null) => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  accessToken: null,
  setAccessToken: (token) => set({ accessToken: token }),

  signupStep: null,
  setSignupStep: (step) => set({ signupStep: step }),

  splashDone: false,
  setSplashDone: (done) => set({ splashDone: done }),

  onAuthInvalid: null,
  setOnAuthInvalid: (handler) => set({ onAuthInvalid: handler }),
}));
