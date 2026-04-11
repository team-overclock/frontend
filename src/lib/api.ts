import { request } from "@/lib/client";

import {
	type SignInInput,
	type SignUpInput,
	type SignInOutput,
	type UpdateProfileInfoInput,
	type UpdateProfileInfoOutput,
	type UpdatePasswordInput,
	type UpdatePasswordOutput,
	type SubmitOnboardingInput,
	type SubmitOnboardingOutput,
	signInInput,
	signUpInput,
	signInOutput,
	updateProfileInfoInput,
	updateProfileInfoOutput,
	updatePasswordInput,
	updatePasswordOutput,
	submitOnboardingInput,
	submitOnboardingOutput,
	sessionResponse,
} from "@/shared/schema";



/**
 * 회원가입 요청
 *
 * @param input 회원가입 폼 입력값 객체
 */
export async function signUp(input: SignUpInput): Promise<void> {
	const payload = signUpInput.parse(input);

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
	const payload = signInInput.parse(input);

	const response = await request({
		method: "POST",
		url: "/auth/sign-in",
		data: payload,
	});

	return signInOutput.parse(response.data);
}

/**
 * 세션 정보 조회
 */
export async function getSession(): Promise<{ isLoggedIn: boolean }> {
	const response = await request({
		method: "GET",
		url: "/auth/session",
	});

	const parsed = sessionResponse.parse(response.data);
	const isLoggedIn = parsed.isLoggedIn ?? !!parsed.user;

	return { isLoggedIn };
}

/**
 * 사용자 정보(이름/동네) 수정 요청
 */
export async function updateProfileInfo(input: UpdateProfileInfoInput): Promise<UpdateProfileInfoOutput> {
	const payload = updateProfileInfoInput.parse(input);

	const response = await request({
		method: "PATCH",
		url: "/auth/profile/info",
		data: payload,
	});

	return updateProfileInfoOutput.parse(response.data);
}

/**
 * 비밀번호 변경 요청
 */
export async function updatePassword(input: UpdatePasswordInput): Promise<UpdatePasswordOutput> {
	const payload = updatePasswordInput.parse(input);

	const response = await request({
		method: "PATCH",
		url: "/auth/profile/password",
		data: payload,
	});

	return updatePasswordOutput.parse(response.data);
}

/**
 * 온보딩 정보 제출 요청
 */
export async function submitOnboarding(input: SubmitOnboardingInput): Promise<SubmitOnboardingOutput> {
	const payload = submitOnboardingInput.parse(input);

	const response = await request({
		method: "POST",
		url: "/onboarding",
		data: payload,
	});

	return submitOnboardingOutput.parse(response.data);
}
