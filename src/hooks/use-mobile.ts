import { MOBILE_BREAKPOINT } from "@/shared/common";
import { useMediaQuery } from "@/hooks/use-media-query";



/**
 * 모바일 화면 여부를 반환하는 Hook
 *
 * max-width: {@link MOBILE_BREAKPOINT} - 1 기준
 */
export function useIsMobile() {
	return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
}
