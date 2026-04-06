import { useCallback, useEffect, useRef } from "react";



/**
 * 여러 개의 ref를 하나로 병합하여 반환하는 커스텀 훅
 *
 * - 주로 컴포넌트 내부에서 ref를 생성하면서, 외부에서 전달된 ref도 함께 사용해야 하는 경우에 유용
 * - 반환된 ref 콜백은 전달된 모든 ref에 동일한 값을 할당함
 */
export function useMergedRef<T>(...refs: Array<React.Ref<T>>) {
	const refsRef = useRef(refs);

	useEffect(() => {
		refsRef.current = refs;
	}, [refs]);

	return useCallback((value: T | null) => {
		refsRef.current.forEach(ref => {
			if (!ref) {
				return;
			}

			if (typeof ref === "function") {
				ref(value);
				return;
			}

			ref.current = value;
		});
	}, []);
}
