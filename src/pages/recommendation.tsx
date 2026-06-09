import { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { useLocation, type Location } from "react-router";
import { LoaderIcon, SearchAlertIcon, X, MapPin, Sparkles } from "lucide-react";
import { useSearchParams } from "react-router";
import { useKakaoLoader, useMap, Map as KakaoMap, MapMarker, CustomOverlayMap } from "react-kakao-maps-sdk";

import * as env from "@/shared/env";
import type * as schema from "@/shared/schema";
import { RETRY_DELAY_MS, sleep } from "@/shared/common";
import { cn } from "@/lib/utils";
import { getRecommendation, getRecommendationProperty } from "@/lib/api";
import { formatPriceUnit } from "@/lib/price-unit";
import { useIsMobile } from "@/hooks/use-mobile";
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
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";



type LocalState = "is_pending" ;
type RecommendationRequestState = LocalState | schema.RecommendationStatus;

const sheetId = "sheet";
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
	enabled = true,
}: {
	points: schema.MapCoordinate[]
	button?: boolean;
	label?: string;
	enabled?: boolean;
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
		if (enabled) {
			setBound();
		}
	}, [setBound, enabled]);

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

function ActiveMarkerPanTo({
	activeId,
	activeToken,
	propertyById,
}: {
	activeId?: number | null;
	activeToken?: number;
	propertyById: Map<number, schema.RecommendationPropertySummary>;
}) {
	const map = useMap();

	useEffect(() => {
		if (typeof activeId !== "number") return;

		const property = propertyById.get(activeId);
		if (!property) return;

		map.panTo(new kakao.maps.LatLng(property.address.latitude, property.address.longitude));
	}, [map, activeId, activeToken, propertyById]);

	return null;
}

/**
 * 부동산 속성의 상세 정보를 표시하는 공통 컴포넌트
 * 마커 팝업과 다이얼로그에서 공유됨
 */
interface PropertyDetailViewProps {
	infrastructureTypes?: Set<string>,
	property: schema.RecommendationPropertySummary | schema.RecommendationPropertyDetailOutput | undefined;
	isDetailed?: boolean;
	onClose?: () => void;
}

function PropertyDetailContent({
	property,
	infrastructureTypes,
	isDetailed = false,
}: Omit<PropertyDetailViewProps, 'onClose'>) {
	if (!property) return null;

	return (
		<>
			{/* 가격 정보 */}
			<div className={cn(
				"grid grid-cols-2 gap-2 bg-muted/40 rounded-xl p-2.5 text-xs",
				isDetailed && "gap-4 bg-muted/30 rounded-2xl p-4 border border-border/40"
			)}>
				<div className={isDetailed ? "flex flex-col gap-1" : ""}>
					<span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">매매가</span>
					<p className={cn(
						"font-extrabold text-primary",
						isDetailed ? "text-lg" : "text-sm mt-0.5"
					)}>
						{property.salePrice?.min ? formatPriceUnit(property.salePrice.min).join(" ") : "정보 없음"}
					</p>
				</div>
				<div className={cn("border-l border-border/60", isDetailed ? "flex flex-col gap-1 pl-4" : "pl-3")}>
					<span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">전세가</span>
					<p className={cn(
						"font-extrabold text-indigo-500",
						isDetailed ? "text-lg" : "text-sm mt-0.5"
					)}>
						{property.jeonsePrice?.min ? formatPriceUnit(property.jeonsePrice.min).join(" ") : "정보 없음"}
					</p>
				</div>
			</div>

			{/* 인프라 정보 */}
			{property.infrastructure && property.infrastructure.length > 0 && (
				<div className="flex flex-col gap-4">
					{isDetailed && (
						<h5 className="font-extrabold text-sm text-foreground/80 tracking-wide uppercase">📍 주변 인프라 상세 정보</h5>
					)}
					<div className={cn(
						isDetailed ? "flex flex-col gap-3" : "flex gap-1.5 flex-wrap"
					)}>
						{property.infrastructure.map((infra, idx) => {
							if (isDetailed && 'name' in infra && 'score' in infra) {
								const searches = [
									...(property.region?.name.split(" ").slice(0, 2) ?? []),
									(
										infra.label.includes("학교") ? "학교" :
											infra.label.includes("병원") ? "병원" :
												infra.label.includes("공원") ? "공원" :
													infra.label
									),
									infra.name,
								]

								const isActive = infrastructureTypes?.has(infra.type);

								return (
									<div
										key={idx}
										className={cn(
											"flex items-start gap-3.5 p-3.5 bg-secondary/40 border border-border/40 rounded-xl hover:bg-secondary/60 hover:shadow-xs transition-all duration-200",
											isActive ? "border-primary shadow" : "opacity-50",
										)}
									>
										<div className="flex items-center justify-center w-10 h-10 text-xl shrink-0">
											{infra.emoji}
										</div>
										<div className="flex-1 min-w-0 flex flex-col gap-1">
											<div className="flex items-center justify-between gap-2">
												<h6 className="font-bold text-sm text-foreground/90 truncate">
													<a
														rel="noopener noreferrer"
														href={`https://map.naver.com/p/search/${searches.join("+")}?searchType=place`}
														target="_blank"
														children={infra.name}
													/>
												</h6>
												<InfraTypeBadge
													{...infra}
													className="text-xs px-1.5 py-1"
												/>
											</div>
											<div className="flex items-center gap-3 text-xs text-muted-foreground">
												<span>거리: <strong className="text-foreground/80 font-bold">{infra.distance}m</strong></span>
												<span className="w-1 h-1 rounded-full bg-muted-foreground/40"/>
												<span>도보: <strong className="text-foreground/80 font-bold">{infra.walkingDuration}분</strong></span>
												<span className="w-1 h-1 rounded-full bg-muted-foreground/40"/>
												<span className="flex items-center gap-0.5">
													점수: <strong className="text-indigo-500 font-bold">{Math.round(infra.score)}점</strong>
												</span>
											</div>
										</div>
									</div>
								);
							} else {
								return (
									<InfraTypeBadge
										key={idx}
										{...infra}
										label={`${infra.distance}m`}
										className="text-xs"
									/>
								);
							}
						})}
					</div>
				</div>
			)}
		</>
	);
}

