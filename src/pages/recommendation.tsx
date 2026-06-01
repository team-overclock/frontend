import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useLocation, type Location } from "react-router";
import { LoaderIcon, SearchAlertIcon } from "lucide-react";
import { useSearchParams } from "react-router";
import { useKakaoLoader, useMap, Map, MapMarker } from "react-kakao-maps-sdk";

import * as env from "@/shared/env";
import type * as schema from "@/shared/schema";
import { RETRY_DELAY_MS, sleep } from "@/shared/common";
import { cn } from "@/lib/utils";
import { getRecommendation } from "@/lib/api";
import { formatPriceUnit } from "@/lib/price-unit";
import { getInfraColor } from "@/shared/common";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInfraTypesStore } from "@/stores/items";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip } from "@/components/tooltip";
import { Header } from "@/components/header";
import { InfraTypeBadge } from "@/components/infra-type-badge";
import {
	Drawer,
	DrawerTrigger,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerDescription,
} from "@/components/ui/drawer";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";



type LocalState = "is_pending" ;
type RecommendationRequestState = LocalState | schema.RecommendationStatus;

const defaultPoint: schema.MapCoordinate = { lat: 33.450701, lng: 126.570667 };



/**
 * 추천 결과 요청 상태에 따른 메시지와 아이콘을 보여주는 컴포넌트
 */
function RecommendationPreBox({
	icon,
	message,
	className,
}: {
	icon?: React.ReactNode;
	message: string | string[];
	className?: string;
}) {
	const messages = Array.isArray(message) ? message : [message];
	return (
		<article className={cn("flex-1 flex flex-col gap-3 justify-center-safe items-center-safe text-2xl font-bold", className)}>
			<p className="empty:hidden">{icon}</p>
			<div className="text-center">{messages.map((m, i) => <p key={i}>{m}</p>)}</div>
		</article>
	);
}

function RecommendationLoading() {
	return (
		<RecommendationPreBox
			icon={<LoaderIcon size={32} className="animate-spin"/>}
			message={[
				"추천 목록을 생성하고 있어요 :)",
				"조금만 기다려 주세요!",
			]}
		/>
	);
}

function RecommendationFailed() {
	return (
		<RecommendationPreBox
			icon={<SearchAlertIcon size={32}/>}
			message={[
				"추천 결과를 가져오지 못했어요 :(",
				"조금만 기다려 주세요!",
			]}
			className="text-destructive"
		/>
	);
}



/**
 * 지도에 추천 결과를 마커로 표시 및 모든 위치가 보이도록 지도의 범위를 자동으로 조정하는 컴포넌트
 *
 * @ref https://react-kakao-maps-sdk.jaeseokim.dev/docs/sample/map/setBounds/
 */
const AutoBoundsSetter = ({
	points,
	button = false,
	label,
}: {
	points: schema.MapCoordinate[]
	button?: boolean;
	label?: string;
}) => {
	const map = useMap();
	const bounds = useMemo(() => {
		const bounds = new kakao.maps.LatLngBounds();

		points.forEach((point) => {
			bounds.extend(new kakao.maps.LatLng(point.lat, point.lng));
		});
		return bounds;
	}, [points]);

	const setBound = useCallback(() => {
		map.setBounds(bounds);
	}, [map, bounds]);

	useEffect(() => {
		setBound();
	}, [setBound]);

	if (!button) {
		return null;
	}

	return (
		<Button
			onClick={setBound}
			children={label || "모든 위치 보기"}
		/>
	);
}

/**
 * 추천 결과를 지도에 표시하는 컴포넌트
 */
