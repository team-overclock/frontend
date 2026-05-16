import { useCallback } from "react";
import { NavLink } from "react-router";

import { useLogoutMutation } from "@/hooks/auth";
import { ROUTES } from "@/shared/routes";
import { Button } from "@/components/ui/button";



/**
 * 메인 페이지 컴포넌트
 */
export function HomePage() {
	const logoutMutation = useLogoutMutation();

	const handleCacheClear = useCallback(() => {
		localStorage.clear();
		sessionStorage.clear();
		logoutMutation.mutate();
	}, [logoutMutation]);

	return (
		<div>
			페이지 목록:<br/>
			- <NavLink to={ROUTES.SIGN_IN}>로그인 페이지</NavLink><br/>
			- <NavLink to={ROUTES.SIGN_UP}>회원가입 페이지</NavLink><br/>
			- <NavLink to={ROUTES.ONBOARDING}>온보딩 페이지</NavLink><br/>
			- <NavLink to={`${ROUTES.RECOMMENDATION}?task_id=unique_hash_value`}>추천 결과 조회 페이지</NavLink><br/>
			- <NavLink to={ROUTES.SETTINGS}>설정 페이지</NavLink><br/>
			<hr className="my-2"/>
			<Button
				type="button"
				variant="default"
				children="모든 캐시 및 저장소 지우기"
				onClick={handleCacheClear}
			/>
			<hr className="my-2"/>
			<p>
				사이트 접속 시 로그인 여부를 확인하여 로그인 페이지로 redirect<br/>
				이 페이지는 사용자가 요청한 추천 목록을 볼 수 있는 페이지로 구현될 예정<br/>
				만약 요청한 내역이 하나도 없다면 온보딩 페이지로 자동 redirect<br/>
				따라서 최초 사용자 입장에서는<br/>
				로그인 페이지 - 온보딩 - 추천 결과 - 목록 페이지<br/>
				순서로 이동하게 될 예정<br/>
			</p>
		</div>
	);
}
