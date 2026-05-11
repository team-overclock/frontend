import { disassemble, getChoseong, convertHangulToQwerty } from "es-hangul";



export interface FilterListOptions<T> {
	/**
	 * 대소문자 구분 여부
	 *
	 * @default false
	 */
	caseSensitive?: boolean;

	/**
	 * 공백으로 구분된 모든 문자열이 매칭되어야 하는지 여부
	 *
	 * @default true
	 */
	matchAll?: boolean;

	/**
	 * 한글 자모 분해 검색 여부
	 *
	 * @default true
	 */
	enableHangulDecomposition?: boolean;

	/**
	 * 한글 초성 매칭 여부
	 */
	enableHangulChoseongMatching?: boolean;

	/**
	 * 한글-쿼티 매칭 여부
	 */
	enableQwertyHangulMatching?: boolean;

	/**
	 * 목록의 각 항목에서 문자열을 추출하는 함수
	 */
	getString?: (item: T) => string;
}

/**
 * 문자열을 검색하기 위한 형태로 변환하는 함수
 */
export function filterListOptionsToObject(value: string, {
	caseSensitive = false,
	enableHangulDecomposition = true,
	enableHangulChoseongMatching = true,
	enableQwertyHangulMatching = true,
}: Omit<FilterListOptions<unknown>, "matchAll" | "getString"> = {}) {
	value = value.trim()
	const data: {
		normalized: string;
		decomposed?: string;
		choseong?: string;
		qwerty?: string;
		qwertyChoseong?: string;
	} = {
		normalized: caseSensitive ? value : value.toLowerCase(),
	};

	if (enableHangulDecomposition) data.decomposed = disassemble(value);
	if (enableHangulChoseongMatching) data.choseong = getChoseong(value);
	if (enableQwertyHangulMatching) data.qwerty = convertHangulToQwerty(value);
	if (enableHangulChoseongMatching && enableQwertyHangulMatching) data.qwertyChoseong = convertHangulToQwerty(data.choseong!);
	return data;
}

/**
 * 문자열 검색 함수
 */
export function filterList<T>(
	items: readonly T[],
	query: string,
	{
		matchAll = true,
		getString,
		...options
	}: FilterListOptions<T> = {},
) {
	/*
	 * 한 단어에서 음절 + 초성 동시 검색 안 됨
	 *
	 * `강남구`를 예시로
	 * - `남`: 검색 됨
	 * - `ㄱㄴㄱ`로 검색 됨
	 * - `ㄱ남ㄱ`: 검색 안 됨
	 */

	const terms = query
		.split(/\s+/)
		.map(x => filterListOptionsToObject(x, options))
		.filter(x => x.normalized);

	if (terms.length === 0) {
		return [...items];
	}

	return items.filter((item) => {
		const str = getString?.(item) ?? String(item);
		const {
			normalized,
			decomposed,
			choseong,
			qwerty,
			qwertyChoseong,
		} = filterListOptionsToObject(str, options);

		const everyOrSome = matchAll ? "every" : "some";
		return terms[everyOrSome]((term) => (
			normalized.includes(term.normalized)
			|| (term.decomposed && decomposed?.includes(term.decomposed))
			|| (term.choseong && term.normalized === term.choseong && choseong?.includes(term.choseong))
			|| (term.qwerty && qwerty?.includes(term.qwerty))
			|| (term.qwerty && qwertyChoseong?.includes(term.qwerty))
		));
	});
}
