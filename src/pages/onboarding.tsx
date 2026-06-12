import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";

import { cn } from "@/lib/utils";
import { convertToNumber } from "@/lib/price-unit";
import { PRICE_UNITS } from "@/shared/enum";
import type { PriceUnit } from "@/shared/enum";
import { ROUTES } from "@/shared/routes";
import * as schema from "@/shared/schema";
import { createRecommendation } from "@/lib/api";
import { useRegionsStore, useInfraTypesStore, useSchoolDistrictTypesStore, useHighSchoolsStore } from "@/stores/items";
import { filterList } from "@/lib/filter-string-list";
import {
	Combobox,
	ComboboxChips,
	ComboboxChip,
	ComboboxChipsInput,
	ComboboxContent,
	ComboboxList,
	ComboboxItem,
	ComboboxEmpty,
	ComboboxValue,
	useComboboxAnchor,
} from "@/components/ui/combobox";
import { getRequestErrorMessage } from "@/lib/request-error";
// import { useAuthStore } from "@/stores/auth";
import { getInfraColor } from "@/shared/common";
import {
	useOnboardingStore,
	type OnboardingPriceKey,
	type OnboardingPriceSelection,
	type OnboardingPriceState,
	type OnboardingPayload,
} from "@/stores/onboarding";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ErrorAlert, ErrorLine } from "@/components/errors";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import * as form from "@/components/form";
import { InfraTypeBadge } from "@/components/infra-type-badge";
import { SchoolDistrictBox } from "@/components/school-district-box";



/**
 * 가격 슬라이드 옵션 기본값
 */
const DEFAULT_PRICE_SLIDER_OPTIONS: PriceSliderOptions = {
	min: 0,
	max: 9999,
	step: 0.1,
	unit: "억 원",
};

/**
 * 가격 정보
 */
const PRICE_ITEMS: readonly PriceItem[] = [
	{
		key: "sale",
		icon: "🏠",
		label: "매매",
		slider: DEFAULT_PRICE_SLIDER_OPTIONS,
	},
	{
		key: "jeonse",
		icon: "💸",
		label: "전세",
		slider: DEFAULT_PRICE_SLIDER_OPTIONS,
	},
];

/**
 * 온보딩 섹션별 구성을 위한 구성 객체
 */