function MarkerInfo({
	onClose,
	...p
}:
	& schema.RecommendationPropertySummary
	& { onClose: () => void }
) {
	return (
		<div className="relative bottom-6 w-72 bg-card/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-4 text-foreground flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
			{/* 상단 헤더: 타이틀 & 점수 & 닫기버튼 */}
			<div className="flex justify-between items-start gap-2">
				<div className="flex flex-col gap-0.5">
					<h4 className="font-extrabold text-base tracking-tight leading-tight text-foreground/90 break-keep">
						{p.name}
					</h4>
					<div className="flex items-center gap-1 text-xs text-muted-foreground">
						<MapPin size={12} className="shrink-0"/>
						<span className="truncate">{p.address.landLot || p.address.roadName || p.region?.name}</span>
					</div>
				</div>
				<div className="flex items-center gap-1.5 shrink-0">
					{/* 점수 뱃지 */}
					<div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-linear-to-r from-indigo-500 to-violet-600 text-white shadow-sm">
						<Sparkles size={10} className="fill-white"/>
						<span>{Math.round(p.score)}점</span>
					</div>
					{/* 닫기 버튼 */}
					<button
						onClick={(e) => {
							e.stopPropagation();
							onClose();
						}}
						className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
						aria-label="닫기"
					>
						<X size={14}/>
					</button>
				</div>
			</div>

			{/* 상세 내용 */}
			<PropertyDetailContent property={p} isDetailed={false}/>
		</div>
	);
}

/**
 * 추천 결과를 지도에 표시하는 컴포넌트
 */
