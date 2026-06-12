import { useState, useEffect } from "react";



/**
 * CSS 미디어 쿼리 결과를 반환하는 Hook
 */
export function useMediaQuery(query: string) {
	const [matches, setMatches] = useState<boolean | undefined>(undefined);

	useEffect(() => {
		const mql = window.matchMedia(query);
		const onChange = () => setMatches(mql.matches);
		mql.addEventListener("change", onChange);
		onChange();
		return () => mql.removeEventListener("change", onChange);
	}, [query]);

	return matches;
}