function RecommendationMap({
	// taskId,
	// requestData,
	properties,
}: Pick<
	schema.RecommendationSummaryOutput,
	"taskId" | "requestData" | "properties"
>) {
	useKakaoLoader({
		appkey: env.KAKAO_MAP_API_KEY,
	});

	const points = useMemo(
		() => properties?.map(x => ({
			lat: x.address.latitude,
			lng: x.address.longitude,
		})) ?? [defaultPoint],
		[properties],
	);

	return (
		<Map
			center={points[0]}
			style={{
				width: "100%",
				height: "100%",
			}}
			level={3}
		>
			{points.map(point => (
				<MapMarker
					key={`marker__${point.lat}-${point.lng}`}
					position={point}
				/>
			))}
			<AutoBoundsSetter points={points}/>
		</Map>
	);
}



function Trophy({ rank }: { rank: number }) {
	const imoji = ["🥇", "🥈", "🥉"][rank - 1] || "";
	return (
		<p
			className={cn(
				"font-bold text-foreground",
				rank === 1 && "text-yellow-500",
				rank === 2 && "text-gray-400",
				rank === 3 && "text-yellow-800",
			)}
			children={`${imoji} ${rank}위`.trim()}
		/>
	);
}

function ScoreGauge({
	score,
	className,
	...props
}: (
	& React.ComponentProps<"div">
	& { score: number }
)) {
	return (
		<div
			className={cn(
				"flex items-center-safe gap-2",
				className,
			)}
			{...props}
		>
			<span
				className={cn(
					"relative block w-full h-2.25 bg-background rounded-full overflow-hidden",
					"after:w-(--w) after:h-full after:bg-primary after:absolute after:inset-0 after:rounded-full",
					"after:bg-linear-90 after:from-green-500 after:to-blue-700",
				)}
				style={{
					"--w": `${score}%`,
				} as React.CSSProperties}
			/>
			<span
				className="text-primary font-bold"
				children={`${Math.round(score)}점`}
			/>
		</div>
	);
}

function PriceBox({
	label,
	price,
}: {
	label: string;
	price: number,
}) {
	return (
		<p
			className="font-bold"
			children={`${label}: ${formatPriceUnit(price).join(" ")}`}
		/>
	);
}

interface PropertySummaryWithRank extends schema.RecommendationPropertySummary {
	rank: number;
}

function PropertySummaryBox(p: (
	& PropertySummaryWithRank
	& {
		active: boolean;
		isMobile: boolean;
		hasSalePrice: boolean;
		hasJeonsePrice: boolean;
	}
)) {
	const infraTypesStore = useInfraTypesStore();
	const infraTypesMap = infraTypesStore.getMap();
	return (
		<article
			className={cn(
				"flex flex-col gap-1.5",
				"border rounded-md shadow-md p-4",
				p.isMobile && "h-64 w-56",
				p.active && "border-primary shadow-lg",
			)}
		>
			<Trophy rank={p.rank}/>
			<ScoreGauge score={p.score}/>
			<p className="font-bold">{p.name}</p>
			<p className="text-xs text-muted-foreground">{p.address.region}</p>
			{p.isMobile && <>
				{p.salePrice && <PriceBox label="매매" price={p.salePrice}/>}
				{p.jeonsePrice && <PriceBox label="전세" price={p.jeonsePrice}/>}
			</>}
			<div className="flex gap-2 mt-auto">
				{p.infrastructure.map(item => (
					<InfraTypeBadge
						key={item.type}
						color={getInfraColor(infraTypesMap.get(item.type)?.type ?? "")}
						label={`${item.distance}m`}
						className="text-xs px-1.5 py-1 opacity-80"
					/>
				))}
			</div>
			<Button
				type="button"
				className="mt-1 font-bold"
				children="상세보기"
			/>
		</article>
	);
}

