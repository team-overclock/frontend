import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { loginCheck, signUp, login, guestLogin, logout, updateUserInfo, updateUserPassword } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";



/**
 * auth 관련 React Query 키 모음
 */
export const authQueryKeys = {
	all: ["auth"] as const,
	check: ["auth", "check"] as const,
	persisted: ["auth", "persisted"] as const,
};

/**
 * 로그인 상태 조회 쿼리
 */
export function useUserQuery() {
	const authStore = useAuthStore();
	const result = useQuery({
		queryKey: authQueryKeys.check,
		queryFn: loginCheck,
		staleTime: 1000 * 60 * 5,
		retry: false,
	});

	useEffect(() => {
		if (result.data?.isLoggedIn && !authStore.isLoggedIn) {
			authStore.set({ isLoggedIn: true });
		}
	}, [result.data?.isLoggedIn, authStore]);

	return result;
}

/**
 * 회원가입 mutation 훅
 */
export function useSignUpMutation() {
	return useMutation({
		mutationFn: signUp,
	});
}

/**
 * 로그인 mutation 훅
 */
export function useLoginMutation() {
	const authStore = useAuthStore();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: login,
		onSuccess: () => {
			authStore.set({ isLoggedIn: true });
			queryClient.removeQueries({ queryKey: authQueryKeys.all });
		},
	});
}

/**
 * 게스트 로그인 mutation 훅
 */
export function useGuestLoginMutation() {
	const authStore = useAuthStore();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: guestLogin,
		onSuccess: () => {
			authStore.set({ isLoggedIn: true });
			queryClient.removeQueries({ queryKey: authQueryKeys.all });
		},
	});
}

/**
 * 로그아웃 mutation 훅
 */
export function useLogoutMutation() {
	const authStore = useAuthStore();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: logout,
		onSuccess: () => {
			authStore.clear();
			queryClient.removeQueries({ queryKey: authQueryKeys.all });
		},
	});
}

/**
 * 사용자 정보(이름/동네) 수정 mutation 훅
 */
export function useUpdateProfileInfoMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updateUserInfo,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: authQueryKeys.all });
		},
	});
}

/**
 * 비밀번호 변경 mutation 훅
 */
export function useUpdatePasswordMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updateUserPassword,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: authQueryKeys.all });
		},
	});
}
