import { Outlet, Navigate } from "react-router";

import { DEFAULT_PAGE } from "@/shared/routes";
import { useAuthStore } from "@/stores/auth";
import { useCurrentPath } from "@/hooks/use-current-path";
import type { SignPageLocationState } from "@/pages/sign";



/**
 * localStorage 기반 사용자 인증 레이아웃
 *
 * - localStorage에 isLoggedIn 값이 true가 아니면 로그인 페이지로 이동
 */
export function LocalAuthLayout() {
	const from = useCurrentPath();
	const authStore = useAuthStore();

	if (!authStore.isLoggedIn) {
		return <Navigate
			to={DEFAULT_PAGE.NOT_LOGGED_IN}
			state={{
				from,
			} satisfies SignPageLocationState}
			replace
		/>
	}

	return (
		<>
			<Outlet/>
		</>
	);
}
