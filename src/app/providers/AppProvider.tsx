import { RouterProvider } from "react-router";

import { router } from "@/app/router";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "./QueryProvider";



/**
 * 애플리케이션 전역 Provider 조합 및 루트에 주입하기 위한 컴포넌트
 *
 * - `RouterProvider`를 통해 라우터 인스턴스 연결
 */
export function AppProvider() {
	return (
		<QueryProvider>
			<TooltipProvider>
				<RouterProvider router={router}/>
			</TooltipProvider>
		</QueryProvider>
	);
}
