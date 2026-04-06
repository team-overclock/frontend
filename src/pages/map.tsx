import { useMemo } from "react";
import { Link, useSearchParams } from "react-router";

import { ROUTES } from "@/shared/routes";
import { useAuthStore } from "@/stores/auth";



/**
 * 맵 페이지 컴포넌트
 */
export function MapPage() {
	const authStore = useAuthStore();
	const [searchParams] = useSearchParams();
	const uniqueId = useMemo(() => searchParams.get("uniqueId") ?? "", [searchParams]);

	return (
		<>
			지도 페이지 <hr/>
			<hr/>
			사용자명: {authStore.name}<br/>
			요청 ID: {uniqueId || "없음"}<br/>
			<hr/>
			<Link to={ROUTES.HOME}>홈으로 이동</Link><br/>
		</>
	);
}
