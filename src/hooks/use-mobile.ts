import { MOBILE_BREAKPOINT } from "@/shared/common";
import { useMediaQuery } from "@/hooks/use-media-query";



export function useIsMobile() {
	return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
}
