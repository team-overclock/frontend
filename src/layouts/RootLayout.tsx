import { Outlet } from "react-router";



/**
 * 공통 레이아웃을 렌더링하는 루트 레이아웃 컴포넌트
 *
 * - 매칭된 하위 라우트는 `Outlet` 위치에 렌더링 됨
 */
export function RootLayout() {
	return (
		<>
			<Outlet/>
		</>
	);
}
