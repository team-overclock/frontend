import { useState, useEffect } from "react";



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
