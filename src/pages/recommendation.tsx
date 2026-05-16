import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";

import { ROUTES } from "@/shared/routes";
import type * as schema from "@/shared/schema";
import { useAuthStore } from "@/stores/auth";
import { getRecommendation } from "@/lib/api";



const retryDelayMs = 1500;
const sleep = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));

type LocalState = "is_pending";
type RecommendationRequestState = LocalState | schema.RecommendationStatus;



/**
 * 추천 페이지 컴포넌트
 */
export function RecommendationPage() {
	const [searchParams] = useSearchParams();
	const taskId = useMemo(() => searchParams.get("task_id") ?? "", [searchParams]);

	const authStore = useAuthStore();
	const [state, setState] = useState<RecommendationRequestState>("is_pending");
	const [recommendation, setRecommendation] = useState<null | schema.RecommendationSummaryOutput>(null);

	useEffect(() => {
		if (!taskId) return;

		let cancelled = false;

		const fetchRecommendation = async () => {
			while (!cancelled) {
				try {
					const rec = await getRecommendation(taskId);
					if (cancelled) return;

					setState(rec.status);
					setRecommendation(rec.status === "completed" ? rec : null);

					if (rec.status === "completed" || rec.status === "failed") return;
				} catch (e) {
					if (cancelled) return;
					console.error(e);
					setState("failed");
					setRecommendation(null);
				}

				await sleep(retryDelayMs);
			}
		};

		fetchRecommendation();

		return () => {
			cancelled = true;
		};
	}, [taskId]);

	return (
		<>
			추천 페이지 <hr/>
			<hr/>
			사용자명: {authStore.name}<br/>
			요청 ID: {taskId || "없음"}<br/>
			<hr/>
			<Link to={ROUTES.HOME}>홈으로 이동</Link><br/>
			{!taskId ? "" : state === "is_pending" ? "추천 결과를 가져오는 중..." : state === "in_progress" ? "추천 결과가 아직 나오지 않았아요" : state === "failed" ? "추천 결과를 가져오지 못했어요" : (
				<div>
					<h2>추천 결과</h2>
					<pre>{JSON.stringify(recommendation, null, 2)}</pre>
				</div>
			)}
		</>
	);
}
