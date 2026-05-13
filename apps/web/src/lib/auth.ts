import { create } from "zustand";
import type { User } from "@uptimecrow/shared";
import { api, ApiError } from "./api";
import { analytics } from "./analytics";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, inviteToken?: string) => Promise<void>;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  fetchUser: async () => {
    try {
      const data = await api.get<{ user: User }>("/api/auth/me");
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        set({ user: null, isAuthenticated: false, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    }
  },

  login: async (email: string, password: string) => {
    const data = await api.post<{ user: User }>("/api/auth/login", { email, password });
    analytics.login("email");
    set({ user: data.user, isAuthenticated: true, isLoading: false });
  },

  register: async (email: string, password: string, name: string, inviteToken?: string) => {
    const data = await api.post<{ user: User }>("/api/auth/register", { email, password, name, ...(inviteToken ? { inviteToken } : {}) });
    analytics.register();
    set({ user: data.user, isAuthenticated: true, isLoading: false });
  },

  setUser: (user) => set({ user }),

  logout: async () => {
    await api.post("/api/auth/logout");
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}));
