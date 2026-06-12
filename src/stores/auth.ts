import { create } from "zustand";
import { persist } from "zustand/middleware";



export interface AuthStateData {
	isLoggedIn: boolean;
}

export interface AuthState extends Partial<AuthStateData> {
	set: (data: AuthStateData) => void;
	clear: () => void;
}

/**
 * 로그인 사용자 프로필을 localStorage에 유지하는 auth store.
 */
export const useAuthStore = create<AuthState>()(persist(set => ({
	set: ({
		isLoggedIn,
	}) => set({
		isLoggedIn,
	}),
	clear: () => set({
		isLoggedIn: undefined,
	}),
}), {
	name: "auth-profile",
	partialize: ({
		isLoggedIn,
	}) => ({
		isLoggedIn,
	}),
}));
