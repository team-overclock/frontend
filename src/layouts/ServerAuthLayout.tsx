import { Outlet, Navigate } from "react-router";

import { DEFAULT_PAGE } from "@/shared/routes";
import type * as schema from "@/shared/schema";
import { useUserQuery } from "@/hooks/auth";
import { useCurrentPath } from "@/hooks/use-current-path";
import type { SignPageLocationState } from "@/pages/sign";



export interface ServerAuthLayoutContext {
	user: schema.UserInfoOutput;
}



/**
 * 백엔드 서버 요청을 통한 사용자 인증 레이아웃
 *
 * - 실제 유효한 세션을 가지고 있는지 판단하기 위한 레이아웃
 */
export function ServerAuthLayout() {
	const from = useCurrentPath();
	const userQuery = useUserQuery();

	const user = userQuery.data?.user;

	if (userQuery.isLoading) {
		return null;
	}

	if (!user) {
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
			<Outlet
				context={{
					user,
				} satisfies ServerAuthLayoutContext}
			/>
		</>
	);
}
