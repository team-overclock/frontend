import { useEffect, useState } from "react";
import { useNavigate, NavLink } from "react-router";
import { LoaderIcon, User2Icon, SearchAlertIcon, ClockIcon, Sparkles, MapPin } from "lucide-react";

import type * as schema from "@/shared/schema";
import { getRecommendations } from "@/lib/api";
import { ROUTES } from "@/shared/routes";
import { cn } from "@/lib/utils";
import { formatPriceUnit } from "@/lib/price-unit";
import { Trophy } from "@/components/trophy";
import { Header } from "@/components/header";
import { InfraTypeBadge } from "@/components/infra-type-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";



const HIGH_SCHOOL_MAX_COUNT = 3;

const STATUS_MAP: Record<
	schema.RecommendationStatus | "isNew",
	{ label: string; className: string }
> = {
	isNew: { label: "미확인", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30 animate-pulse" },
	completed: { label: "완료", className: "bg-green-500/10 text-green-600 border-green-500/30" },
	in_progress: { label: "처리 중", className: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
	failed: { label: "실패", className: "bg-destructive/10 text-destructive border-destructive/30" },
};

function StatusBadge({
	isNew,
	status,
}: {
	isNew?: boolean;
	status: schema.RecommendationStatus;
}) {
	const { label, className } = STATUS_MAP[isNew ? "isNew" : status];

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
	const { requestData, status, requestedAt, bestProperty, lastViewedAt } = item;
	const salePrice = requestData.salePrice;
	const jeonsePrice = requestData.jeonsePrice;
	const isClickable = status !== "failed";
	const bestAddress = bestProperty?.address.roadName ?? bestProperty?.address.landLot ?? bestProperty?.region.name;
	const isNew = status === "completed" && lastViewedAt === null;

	return (
		<article
			className={cn(
				"flex flex-col gap-3 p-4 rounded-xl border bg-card shadow-sm",
				"transition-all duration-200",
				isClickable && "hover:shadow-md hover:border-primary/40 focus-visible:shadow-md focus-visible:outline-primary/40 cursor-pointer",
				status === "in_progress" && "border-blue-500/30",
				status === "failed" && "border-destructive/30 opacity-60",
			)}
			onClick={isClickable ? onClick : undefined}
			tabIndex={isClickable ? 0 : undefined}
			role={isClickable ? "link" : undefined}
		>
			{/* 상단: 제목 + 상태 */}
			<div className="flex items-start justify-between gap-2">
				<h3
					className={cn(
						"font-bold text-base text-foreground/90 break-keep flex-1 leading-tight",
						!requestData.name && "text-muted-foreground font-medium text-sm"
					)}
					children={requestData.name || "(이름 없음)"}
				/>
				<StatusBadge status={status} isNew={isNew}/>
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

			{!!requestData.schoolDistricts?.length && (
				<div className="flex flex-wrap gap-1">
					{requestData.schoolDistricts.map(d => (
						<span
							key={d.type}
							className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium"
						>
							{d.label}
						</span>
					))}
				</div>
			)}

			{!!requestData.highSchools?.length && (
				<p className="text-[11px] text-muted-foreground leading-relaxed">
					🏫 {requestData.highSchools.slice(0, HIGH_SCHOOL_MAX_COUNT).map(s => s.name).join(", ")}
					{requestData.highSchools.length > HIGH_SCHOOL_MAX_COUNT && ` 외 ${requestData.highSchools.length - HIGH_SCHOOL_MAX_COUNT}개`}
				</p>
			)}

			{/* 가격 정보 */}
			{(salePrice?.min || salePrice?.max || jeonsePrice?.max || jeonsePrice?.min) && (
				<div className="flex gap-4 text-xs">
					{(salePrice?.min || salePrice?.max) && (
						<p className="font-semibold text-primary">
							매매 {formatPriceUnit(salePrice.min).join(" ")} ~ {formatPriceUnit(requestData.salePrice!.max!).join(" ")}~
						</p>
					)}
					{(jeonsePrice?.min || jeonsePrice?.max) && (
						<p className="font-semibold text-indigo-500">
							전세 {formatPriceUnit(jeonsePrice.min).join(" ")} ~ {formatPriceUnit(jeonsePrice.max).join(" ")}
						</p>
					)}
				</div>
			)}

			{/* 베스트 매물 */}
			{status === "completed" && <>
				<hr/>
				<div className="flex gap-1 flex-wrap-reverse rounded-lg bg-primary/5 border border-primary/15 p-2.5 text-xs">
					{!bestProperty ? (
						"조건에 맞는 집을 찾지 못했어요"
					) : (
						<>
							<div className="flex-1 flex flex-col gap-1">
								<Trophy rank={1}/>
								<span
									className={cn(
										"font-bold text-foreground/80 truncate",
										!bestProperty.name && "text-muted-foreground font-medium"
									)}
									children={bestProperty.name || "(알 수 없음)"}
								/>
								<p className="flex items-center gap-1 text-muted-foreground">
									<MapPin size={10} className="shrink-0"/>
									<span className="truncate">{bestAddress}</span>
								</p>
							</div>
							<span className="flex gap-0.5 items-center-safe justify-center-safe font-bold text-indigo-500">
								<Sparkles size={10}/>
								{Math.round(bestProperty.score)}점
							</span>
						</>
					)}
				</div>
				<hr/>
			</>}

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
