import { disassemble, getChoseong, convertHangulToQwerty } from "es-hangul";



export interface FilterStringListOptions {
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
}

export function filterStringListOptionsToObject(value: string, {
	caseSensitive = false,
	enableHangulDecomposition = true,
	enableHangulChoseongMatching = true,
	enableQwertyHangulMatching = true,
}: Omit<FilterStringListOptions, "matchAll"> = {}) {
	value = value.trim()
	const data: {
		normalized: string;
		decomposed?: string;
		choseong?: string;
		qwerty?: string;
	} = {
		normalized: caseSensitive ? value : value.toLowerCase(),
	};

	if (enableHangulDecomposition) data.decomposed = disassemble(value);
	if (enableHangulChoseongMatching) data.choseong = getChoseong(value);
	if (enableQwertyHangulMatching) data.qwerty = convertHangulToQwerty(value);
	return data;
}

/**
 * 문자열 검색 함수
 */
export function filterStringList(items: string[], query: string, {
	matchAll = true,
	...options
}: FilterStringListOptions = {}) {
	const terms = query
		.split(/\s+/)
		.map(x => filterStringListOptionsToObject(x, options))
		.filter(x => x.normalized);

	if (terms.length === 0) {
		return [...items];
	}

	return items.filter((item) => {
		const {
			normalized,
			decomposed,
			choseong,
			qwerty,
		} = filterStringListOptionsToObject(item, options);

		const everyOrSome = matchAll ? "every" : "some";
		return terms[everyOrSome]((term) => (
			normalized.includes(term.normalized)
			|| (term.decomposed && decomposed?.includes(term.decomposed))
			|| (term.choseong && term.normalized === term.choseong && choseong?.includes(term.choseong))
			|| (term.qwerty && qwerty?.includes(term.qwerty))
		));
	});
}
