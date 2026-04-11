import { AREAS } from "@/shared/enum";



/**
 * 이메일 형식 패턴
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 비밀번호 최소 길이
 */
const PASSWORD_MIN_LENGTH = 8;



/**
 * 이름 값 검증
 *
 * @param value 검증할 이름 문자열
 *
 * @throws 유효하지 않은 이름일 때
 */
export function name(value: string) {
	value = value.trim();
	if (!value) {
		return "이름이 입력되지 않았어요";
	}
}

/**
 * 이메일 형식 검증
 *
 * @param value 검증할 이메일 문자열
 *
 * @throws 유효하지 않은 이메일일 때
 */
export function email(value: string) {
	value = value.trim();
	if (!value) {
		return "이메일이 입력되지 않았아요";
	} else if (!EMAIL_REGEX.test(value)) {
		return "유효하지 않은 이메일 형식이에요";
	}
}

/**
 * 비밀번호 검증
 *
 * @param value 검증할 비밀번호 문자열
 *
 * @throws 유효하지 않은 비밀번호일 때
 */
export function password(value: string) {
	value = value.trim();
	if (!value) {
		return "비밀번호가 입력되지 않았아요";
	} else if (value.length < PASSWORD_MIN_LENGTH) {
		return `비밀번호는 최소 ${PASSWORD_MIN_LENGTH}자 이상이어야 해요`;
	}
}

/**
 * 생활권(지역/동네) 검증
 *
 * 유효하지 않으면 에러 throw.
 *
 * @param value - 검증할 생활권 문자열
 * @throws 유효하지 않은 지역일 때
 */
export function area(value: string) {
	if (!value.trim()) {
		return "동네가 입력되지 않았아요";
	} else if (!AREAS.includes(value)) {
		return "지원하지 않는 동네예요";
	}
}
