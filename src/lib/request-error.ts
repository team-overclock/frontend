import axios from "axios";
import { ZodError } from "zod";



/**
 * API 요청 실패 에러를 사용자 표시용 문자열로 변환
 */
export function getRequestErrorMessage(error: unknown) {
	if (error instanceof ZodError) {
		return "서버 응답 형식이 올바르지 않아요. 백엔드 주소/포트 또는 응답 스키마를 확인해 주세요.";
	}

	if (!axios.isAxiosError(error)) {
		return error instanceof Error ? error.message : "요청 처리 중 오류가 발생했어요.";
	}

	const responseData = error.response?.data;

	if (typeof responseData === "string") {
		return responseData;
	}

	if (Array.isArray(responseData)) {
		const messages = responseData
			.map((item) => {
				if (!item || typeof item !== "object") {
					return undefined;
				}

				if ("message" in item && typeof item.message === "string") {
					if ("path" in item && Array.isArray(item.path) && item.path.length > 0) {
						return `${item.path.join(".")}: ${item.message}`;
					}

					return item.message;
				}

				return undefined;
			})
			.filter((message): message is string => Boolean(message));

		if (messages.length > 0) {
			return messages.join("\n");
		}
	}

	if (
		responseData &&
		typeof responseData === "object" &&
		"message" in responseData &&
		typeof responseData.message === "string"
	) {
		return responseData.message;
	}

	return "요청 처리 중 오류가 발생했어요.";
}