const SECTION_OPTIONS: SectionOptions[] = [
	{
		heading: "선호 동네",
		description: "추천 받고 싶은 동네를 선택할 수 있어요!",
		renderOverview: ctx => (
			<form.RegionField
				name="overviewRegion"
				required={false}
				value={ctx.overviewRegion.name}
				className="group-data-[invalid=true]:*:data-[slot=input-group]:border-destructive"
				tabIndex={-1}
				readOnly
			/>
		),
		renderChildren: ctx => (
			<div>
				<form.RegionField
					name="region"
					required={false}
					value={ctx.selectedRegion.name}
					onChange={ctx.handleRegionInputChange}
					onClear={ctx.handleRegionInputClear}
					defaultValue={undefined}
				/>
				<form.RegionListPanel
					className="mt-2"
					items={ctx.filteredRegionList}
					onSelect={ctx.handleRegionItemClick}
					style={{
						"--region-listbox-height": "230px",
					} as React.CSSProperties}
				/>
			</div>
		),
	},
	{
		required: true,
		heading: "🏗️ 생활 인프라 (1개 이상)",
		description: "선택한 순서대로 우선순위가 정해져요!",
		validate: ctx => (ctx.numberOfSelectedInfra ? undefined : "인프라를 1개 이상 선택해 주세요!"),
		renderOverview: ctx => {
			const selectedHighSchoolNames = ctx.committedHighSchoolIds
				.map(id => ctx.highSchoolsMap.get(Number(id))?.name)
				.filter(Boolean) as string[];

			const selectedDistrictLabels = ctx.committedSchoolDistricts
				.map(type => ctx.schoolDistrictTypesMap.get(type)?.label)
				.filter(Boolean) as string[];

			return (
				<div className={cn(
					"rounded-2xl border bg-secondary p-4 shadow-md space-y-4 transition-colors",
					"group-data-[required=true]:border-primary group-data-[invalid=true]:border-destructive!"
				)}>
					<div className="space-y-2">
						<h3 className="text-sm font-bold">인프라 우선순위</h3>
						<ol className="rounded-xl flex flex-wrap gap-2 justify-start-safe">
							{ctx.infraStateItems.filter(x => x.order).sort((a, b) => a.order! - b.order!).map((props) => (
								<li key={props.order}>
									<InfraTypeBadge {...props}/>
								</li>
							))}
							{!ctx.numberOfSelectedInfra && (
								<li
									className="text-sm text-muted-foreground"
									children="아직 인프라를 선택하지 않았어요!"
								/>
							)}
						</ol>
					</div>

					<div className="border-t pt-3 space-y-2">
						<div className="flex flex-wrap gap-4 text-xs">
							<div>
								<span className="font-semibold text-muted-foreground mr-2">학군 유형:</span>
								{selectedDistrictLabels.length > 0 ? (
									<span className="font-medium">
										{selectedDistrictLabels.join(", ")}
									</span>
								) : (
									<span className="text-muted-foreground">선택 안 함</span>
								)}
							</div>
							<div>
								<span className="font-semibold text-muted-foreground mr-2">선호 고등학교:</span>
								{selectedHighSchoolNames.length > 0 ? (
									<span className="font-medium text-wrap break-all">
										{selectedHighSchoolNames.slice(0, 3).join(", ")}
										{selectedHighSchoolNames.length > 3 && ` 외 ${selectedHighSchoolNames.length - 3}개`}
									</span>
								) : (
									<span className="text-muted-foreground">선택 안 함</span>
								)}
							</div>
						</div>
					</div>
				</div>
			);
		},
		renderChildren: ctx => {
			const isSchoolDistrictEnabled = ctx.selectedInfraTypes.some(infra =>
				["ELEMENTARY_SCHOOL", "MIDDLE_SCHOOL", "HIGH_SCHOOL"].includes(infra.type)
			);
			const isHighSchoolEnabled = ctx.selectedInfraTypes.some(infra =>
				infra.type === "HIGH_SCHOOL"
			);

			return (
				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-3">
						<Button
							type="button"
							variant="secondary"
							disabled={!isSchoolDistrictEnabled}
							onClick={ctx.openSchoolDistrictDialog}
							className="h-11 rounded-xl font-semibold border-input shadow-sm flex items-center justify-center gap-2"
						>
							<span>🎓 학군 유형 설정</span>
							{ctx.committedSchoolDistricts.length > 0 && (
								<span className="bg-primary text-primary-foreground text-[10px] size-5 rounded-full flex items-center justify-center font-bold">
									{ctx.committedSchoolDistricts.length}
								</span>
							)}
						</Button>
						<Button
							type="button"
							variant="secondary"
							disabled={!isHighSchoolEnabled}
							onClick={ctx.openHighSchoolDialog}
							className="h-11 rounded-xl font-semibold border-input shadow-sm flex items-center justify-center gap-2"
						>
							<span>🏫 선호 고등학교 설정</span>
							{ctx.committedHighSchoolIds.length > 0 && (
								<span className="bg-primary text-primary-foreground text-[10px] size-5 rounded-full flex items-center justify-center font-bold">
									{ctx.committedHighSchoolIds.length}
								</span>
							)}
						</Button>
					</div>

					<div className="grid grid-cols-2 gap-4">
						{ctx.infraStateItems.map(infra => (
							<Card
								key={infra.type}
								type={infra.type}
								emoji={infra.emoji}
								label={infra.label}
								description={infra.description}
								color={infra.color}
								order={infra.order}
								checked={!!infra.order}
								onCheckChange={checked => ctx.handleCardToggle(infra.label, checked)}
							/>
						))}
					</div>

					<Dialog open={ctx.isSchoolDistrictOpen} onOpenChange={ctx.setSchoolDistrictOpen}>
						<DialogContent className="w-md sm:max-w-md ">
							<DialogHeader>
								<DialogTitle>🎓 학군 유형 설정</DialogTitle>
								<DialogDescription>
									원하는 학군 유형을 선택할 수 있어요!<br/>
									(다중 선택이 가능하며, 우선순위가 적용되지 않아요)
								</DialogDescription>
							</DialogHeader>
							<div className="grid grid-cols-3 gap-3 my-6">
								{ctx.schoolDistrictTypeItems.map((district) => {
									const isSelected = ctx.selectedSchoolDistricts.includes(district.type);
									return (
										<SchoolDistrictBox
											key={district.type}
											item={district}
											onClick={() => ctx.handleSchoolDistrictToggle(district.type)}
											isSelected={isSelected}
										/>
									);
								})}
							</div>
							<DialogFooter>
								<Button onClick={() => ctx.handleSchoolDistrictConfirm()} className="rounded-xl px-6">확인</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>

					<Dialog open={ctx.isHighSchoolOpen} onOpenChange={ctx.setHighSchoolOpen}>
						<DialogContent className="max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto">
							<DialogHeader>
								<DialogTitle>🏫 선호 고등학교 설정</DialogTitle>
								<DialogDescription>
									관심 있는 고등학교를 검색하여 추가해보세요!<br/>
									(다중 선택이 가능하며, 우선순위가 적용되지 않아요)
								</DialogDescription>
							</DialogHeader>
							<SchoolDistrictSelector
								highSchoolItems={ctx.highSchoolItems}
								selectedHighSchoolIds={ctx.selectedHighSchoolIds}
								onHighSchoolsChange={ctx.handleHighSchoolsChange}
							/>
							<DialogFooter>
								<Button onClick={() => ctx.handleHighSchoolConfirm()} className="rounded-xl px-6">확인</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			);
		},
	},
	{
		heading: "💰 가격 조건 (선택 사항)",
		description: "가격 조건을 설정하면 해당 범위의 매물만 표시돼요!",
		renderOverview: ({ priceItems }) => (
			<div className="rounded-2xl border bg-secondary p-4 shadow-md space-y-3">
				<h3 className="text-sm font-bold">가격 조건</h3>
				<ul className="space-y-1 text-sm">
					{priceItems.map(({ icon, label, enabled, range: [start, end], unit }) => (
						<li key={label} className={cn(!enabled && "opacity-40")}>
							{icon} {label}: {enabled ? `${start}${unit} - ${end}${unit}` : "선택 안 함"}
						</li>
					))}
				</ul>
			</div>
		),
		renderChildren: ctx => (
			<div className="rounded-2xl border bg-secondary p-4 shadow-md space-y-3">
				{ctx.priceItems.map(item => (
					<div key={item.key} className="not-last:border-b">
						<div className="flex justify-between items-center-safe">
							<Label htmlFor={item.key}>{item.icon} {item.label}</Label>
							<Switch id={item.key} checked={item.enabled} onCheckedChange={item.setEnabled}/>
						</div>
						<div>
							<div className="flex flex-wrap-reverse justify-between items-center-safe pt-2 pb-1.5 gap-3">
								<div className="flex flex-wrap items-center-safe gap-2">
									<div className="flex items-center-safe gap-1">
										<Label htmlFor={`${item.key}-min`} className="text-xs text-muted-foreground">최소</Label>
										<Input
											id={`${item.key}-min`}
											type="number"
											inputMode="numeric"
											className="h-8 w-22 rounded-md px-2"
											min={item.slider.min}
											max={item.slider.max}
											step={item.slider.step}
											value={item.range[0]}
											disabled={!item.enabled}
											aria-disabled={!item.enabled}
											aria-label={`${item.label} 최소 금액`}
											onChange={event => {
												const parsed = Number(event.target.value);
												if (Number.isNaN(parsed)) return;

												const nextMin = clampNumber(parsed, item.slider.min, item.slider.max);
												const nextMax = Math.max(nextMin, item.range[1]);
												item.setRange([nextMin, nextMax]);
											}}
										/>
									</div>
									<div className="flex items-center-safe gap-1">
										<Label htmlFor={`${item.key}-max`} className="text-xs text-muted-foreground">최대</Label>
										<Input
											id={`${item.key}-max`}
											type="number"
											inputMode="numeric"
											className="h-8 w-22 rounded-md px-2"
											min={item.slider.min}
											max={item.slider.max}
											step={item.slider.step}
											value={item.range[1]}
											disabled={!item.enabled}
											aria-disabled={!item.enabled}
											aria-label={`${item.label} 최대 금액`}
											onChange={event => {
												const parsed = Number(event.target.value);
												if (Number.isNaN(parsed)) return;

												const nextMax = clampNumber(parsed, item.slider.min, item.slider.max);
												const nextMin = Math.min(item.range[0], nextMax);
												item.setRange([nextMin, nextMax]);
											}}
										/>
									</div>
								</div>
								<div className="flex items-center-safe gap-1">
									<Label asChild className="text-xs text-muted-foreground"><span>단위</span></Label>
									<Select value={item.unit} onValueChange={value => item.setUnit(value as PriceUnit)}>
										<SelectTrigger
											disabled={!item.enabled}
											aria-disabled={!item.enabled}
											className="h-8 w-24"
											aria-label={`${item.label} 가격 단위 선택`}
										>
											<SelectValue placeholder="단위 선택"/>
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												<SelectLabel>단위</SelectLabel>
												{PRICE_UNITS.map(unit => (
													<SelectItem key={unit} value={unit}>{unit}</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
								</div>
							</div>
							<Slider
								className="w-full py-2"
								min={item.slider.min}
								max={item.slider.max}
								step={item.slider.step}
								value={item.range}
								disabled={!item.enabled}
								aria-disabled={!item.enabled}
								aria-label={`${item.label} 가격 범위`}
								onValueChange={value => {
									if (value.length !== 2) return;
									item.setRange(value as PriceRange);
								}}
							/>
						</div>
					</div>
				))}
			</div>
		),
	},
];



/**
 * 인프라 백엔드에서 받아온 정보와 공통 정보 스키마를 합친 타입
 */
interface InfraInfoItem extends schema.InfraTypeItem {
	order?: number;
	color?: string;
}

/**
 * 가격 조건 컨트롤용 슬라이더 옵션
 */
interface PriceSliderOptions extends Pick<OnboardingPriceSelection, "unit"> {
	min: number;
	max: number;
	step: number;
}

/**
 * 가격 정보 타입
 */
interface PriceItem {
	key: OnboardingPriceKey;
	icon: string;
	label: string;
	slider: PriceSliderOptions;
}

/**
 * slider min/max 값
 */
type PriceRange = [number, number];

/**
 * 온보딩 폼 상태 타입
 */
interface OnboardingFormState extends Required<OnboardingPayload> {
}

/**
 * 편집 화면을 overview를 통해 들어갔는지 판별하기 위한 라우터 상태 타입
 */
interface OnboardingPPageLocationState {
	editingFromOnboarding: true;
}

/**
 * 섹션 렌더링에 필요한 컨텍스트 타입
 */
interface SectionRenderContext {
	selectedRegion: schema.RegionItem;
	overviewRegion: schema.RegionItem;
	filteredRegionList: schema.RegionItem[];
	infraStateItems: InfraInfoItem[];
	numberOfSelectedInfra: number;
	handleRegionInputChange: React.ChangeEventHandler<HTMLInputElement>;
	handleRegionInputClear: Exclude<form.FieldProps["onClear"], undefined>;
	handleRegionItemClick: form.RegionListPanelProps["onSelect"];
	handleCardToggle: (typeName: string, checked: boolean) => void;
	priceItems: Array<PriceItem & OnboardingPriceSelection & {
		setEnabled: (checked: boolean) => void;
		setRange: (range: PriceRange) => void;
		setUnit: (unit: PriceUnit) => void;
	}>;
	highSchoolItems: schema.HighSchoolItem[];
	highSchoolsMap: ReadonlyMap<number, schema.HighSchoolItem>;
	selectedHighSchoolIds: string[];
	committedHighSchoolIds: string[];
	handleHighSchoolsChange: (ids: string[]) => void;
	handleHighSchoolConfirm: () => void;
	schoolDistrictTypeItems: schema.SchoolDistrictTypeItem[];
	schoolDistrictTypesMap: ReadonlyMap<string, schema.SchoolDistrictTypeItem>;
	selectedSchoolDistricts: string[];
	committedSchoolDistricts: string[];
	handleSchoolDistrictToggle: (type: string) => void;
	handleSchoolDistrictConfirm: () => void;
	selectedInfraTypes: schema.InfraTypeItem[];
	isSchoolDistrictOpen: boolean;
	setSchoolDistrictOpen: (open: boolean) => void;
	openSchoolDistrictDialog: () => void;
	isHighSchoolOpen: boolean;
	setHighSchoolOpen: (open: boolean) => void;
	openHighSchoolDialog: () => void;
}

/**
 * 온보딩 섹션 구성 옵션 타입
 */
interface SectionOptions {
	heading: string;
	description: string;
	required?: boolean;
	validate?: (ctx: SectionRenderContext) => string | undefined;
	renderOverview: (ctx: SectionRenderContext) => React.ReactNode;
	renderChildren: (ctx: SectionRenderContext) => React.ReactNode;
}



/**
 * @returns 가격 상태 기본값
 */
const createInitialOnboardingPriceState = (): OnboardingPriceState => ({
	sale: {
		enabled: false,
		range: [DEFAULT_PRICE_SLIDER_OPTIONS.min, DEFAULT_PRICE_SLIDER_OPTIONS.max],
		unit: DEFAULT_PRICE_SLIDER_OPTIONS.unit,
	},
	jeonse: {
		enabled: false,
		range: [DEFAULT_PRICE_SLIDER_OPTIONS.min, DEFAULT_PRICE_SLIDER_OPTIONS.max],
		unit: DEFAULT_PRICE_SLIDER_OPTIONS.unit,
	},
});

function priceStateToRequestSchema(state: OnboardingPriceSelection) {
	if (!state.enabled) return null;
	return {
		min: convertToNumber(`${state.range[0]}${state.unit}`),
		max: convertToNumber(`${state.range[1]}${state.unit}`),
	};
}

/**
 * 숫자를 지정된 구간으로 보정하는 함수
 */
function clampNumber(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(value, max));
}

/**
 * 가격 상태를 깊은 복사하여 새로운 객체로 반환하는 함수
 */
function clonePriceState(source?: OnboardingPriceState): OnboardingPriceState {
	const state = source ?? createInitialOnboardingPriceState();

	return {
		sale: {
			...state.sale,
			range: [...state.sale.range] as PriceRange,
		},
		jeonse: {
			...state.jeonse,
			range: [...state.jeonse.range] as PriceRange,
		},
	};
}

/**
 * 온보딩 폼 상태를 안전하게 생성하는 함수
 */
function createOnboardingFormState(
	region?: schema.RegionItem,
	infraTypes?: schema.InfraTypeItem[],
	priceState?: OnboardingPriceState,
	highSchools?: string[],
	schoolDistricts?: string[],
): OnboardingFormState {
	return {
		region: region ?? { id: 0, name: "" },
		infraTypes: [...(infraTypes ?? [])],
		priceState: clonePriceState(priceState),
		highSchools: [...(highSchools ?? [])],
		schoolDistricts: [...(schoolDistricts ?? [])],
	};
}

/**
 * 검색 파라미터에서 현재 편집 섹션 인덱스를 파싱하는 함수
 *
 * @returns 유효한 섹션 인덱스, 없거나 잘못된 경우 -1
 */
function parseSectionFromSearchParam(value: string | null): number {
	if (value === null) return -1;

	const parsed = Number(value);
	if (!Number.isInteger(parsed)) return -1;

	if (parsed < 1 || parsed > SECTION_OPTIONS.length) return -1;

	return parsed - 1;
}

/**
 * 편집 화면을 overview를 통해 들어갔는지 판별하는 타입 가드 함수
 *
 * @param state location.state
 */
function isOnboardingLocationState(state: unknown): state is OnboardingPPageLocationState {
	return !!state
		&& typeof state === "object"
		&& "editingFromOnboarding" in state
		&& state.editingFromOnboarding === true;
}



/**
 * 인프라 카드 컴포넌트 props 타입
 */
interface CardProps extends InfraInfoItem {
	checked: boolean;
	onCheckChange: (check: boolean) => void;
}

/**
 * 인프라 선택 카드 컴포넌트
 */
function Card({
	type,
	label,
	emoji,
	description,
	order,
	checked,
	onCheckChange,
}: CardProps) {
	const color = getInfraColor(type);

	return (
		<button
			type="button"
			role="checkbox"
			aria-checked={checked}
			aria-label={label}
			onClick={() => onCheckChange(!checked)}
			className={cn(
				"relative transition-colors border-2 rounded-2xl shadow-md",
				"p-4 space-y-1 text-left",
				checked ? "bg-(--c)/5 border-(--c)/80" : "bg-secondary border-foreground/10 hover:bg-muted",
			)}
			style={{ "--c": color } as React.CSSProperties}
		>
			<div
				className="empty:hidden absolute top-2 right-2 bg-(--c)/80 size-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
				children={order}
			/>
			<div className="text-3xl">{emoji}</div>
			<h3 className="font-semibold">{label}</h3>
			<p className="text-sm text-muted-foreground">{description}</p>
		</button>
	);
}



/**
 * 온보딩 페이지 컴포넌트
 */
export function OnboardingPage() {
	const formId = "onboarding-form";
	// const { regionName: defaultRegionName } = useAuthStore();
	const regionsStore = useRegionsStore();
	const infraTypesStore = useInfraTypesStore();
	const schoolDistrictTypesStore = useSchoolDistrictTypesStore();
	const highSchoolsStore = useHighSchoolsStore();

	const regionItems = regionsStore.items;
	const regionMap = regionsStore.getMap("name");
	const infraTypesItems = infraTypesStore.items;
	const infraTypesMap = infraTypesStore.getMap("label");
	const schoolDistrictTypeItems = schoolDistrictTypesStore.items;
	const schoolDistrictTypesMap = schoolDistrictTypesStore.getMap("type");
	const highSchoolItems = highSchoolsStore.items;
	const highSchoolsMap = highSchoolsStore.getMap("id");
	const {
		region: storedRegion = undefined,
		infraTypes: storedInfraTypes = [],
		priceState: storedPriceState = createInitialOnboardingPriceState(),
		highSchools: storedHighSchools = [],
		schoolDistricts: storedSchoolDistricts = [],
		set: setOnboarding,
		reset: resetOnboarding,
	} = useOnboardingStore();

	/**
	 * 편집 종료 후 포커스를 되돌릴 섹션 인덱스 ref
	 */
	const pendingFocusSectionRef = useRef<number | null>(null);

	/**
	 * overview 섹션의 수정 버튼 ref 목록
	 */
	const overviewEditButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);

	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams] = useSearchParams();
	const [overviewErrorMessages, setOverviewErrorMessages] = useState<string[]>([]);
	const [editorErrorMessages, setEditorErrorMessages] = useState<string[]>([]);
	const [requestErrorMessage, setRequestErrorMessage] = useState("");

	const [committedState, setCommittedState] = useState<OnboardingFormState>(createOnboardingFormState(
		storedRegion,
		storedInfraTypes,
		storedPriceState,
		storedHighSchools,
		storedSchoolDistricts,
	));
	const [draftState, setDraftState] = useState<OnboardingFormState>(createOnboardingFormState(
		storedRegion,
		storedInfraTypes,
		storedPriceState,
		storedHighSchools,
		storedSchoolDistricts,
	));

	if (
		storedRegion
		&& (
			committedState.region?.id !== storedRegion.id
			|| committedState.infraTypes.length !== storedInfraTypes.length
			|| committedState.highSchools.length !== storedHighSchools.length
			|| committedState.schoolDistricts.length !== storedSchoolDistricts.length
		)
	) {
		const nextState = createOnboardingFormState(
			storedRegion,
			storedInfraTypes,
			storedPriceState,
			storedHighSchools,
			storedSchoolDistricts,
		);
		setCommittedState(nextState);
		setDraftState(createOnboardingFormState(
			nextState.region,
			nextState.infraTypes,
			nextState.priceState,
			nextState.highSchools,
			nextState.schoolDistricts,
		));
	}

	useEffect(() => {
		regionsStore.fetch();
	}, [regionsStore]);

	useEffect(() => {
		infraTypesStore.fetch();
	}, [infraTypesStore]);

	useEffect(() => {
		schoolDistrictTypesStore.fetch();
	}, [schoolDistrictTypesStore]);

	useEffect(() => {
		highSchoolsStore.fetch();
	}, [highSchoolsStore]);

	const getRegionItem = useCallback(
		(name: string) => regionMap.get(name) ?? { id: 0, name },
		[regionMap],
	);

	const currSection = useMemo(
		() => parseSectionFromSearchParam(searchParams.get("edit")),
		[searchParams],
	);

	const isEditing = currSection >= 0;
	const selectedRegion = isEditing ? draftState.region : committedState.region;
	const selectedInfraTypes = isEditing ? draftState.infraTypes : committedState.infraTypes;
	const selectedPriceState = isEditing ? draftState.priceState : committedState.priceState;

	const openEditor = useCallback((nextSection: number) => {
		const nextParams = new URLSearchParams(searchParams);
		nextParams.set("edit", String(nextSection + 1));

		navigate(
			{
				pathname: location.pathname,
				search: `?${nextParams.toString()}`,
			},
			{
				state: { editingFromOnboarding: true } satisfies OnboardingPPageLocationState,
			},
		);
	}, [location.pathname, navigate, searchParams]);

	const closeEditor = useCallback(() => {
		if (isOnboardingLocationState(location.state)) {
			navigate(-1);
			return;
		}

		const nextParams = new URLSearchParams(searchParams);
		nextParams.delete("edit");

		navigate(
			{
				pathname: location.pathname,
				search: nextParams.toString() ? `?${nextParams.toString()}` : "",
			},
			{ replace: true },
		);
	}, [location.pathname, location.state, navigate, searchParams]);

	useEffect(() => {
		if (currSection >= 0 || pendingFocusSectionRef.current === null) return;

		const focusSection = pendingFocusSectionRef.current;
		pendingFocusSectionRef.current = null;

		requestAnimationFrame(() => overviewEditButtonRefs.current[focusSection]?.focus());
	}, [currSection]);

	const updateDraft = useCallback((updater: (prev: OnboardingFormState) => OnboardingFormState) => {
		setDraftState(prev => updater(prev));
	}, []);

	const setDraftPriceEnabled = useCallback((key: OnboardingPriceKey, enabled: boolean) => {
		updateDraft(prev => ({
			...prev,
			priceState: {
				...prev.priceState,
				[key]: {
					...prev.priceState[key],
					enabled,
				},
			},
		}));
	}, [updateDraft]);

	const setDraftPriceRange = useCallback((key: OnboardingPriceKey, range: PriceRange) => {
		updateDraft(prev => ({
			...prev,
			priceState: {
				...prev.priceState,
				[key]: {
					...prev.priceState[key],
					range,
				},
			},
		}));
	}, [updateDraft]);

	const setDraftPriceUnit = useCallback((key: OnboardingPriceKey, unit: PriceUnit) => {
		updateDraft(prev => ({
			...prev,
			priceState: {
				...prev.priceState,
				[key]: {
					...prev.priceState[key],
					unit,
				},
			},
		}));
	}, [updateDraft]);

	const priceItemsWithState = useMemo(() => {
		return PRICE_ITEMS.map(item => {
			const current = selectedPriceState[item.key];

			return {
				...item,
				enabled: current.enabled,
				range: current.range,
				unit: current.unit,
				setEnabled: (checked: boolean) => setDraftPriceEnabled(item.key, checked),
				setRange: (range: PriceRange) => setDraftPriceRange(item.key, range),
				setUnit: (unit: PriceUnit) => setDraftPriceUnit(item.key, unit),
			};
		});
	}, [selectedPriceState, setDraftPriceEnabled, setDraftPriceRange, setDraftPriceUnit]);

	const filteredRegionList = useMemo(
		() => filterList(
			regionItems,
			selectedRegion.name,
			{ getString: region => region.name },
		),
		[selectedRegion, regionItems],
	);

	const infraStateItems = useMemo(() => {
		return infraTypesItems.map(infra => {
			const infraTypeId = infraTypesMap.get(infra.label)!.type;
			const order = selectedInfraTypes.findIndex(selected => selected.type === infra.type);
			return {
				...infra,
				id: infraTypeId,
				order: order >= 0 ? order + 1 : undefined,
			};
		});
	}, [infraTypesItems, infraTypesMap, selectedInfraTypes]);

	const [isSchoolDistrictOpen, setSchoolDistrictOpen] = useState(false);
	const [isHighSchoolOpen, setHighSchoolOpen] = useState(false);

	const [tempSchoolDistricts, setTempSchoolDistricts] = useState<string[]>([]);
	const [tempHighSchools, setTempHighSchools] = useState<string[]>([]);

	const openSchoolDistrictDialog = useCallback(() => {
		setTempSchoolDistricts(draftState.schoolDistricts);
		setSchoolDistrictOpen(true);
	}, [draftState.schoolDistricts]);

	const openHighSchoolDialog = useCallback(() => {
		setTempHighSchools(draftState.highSchools);
		setHighSchoolOpen(true);
	}, [draftState.highSchools]);

	const handleSchoolDistrictConfirm = useCallback(() => {
		updateDraft(prev => ({
			...prev,
			schoolDistricts: tempSchoolDistricts,
		}));
		setSchoolDistrictOpen(false);
	}, [updateDraft, tempSchoolDistricts]);

	const handleHighSchoolConfirm = useCallback(() => {
		updateDraft(prev => ({
			...prev,
			highSchools: tempHighSchools,
		}));
		setHighSchoolOpen(false);
	}, [updateDraft, tempHighSchools]);

	const handleCardToggle = useCallback<SectionRenderContext["handleCardToggle"]>((typeName, checked) => {
		updateDraft(prev => {
			const targetInfra = infraTypesMap.get(typeName)!;
			const nextInfraTypes = !checked
				? prev.infraTypes.filter(value => value.label !== typeName)
				: [...prev.infraTypes, targetInfra];

			const hasSchoolInfra = nextInfraTypes.some(infra =>
				["ELEMENTARY_SCHOOL", "MIDDLE_SCHOOL", "HIGH_SCHOOL"].includes(infra.type)
			);
			const nextSchoolDistricts = hasSchoolInfra ? prev.schoolDistricts : [];

			const hasHighSchoolInfra = nextInfraTypes.some(infra =>
				infra.type === "HIGH_SCHOOL"
			);
			const nextHighSchools = hasHighSchoolInfra ? prev.highSchools : [];

			return {
				...prev,
				infraTypes: nextInfraTypes,
				schoolDistricts: nextSchoolDistricts,
				highSchools: nextHighSchools,
			};
		});
	}, [updateDraft, infraTypesMap]);

	const handleRegionInputChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>((event) => {
		const nextValue = event.target.value;
		updateDraft(prev => ({ ...prev, region: getRegionItem(nextValue) }));
	}, [updateDraft, getRegionItem]);

	const handleRegionInputClear = useCallback<React.MouseEventHandler<HTMLButtonElement>>(() => {
		updateDraft(prev => ({ ...prev, region: getRegionItem("") }));
	}, [updateDraft, getRegionItem]);

	const handleRegionItemClick = useCallback<form.RegionListPanelProps["onSelect"]>((event, region) => {
		event.currentTarget.blur();
		updateDraft(prev => ({ ...prev, region }));
	}, [updateDraft]);

	const handleTempHighSchoolsChange = useCallback((ids: string[]) => {
		setTempHighSchools(ids);
	}, []);

	const handleTempSchoolDistrictToggle = useCallback((type: string) => {
		setTempSchoolDistricts(prev =>
			prev.includes(type) ? prev.filter(x => x !== type) : [...prev, type]
		);
	}, []);

	const sectionContext = useMemo<SectionRenderContext>(() => ({
		infraStateItems,
		selectedRegion,
		overviewRegion: committedState.region,
		filteredRegionList,
		numberOfSelectedInfra: selectedInfraTypes.length,
		handleRegionInputChange,
		handleRegionInputClear,
		handleRegionItemClick,
		handleCardToggle,
		priceItems: priceItemsWithState,
		highSchoolItems,
		highSchoolsMap,
		selectedHighSchoolIds: tempHighSchools,
		committedHighSchoolIds: isEditing ? draftState.highSchools : committedState.highSchools,
		handleHighSchoolsChange: handleTempHighSchoolsChange,
		handleHighSchoolConfirm,
		schoolDistrictTypeItems,
		schoolDistrictTypesMap,
		selectedSchoolDistricts: tempSchoolDistricts,
		committedSchoolDistricts: isEditing ? draftState.schoolDistricts : committedState.schoolDistricts,
		handleSchoolDistrictToggle: handleTempSchoolDistrictToggle,
		handleSchoolDistrictConfirm,
		selectedInfraTypes,
		isSchoolDistrictOpen,
		setSchoolDistrictOpen,
		openSchoolDistrictDialog,
		isHighSchoolOpen,
		setHighSchoolOpen,
		openHighSchoolDialog,
	}), [
		infraStateItems,
		selectedRegion,
		committedState.region,
		filteredRegionList,
		selectedInfraTypes,
		handleRegionInputChange,
		handleRegionInputClear,
		handleRegionItemClick,
		handleCardToggle,
		priceItemsWithState,
		highSchoolItems,
		highSchoolsMap,
		isEditing,
		tempHighSchools,
		draftState.highSchools,
		committedState.highSchools,
		handleTempHighSchoolsChange,
		handleHighSchoolConfirm,
		schoolDistrictTypeItems,
		schoolDistrictTypesMap,
		tempSchoolDistricts,
		draftState.schoolDistricts,
		committedState.schoolDistricts,
		handleTempSchoolDistrictToggle,
		handleSchoolDistrictConfirm,
		isSchoolDistrictOpen,
		isHighSchoolOpen,
		openSchoolDistrictDialog,
		openHighSchoolDialog,
	]);

	const handleEditClick = useCallback((idx: number) => {
		setDraftState(createOnboardingFormState(
			committedState.region,
			committedState.infraTypes,
			committedState.priceState,
			committedState.highSchools,
			committedState.schoolDistricts,
		));
		openEditor(idx);
	}, [committedState, openEditor]);

	const handleCancelClick = useCallback(() => {
		if (currSection < 0) return;

		pendingFocusSectionRef.current = currSection;
		setDraftState(createOnboardingFormState(
			committedState.region,
			committedState.infraTypes,
			committedState.priceState,
			committedState.highSchools,
			committedState.schoolDistricts,
		));
		setEditorErrorMessages(prev => {
			const next = [...prev];
			next[currSection] = "";
			return next;
		});
		closeEditor();
	}, [closeEditor, committedState, currSection]);

	const handleResetClick = useCallback(() => {
		const initialState = createOnboardingFormState(
			getRegionItem(""),
			[],
			createInitialOnboardingPriceState(),
			[],
			[],
		);

		resetOnboarding();
		setCommittedState(initialState);
		setDraftState(createOnboardingFormState(
			initialState.region,
			initialState.infraTypes,
			initialState.priceState,
			initialState.highSchools,
			initialState.schoolDistricts,
		));
		setOverviewErrorMessages([]);
		setEditorErrorMessages([]);
		setRequestErrorMessage("");
		closeEditor();
	}, [closeEditor, getRegionItem, resetOnboarding]); // defaultRegionName

	const handleSaveClick = useCallback(() => {
		if (currSection < 0) return;

		const validationMessage = SECTION_OPTIONS[currSection]?.validate?.(sectionContext);
		if (validationMessage) {
			setEditorErrorMessages(prev => {
				const next = [...prev];
				next[currSection] = validationMessage;
				return next;
			});
			return;
		}

		const nextCommittedState = createOnboardingFormState(
			draftState.region,
			draftState.infraTypes,
			draftState.priceState,
			draftState.highSchools,
			draftState.schoolDistricts,
		);

		setCommittedState(nextCommittedState);
		setOnboarding({
			region: nextCommittedState.region,
			infraTypes: nextCommittedState.infraTypes,
			priceState: nextCommittedState.priceState,
			highSchools: nextCommittedState.highSchools,
			schoolDistricts: nextCommittedState.schoolDistricts,
		});

		setOverviewErrorMessages(prev => {
			const next = [...prev];
			next[currSection] = "";
			return next;
		});
		setEditorErrorMessages(prev => {
			const next = [...prev];
			next[currSection] = "";
			return next;
		});

		pendingFocusSectionRef.current = currSection;
		closeEditor();
	}, [closeEditor, draftState, setOnboarding, currSection, sectionContext]);

	const handleFormSubmit = useCallback<React.SubmitEventHandler<HTMLFormElement>>(async (event) => {
		event.preventDefault();
		setRequestErrorMessage("");

		const errors = SECTION_OPTIONS.map(x => x.validate?.(sectionContext) ?? "");
		const hasAnyError = errors.some(Boolean);

		if (hasAnyError) {
			setOverviewErrorMessages(errors);
			setEditorErrorMessages([]);
			return;
		}

		setOverviewErrorMessages([]);
		setEditorErrorMessages([]);

		try {
			const response = await createRecommendation({
				// name: undefined,  / 입력란 추가?
				regionId: committedState.region.id || null,
				infrastructureTypes: committedState.infraTypes.map(infra => infra.type),
				highSchoolIds: committedState.highSchools.map(Number),
				schoolDistrictTypes: committedState.schoolDistricts,
				salePrice: priceStateToRequestSchema(committedState.priceState.sale),
				jeonsePrice: priceStateToRequestSchema(committedState.priceState.jeonse),
			});

			resetOnboarding();
			navigate({
				pathname: ROUTES.RECOMMENDATION,
				search: `?task_id=${encodeURIComponent(response.taskId)}`,
			}, {
				replace: true,
			});
		} catch (error) {
			setRequestErrorMessage(getRequestErrorMessage(error));
		}
	}, [committedState, navigate, resetOnboarding, sectionContext]);

	return (
		<div className="flex-1 flex flex-col h-full w-full">
			<Header
				heading="맞춤 검색 조건 선택"
			/>
			<main className="flex-1 flex flex-col py-6 gap-6 app-container">
				<form.Provider
					id={formId}
					onSubmit={handleFormSubmit}
					className="flex-1 relative space-y-4"
				>
					<section
						inert={currSection < 0 ? undefined : true}
						className={cn(
							"space-y-4 transition-all",
							currSection < 0
								? "static translate-x-0 opacity-100"
								: "absolute inset-0 h-0 -translate-x-12 opacity-0 pointer-events-none",
						)}
					>
						<header className="px-2 space-y-1">
							<h2 className="text-lg font-bold">검색 조건을 설정해 주세요</h2>
							<p className="text-sm text-muted-foreground">원하는 조건에 맞는 집을 찾아드려요!</p>
						</header>

						<ErrorAlert message={requestErrorMessage}/>

						{SECTION_OPTIONS.map((opts, idx) => (
							<article
								key={opts.heading}
								className="relative group"
								data-invalid={!!overviewErrorMessages[idx]}
								data-required={opts.required ? true : undefined}
							>
								{opts.required && (
									<span
										className={cn(
											"block px-2 py-1 text-xs font-medium text-primary",
											overviewErrorMessages[idx] && "text-destructive",
										)}
										children="* 필수"
									/>
								)}
								<Button
									ref={node => {
										overviewEditButtonRefs.current[idx] = node;
									}}
									type="button"
									variant="ghost"
									className={cn(
										"absolute z-999 right-2 text-xs font-medium text-muted-foreground",
										opts.required ? "top-9" : "top-2",
									)}
									onClick={() => handleEditClick(idx)}
									children="수정"
								/>
								{opts.renderOverview(sectionContext)}
								<ErrorLine message={overviewErrorMessages[idx]}/>
							</article>
						))}
					</section>

					{SECTION_OPTIONS.map((opts, idx) => {
						const currentIsEditing = currSection === idx;

						return (
							<section
								key={`${opts.heading}-editor`}
								inert={currentIsEditing ? undefined : true}
								className={cn(
									"space-y-4 transition-all",
									currentIsEditing
										? "static translate-x-0 opacity-100"
										: "absolute inset-0 h-0 translate-x-12 opacity-0 pointer-events-none",
								)}
							>
								<header className="px-2 space-y-1">
									<h3 className="text-lg font-bold">{opts.heading}</h3>
									<p className="text-sm text-muted-foreground">{opts.description}</p>
								</header>
								<ErrorAlert message={editorErrorMessages[idx] || overviewErrorMessages[idx]}/>
								{opts.renderChildren(sectionContext)}
							</section>
						);
					})}
				</form.Provider>

				<Footer className="flex justify-center-safe gap-4">
					<Button
						size="lg"
						variant="secondary"
						type="button"
						className="flex-1 rounded-full font-bold shadow-md"
						onClick={currSection < 0 ? handleResetClick : handleCancelClick}
						children={currSection < 0 ? "초기화" : "취소"}
					/>
					<Button
						size="lg"
						variant="default"
						type={currSection < 0 ? "submit" : "button"}
						form={currSection < 0 ? formId : undefined}
						className="flex-1 rounded-full font-bold shadow-md"
						onClick={currSection < 0 ? undefined : handleSaveClick}
						children={currSection < 0 ? "다음" : "저장"}
					/>
				</Footer>
			</main>
		</div>
	);
}

