import { useLocation } from "react-router";



export function useCurrentPath() {
	const { pathname, search, hash } = useLocation();
	return `${pathname}${search}${hash}`;
}
