import { z } from "zod";
import { AREAS, INFRA_TITLES, PRICE_KEYS } from "@/shared/enum";



export type SignUpInput = z.infer<typeof signUpInput>;
export type SignInInput = z.infer<typeof signInInput>;
export type SignInOutput = z.infer<typeof signInOutput>;
export type UpdateProfileInfoInput = z.infer<typeof updateProfileInfoInput>;
export type UpdateProfileInfoOutput = z.infer<typeof updateProfileInfoOutput>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordInput>;
export type UpdatePasswordOutput = z.infer<typeof updatePasswordOutput>;
export type SubmitOnboardingInput = z.infer<typeof submitOnboardingInput>;
export type SubmitOnboardingOutput = z.infer<typeof submitOnboardingOutput>;
export type SessionResponse = z.infer<typeof sessionResponse>;



/**
 * 이름 입력 스키마
 */
export const name = z.string()
	.trim()
	.min(1, "이름이 입력되지 않았어요");

/**
 * 이메일 입력 스키마
 */
export const email = z.string()
	.trim()
	.min(1, "이메일이 입력되지 않았아요")
	.pipe(z.email("유효하지 않은 이메일 형식이에요"));

/**
 * 비밀번호 입력 스키마
 */
export const password = z.string()
	.trim()
	.min(1, "비밀번호가 입력되지 않았아요")
	.min(8, "비밀번호는 최소 8자 이상이어야 해요");

/**
 * 선호 동네 입력 스키마
 */
export const area = z.string()
	.trim()
	.min(1, "동네가 입력되지 않았아요")
	.refine(value => (AREAS as readonly string[]).includes(value), "지원하지 않는 동네예요");



/**
 * 회원가입 요청 데이터 스키마
 */
export const signUpInput = z.object({
	name, email, password,
	preferredArea: area,
});

/**
 * 로그인 요청 데이터 스키마
 */
export const signInInput = z.object({
	email, password,
});

/**
 * 로그인 응답 데이터 스키마
 */
export const signInOutput = signUpInput.pick({
	name: true,
	email: true,
	preferredArea: true,
});



/**
 * 사용자 정보(이름/동네) 수정 요청 데이터 스키마
 */
export const updateProfileInfoInput = signUpInput.pick({
	name: true,
	preferredArea: true,
});

/**
 * 사용자 정보(이름/동네) 수정 응답 데이터 스키마
 */
export const updateProfileInfoOutput = signInOutput;

/**
 * 비밀번호 변경 요청 데이터 스키마
 */
export const updatePasswordInput = z.object({
	currentPassword: password,
	newPassword: password,
}).refine(
	data => data.currentPassword !== data.newPassword,
	"새 비밀번호가 현재 비밀번호와 같아요",
);

/**
 * 비밀번호 변경 응답 데이터 스키마
 */
export const updatePasswordOutput = z.object({
	isSuccess: z.boolean(),
});



/**
 * 온보딩 제출 요청 데이터 스키마
 */
export const submitOnboardingInput = z.object({
	preferredArea: area,
	infraTitles: z.array(z.enum(INFRA_TITLES)).min(1, "인프라를 1개 이상 선택해 주세요!"),
	priceState: z.record(
		z.enum(PRICE_KEYS),
		z.object({
			enabled: z.boolean(),
			min: z.number().nonnegative("가격은 음수일 수 없어요"),
			max: z.number().nonnegative("가격은 음수일 수 없어요"),
		}),
	),
});

/**
 * 온보딩 제출 응답 데이터 스키마
 */
export const submitOnboardingOutput = z.object({
	isSuccess: z.boolean(),
	uniqueId: z.union([z.string(), z.number()]),
});



/**
 * 세션 조회 요청에 대한 응답 데이터 스키마 정의
 */
export const sessionResponse = z.looseObject({
	isLoggedIn: z.boolean().optional(),
	user: z.unknown().optional(),
});
