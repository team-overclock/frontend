/**
 * 동네 목록
 */
export const AREAS = [
	"서울시 강남구 개포동",
	"서울시 서초구 반포동",
	"서울시 송파구 잠실동",
	"서울시 마포구 공덕동",
	"서울시 양천구 목동",
	"서울시 강남구 개포동 2",
	"서울시 서초구 반포동 2",
	"서울시 송파구 잠실동 2",
	"서울시 마포구 공덕동 2",
	"서울시 양천구 목동 2",
	"서울시 강남구 개포동 3",
	"서울시 서초구 반포동 3",
	"서울시 송파구 잠실동 3",
	"서울시 마포구 공덕동 3",
	"서울시 양천구 목동 3",
	"서울시 강남구 개포동 4",
	"서울시 서초구 반포동 4",
	"서울시 송파구 잠실동 4",
	"서울시 마포구 공덕동 4",
	"서울시 양천구 목동 4",
	"서울시 강남구 개포동 5",
	"서울시 서초구 반포동 5",
	"서울시 송파구 잠실동 5",
	"서울시 마포구 공덕동 5",
	"서울시 양천구 목동 5",
];



/**
 * 인프라 타이틀
 */
export type InfraTitle = typeof INFRA_TITLES[number];

/**
 * 인프라 타이틀 목록
 */
export const INFRA_TITLES = [
	"지하철역",
	"초등학교",
	"대형병원",
	"공원·녹지",
	"대형마트",
	"고등학교",
] as const;

/**
 * 인프라 데이터
 */
export interface InfraItem {
	icon: string;
	title: InfraTitle;
	description: string;
	color: string;
}

/**
 * 인프라 정보 목록
 */
export const INFRA_ITEMS: InfraItem[] = [
	{
		icon: "🚇",
		title: "지하철역",
		description: "가장 가까운 역까지 거리",
		color: "blue",
	},
	{
		icon: "🎒",
		title: "초등학교",
		description: "배정 초등학교 도보 거리",
		color: "orange",
	},
	{
		icon: "🏥",
		title: "대형병원",
		description: "종합병원·대학병원 거리",
		color: "red",
	},
	{
		icon: "🌳",
		title: "공원·녹지",
		description: "근린공원·산책로 거리",
		color: "green",
	},
	{
		icon: "🛒",
		title: "대형마트",
		description: "마트·백화점 거리",
		color: "purple",
	},
	{
		icon: "🏫",
		title: "고등학교",
		description: "인근 고등학교 거리",
		color: "gold",
	},
];



/**
 * 거래 유형
 */
export type PriceKey = typeof PRICE_KEYS[number];

/**
 * 거래 유형 목록
 */
export const PRICE_KEYS = [
	"purchase",
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
