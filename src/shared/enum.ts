/**
 * 거래 유형
 */
export type PriceKey = typeof PRICE_KEYS[number];

/**
 * 거래 유형 목록
 */
export const PRICE_KEYS = [
	"sale",
	"jeonse",
] as const;

/**
 * 가격 단위
 */
export type PriceUnit = typeof PRICE_UNITS[number];

/**
 * 가격 단위 목록
 */
export const PRICE_UNITS = [
	"억 원",
	"만 원",
] as const;