function RecommendationSheet({
	items,
	className,
	children,
	...props
}: {
	isMobile: boolean;
	items: PropertySummaryWithRank[];
	hasSalePrice: boolean;
	hasJeonsePrice: boolean;
	className?: string;
	children?: React.ReactNode;
}) {
	return (
		<div className={cn("z-10 bg-secondary shadow-md overflow-hidden", className)}>
			{children}
			<ol
				className={cn(
					"p-4 h-full flex gap-4",
					!props.isMobile && "flex-col mt-4 border-t",
					props.isMobile && "justify-center-safe",
				)}
			>
				{items.map((item, index) => (
					<li key={index}>
						<PropertySummaryBox active={false} {...props} {...item}/>
					</li>
				))}
				{items.map((item, index) => (
					<li key={index}>
						<PropertySummaryBox active={false} {...props} {...item}/>
					</li>
				))}
				{items.map((item, index) => (
					<li key={index}>
						<PropertySummaryBox active={false} {...props} {...item}/>
					</li>
				))}
				{items.map((item, index) => (
					<li key={index}>
						<PropertySummaryBox active={false} {...props} {...item}/>
					</li>
				))}
				{items.map((item, index) => (
					<li key={index}>
						<PropertySummaryBox active={false} {...props} {...item}/>
					</li>
				))}
			</ol>
		</div>
	);
}



const snapPoints = ["550px", 1];

interface LocationState {
	/**
	 * - 추천 요청 후 페이지 이동 시 입력한 name 값 넘기기
	 * - 추천 목록 페이지에서 클릭 시 화묜에 표시된 name 넘기기
	 */
	name?: string;
}

const sortByMap = {
	score: "점수",
	salePrice: "매매가",
	jeonsePrice: "전세가"
};

