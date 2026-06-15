import { request } from "@/lib/client";

import * as schema from "@/shared/schema";



/**
 * 지역 목록 조회
 */
export function healthCheck() {
	return request({
		guard: {
			response: schema.healthCheckOutput,
		},
		method: "GET",
		url: "/",
	});
}

/**
 * 지역 목록 조회
 */
export function getRegions() {
	return request({
		guard: {
			response: schema.getRegionsOutput,
		},
		method: "GET",
		url: "/regions",
	});
}

/**
 * 인프라 유형 목록 조회
 */
export function getInfraTypes() {
	return request({
		guard: {
			response: schema.getInfraTypeOutput,
		},
		method: "GET",
		url: "/infrastructure-types",
	});
}

/**
 * 학군 유형 목록 조회
 */
export function getSchoolDistrictTypes() {
	return request({
		guard: {
			response: schema.getSchoolDistrictTypesOutput,
		},
		method: "GET",
		url: "/school-districts-types",
	});
}

/**
 * 고등학교 목록 조회
 */
export function getHighSchools() {
	return request({
		guard: {
			response: schema.getHighSchoolsOutput,
		},
		method: "GET",
		url: "/infrastructures/high-schools",
	});
}




export async function loginCheck() {
	return request({
		guard: {
			response: schema.authCheckOutput,
		},
		method: "GET",
		url: "/auth/check",
	});
}

/**
 * 회원가입 요청
 *
 * @param input 회원가입 폼 입력값 객체
 */
export async function signUp(data: schema.SignUpInput) {
	return request({
		guard: {
			request: schema.signUpInput,
			response: schema.userInfoOutput,
		},
		method: "POST",
		url: "/auth/signup",
		data,
	});
}

/**
 * 로그인 요청
 *
 * @param input 로그인 폼 입력값 객체
 */
export async function login(data: schema.LoginInput) {
	return request({
		guard: {
			request: schema.loginInput,
			response: schema.userInfoOutput,
		},
		method: "POST",
		url: "/auth/login",
		data,
	});
}

/**
 * 게스트 로그인 요청
 */
export async function guestLogin() {
	return request({
		guard: {
			response: schema.userInfoOutput,
		},
		method: "POST",
		url: "/auth/guest",
	});
}

/**
 * 로그아웃
 */
export async function logout() {
	return request({
		method: "POST",
		url: "/auth/logout",
	});
}

/**
 * 사용자 정보 조회
 */
export async function getUserInfo() {
	return request({
		guard: {
			response: schema.userInfoOutput,
		},
		method: "GET",
		url: "/users/me",
	});
}

/**
 * 사용자 정보(이름/동네) 수정 요청
 */
export async function updateUserInfo(data: schema.UserInfoUpdateInput) {
	return request({
		guard: {
			request: schema.userInfoUpdateInput,
			response: schema.userInfoOutput,
		},
		method: "PATCH",
		url: "/users/me",
		data,
	});
}

/**
 * 비밀번호 변경 요청
 */
export async function updateUserPassword(data: schema.UserPasswordUpdateInput) {
	return request({
		guard: {
			request: schema.userPasswordUpdateInput,
		},
		method: "POST",
		url: "/users/me/password",
		data,
	});
}



/**
 * 사용자 추천 생성 요청 목록 조회
 */
export async function getRecommendations() {
	return request({
		guard: {
			response: schema.userRecommendationsOutput,
		},
		method: "GET",
		url: "/users/me/recommendations",
	});
}

/**
 * 사용자 추천 생성 요청 목록 삭제
 */
export async function deleteSearchLog(taskId: string) {
	return request({
		method: "DELETE",
		url: `/users/me/recommendations/${taskId}`,
	});
}

/**
 * 선택한 조건 기반 추천 요청
 */
export async function createRecommendation(data: schema.RecommendationCreateInput) {
	return request({
		guard: {
			request: schema.recommendationCreateInput,
			response: schema.recommendationCreateOutput,
		},
		method: "POST",
		url: "/recommendations",
		data,
	});
}

/**
 * 추천 정보 수정 요청
 */
export async function updateRecommendation(taskId: string, data: schema.RecommendationUpdateInput) {
	return request({
		guard: {
			request: schema.recommendationUpdateInput,
		},
		method: "PATCH",
		url: `/recommendations/${taskId}`,
		data,
	});
}

/**
 * 추천 생성 결과 조회
 */
export async function getRecommendation(taskId: string) {
	return request({
		guard: {
			response: schema.recommendationSummaryOutput,
		},
		method: "GET",
		url: `/recommendations/${taskId}`,
	});
}

/**
 * 추천 생성 결과 내 매물 상세 정보 조회
 */
export async function getRecommendationProperty(taskId: string, propertyId: number, data: schema.RecommendationCreateInput) {
	return request({
		guard: {
			response: schema.recommendationPropertyDetailOutput,
		},
		method: "GET",
		url: `/recommendations/${taskId}/properties/${propertyId}`,
		data,
	});
}
