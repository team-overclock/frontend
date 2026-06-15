import { PRICE_UNITS, type PriceUnit } from "@/shared/enum";



/**
 * 가격 단위 문자열을 숫자로 변환하는 함수
 *
 * - "억 원" 단위는 10,000 * 10,000으로 변환
 * - "만 원" 단위는 10,000으로 변환
 * - 지원하지 않는 단위나 유효하지 않은 숫자 입력 시 예외 발생
 *
 * @param value 가격 단위 문자열 (예: "2억 원", "500만 원")
 * @returns 변환된 숫자 값 (예: 200000000, 5000000)
 * @throws {Error} 지원하지 않는 단위이거나 유효하지 않은 숫자 입력 시
 */
export function convertToNumber(value: string) {
	if (!PRICE_UNITS.some(unit => value.endsWith(unit))) {
		throw new Error("지원하지 않는 단위예요");
	}

	const numericValue = parseFloat(value);
	if (Number.isNaN(numericValue)) {
		throw new Error("유효한 숫자가 아니에요");
	}

	if (value.endsWith("억 원")) {
		return numericValue * 10_000 * 10_000;
	} else {
		return numericValue * 10_000;
	}
}



/**
 * 숫자 가격을 단위 문자열로 포맷팅하는 함수
 *
 * - 10,000 * 10,000 이상은 "억 원" 단위로 포맷팅
 * - 10,000 이상은 "만 원" 단위로 포맷팅
 * - 10,000 미만은 "0만 원"으로 포맷팅
 *
 * @param value 숫자 가격 (예: 200000000, 5000000)
 * @returns 숫자 가격과 단위 문자열의 튜플 (예: [20, "억 원"], [500, "만 원"])
 */
export function formatPriceUnit(value?: number | null): [number, PriceUnit | "원"] {
	let number: number;
	let unit: PriceUnit | "원";

	if (!value) {
		number = 0;
		unit = "원";
	} else if (value >= 10_000 * 10_000) {
		number = value / (10_000 * 10_000);
		unit = "억 원";
	} else {
		number = value / 10_000;
		unit = "만 원";
	}

	number = Math.round(number * 100) / 100; // 소수점 둘째 자리까지 반올림

	return [number, unit];
}