function SortBySelect<K extends keyof typeof sortByMap>(item: {
	label: string;
	value: K;
	onChange: (value: K) => void;
}) {
	return (
		<Select value={item.value} onValueChange={value => item.onChange(value as K)}>
			<SelectTrigger
				className="h-8 w-24"
				aria-label={item.label}
			>
				<SelectValue placeholder="단위 선택"/>
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectLabel>{item.label}</SelectLabel>
					{Object.entries(sortByMap).map(([key, label]) => (
						<SelectItem key={key} value={key} children={label}/>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}

/**
 * 추천 페이지 컴포넌트
 *
 * - 로그인 여부는 레이아웃단에서 처리 + 백엔드에서 검증 후 결과 리턴
 * - 에러 및 progress 상태면 알아서 재요청
 */
export function RecommendationPage() {
	const [bottomSheetOpen, setBottomSheetOpen] = useState(true);
	const [sortBy, setSortBy] = useState<keyof typeof sortByMap>("score");
	const [snap, setSnap] = useState<number | string | null>(snapPoints[0]);
	const infraTypesStore = useInfraTypesStore();

	const isMobile = useIsMobile();
	// const isMobile = true
	const location = useLocation() as Location<LocationState | undefined>;
	const [searchParams] = useSearchParams();
	const taskId = useMemo(() => searchParams.get("task_id") ?? "", [searchParams]);
	const infraTypesMap = infraTypesStore.getMap();

	const [recState, setRecState] = useState<RecommendationRequestState>("is_pending");
	const [recommendation, setRecommendation] = useState<null | schema.RecommendationSummaryOutput>(null);

	const recName = recommendation?.requestData.name || location.state?.name || taskId;
	const hasSalePrice = !!recommendation?.requestData.salePrice;
	const hasJeonsePrice = !!recommendation?.requestData.jeonsePrice;

	const infraInfos = useMemo(
		() => recommendation?.requestData.infrastructureTypes.map((name, idx) => ({
			...infraTypesMap.get(name),
			order: idx + 1,
		})) ?? [],
		[recommendation?.requestData.infrastructureTypes, infraTypesMap],
	);

	const sortedProperties = useMemo(
		()  => recommendation?.properties?.map((x, idx) => ({ ...x, rank: idx + 1 })).toSorted((a, b) => {
			if (sortBy === "score") {
				return b.score - a.score;
			}

			return (a[sortBy] ?? Infinity) - (b[sortBy] ?? Infinity);
		}) ?? [],
		[sortBy, recommendation?.properties],
	);

	useEffect(() => {
		if (!taskId) return;

		let cancelled = false;

		const fetchRecommendation = async () => {
			while (!cancelled) {
				try {
					const rec = await getRecommendation(taskId);
					if (cancelled) return;

					setRecState(rec.status);
					setRecommendation(rec);

					if (rec.status === "completed" || rec.status === "failed") return;
				} catch (e) {
					if (cancelled) return;
					console.error(e);
					setRecState("failed");
					setRecommendation(null);
				}

				await sleep(RETRY_DELAY_MS);
			}
		};

		fetchRecommendation();

		return () => {
			cancelled = true;
		};
	}, [taskId]);

	return (
		<div className="flex-1 flex w-full">
			{!isMobile && (
				<RecommendationSheet
					isMobile={false}
					items={sortedProperties}
					hasSalePrice={hasSalePrice}
					hasJeonsePrice={hasJeonsePrice}
					className="w-64 lg:w-96 rounded-r-4xl"
				>
					<Header heading="추천 결과 조회"/>
					<Tooltip
						type="button"
						trigger={recName}
						children={recName}
						className="w-full font-bold text-center overflow-hidden text-ellipsis"
					/>
					<div
						className={cn(
							"grid gap-2 mt-4 px-4 grid-cols-3",
							infraInfos.length === 1 && "grid-cols-1",
							[2, 4].includes(infraInfos.length) && "grid-cols-2",
						)}
					>
						{infraInfos.map(infra => (
							<Tooltip
							 	key={infra.type}
								type="button"
								trigger={<InfraTypeBadge {...infra} label=""/>}
								className="w-full"
								children={infra.label}
							/>
						))}
					</div>
				</RecommendationSheet>
			)}
			<div className="flex-1 flex flex-col">
				{isMobile && <>
					<Header heading={`추천 결과 조회 - ${recName}`.trim()}/>
					<ScrollArea className="w-svw whitespace-nowrap">
						<div className="bg-secondary p-4 w-full flex justify-center-safe gap-4">
							{infraInfos.map((infra) => (
								<div key={infra.label}>
									<InfraTypeBadge {...infra}/>
								</div>
							))}
						</div>
						<ScrollBar orientation="horizontal"/>
					</ScrollArea>
				</>}
				{
					// 결과를 정상적으로 받아왔을 경우에만 지도 표시
					!taskId || recState === "in_progress" || recState === "is_pending" ? (
						<RecommendationLoading/>
					) : !recommendation ? (
						<RecommendationFailed/>
					) : (
						<div className={cn("flex-1", isMobile ? "" : "-ml-4")}>
							<RecommendationMap {...recommendation}/>
						</div>
					)
				}
				{isMobile && (
					<Drawer
						open={bottomSheetOpen}
						onOpenChange={setBottomSheetOpen}
						snapPoints={snapPoints}
						activeSnapPoint={snap}
						setActiveSnapPoint={setSnap}
						snapToSequentialPoint
						modal={false}
					>
						<DrawerTrigger
							onClick={e => e.currentTarget.blur()}
							className="font-bold text-lg p-2 bg-secondary"
							children="순위 보기"
						/>
						<DrawerContent className="h-[60%] max-h-[97%]! shadow-2xl">
							<div className="flex justify-between px-4">
								<DrawerHeader className="">
									<DrawerTitle>🏆 추천 단지 {sortedProperties.length || 0}곳</DrawerTitle>
									<DrawerDescription className="sr-only">Top 10</DrawerDescription>
								</DrawerHeader>
								<div>
									<SortBySelect
										label="정렬 기준"
										onChange={setSortBy}
										value={sortBy}
									/>
								</div>
							</div>
							<ScrollArea className="w-svw whitespace-nowrap h-full">
								<RecommendationSheet
									isMobile
									items={sortedProperties}
									hasSalePrice={hasSalePrice}
									hasJeonsePrice={hasJeonsePrice}
									className="rounded-t-[35px]"
								/>
								<ScrollBar orientation="horizontal"/>
							</ScrollArea>
						</DrawerContent>
					</Drawer>
				)}
			</div>
		</div>
	);
}
