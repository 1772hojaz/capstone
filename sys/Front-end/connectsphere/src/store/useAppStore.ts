import { create } from 'zustand';
import type { CurrentUser } from '../types/api';

interface AppState {
  currentUser?: CurrentUser;
  userLocation: string;
  setCurrentUser: (u?: CurrentUser) => void;
  setUserLocation: (loc: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: undefined,
  userLocation: 'Harare',
  setCurrentUser: (currentUser) => set({ currentUser }),
  setUserLocation: (userLocation) => set({ userLocation }),
}));

