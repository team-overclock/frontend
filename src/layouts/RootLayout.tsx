import { Outlet, Navigate, useLocation } from "react-router";

import { DEFAULT_PAGE, ROUTES } from "@/shared/routes";
import { useAuthStore } from "@/stores/auth";



/**
 * 공통 레이아웃을 렌더링하는 루트 레이아웃 컴포넌트
 *
 * - 매칭된 하위 라우트는 `Outlet` 위치에 렌더링 됨
 */
export function RootLayout() {
	const { pathname } = useLocation();
	const authStore = useAuthStore();

	if (!authStore.cuid && !pathname.startsWith(ROUTES.SIGN_UP) && !pathname.startsWith(ROUTES.SIGN_IN)) {
		return <Navigate to={DEFAULT_PAGE.NOT_LOGGED_IN} replace/>
	}

	return (
		<>
			<Outlet/>
		</>
	);
}
