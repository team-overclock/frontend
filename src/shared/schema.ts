import { z } from "zod";



export type SignUpInput = z.infer<typeof signUpInputSchema>;
export type SignInInput = z.infer<typeof signInInputSchema>;
export type SignInOutput = z.infer<typeof signInOutputSchema>;
export type SubmitOnboardingInput = z.infer<typeof submitOnboardingInputSchema>;
export type SubmitOnboardingOutput = z.infer<typeof submitOnboardingOutputSchema>;



/**
 * 회원가입 요청 데이터 스키마
 */
export const signUpInputSchema = z.object({
	name: z.string().min(1),
	email: z.email(),
	password: z.string().min(8),
	preferredArea: z.string().min(1),
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
	preferredArea: true,
});

/**
 * 온보딩 제출 요청 데이터 스키마
 */
export const submitOnboardingInputSchema = z.object({
	preferredArea: z.string().min(1),
	infraTitles: z.array(z.string()),
	priceState: z.object({
		purchase: z.object({
			enabled: z.boolean(),
			range: z.tuple([z.number(), z.number()]),
			unit: z.string(),
		}),
		jeonse: z.object({
			enabled: z.boolean(),
			range: z.tuple([z.number(), z.number()]),
			unit: z.string(),
		}),
	}),
});

/**
 * 온보딩 제출 응답 데이터 스키마
 */
export const submitOnboardingOutputSchema = z.object({
	isSuccess: z.boolean(),
	uniqueId: z.union([z.string(), z.number()]),
});

/**
 * 세션 요청에 대한 응답 데이터 스키마 정의
 */
export const sessionResponseSchema = z.looseObject({
	isLoggedIn: z.boolean().optional(),
	user: z.unknown().optional(),
});
