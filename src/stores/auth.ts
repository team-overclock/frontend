import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { SignInOutput } from "@/shared/schema";



interface AuthState extends Partial<SignInOutput> {
	set: (profile: SignInOutput) => void;
	clear: () => void;
}

/**
 * 로그인 사용자 프로필을 localStorage에 유지하는 auth store.
 */
export const useAuthStore = create<AuthState>()(persist(set => ({
	set: ({
		name,
		preferredArea,
	}) => set({
		name,
		preferredArea,
	}),
	clear: () => set({
		name: undefined,
		preferredArea: undefined,
	}),
}), {
	name: "auth-profile",
	partialize: ({
		name,
		preferredArea,
	}) => ({
		name,
		preferredArea,
	}),
}));