function RecommendationMap({
	// taskId,
	// requestData,
	properties,
	activeItem,
	onActiveChange,
}:
	& Pick<
		schema.RecommendationSummaryOutput,
		"taskId" | "requestData" | "properties"
	>
	& {
		activeItem?: ActivePropertyItem | null;
		onActiveChange: (propertyId: number | null) => void;
	}
) {
	useKakaoLoader({
		appkey: env.KAKAO_MAP_API_KEY,
	});

	const propertyMap = useMemo(
		() => new Map<number, schema.RecommendationPropertySummary>(
			properties?.map((x, idx) => [idx, x])
		),
		[properties],
	);

	const propertyById = useMemo(
		() => new Map<number, schema.RecommendationPropertySummary>(
			properties?.map((x) => [x.id, x])
		),
		[properties],
	);

	const points = useMemo<Array<{
		lat: number;
		lng: number;
	}>>(
		() => properties?.map(x => ({
			lat: x.address.latitude,
			lng: x.address.longitude,
		})) ?? [defaultPoint],
		[properties],
	);

	return (
		<KakaoMap
			center={points[0]}
			onClick={() => onActiveChange(null)}
			style={{
				width: "100%",
				height: "100%",
			}}
			level={3}
			className="*:nth-of-type-[2]:left-auto! *:nth-of-type-[2]:right-0!"
		>
			{points.map((point, idx) => {
				const currentProperty = propertyMap.get(idx);
				const isActive = activeItem?.id === currentProperty?.id;

				return (
					<div key={`marker-group__${point.lat}-${point.lng}`}>
						<MapMarker
							position={point}
							onClick={() => {
								if (currentProperty?.id === undefined) return;
								onActiveChange(currentProperty.id);
							}}
						/>
						{isActive && currentProperty && (
							<CustomOverlayMap
								position={point}
								yAnchor={1.15}
								clickable={true}
							>
								<MarkerInfo
									{...currentProperty}
									onClose={() => onActiveChange(null)}
								/>
							</CustomOverlayMap>
						)}
					</div>
				);
			})}
			<AutoBoundsSetter
				points={points}
				enabled={false}
			/>
			<ActiveMarkerPanTo
				activeId={activeItem?.id}
				activeToken={activeItem?.clickedAt}
				propertyById={propertyById}
			/>
		</KakaoMap>
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
		onActiveChange: (id: number) => void;
		onDetailClick: (id: number) => void;
	}
)) {
	return (
		<article
			id={`property-${p.id}`}
			className={cn(
				"flex flex-col gap-1.5",
				"border rounded-md shadow-md p-4",
				p.active && "border-primary shadow-lg shadow-primary/15",
				p.isMobile && "h-64 w-56",
			)}
			onClick={() => p.onActiveChange(p.id)}
		>
			<Trophy rank={p.rank}/>
			<ScoreGauge score={p.score}/>
			<p className="font-bold">{p.name}</p>
			<p className="text-xs text-muted-foreground">{p.region?.name}</p>
			{p.isMobile && <>
				{p.salePrice?.min && <PriceBox label="매매" price={p.salePrice.min}/>}
				{p.jeonsePrice?.min && <PriceBox label="전세" price={p.jeonsePrice.min}/>}
			</>}
			<div className="flex gap-2 mt-auto">
				{p.infrastructure.map(infra => (
					<InfraTypeBadge
						key={infra.type}
						type={infra.type}
						label={`${infra.distance}m`}
						className="text-xs px-1.5 py-1 opacity-80"
					/>
				))}
			</div>
			<Button
				type="button"
				className="mt-1 font-bold"
				children="상세보기"
				onClick={(e) => {
					e.stopPropagation();
					p.onDetailClick(p.id);
				}}
			/>
		</article>
	);
}

interface ActivePropertyItem {
	id: number | null;
	source: string;
	clickedAt: number;
}

function RecommendationItems({
	items,
	activeItem,
	className,
	...props
}: {
	isMobile: boolean;
	items: PropertySummaryWithRank[];
	activeItem?: ActivePropertyItem | null;
	onActiveChange: (id: number) => void;
	onDetailClick: (id: number) => void;
	hasSalePrice: boolean;
	hasJeonsePrice: boolean;
	className?: string;
}) {
	const refs = useRef<Map<number, HTMLLIElement>>(new Map());

	useEffect(() => {
		if (typeof activeItem?.id === "number") {
			const activeDom = refs.current.get(activeItem.id);
			activeDom?.scrollIntoView({ behavior: "smooth", block: "nearest" });
			activeDom?.querySelector("button")?.focus();
		}
	}, [activeItem]);

	return (
		<ol
			className={cn(
				"p-4 h-full flex gap-4",
				!props.isMobile && "flex-col",
				props.isMobile && "justify-center-safe",
				className,
			)}
		>
			{items.map((item) => (
				<li
					key={item.id}
					ref={elem => {
						if (elem) refs.current.set(item.id, elem);
						else refs.current.delete(item.id);
					}}
				>
					<PropertySummaryBox active={activeItem?.id === item.id} {...props} {...item}/>
				</li>
			))}
		</ol>
	);
}

