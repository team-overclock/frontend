import camelcaseKeys from "camelcase-keys";
import snakecaseKeys from "snakecase-keys";
import axios from "axios";
import type z from "zod";
import type { AxiosRequestConfig } from "axios";

import { BACKEND_URL } from "@/shared/env";



/*
 * TODO:
 * region, infra type error 시 응답 내 items를 localStorage로 저장하기
 */

/**
 * 백엔드 API와 통신하기 위한 Axios 인스턴스
 *
 * - `baseURL`은 {@link BACKEND_URL}로 설정
 * - `withCredentials`는 `true`로 설정하여 쿠키를 포함한 요청을 보낼 수 있도록 함
 * - 기본 헤더로 `Content-Type: application/json`을 포함
 */
export const client = axios.create({
	baseURL: BACKEND_URL,
	withCredentials: true,
	headers: {
		"Content-Type": "application/json",
	},
});

// 요청 인터셉터를 사용하여 모든 요청 데이터를 snake_case로 변환하여 전송하도록 함
client.interceptors.request.use(config => {
	if (config.data) {
		config.data = snakecaseKeys(config.data, { deep: true });
	}
	return config;
});

// 응답 인터셉터를 사용하여 모든 응답 데이터를 camelCase로 변환하여 수신하도록 함
client.interceptors.response.use(config => {
	if (config.data) {
		config.data = camelcaseKeys(config.data, { deep: true });
	}
	return config;
});



export interface RequestOptions<
	T extends z.ZodType = z.ZodType,
	R extends z.ZodType = z.ZodType,
	D = unknown,
> extends AxiosRequestConfig<D> {
	guard?: {
		request?: T;
		response?: R;
	}
}

/**
 * 요청 및 응답 데이터에 대해 검증이 가능한 `client.request`의 래퍼 함수.
 *
 * {@link RequestOptions}의 `guard` 필드에 Zod 스키마을 포함하여 요청과 응답 데이터에 대한 검증을 수행할 수 있음
 */
export async function request<
	T extends z.ZodType = z.ZodType,
	R extends z.ZodType = z.ZodType,
	D = unknown,
>({
	guard,
	...config
}: RequestOptions<T, R, D> = {}): Promise<z.infer<R>> {
	const data = guard?.request ? guard.request.parse(config.data) : config.data;
	const response = await client.request({
		...config,
		data,
	});
	return guard?.response ? guard.response.parse(response.data) : response.data;
}
