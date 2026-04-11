import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";

import { cn } from "@/lib/utils";
import { AREAS, INFRA_ITEMS, PRICE_UNITS } from "@/shared/enum";
import type { InfraItem, InfraTitle, PriceUnit } from "@/shared/enum";
import { ROUTES } from "@/shared/routes";
import * as schema from "@/shared/schema";
import { submitOnboarding } from "@/lib/api";
import { filterStringList } from "@/lib/filter-string-list";
import { getRequestErrorMessage } from "@/lib/request-error";
import { useAuthStore } from "@/stores/auth";
import {
	useOnboardingStore,
	type OnboardingPriceKey,
	type OnboardingPriceSelection,
	type OnboardingPriceState,
} from "@/stores/onboarding";

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



/**
 * 가격 슬라이드 옵션 기본값
 */
const DEFAULT_PRICE_SLIDER_OPTIONS: PriceSliderOptions = {
	min: 0,
	max: 9999,
	step: 1,
	unit: "억 원",
};

/**
 * 가격 정보
 */
const PRICE_ITEMS: readonly PriceItem[] = [
	{
		key: "purchase",
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
		heading: "선호하는 동네를 선택해 주세요",
		description: "가입 시 선택한 동네는 변경되지 않아요!",
		validate: (ctx) => {
			const parsed = schema.area.safeParse(ctx.selectedArea);
			return parsed.success ? undefined : parsed.error.issues[0]?.message;
		},
		renderOverview: ctx => (
			<form.AreaField
				name="overviewArea"
				value={ctx.overviewArea}
				className="group-data-[invalid=true]:*:data-[slot=input-group]:border-destructive"
				tabIndex={-1}
				readOnly
			/>
		),
		renderChildren: ctx => (
			<div>
				<form.AreaField
					name="preferredArea"
					value={ctx.selectedArea}
					onChange={ctx.handleAreaInputChange}
					onClear={ctx.handleAreaInputClear}
					defaultValue={undefined}
				/>
				<form.AreaListPanel
					className="mt-2"
					items={ctx.filteredAreaList}
					onSelect={ctx.handleAreaItemClick}
				/>
			</div>
		),
	},
	{
		heading: "🏗️ 생활 인프라 (1개 이상)",
		description: "선택한 순서대로 우선순위가 정해져요!",
		validate: ctx => (ctx.selectedInfraTitles.length ? undefined : "인프라를 1개 이상 선택해 주세요!"),
		renderOverview: ctx => (
			<div className="rounded-2xl border bg-secondary p-4 shadow-md space-y-3 transition-colors group-data-[invalid=true]:border-destructive">
				<h3 className="text-sm font-bold">인프라 우선순위</h3>
				<ol className="rounded-xl flex flex-wrap gap-2 justify-center-safe">
					{ctx.selectedItems.map(({ icon, title, color }, idx) => (
						<li
							key={title}
							className="flex justify-center-safe rounded-xl border border-(--c) bg-(--c)/5 px-3 py-2 text-sm font-medium"
							style={{
								"--c": color,
							} as React.CSSProperties}
						>
							<span
								className="inline-flex justify-center items-center size-6 rounded-full bg-(--c) mr-1 text-white"
								children={idx + 1}
							/>
							<span>{icon} {title}</span>
						</li>
					))}
					{!ctx.selectedItems.length && (
						<li
							className="text-sm text-muted-foreground"
							children="아직 인프라를 선택하지 않았어요!"
						/>
					)}
				</ol>
			</div>
		),
		renderChildren: ctx => (
			<div className="grid grid-cols-2 gap-4">
				{INFRA_ITEMS.map(infra => (
					<Card
						{...infra}
						key={infra.title}
						order={ctx.selectedOrderMap.get(infra.title)}
						checked={ctx.selectedTitleSet.has(infra.title)}
						onCheckChange={checked => ctx.handleCardToggle(infra.title, checked)}
					/>
				))}
			</div>
		),
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
							<div className="flex justify-between items-center-safe pt-2 pb-1.5 gap-3">
								<div className="flex items-center-safe gap-2">
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
interface OnboardingFormState {
	preferredArea: string;
	infraTitles: InfraTitle[];
	priceState: OnboardingPriceState;
}

/**
 * 편집 화면을 overview를 통해 들어갔는지 판별하기 위한 라우터 상태 타입
 */
interface LocationState {
	editingFromOnboarding: true;
}

/**
 * 섹션 렌더링에 필요한 컨텍스트 타입
 */
interface SectionRenderContext {
	selectedArea: string;
	overviewArea: string;
	filteredAreaList: string[];
	handleAreaInputChange: React.ChangeEventHandler<HTMLInputElement>;
	handleAreaInputClear: Exclude<form.FieldProps["onClear"], undefined>;
	handleAreaItemClick: form.AreaListPanelProps["onSelect"];
	selectedInfraTitles: InfraTitle[];
	selectedItems: InfraItem[];
	selectedTitleSet: Set<InfraTitle>;
	selectedOrderMap: Map<InfraTitle, number>;
	handleCardToggle: (title: InfraTitle, checked: boolean) => void;
	priceItems: Array<PriceItem & OnboardingPriceSelection & {
		setEnabled: (checked: boolean) => void;
		setRange: (range: PriceRange) => void;
		setUnit: (unit: PriceUnit) => void;
	}>;
}

/**
 * 온보딩 섹션 구성 옵션 타입
 */
interface SectionOptions {
	heading: string;
	description: string;
	validate?: (ctx: SectionRenderContext) => string | undefined;
	renderOverview: (ctx: SectionRenderContext) => React.ReactNode;
	renderChildren: (ctx: SectionRenderContext) => React.ReactNode;
}



/**
 * 인프라 매핑 객체
 */
const INFRA_BY_TITLE = new Map(INFRA_ITEMS.map(infra => [infra.title, infra] as const));

/**
 * @returns 가격 상태 기본값
 */
const createInitialOnboardingPriceState = (): OnboardingPriceState => ({
	purchase: {
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
		purchase: {
			...state.purchase,
			range: [...state.purchase.range] as PriceRange,
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
function createOnboardingFormState (
	preferredArea?: string,
	infraTitles?: InfraTitle[],
	priceState?: OnboardingPriceState,
): OnboardingFormState {
	return {
		preferredArea: preferredArea ?? "",
		infraTitles: [...(infraTitles ?? [])],
		priceState: clonePriceState(priceState),
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
function isOnboardingLocationState(state: unknown): state is LocationState {
	return !!state
		&& typeof state === "object"
		&& "editingFromOnboarding" in state
		&& state.editingFromOnboarding === true;
}



/**
 * 인프라 카드 컴포넌트 props 타입
 */
interface CardProps extends InfraItem {
	order?: number;
	checked: boolean;
	onCheckChange: (check: boolean) => void;
}

/**
 * 인프라 선택 카드 컴포넌트
 */
function Card({
	icon,
	title,
	description,
	color,
	order,
	checked,
	onCheckChange,
}: CardProps) {
	return (
		<button
			type="button"
			role="checkbox"
			aria-checked={checked}
			aria-label={title}
			onClick={() => onCheckChange(!checked)}
			className={cn(
				"relative transition-colors border-2 rounded-2xl shadow-md",
				"p-4 space-y-1 text-left",
				checked ? "bg-(--c)/5 border-(--c)/80" : "bg-secondary border-foreground/10",
			)}
			style={{ "--c": color } as React.CSSProperties}
		>
			<div
				className="empty:hidden absolute top-2 right-2 bg-(--c)/80 size-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
				children={order}
			/>
			<div className="text-3xl">{icon}</div>
			<h3 className="font-semibold">{title}</h3>
			<p className="text-sm text-muted-foreground">{description}</p>
		</button>
	);
}



/**
 * 온보딩 페이지 컴포넌트
 */
export function OnboardingPage() {
	const formId = "onboarding-form";
	const { preferredArea: defaultArea } = useAuthStore();
	const {
		preferredArea: storedPreferredArea = defaultArea,
		infraTitles: storedInfraTitles = [],
		priceState: storedPriceState = createInitialOnboardingPriceState(),
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

	const [committedState, setCommittedState] = useState<OnboardingFormState>(() => createOnboardingFormState(
		storedPreferredArea,
		storedInfraTitles,
		storedPriceState,
	));
	const [draftState, setDraftState] = useState<OnboardingFormState>(() => createOnboardingFormState(
		storedPreferredArea,
		storedInfraTitles,
		storedPriceState,
	));
	const currSection = useMemo(
		() => parseSectionFromSearchParam(searchParams.get("edit")),
		[searchParams],
	);

	const isEditing = currSection >= 0;
	const selectedArea = isEditing ? draftState.preferredArea : committedState.preferredArea;
	const selectedInfraTitles = isEditing ? draftState.infraTitles : committedState.infraTitles;
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
				state: { editingFromOnboarding: true } satisfies LocationState,
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

	const selectedTitleSet = useMemo(() => new Set(selectedInfraTitles), [selectedInfraTitles]);
	const selectedOrderMap = useMemo(
		() => new Map(selectedInfraTitles.map((title, idx) => [title, idx + 1] as const)),
		[selectedInfraTitles],
	);
	const selectedItems = useMemo(
		() => selectedInfraTitles.map(title => INFRA_BY_TITLE.get(title)).filter((item): item is InfraItem => !!item),
		[selectedInfraTitles],
	);

	const filteredAreaList = useMemo(
		() => filterStringList(AREAS, selectedArea),
		[selectedArea],
	);

	const handleCardToggle = useCallback<SectionRenderContext["handleCardToggle"]>((title) => {
		updateDraft(prev => ({
			...prev,
			infraTitles: prev.infraTitles.includes(title)
				? prev.infraTitles.filter(value => value !== title)
				: [...prev.infraTitles, title],
		}));
	}, [updateDraft]);

	const handleAreaInputChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>((event) => {
		const nextValue = event.target.value;
		updateDraft(prev => ({ ...prev, preferredArea: nextValue }));
	}, [updateDraft]);

	const handleAreaInputClear = useCallback<React.MouseEventHandler<HTMLButtonElement>>(() => {
		updateDraft(prev => ({ ...prev, preferredArea: "" }));
	}, [updateDraft]);

	const handleAreaItemClick = useCallback<form.AreaListPanelProps["onSelect"]>((event, area) => {
		event.currentTarget.blur();
		updateDraft(prev => ({ ...prev, preferredArea: area }));
	}, [updateDraft]);

	const sectionContext = useMemo<SectionRenderContext>(() => ({
		selectedArea,
		overviewArea: committedState.preferredArea,
		filteredAreaList,
		handleAreaInputChange,
		handleAreaInputClear,
		handleAreaItemClick,
		selectedInfraTitles,
		selectedItems,
		selectedTitleSet,
		selectedOrderMap,
		handleCardToggle,
		priceItems: priceItemsWithState,
	}), [
		selectedArea,
		committedState.preferredArea,
		filteredAreaList,
		handleAreaInputChange,
		handleAreaInputClear,
		handleAreaItemClick,
		selectedInfraTitles,
		selectedItems,
		selectedTitleSet,
		selectedOrderMap,
		handleCardToggle,
		priceItemsWithState,
	]);

	const handleEditClick = useCallback((idx: number) => {
		setDraftState(createOnboardingFormState(
			committedState.preferredArea,
			committedState.infraTitles,
			committedState.priceState,
		));
		openEditor(idx);
	}, [committedState, openEditor]);

	const handleCancelClick = useCallback(() => {
		if (currSection < 0) return;

		pendingFocusSectionRef.current = currSection;
		setDraftState(createOnboardingFormState(
			committedState.preferredArea,
			committedState.infraTitles,
			committedState.priceState,
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
			defaultArea,
			[],
			createInitialOnboardingPriceState(),
		);

		resetOnboarding();
		setCommittedState(initialState);
		setDraftState(createOnboardingFormState(
			initialState.preferredArea,
			initialState.infraTitles,
			initialState.priceState,
		));
		setOverviewErrorMessages([]);
		setEditorErrorMessages([]);
		setRequestErrorMessage("");
		closeEditor();
	}, [closeEditor, defaultArea, resetOnboarding]);

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
			draftState.preferredArea,
			draftState.infraTitles,
			draftState.priceState,
		);

		setCommittedState(nextCommittedState);
		setOnboarding({
			preferredArea: nextCommittedState.preferredArea,
			infraTitles: nextCommittedState.infraTitles,
			priceState: nextCommittedState.priceState,
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
			const response = await submitOnboarding({
				preferredArea: committedState.preferredArea,
				infraTitles: committedState.infraTitles,
				priceState: committedState.priceState,
			});

			if (!response.isSuccess) {
				setRequestErrorMessage("온보딩 요청 처리에 실패했어요.");
				return;
			}

			resetOnboarding();
			navigate({
				pathname: ROUTES.MAP,
				search: `?uniqueId=${encodeURIComponent(String(response.uniqueId))}`,
			});
		} catch (error) {
			setRequestErrorMessage(getRequestErrorMessage(error));
		}
	}, [committedState, navigate, resetOnboarding, sectionContext]);

	return (
		<div className="h-full flex flex-col">
			<Header
				heading="맞춤 검색 조건 선택"
				className="mx-auto max-w-3xl"
			/>
			<main className="flex-1 px-4 py-6 space-y-6 mx-auto w-full max-w-3xl">
				<form.Provider
					id={formId}
					onSubmit={handleFormSubmit}
					className="px-2 space-y-4"
				>
					<div className="relative">
						<section
							inert={currSection < 0 ? undefined : true}
							className={cn(
								"space-y-4 transition-all",
								currSection < 0
									? "static translate-x-0 opacity-100"
									: "absolute inset-0 -translate-x-12 opacity-0 pointer-events-none",
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
								>
									<Button
										ref={node => {
											overviewEditButtonRefs.current[idx] = node;
										}}
										type="button"
										variant="ghost"
										className="absolute z-999 top-2 right-2 text-xs font-medium text-muted-foreground"
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
											: "absolute inset-0 translate-x-12 opacity-0 pointer-events-none",
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
					</div>
				</form.Provider>

				<Footer className="flex justify-center-safe gap-4">
					<Button
						size="lg"
						variant="secondary"
						type="button"
						className="flex-1 rounded-full font-bold"
						onClick={currSection < 0 ? handleResetClick : handleCancelClick}
						children={currSection < 0 ? "초기화" : "취소"}
					/>
					<Button
						size="lg"
						variant="default"
						type={currSection < 0 ? "submit" : "button"}
						form={currSection < 0 ? formId : undefined}
						className="flex-1 rounded-full font-bold"
						onClick={currSection < 0 ? undefined : handleSaveClick}
						children={currSection < 0 ? "다음" : "저장"}
					/>
				</Footer>
			</main>
		</div>
	);
}
