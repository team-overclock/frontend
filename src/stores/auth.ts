import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { UserInfoOutput } from "@/shared/schema";



type AuthStateField = Extract<keyof UserInfoOutput, "cuid" | "name" | "regionName">;
type AuthStateData = Pick<UserInfoOutput, AuthStateField>;

interface AuthState extends Partial<AuthStateData> {
	set: (data: AuthStateData) => void;
	clear: () => void;
}

/**
 * 로그인 사용자 프로필을 localStorage에 유지하는 auth store.
 */
export const useAuthStore = create<AuthState>()(persist(set => ({
	set: ({
		cuid,
		name,
		regionName,
	}) => set({
		cuid,
		name,
		regionName,
	}),
	clear: () => set({
		cuid: undefined,
		name: undefined,
		regionName: undefined,
	}),
}), {
	name: "auth-profile",
	partialize: ({
		cuid,
		name,
		regionName,
	}) => ({
		cuid,
		name,
		regionName,
	}),
}));