interface SchoolDistrictSelectorProps {
	highSchoolItems: schema.HighSchoolItem[];
	selectedHighSchoolIds: string[];
	onHighSchoolsChange: (ids: string[]) => void;
}

function SchoolDistrictSelector({
	highSchoolItems,
	selectedHighSchoolIds,
	onHighSchoolsChange,
}: SchoolDistrictSelectorProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const anchor = useComboboxAnchor();
	const highSchoolsStore = useHighSchoolsStore();
	const highSchoolsMap = highSchoolsStore.getMap("id");

	const filteredSchoolIds = useMemo(() => {
		const filtered = filterList(highSchoolItems, searchQuery, {
			getString: school => school.name,
		});
		return filtered.map(s => String(s.id));
	}, [searchQuery, highSchoolItems]);

	return (
		<Combobox
			multiple
			value={selectedHighSchoolIds}
			onValueChange={onHighSchoolsChange}
			inputValue={searchQuery}
			onInputValueChange={setSearchQuery}
			items={filteredSchoolIds}
			filter={null}
		>
			<ComboboxChips ref={anchor}>
				<ComboboxValue>
					{(values: string[]) => (
						<React.Fragment>
							{values.map((id) => {
								const school = highSchoolsMap.get(Number(id));
								return (
									<ComboboxChip key={id}>
										{school?.name ?? id}
									</ComboboxChip>
								);
							})}
							<ComboboxChipsInput placeholder={values.length === 0 ? "고등학교 이름을 검색하세요..." : ""} />
						</React.Fragment>
					)}
				</ComboboxValue>
			</ComboboxChips>
			<ComboboxContent
				anchor={anchor}
				className="w-full pointer-events-auto"
				onWheel={(e) => e.stopPropagation()}
				onTouchMove={(e) => e.stopPropagation()}
			>
				<ComboboxEmpty>검색 결과가 없습니다.</ComboboxEmpty>
				<ComboboxList>
					{(id: string) => {
						const school = highSchoolsMap.get(Number(id));
						return (
							<ComboboxItem key={id} value={id}>
								{school?.name ?? id}
							</ComboboxItem>
						);
					}}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}
