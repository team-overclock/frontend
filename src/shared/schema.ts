import z from "zod";



export type ErrorCode = z.infer<typeof ERROR_CODE>;
export type HealthCheckOutput = z.infer<typeof healthCheckOutput>;
export type RegionItem = z.infer<typeof regionItem>;
export type InfraTypeItem = z.infer<typeof infraTypeItem>;
export type GetRegionsOutput = z.infer<typeof getRegionsOutput>;
export type GetInfraTypeOutput = z.infer<typeof getInfraTypeOutput>;
export type SchoolDistrictTypeItem = z.infer<typeof schoolDistrictTypeItem>;
export type GetSchoolDistrictTypesOutput = z.infer<typeof getSchoolDistrictTypesOutput>;
export type HighSchoolItem = z.infer<typeof highSchoolItem>;
export type GetHighSchoolsOutput = z.infer<typeof getHighSchoolsOutput>;
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
export type UserRecommendationItem = z.infer<typeof userRecommendationItem>;
export type UserRecommendationsOutput = z.infer<typeof userRecommendationsOutput>;
export type RecommendationCreateInput = z.infer<typeof recommendationCreateInput>;
export type RecommendationUpdateInput = z.infer<typeof recommendationUpdateInput>;
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



export const ERROR_CODE = z.enum([
	"UNKNOWN_ERROR",
	"DUPLICATE_EMAIL",
	"AUTHENTICATION_REQUIRED",
	"FORBIDDEN",
	"INVALID_CREDENTIALS",
	"INCORRECT_CURRENT_PASSWORD",
	"REGION_ERROR",
	"TASK_NOT_FOUND",
	"HIGH_SCHOOL_ERROR",
]);



/**
 * 헬스 체크 응답
 */
export const healthCheckOutput = z.object({
	Hello: z.literal("World"),
});



/**
 * 지역 item
 */
export const regionItem = z.object({
	id: nonNegativeInt,
	name: nonEmptyString,
});

/**
 * 인프라 유형 item
 */
export const infraTypeItem = z.object({
	type: nonEmptyString,
	emoji: nonEmptyString,
	label: nonEmptyString,
	description: nonEmptyString,
});

/**
 * 지역 목록 응답 구조
 */
export const getRegionsOutput = z.object({
	total: nonNegativeInt,
	items: regionItem.array(),
});

/**
 * 인프라 유형 목록 응답 구조
 */
export const getInfraTypeOutput = z.object({
	total: nonNegativeInt,
	items: infraTypeItem.array(),
});



/**
 * 학군 유형 목록 응답
 */
export const schoolDistrictTypeItem = z.object({
	type: nonEmptyString,
	label: nonEmptyString,
	description: nonEmptyString,
});

/**
 * 학군 유형 목록 응답
 */
export const getSchoolDistrictTypesOutput = z.object({
	total: nonNegativeInt,
	items: schoolDistrictTypeItem.array(),
});

/**
 * 고등학교 item
 */
export const highSchoolItem = z.object({
	id: nonNegativeInt,
	name: nonEmptyString,
	latitude: z.number(),
	longitude: z.number(),
});

/**
 * 고등학교 목록 응답
 */
export const getHighSchoolsOutput = z.object({
	total: nonNegativeInt,
	items: highSchoolItem.array(),
});



/**
 * 사용자 정보 응답
 * - 회원가입/로그인/사용자 정보 수정 요청에 대한 응답
 */
export const userInfoOutput = z.object({
	cuid: nonEmptyString,
	name: nonEmptyString,
	email,
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
	name: nonEmptyString.nullable(),
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
	min: nonNegativeInt.nullable(),
	max: nonNegativeInt.nullable(),
});

/**
 * 지도용 좌표 정보
 */
export const mapCoordinate = z.object({
	lat: z.number(),
	lng: z.number(),
});

/**
 * 좌표 정보
 */
export const coordinate = z.object({
	latitude: z.number(),
	longitude: z.number(),
});

/**
 * 주소 정보
 */
export const address = coordinate.extend({
	landLot: nonEmptyString.nullable(),
	roadName: nonEmptyString.nullable(),
});

/**
 * 인프라 요약 정보
 */
export const infraSummary = infraTypeItem.safeExtend({
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
	region: regionItem,
	address,
	salePrice: priceRange.nullable(),
	jeonsePrice: priceRange.nullable(),
	infrastructure: infraSummary.array(),
});



/**
 * 추천 생성 요청
 */
export const recommendationCreateInput = z.object({
	name: nonEmptyString.optional(),
	regionId: nonNegativeInt.nullable().optional(),
	infrastructureTypes: nonEmptyString.array(),
	highSchoolIds: nonNegativeInt.array().optional(),
	schoolDistrictTypes: nonEmptyString.array().optional(),
	salePrice: priceRange.nullable().optional(),
	jeonsePrice: priceRange.nullable().optional(),
});

/**
 * 추천 요청 시 전달한 데이터 내 pk 등을 사람이 읽을 수 있게 변환한 구조
 */
export const requestData = z.object({
	name: nonEmptyString.nullable(),
	region: regionItem.nullable(),
	infrastructureTypes: infraTypeItem.array(),
	highSchools: highSchoolItem.array().nullable(),
	schoolDistricts: schoolDistrictTypeItem.array().nullable(),
	salePrice: priceRange.nullable(),
	jeonsePrice: priceRange.nullable(),
});

/**
 * 추천 데이터 수정 요청
 *
 * 현재는 이름만 변경 가능
 */
export const recommendationUpdateInput = z.object({
	name: z.string().nullable().optional(),
});

/**
 * 추천 생성 요청 응답
 */
export const recommendationCreateOutput = z.object({
	taskId: nonEmptyString,
});

/**
 * 추천 결과에 대한 요약 정보 응답
 */
export const recommendationSummaryOutput = recommendationCreateOutput.safeExtend({
	status: recommendationStatus,
	total: nonNegativeInt.nullable(),
	requestData,
	properties: recommendationPropertySummary.array().nullable(),
});

/**
 * 추천 결과 내 매물에 대한 상세 정보 응답
 */
export const recommendationPropertyDetailOutput = z.object({
	...recommendationPropertySummary.shape,
	infrastructure: infraDetail.array(),
});



/**
 * 사용자별 추천 요청 목록 아이템
 */
export const userRecommendationItem = recommendationCreateOutput.safeExtend({
	status: recommendationStatus,
	requestedAt: datetime,
	lastViewedAt: datetime.nullable(),
	requestData,
	bestProperty: recommendationPropertySummary.omit({ infrastructure: true }).nullable(),
});

/**
 * 사용자별 추천 요청 목록 응답
 */
export const userRecommendationsOutput = z.object({
	total: nonNegativeInt,
	items: userRecommendationItem.array(),
});
