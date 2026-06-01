import { useOutletContext } from "react-router";

import type { ServerAuthLayoutContext } from "@/layouts/ServerAuthLayout";



/**
 * ServerAuthLayout에서 정의한 컨텍스트를 반환하는 hook
 */
export function useServerAuthLayoutContext(): ServerAuthLayoutContext {
	return useOutletContext<ServerAuthLayoutContext>();
}
