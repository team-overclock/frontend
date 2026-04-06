import axios from "axios";

import { BACKEND_URL } from "@/shared/env";



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



/**
 * `client.request`의 래퍼 함수로, API 요청을 보낼 때 사용할 수 있음
 *
 * @param props
 */
export function request(props: Parameters<typeof client.request>[0]) {
	return client.request(props);
}
