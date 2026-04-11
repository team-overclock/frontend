import { z } from "zod";
import { AREAS, INFRA_TITLES, PRICE_KEYS, PRICE_UNITS } from "@/shared/enum";



export type SignUpInput = z.infer<typeof signUpInputSchema>;
export type SignInInput = z.infer<typeof signInInputSchema>;
export type SignInOutput = z.infer<typeof signInOutputSchema>;
export type UpdateProfileInfoInput = z.infer<typeof updateProfileInfoInputSchema>;
export type UpdateProfileInfoOutput = z.infer<typeof updateProfileInfoOutputSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordInputSchema>;
export type UpdatePasswordOutput = z.infer<typeof updatePasswordOutputSchema>;
export type SubmitOnboardingInput = z.infer<typeof submitOnboardingInputSchema>;
export type SubmitOnboardingOutput = z.infer<typeof submitOnboardingOutputSchema>;
export type SessionResponseSchema = z.infer<typeof sessionResponseSchema>;



/**
 * 회원가입 요청 데이터 스키마
 */
export const signUpInputSchema = z.object({
	name: z.string().min(1),
	email: z.email(),
	password: z.string().min(8),
	preferredArea: z.enum(AREAS),
});

/**
 * 로그인 요청 데이터 스키마
 */
export const signInInputSchema = z.object({
	email: z.string(),
	password: z.string(),
});

/**
 * 로그인 응답 데이터 스키마
 */
export const signInOutputSchema = signUpInputSchema.pick({
	name: true,
	email: true,
	preferredArea: true,
});



/**
 * 사용자 정보(이름/동네) 수정 요청 데이터 스키마
 */
export const updateProfileInfoInputSchema = signUpInputSchema.pick({
	name: true,
	preferredArea: true,
});

/**
 * 사용자 정보(이름/동네) 수정 응답 데이터 스키마
 */
export const updateProfileInfoOutputSchema = signInOutputSchema;

/**
 * 비밀번호 변경 요청 데이터 스키마
 */
export const updatePasswordInputSchema = z.object({
	currentPassword: z.string().min(1),
	newPassword: z.string().min(1),
});

/**
 * 비밀번호 변경 응답 데이터 스키마
 */
export const updatePasswordOutputSchema = z.object({
	isSuccess: z.boolean(),
});



/**
 * 온보딩 제출 요청 데이터 스키마
 */
export const submitOnboardingInputSchema = z.object({
	preferredArea: z.enum(AREAS),
	infraTitles: z.array(z.enum(INFRA_TITLES)),
	priceState: z.record(
		z.enum(PRICE_KEYS),
		z.object({
			enabled: z.boolean(),
			range: z.tuple([z.number(), z.number()]),
			unit: z.enum(PRICE_UNITS),
		}),
	),
});

/**
 * 온보딩 제출 응답 데이터 스키마
 */
export const submitOnboardingOutputSchema = z.object({
	isSuccess: z.boolean(),
	uniqueId: z.union([z.string(), z.number()]),
});



/**
 * 세션 조회 요청에 대한 응답 데이터 스키마 정의
 */
export const sessionResponseSchema = z.looseObject({
	isLoggedIn: z.boolean().optional(),
	user: z.unknown().optional(),
});
