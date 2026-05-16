/**
 * 인프라 데이터
 */
export interface InfraInfo {
	icon: string;
	typeName: string;
	description: string;
	color: string;
}

/**
 * 인프라 유형으로 아이콘, 제목, 설명, 색상을 반환하는 함수
 */
export const getInfraInfo = (() => {
	const infraInfo = new Map<string, InfraInfo>([
		["지하철역",  { icon: "🚇", color: "blue", typeName: "지하철역", description: "가장 가까운 역까지 거리" }],
		["초등학교",  { icon: "🎒", color: "orange", typeName: "초등학교", description: "배정 초등학교 도보 거리" }],
		["대형병원",  { icon: "🏥", color: "red", typeName: "대형병원", description: "종합병원·대학병원 거리" }],
		["공원·녹지", { icon: "🌳", color: "green", typeName: "공원·녹지", description: "근린공원·산책로 거리" }],
		["대형마트",  { icon: "🛒", color: "purple", typeName: "대형마트", description: "마트·백화점 거리" }],
		["고등학교",  { icon: "🏫", color: "gold", typeName: "고등학교", description: "인근 고등학교 거리" }],
	]);

	const defaultValue = {
		icon: "❓",
		color: "gray",
		description: "정보 없음",
	};

	return function getInfraInfo(typeName: string): InfraInfo {
		return infraInfo.get(typeName) ?? {
			...defaultValue,
			typeName,
		}
	};
})();
