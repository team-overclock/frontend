import { request } from "@/lib/client";

import {
	type SignInInput,
	type SignUpInput,
	type SignInOutput,
	signInInputSchema,
	signUpInputSchema,
	signInOutputSchema,
	sessionResponseSchema,
} from "@/shared/schema";



/**
 * 회원가입 요청
 *
 * @param input 회원가입 폼 입력값 객체
 */
export async function signUp(input: SignUpInput): Promise<void> {
	const payload = signUpInputSchema.parse(input);

	await request({
		method: "POST",
		url: "/auth/sign-up",
		data: payload,
	});
}

/**
 * 로그인 요청
 *
 * @param input 로그인 폼 입력값 객체
 */
export async function signIn(input: SignInInput): Promise<SignInOutput> {
	const payload = signInInputSchema.parse(input);

	const response = await request({
		method: "POST",
		url: "/auth/sign-in",
		data: payload,
	});

	return signInOutputSchema.parse(response.data);
}

/**
 * 세션 정보 조회
 */
export async function getSession(): Promise<{ isLoggedIn: boolean }> {
	const response = await request({
		method: "GET",
		url: "/auth/session",
	});

	const parsed = sessionResponseSchema.parse(response.data);
	const isLoggedIn = parsed.isLoggedIn ?? !!parsed.user;

	return { isLoggedIn };
}
