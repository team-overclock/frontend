import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getSession, signIn, signUp, updatePassword, updateProfileInfo } from "@/lib/api";



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
		mutationFn: signUp,
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
		mutationFn: signIn,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
		},
	});
}

/**
 * 사용자 정보(이름/동네) 수정 mutation 훅
 */
export function useUpdateProfileInfoMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updateProfileInfo,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
		},
	});
}

/**
 * 비밀번호 변경 mutation 훅
 */
export function useUpdatePasswordMutation() {
	return useMutation({
		mutationFn: updatePassword,
	});
}
