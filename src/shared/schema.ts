import z from "zod";



export type Item = z.infer<typeof item>;
export type HealthCheckOutput = z.infer<typeof healthCheckOutput>;
export type GetItemsOutput = z.infer<typeof getItemsOutput>;
export type SignUpInput = z.infer<typeof signUpInput>;
export type LoginInput = z.infer<typeof loginInput>;
export type UserInfoUpdateInput = z.infer<typeof userInfoUpdateInput>;
export type UserPasswordUpdateInput = z.infer<typeof userPasswordUpdateInput>;
export type UserInfoOutput = z.infer<typeof userInfoOutput>;
export type AuthCheckOutput = z.infer<typeof authCheckOutput>;
export type RecommendationStatus = z.infer<typeof recommendationStatus>;
export type PriceRange = z.infer<typeof priceRange>;
export type RequestData = z.infer<typeof requestData>;
export type MapCoordinate = z.infer<typeof mapCoordinate>;
export type Coordinate = z.infer<typeof coordinate>;
export type Address = z.infer<typeof address>;
export type InfraSummary = z.infer<typeof infraSummary>;
export type InfraDetail = z.infer<typeof infraDetail>;
export type RecommendationPropertySummary = z.infer<typeof recommendationPropertySummary>;
export type UserRecommendationsOutput = z.infer<typeof userRecommendationsOutput>;
export type RecommendationCreateInput = z.infer<typeof recommendationCreateInput>;
export type RecommendationCreateOutput = z.infer<typeof recommendationCreateOutput>;
export type RecommendationSummaryOutput = z.infer<typeof recommendationSummaryOutput>;
export type RecommendationPropertyDetailOutput = z.infer<typeof recommendationPropertyDetailOutput>;



export const nonEmptyString = z.string().trim().nonempty("값이 입력되지 않았어요")
export const nonNegativeInt = z.int().nonnegative("0 이상의 정수를 입력해주세요");
export const nonNegativeFloat = z.number().nonnegative("0 이상의 실수를 입력해주세요");
export const name = z.clone(nonEmptyString);
export const region = z.string().trim().nonempty("동네를 선택해 주세요");
export const email = nonEmptyString.pipe(z.email("유효하지 않은 이메일 형식이에요"));
export const password = nonEmptyString.min(4, "비밀번호는 최소 4자 이상이어야 해요");
export const datetime = z.coerce.date();

/**
 * pk-name 쌍
 */
export const item = z.object({
	id: nonNegativeInt,
	name: nonEmptyString,
});



/**
 * 헬스 체크 응답
 */
export const healthCheckOutput = z.object({
	Hello: z.literal("World"),
});



/**
 * 지역, 인프라 유형 목록 응답 구조
 */
export const getItemsOutput = z.object({
	total: nonNegativeInt,
	items: item.array(),
});



/**
 * 사용자 정보 응답
 * - 회원가입/로그인/사용자 정보 수정 요청에 대한 응답
 */
export const userInfoOutput = z.object({
	cuid: nonEmptyString,
	name: nonEmptyString,
	email,
	regionId: nonNegativeInt.nullable(),
	regionName: nonEmptyString.nullable(),
	createdAt: datetime,
});

/**
 * 로그인 상태 조회 응답
 */
export const authCheckOutput = z.object({
	isLoggedIn: z.boolean(),
	user: userInfoOutput.nullable(),
});

/**
 * 회원가입 요청
 */
export const signUpInput = z.object({
	email, password,
	name: nonEmptyString,
	regionId: nonNegativeInt.nullable().optional(),
});

/**
 * 로그인 요청
 */
export const loginInput = z.object({
	email, password,
});

/**
 * 사용자 정보 수정 요청
 */
export const userInfoUpdateInput = signUpInput.pick({
	name: true,
	email: true,
	regionId: true,
}).partial();

/**
 * 비밀번호 변경 요청
 */
export const userPasswordUpdateInput = z.object({
	currentPassword: password,
	newPassword: password,
});



/**
 * 추천 요청 처리 상태
 */
export const recommendationStatus = z.enum(["completed", "in_progress", "failed"]);

/**
 * 추천 가격 범위
 */
export const priceRange = z.object({
	min: nonNegativeInt,
	max: nonNegativeInt,
});

/**
 * 추천 요청 시 전달한 데이터 내 pk 등을 사람이 읽을 수 있게 변환한 구조
 */
export const requestData = z.object({
	name: nonEmptyString.nullable(),
	region: nonEmptyString,
	infrastructureTypes: nonEmptyString.array(),
	salePrice: priceRange.nullable(),
	depositPrice: priceRange.nullable(),
});

/**
 * 지도용 좌표 정보
 */
export const mapCoordinate = z.object({
	lat: nonNegativeFloat,
	lng: nonNegativeFloat,
});

/**
 * 좌표 정보
 */
export const coordinate = z.object({
	latitude: nonNegativeFloat,
	longitude: nonNegativeFloat,
});

/**
 * 주소 정보
 */
export const address = coordinate.extend({
	landLot: nonEmptyString,
	roadName: nonEmptyString.nullable(),
});

/**
 * 인프라 요약 정보
 */
export const infraSummary = z.object({
	type: nonEmptyString,
	distance: nonNegativeFloat,
	walkingDuration: nonNegativeInt,
});

/**
 * 인프라 상세 정보
 */
export const infraDetail = z.object({
	...infraSummary.shape,
	...coordinate.shape,
	name: nonEmptyString,
	score: nonNegativeFloat,
});

/**
 * 추천 매물 요약 정보
 */
export const recommendationPropertySummary = z.object({
	id: nonNegativeInt,
	name: nonEmptyString,
	score: nonNegativeFloat,
	address,
	salePrice: nonNegativeInt.nullable(),
	depositPrice: nonNegativeInt.nullable(),
	infrastructure: infraSummary.array().max(2),
});



/**
 * 사용자별 추천 요청 목록 응답
 */
export const userRecommendationsOutput = z.object({
	total: nonNegativeInt,
	requestData,
});

/**
 * 추천 요청 생성 입력
 */
export const recommendationCreateInput = z.object({
	name: nonEmptyString.optional(),
	regionId: nonNegativeInt,
	infrastructureTypeIds: nonNegativeInt.array(),
	salePrice: priceRange.nullable().optional(),
	depositPrice: priceRange.nullable().optional(),
});

/**
 * 추천 요청 생성 응답
 */
export const recommendationCreateOutput = z.object({
	taskId: nonEmptyString,
	status: recommendationStatus,
});

/**
 * 추천 요청 결과에 대한 요약 정보 응답
 */
export const recommendationSummaryOutput = recommendationCreateOutput.safeExtend({
	total: nonNegativeInt.nullable(),
	requestData,
	properties: recommendationPropertySummary.array().nullable(),
});

/**
 * 추천 요청 결과 내 매물에 대한 상세 정보 응답
 */
export const recommendationPropertyDetailOutput = recommendationPropertySummary.extend({
	infrastructure: infraDetail.array(),
});
