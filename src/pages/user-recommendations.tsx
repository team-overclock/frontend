import { useEffect, useState } from "react";
import { useNavigate, NavLink } from "react-router";
import { LoaderIcon, User2Icon, SearchAlertIcon, ClockIcon, Sparkles, MapPin } from "lucide-react";

import type * as schema from "@/shared/schema";
import { getRecommendations } from "@/lib/api";
import { ROUTES } from "@/shared/routes";
import { cn } from "@/lib/utils";
import { formatPriceUnit } from "@/lib/price-unit";
import { Header } from "@/components/header";
import { InfraTypeBadge } from "@/components/infra-type-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";



const STATUS_MAP: Record<schema.RecommendationStatus, { label: string; className: string }> = {
	completed: { label: "완료", className: "bg-green-500/10 text-green-600 border-green-500/30" },
	in_progress: { label: "처리 중", className: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
	failed: { label: "실패", className: "bg-destructive/10 text-destructive border-destructive/30" },
};

function StatusBadge({ status }: { status: schema.RecommendationStatus }) {
	const { label, className } = STATUS_MAP[status];
	return (
		<Badge
			variant="outline"
			className={cn("text-xs font-bold", className)}
			children={label}
		/>
	);
}

function formatDate(date: Date) {
	return date.toLocaleDateString("ko-KR", {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

interface RecommendationCardProps {
	item: schema.UserRecommendationItem;
	onClick: () => void;
}

function RecommendationCard({ item, onClick }: RecommendationCardProps) {
	const { requestData, status, requestedAt } = item;
	const hasSalePrice = requestData.salePrice?.min != null;
	const hasJeonsePrice = requestData.jeonsePrice?.min != null;
	const isClickable = status !== "failed";

	return (
		<article
			className={cn(
				"flex flex-col gap-3 p-4 rounded-xl border bg-card shadow-sm",
				"transition-all duration-200",
				isClickable && "hover:shadow-md hover:border-primary/40 cursor-pointer",
				status === "in_progress" && "border-blue-500/30",
				status === "failed" && "border-destructive/30 opacity-60",
			)}
			onClick={isClickable ? onClick : undefined}
		>
			{/* 상단: 제목 + 상태 */}
			<div className="flex items-start justify-between gap-2">
				<h3 className="font-bold text-base text-foreground/90 break-keep flex-1 leading-tight">
					{requestData.name ? (
						<>
							<Sparkles size={14} className="inline-block mr-1 text-primary align-text-top"/>
							{requestData.name}
						</>
					) : (
						<span className="text-muted-foreground font-medium text-sm">{item.taskId}</span>
					)}
				</h3>
				<StatusBadge status={status}/>
			</div>

			{/* 지역 */}
			{requestData.region && (
				<p className="flex items-center gap-1 text-xs text-muted-foreground">
					<MapPin size={12} className="shrink-0"/>
					{requestData.region.name}
				</p>
			)}

			{/* 인프라 뱃지 */}
			{requestData.infrastructureTypes.length > 0 && (
				<div className="flex flex-wrap gap-1.5">
					{requestData.infrastructureTypes.map((infra) => (
						<InfraTypeBadge
							key={infra.type}
							{...infra}
							className="text-xs px-2 py-1"
						/>
					))}
				</div>
			)}

			{/* 가격 정보 */}
			{(hasSalePrice || hasJeonsePrice) && (
				<div className="flex gap-4 text-xs">
					{hasSalePrice && (
						<p className="font-semibold text-primary">
							매매 {formatPriceUnit(requestData.salePrice!.min!).join(" ")}~
						</p>
					)}
					{hasJeonsePrice && (
						<p className="font-semibold text-indigo-500">
							전세 {formatPriceUnit(requestData.jeonsePrice!.min!).join(" ")}~
						</p>
					)}
				</div>
			)}

			{/* 요청 일시 */}
			<p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-auto">
				<ClockIcon size={11} className="shrink-0"/>
				{formatDate(requestedAt)}
			</p>
		</article>
	);
}



/**
 * 사용자 추천 목록 페이지 컴포넌트
 */
export function UserRecommendationsPage() {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<schema.UserRecommendationsOutput | null>(null);

	useEffect(() => {
		let cancelled = false;

		getRecommendations()
			.then((res) => {
				if (cancelled) return;
				if (res.total === 0) {
					navigate(ROUTES.ONBOARDING, { replace: true });
					return;
				}
				setData(res);
			})
			.catch((e) => {
				console.error(e);
				if (!cancelled) setError("추천 목록을 불러오지 못했어요.");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => { cancelled = true; };
	}, [navigate]);

	const handleItemClick = (item: schema.UserRecommendationItem) => {
		navigate(
			`${ROUTES.RECOMMENDATION}?task_id=${item.taskId}`,
			{ state: { name: item.requestData.name } },
		);
	};

	return (
		<>
			<Header heading="내 추천 목록">
				<div className="flex items-center-safe gap-2">
					<Button
						variant="outline"
						className="p-4 shadow-md font-bold"
						asChild
					>
						<NavLink to={ROUTES.ONBOARDING} className="no-underline">
							<Sparkles size={16}/>
							새 추천 생성
						</NavLink>
					</Button>
					<NavLink to={ROUTES.SETTINGS}>
						<User2Icon/>
					</NavLink>
				</div>
			</Header>

			{loading ? (
				<main className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
					<LoaderIcon size={32} className="animate-spin"/>
					<p className="font-bold text-lg">불러오는 중...</p>
				</main>
			) : error ? (
				<main className="flex-1 flex flex-col items-center justify-center gap-3 text-destructive">
					<SearchAlertIcon size={32}/>
					<p className="font-bold text-lg">{error}</p>
					<Button
						variant="outline"
						onClick={() => window.location.reload()}
						children="다시 시도"
					/>
				</main>
			) : data ? (
				<main className="flex-1 flex flex-col gap-3 py-4 app-container">
					<p className="text-sm text-muted-foreground font-medium">
						총 {data.total}건의 추천 요청
					</p>
					{data.items.map((item) => (
						<RecommendationCard
							key={item.taskId}
							item={item}
							onClick={() => handleItemClick(item)}
						/>
					))}
				</main>
			) : null}
		</>
	);
}
