import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getSession, signIn, signUp } from "@/lib/api";
import type { SignInInput, SignUpInput } from "@/shared/schema";



/**
 * auth 관련 React Query 키 모음
 */
export const authQueryKeys = {
	session: ["auth", "session"] as const,
};

/**
 * 현재 세션(로그인 상태) 조회 쿼리
 */
export function useSessionQuery() {
	return useQuery({
		queryKey: authQueryKeys.session,
		queryFn: getSession,
		staleTime: 1000 * 60 * 5,
		retry: false,
	});
}

/**
 * 회원가입 mutation 훅
 */
export function useSignUpMutation() {
	return useMutation({
		mutationFn: (input: SignUpInput) => signUp(input),
	});
}

/**
 * 로그인 mutation 훅
 *
 * 성공 시 세션 쿼리 무효화 처리
 */
export function useSignInMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: SignInInput) => signIn(input),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
		},
	});
}