function RecommendationSheet({
	className,
	children,
	...props
}:
	& React.ComponentProps<typeof RecommendationItems>
	& {
		children?: React.ReactNode;
	}
) {
	const ref = useRef<HTMLDivElement>(null);
	const [height, setHeight] = useState<number>(0);

	useEffect(() => {
		if (!ref.current) return;

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				setHeight(entry.contentRect.height);
			}
		});

		observer.observe(ref.current);
		return () => {
			observer.disconnect();
		};
	}, []);

	return (
		<div id={sheetId} className={cn("z-10 bg-secondary shadow-md overflow-hidden", className)}>
			<div
				ref={ref}
				className="w-full"
				children={children}
			/>
			{
				props.isMobile ? (
					<RecommendationItems
						{...props}
					/>
				) : (
					<ScrollArea
						className="whitespace-nowrap h-[calc(100svh-var(--height,0px))]"
						style={{
							"--height": `${height}px`,
						} as React.CSSProperties}
					>
						<RecommendationItems
							{...props}
						/>
					</ScrollArea>
				)
			}
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

	const isMobile = useIsMobile();
	// const isMobile = true
	const location = useLocation() as Location<LocationState | undefined>;
	const [searchParams] = useSearchParams();
	const taskId = useMemo(() => searchParams.get("task_id") ?? "", [searchParams]);
	const [activePropertyItem, setActivePropertyItem] = useState<ActivePropertyItem | null>(null);
	const [recState, setRecState] = useState<RecommendationRequestState>("is_pending");
	const [recommendation, setRecommendation] = useState<null | schema.RecommendationSummaryOutput>(null);
	const [detailOpen, setDetailOpen] = useState(false);
	const [detailLoading, setDetailLoading] = useState(false);
	const [detailData, setDetailData] = useState<schema.RecommendationPropertyDetailOutput | null>(null);
	const [detailError, setDetailError] = useState<string | null>(null);
	const [selectedProperty, setSelectedProperty] = useState<schema.RecommendationPropertySummary | null>(null);

	const recName = recommendation?.requestData.name || location.state?.name || taskId;
	const hasSalePrice = !!recommendation?.requestData.salePrice;
	const hasJeonsePrice = !!recommendation?.requestData.jeonsePrice;

	const handlePropertyClick = (id: number | null, source: string) => {
		if (id === null) {
			setActivePropertyItem(null);
		} else {
			setActivePropertyItem({ id, source, clickedAt: Date.now() });
		}
	};

	const handleViewDetail = async (propertyId: number) => {
		if (!recommendation) return;

		const prop = recommendation.properties?.find(p => p.id === propertyId);
		setSelectedProperty(prop ?? null);

		setDetailOpen(true);
		setDetailLoading(true);
		setDetailError(null);
		setDetailData(null);
		handlePropertyClick(propertyId, "detail");

		try {
			const reqData = recommendation.requestData;
			const apiInput: schema.RecommendationCreateInput = {
				name: reqData.name ?? undefined,
				regionId: reqData.region?.id,
				infrastructureTypes: reqData.infrastructureTypes.map(x => x.type),
				highSchoolIds: reqData.highSchools?.map(x => x.id) ?? [],
				schoolDistrictTypes: reqData.schoolDistricts?.map(x => x.type) ?? [],
				salePrice: reqData.salePrice ?? undefined,
				jeonsePrice: reqData.jeonsePrice ?? undefined,
			};

			const detail = await getRecommendationProperty(taskId, propertyId, apiInput);
			setDetailData(detail);
		} catch (e) {
			console.error(e);
			setDetailError("상세 정보를 불러오는 데 실패했습니다.");
		} finally {
			setDetailLoading(false);
		}
	};

	const infraInfos = useMemo(
		() => recommendation?.requestData.infrastructureTypes.map((infra, idx) => ({
			...infra,
			order: idx + 1,
		})) ?? [],
		[recommendation?.requestData.infrastructureTypes],
	);

	const sortedProperties = useMemo(
		()  => recommendation?.properties?.map((x, idx) => ({ ...x, rank: idx + 1 })).toSorted((a, b) => {
			if (sortBy === "score") {
				return b.score - a.score;
			}

			return (a[sortBy]?.min ?? Infinity) - (b[sortBy]?.min ?? Infinity);
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
					activeItem={activePropertyItem}
					hasSalePrice={hasSalePrice}
					hasJeonsePrice={hasJeonsePrice}
					className="w-80 lg:w-96 rounded-r-4xl"
					onActiveChange={(id: number) => {
						handlePropertyClick(id, "sheet")
					}}
					onDetailClick={handleViewDetail}
				>
					<Header heading="추천 결과 조회"/>
					<Tooltip
						type="button"
						trigger={recName}
						children={recName}
						className="w-full font-bold text-center overflow-hidden text-ellipsis"
						tabIndex={-1}
					/>
					<div
						className={cn(
							"border-b pb-4 grid gap-2 mt-4 px-4 grid-cols-3",
							infraInfos.length === 1 && "grid-cols-1",
							[2, 4].includes(infraInfos.length) && "grid-cols-2",
						)}
					>
						{infraInfos.map(infra => (
							<InfraTypeBadge key={infra.type} {...infra}/>
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
							<RecommendationMap
								{...recommendation}
								activeItem={activePropertyItem}
								onActiveChange={id => {
									handlePropertyClick(id, "marker");
								}}
							/>
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
							className="font-bold text-lg p-2 bg-card text-primary"
							children={`추천 단지 ${sortedProperties.length || 0}곳 보기`}
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
									activeItem={activePropertyItem}
									hasSalePrice={hasSalePrice}
									hasJeonsePrice={hasJeonsePrice}
									className="rounded-t-[35px]"
									onActiveChange={(id: number) => {
										handlePropertyClick(id, "sheet")
									}}
									onDetailClick={handleViewDetail}
								/>
								<ScrollBar orientation="horizontal"/>
							</ScrollArea>
						</DrawerContent>
					</Drawer>
				)}
			</div>

			{/* 상세 보기 Dialog */}
			<Dialog open={detailOpen} onOpenChange={setDetailOpen}>
				<DialogContent>
					{(() => {
						const p = detailData || selectedProperty;
						return (
							<>
								<DialogHeader>
									<div className="flex items-center justify-between gap-4 mr-6">
										<DialogTitle className="text-xl font-extrabold tracking-tight text-foreground/90 break-keep">
											{p?.name}
										</DialogTitle>
										<div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-extrabold bg-linear-to-r from-indigo-500 to-violet-600 text-white shadow-md shrink-0">
											<Sparkles size={12} className="fill-white"/>
											<span>{p?.score === undefined ? "???" : Math.round(p.score)}점</span>
										</div>
									</div>
									<DialogDescription className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
										<MapPin size={14} className="shrink-0"/>
										<span className="break-all">
											{p?.address.roadName || p?.address.landLot || p?.region?.name}
										</span>
									</DialogDescription>
								</DialogHeader>

								{detailLoading ? (
									<div className="flex flex-col items-center justify-center py-12 gap-3">
										<LoaderIcon className="animate-spin text-primary" size={40}/>
										<p className="text-sm font-bold text-muted-foreground">상세 정보를 불러오고 있어요...</p>
									</div>
								) : detailError ? (
									<div className="flex flex-col items-center justify-center py-12 gap-3 text-destructive">
										<SearchAlertIcon size={40}/>
										<p className="text-sm font-bold">{detailError}</p>
									</div>
								) : detailData ? (
									<div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4 flex flex-col gap-6">
										<PropertyDetailContent property={detailData} isDetailed={true} infrastructureTypes={new Set(infraInfos.map(x => x.type))}/>
									</div>
								) : null}

								<DialogFooter>
									{detailData ? (
										<DialogClose asChild>
											<Button variant="default" className="font-bold">
												네이버 부동산으로 이동
											</Button>
										</DialogClose>
									) : (
										<DialogClose asChild>
											<Button variant="secondary" className="font-bold">
												닫기
											</Button>
										</DialogClose>
									)}
								</DialogFooter>
							</>
						);
					})()}
				</DialogContent>
			</Dialog>
		</div>
	);
}
