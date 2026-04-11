import { NavLink } from "react-router";

import { ROUTES } from "@/shared/routes";



/**
 * 메인 페이지 컴포넌트
 */
export function HomePage() {
	return (
		<div>
			페이지 목록:<br/>
			- <NavLink to={ROUTES.SIGN_IN}>로그인 페이지</NavLink><br/>
			- <NavLink to={ROUTES.SIGN_UP}>회원가입 페이지</NavLink><br/>
			- <NavLink to={ROUTES.ONBOARDING}>온보딩 페이지</NavLink><br/>
			- <NavLink to={ROUTES.MAP}>지도 페이지</NavLink><br/>
			- <NavLink to={ROUTES.SETTINGS}>설정 페이지</NavLink><br/>
		</div>
	);
}
