import { useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";

import { cn } from "@/lib/utils";
import { AREAS } from "@/shared/areas";
import { ROUTES } from "@/shared/routes";
import * as validate from "@/lib/validate";
import { submitOnboarding } from "@/lib/api";
import { filterStringList } from "@/lib/filter-string-list";
import { getRequestErrorMessage } from "@/lib/request-error";
import { useAuthStore } from "@/stores/auth";
import {
	useOnboardingStore,
	type OnboardingPriceSelection,
	type OnboardingPriceState,
	type OnboardingPriceKey,
	type OnboardingPriceUnit,
} from "@/stores/onboarding";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ErrorAlert, ErrorLine } from "@/components/errors";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import * as form from "@/components/form";



/**
 * 인프라 정보
 */
const infraItems: InfraItem[] = [
	{
		icon: "🚇",
		title: "지하철역",
		description: "가장 가까운 역까지 거리",
		color: "blue",
	},
	{
		icon: "🎒",
		title: "초등학교",
		description: "배정 초등학교 도보 거리",
		color: "orange",
	},
	{
		icon: "🏥",
		title: "대형병원",
		description: "종합병원·대학병원 거리",
		color: "red",
	},
	{
		icon: "🌳",
		title: "공원·녹지",
		description: "근린공원·산책로 거리",
		color: "green",
	},
	{
		icon: "🛒",
		title: "대형마트",
		description: "마트·백화점 거리",
		color: "purple",
	},
	{
		icon: "🏫",
		title: "고등학교",
		description: "인근 고등학교 거리",
		color: "gold",
	},
];



/**
 * 가격 단위
 */
const PRICE_UNITS = [
	"억 원",
	"만 원",
];

/**
 * 가격 슬라이드 옵션
 */
const DEFAULT_PRICE_SLIDER_CONFIG: PriceSliderConfig = {
	min: 0,
	max: 9999,
	step: 1,
};

/**
 * 매매 가격 정보
 */
const purchaseItem: PriceItem = {
	key: "purchase",
	icon: "🏠",
	label: "매매",
	slider: DEFAULT_PRICE_SLIDER_CONFIG,
};

/**
 * 전세 가격 정보
 */
const jeonseItem: PriceItem = {
	key: "jeonse",
	icon: "💸",
	label: "전세",
	slider: DEFAULT_PRICE_SLIDER_CONFIG,
};

/**
 * @returns 가격 정보 기본값
 */
const createInitialOnboardingPriceState = (): OnboardingPriceState => ({
	purchase: {
		enabled: false,
		range: [DEFAULT_PRICE_SLIDER_CONFIG.min, DEFAULT_PRICE_SLIDER_CONFIG.max],
		unit: "억 원",
	},
	jeonse: {
		enabled: false,
		range: [DEFAULT_PRICE_SLIDER_CONFIG.min, DEFAULT_PRICE_SLIDER_CONFIG.max],
		unit: "억 원",
	},
});

/**
 * 각 스탭별 overview와 editor 구성 데이터
 */
const stepConfigs: StepConfig[] = [
	{
		heading: "선호하는 동네를 선택해 주세요",
		description: "가입 시 선택한 동네는 변경되지 않아요!",
		validate: ctx => validate.area(ctx.selectedArea),
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
					isOpen
				/>
			</div>
		),
	},
	{
		heading: "🏗️ 생활 인프라 (1개 이상)",
		description: "선택한 순서대로 우선순위가 정해져요!",
		validate: ctx => (ctx.selectedInfraTitles.length > 0 ? undefined : "인프라를 1개 이상 선택해 주세요!"),
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
							<span className="inline-flex justify-center items-center size-6 rounded-full bg-(--c) mr-1 text-white">{idx + 1}</span>
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
				{infraItems.map(infra => (
					<Card
						key={infra.title}
						order={ctx.selectedOrderMap.get(infra.title)}
						checked={ctx.selectedTitleSet.has(infra.title)}
						onChange={() => ctx.handleCardToggle(infra.title)}
						{...infra}
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
							<Label
								htmlFor={item.key}
								children={`${item.icon} ${item.label}`}
							/>
							<Switch
								id={item.key}
								onCheckedChange={item.setEnabled}
								checked={item.enabled}
							/>
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
										onChange={event => {
											const parsedValue = Number(event.target.value);
											if (Number.isNaN(parsedValue)) return;

											const nextMin = Math.max(item.slider.min, Math.min(parsedValue, item.slider.max));
											const nextMax = Math.max(nextMin, item.range[1]);

											item.setRange([nextMin, nextMax]);
										}}
										aria-label={`${item.label} 최소 금액`}
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
										onChange={event => {
											const parsedValue = Number(event.target.value);
											if (Number.isNaN(parsedValue)) return;

											const nextMax = Math.max(item.slider.min, Math.min(parsedValue, item.slider.max));
											const nextMin = Math.min(item.range[0], nextMax);

											item.setRange([nextMin, nextMax]);
										}}
										aria-label={`${item.label} 최대 금액`}
									/>
								</div>
								<div className="flex items-center-safe gap-1">
									<Label asChild className="text-xs text-muted-foreground"><span>단위</span></Label>
									<Select
										value={item.unit}
										onValueChange={value => item.setUnit(value as OnboardingPriceUnit)}
									>
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
								aria-label={`${item.label} 가격 범위`}
								value={item.range}
								disabled={!item.enabled}
								aria-disabled={!item.enabled}
								onValueChange={value => {
									if (value.length !== 2) return;
									item.setRange(value as [number, number]);
								}}
							/>
						</div>
					</div>
				))}
			</div>
		),
	},
];



interface InfraItem {
	icon: string;
	title: string;
	description: string;
	color: string;
}

interface PriceSliderConfig {
	min: number;
	max: number;
	step: number;
}

interface PriceItem {
	key: OnboardingPriceKey;
	icon: string;
	label: string;
	slider: PriceSliderConfig;
}

type PriceRange = [number, number];

const infraByTitle = new Map(infraItems.map(infra => [infra.title, infra] as const));
const priceItems = [purchaseItem, jeonseItem] as const;

const parseStepFromSearchParam = (value: string | null) => {
	if (value === null) return -1;

	const parsed = Number(value);
	if (!Number.isInteger(parsed)) return -1;

	return parsed >= 0 && parsed < stepConfigs.length ? parsed : -1;
};

interface LocationState {
	editingFromOnboarding: true;
}

function isOnboardingLocationState(state: unknown): state is LocationState {
	return !!state
		&& typeof state === "object"
		&& "editingFromOnboarding" in state
		&& state.editingFromOnboarding === true;
}



interface StepRenderContext {
	selectedArea: string;
	overviewArea: string;
	areaList: string[];
	filteredAreaList: string[];
	handleAreaInputChange: React.ChangeEventHandler<HTMLInputElement>;
	handleAreaInputClear: Exclude<form.FieldProps["onClear"], undefined>;
	handleAreaItemClick: form.AreaListPanelProps["onSelect"];
	selectedInfraTitles: string[];
	selectedItems: InfraItem[];
	selectedTitleSet: Set<string>;
	selectedOrderMap: Map<string, number>;
	handleCardToggle: (title: string) => void;
	priceItems: Array<PriceItem & OnboardingPriceSelection & {
		setEnabled: (checked: boolean) => void;
		setRange: (range: PriceRange) => void;
		setUnit: (unit: OnboardingPriceUnit) => void;
	}>;
}

interface StepConfig {
	heading: string;
	description: string;
	validate?: (ctx: StepRenderContext) => string | undefined;
	renderOverview: (ctx: StepRenderContext) => React.ReactNode;
	renderChildren: (ctx: StepRenderContext) => React.ReactNode;
}



interface CardProps extends InfraItem {
	order?: number;
	checked: boolean;
	onChange: React.ChangeEventHandler<HTMLInputElement>;
}

function Card({
	icon,
	title,
	description,
	color,
	order,
	checked,
	...props
}: CardProps) {
	return (
		<label
			aria-pressed={checked}
			className={cn(
				"relative transition-colors border-2 rounded-2xl shadow-md",
				"p-4 space-y-1 text-left",
				"block cursor-pointer",
				checked ? "bg-(--c)/5 border-(--c)/80" : "bg-secondary border-foreground/10"
			)}
			style={{
				"--c": color,
			} as React.CSSProperties}
		>
			<input
				type="checkbox"
				className="sr-only"
				checked={checked}
				aria-label={title}
				{...props}
			/>
			<div className="empty:hidden absolute top-2 right-2 bg-(--c)/80 size-6 rounded-full flex items-center justify-center text-xs font-bold text-white">{order}</div>
			<div className="text-3xl">{icon}</div>
			<h3 className="font-semibold">{title}</h3>
			<p className="text-sm text-muted-foreground">{description}</p>
		</label>
	);
}



export function OnboardingPage() {
	const {
		preferredArea: defaultArea,
	} = useAuthStore();

	const {
		preferredArea: storedPreferredArea = defaultArea,
		infraTitles: storedInfraTitles = [],
		priceState: storedPriceState = createInitialOnboardingPriceState(),
		set: setOnboarding,
		reset: resetOnboarding,
	} = useOnboardingStore();

	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams] = useSearchParams();
	const [overviewErrorMessages, setOverviewErrorMessages] = useState<string[]>([]);
	const [editorErrorMessages, setEditorErrorMessages] = useState<string[]>([]);
	const [requestErrorMessage, setRequestErrorMessage] = useState("");
	const [overviewArea, setOverviewArea] = useState(storedPreferredArea ?? "");
	const [selectedArea, setSelectedArea] = useState(storedPreferredArea ?? "");
	const [selectedInfraTitles, setSelectedInfraTitles] = useState(storedInfraTitles);
	const [priceState, setPriceState] = useState(storedPriceState);

	const step = useMemo(() => parseStepFromSearchParam(searchParams.get("step")), [searchParams]);

	const openEditor = useCallback((nextStep: number) => {
		const nextSearchParams = new URLSearchParams(searchParams);
		nextSearchParams.set("step", String(nextStep));
		const searchString = nextSearchParams.toString();

		navigate({
			pathname: location.pathname,
			search: `?${searchString}`
		}, {
			state: {
				editingFromOnboarding: true,
			} satisfies LocationState,
		});
	}, [location.pathname, navigate, searchParams]);

	const closeEditor = useCallback(() => {
		if (isOnboardingLocationState(location.state)) {
			navigate(-1);
			return;
		}

		const nextSearchParams = new URLSearchParams(searchParams);
		nextSearchParams.delete("step");
		const searchString = nextSearchParams.toString();
		navigate({
			pathname: location.pathname,
			search: searchString ? `?${searchString}` : "",
		}, { replace: true });
	}, [location.pathname, location.state, navigate, searchParams]);

	const priceItemsWithState = useMemo(() => priceItems.map(item => {
		const current = priceState[item.key];

		return {
			...item,
			enabled: current.enabled,
			range: current.range,
			unit: current.unit,
			setEnabled: (checked: boolean) => {
				setPriceState(prev => ({
					...prev,
					[item.key]: {
						...prev[item.key],
						enabled: checked,
					},
				}));
			},
			setRange: (range: PriceRange) => {
				setPriceState(prev => ({
					...prev,
					[item.key]: {
						...prev[item.key],
						range,
					},
				}));
			},
			setUnit: (unit: OnboardingPriceUnit) => {
				setPriceState(prev => ({
					...prev,
					[item.key]: {
						...prev[item.key],
						unit,
					},
				}));
			},
		};
	}), [priceState]);

	const handleCardToggle = useCallback<StepRenderContext["handleCardToggle"]>(title => {
		setSelectedInfraTitles(prev => (
			prev.includes(title)
				? prev.filter(x => x !== title)
				: [...prev, title]
		));
	}, []);

	const selectedTitleSet = useMemo(() => new Set(selectedInfraTitles), [selectedInfraTitles]);
	const selectedOrderMap = useMemo(
		() => new Map(selectedInfraTitles.map((title, index) => [title, index + 1] as const)),
		[selectedInfraTitles],
	);
	const selectedItems = useMemo(
		() => selectedInfraTitles.map(title => infraByTitle.get(title)).filter((infra): infra is InfraItem => !!infra),
		[selectedInfraTitles],
	);

	const filteredAreaList = useMemo(
		() => filterStringList(AREAS, selectedArea),
		[selectedArea],
	);

	const handleAreaInputChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(event => {
		setSelectedArea(event.target.value);
	}, []);

	const handleAreaInputClear = useCallback<React.MouseEventHandler<HTMLButtonElement>>(() => {
		setSelectedArea("");
	}, []);

	const handleAreaItemClick = useCallback<form.AreaListPanelProps["onSelect"]>((event, area) => {
		event.currentTarget.blur();
		setSelectedArea(area);
	}, []);

	const stepContext = useMemo<StepRenderContext>(() => ({
		handleCardToggle,
		selectedArea,
		overviewArea,
		areaList: AREAS,
		filteredAreaList,
		handleAreaInputChange,
		handleAreaInputClear,
		handleAreaItemClick,
		selectedInfraTitles,
		selectedItems,
		selectedOrderMap,
		selectedTitleSet,
		priceItems: priceItemsWithState,
	}), [
		handleCardToggle,
		selectedArea,
		overviewArea,
		filteredAreaList,
		handleAreaInputChange,
		handleAreaInputClear,
		handleAreaItemClick,
		selectedInfraTitles,
		selectedItems,
		selectedOrderMap,
		selectedTitleSet,
		priceItemsWithState,
	]);

	const handleEditClick = useCallback((idx: number) => {
		openEditor(idx);
	}, [openEditor]);

	const handleCancelClick = useCallback(() => {
		const editingStep = step;
		setSelectedArea(overviewArea);
		setSelectedInfraTitles(storedInfraTitles);
		setPriceState(storedPriceState);
		setEditorErrorMessages(prev => {
			const next = [...prev];
			next[editingStep] = "";
			return next;
		});
		closeEditor();
	}, [
		step,
		overviewArea,
		storedInfraTitles,
		storedPriceState,
		closeEditor,
		setSelectedInfraTitles,
		setSelectedArea,
		setPriceState,
	]);

	const handleResetClick = useCallback(() => {
		resetOnboarding();
		setOverviewArea(defaultArea ?? "");
		setSelectedArea(defaultArea ?? "");
		setSelectedInfraTitles([]);
		setPriceState(createInitialOnboardingPriceState());
		setOverviewErrorMessages([]);
		setEditorErrorMessages([]);
		setRequestErrorMessage("");
		closeEditor();
	}, [
		defaultArea,
		closeEditor,
		resetOnboarding,
		setEditorErrorMessages,
		setOverviewArea,
		setOverviewErrorMessages,
		setPriceState,
		setRequestErrorMessage,
	]);

	const handleSaveClick = useCallback(() => {
		const activeStep = stepConfigs[step];
		const validationMessage = activeStep?.validate?.(stepContext);
		if (validationMessage) {
			setEditorErrorMessages(prev => {
				const next = [...prev];
				next[step] = validationMessage;
				return next;
			});
			return;
		}
		setOnboarding({
			preferredArea: selectedArea,
			infraTitles: selectedInfraTitles,
			priceState: priceState,
		});
		setOverviewArea(selectedArea);
		setOverviewErrorMessages(prev => {
			const next = [...prev];
			next[step] = "";
			return next;
		});
		setEditorErrorMessages(prev => {
			const next = [...prev];
			next[step] = "";
			return next;
		});
		closeEditor();
	}, [closeEditor, selectedArea, selectedInfraTitles, priceState, setOnboarding, step, stepContext]);

	const handleFormSubmit = useCallback<React.SubmitEventHandler<HTMLFormElement>>(async (e) => {
		e.preventDefault();
		setRequestErrorMessage("");

		const errors = stepConfigs.map(x => x.validate?.(stepContext) ?? "");

		if (errors.filter(x => !!x).length) {
			setOverviewErrorMessages(errors);
			setEditorErrorMessages([]);
			return;
		}
		setOverviewErrorMessages([]);
		setEditorErrorMessages([]);

		try {
			const response = await submitOnboarding({
				preferredArea: selectedArea,
				infraTitles: selectedInfraTitles,
				priceState,
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
	}, [navigate, priceState, resetOnboarding, selectedArea, selectedInfraTitles, stepContext]);

	return (
		<div className="h-full flex flex-col">
			<Header
				heading="맞춤 검색 조건 선택"
				className="mx-auto max-w-3xl"
			/>
			<main className="flex-1 px-4 py-6 space-y-6 mx-auto w-full max-w-3xl">
				<form.Provider
					id="onboarding-form"
					onSubmit={handleFormSubmit}
					className="px-2 space-y-4"
				>
					<ErrorAlert message={requestErrorMessage}/>
					<div className="relative">
						<section
							inert={step < 0 ? undefined : true}
							className={cn(
								"space-y-4 transition-all",
								step < 0
									? "static translate-x-0 opacity-100"
									: "absolute inset-0 -translate-x-12 opacity-0 pointer-events-none",
							)}
						>
							<header className="px-2 space-y-1">
								<h2 className="text-lg font-bold">검색 조건을 설정해 주세요</h2>
								<p className="text-sm text-muted-foreground">원하는 조건에 맞는 집을 찾아드려요!</p>
							</header>
							{stepConfigs.map((stepConfig, index) => (
								<article
									key={stepConfig.heading}
									className="relative group"
									data-invalid={!!overviewErrorMessages[index]}
								>
									<Button
										type="button"
										variant="ghost"
										children="수정"
										className="absolute z-999 top-2 right-2 text-xs font-medium text-muted-foreground"
										onClick={() => handleEditClick(index)}
									/>
									{stepConfig.renderOverview(stepContext)}
									<ErrorLine
										message={overviewErrorMessages[index]}
									/>
								</article>
							))}
						</section>

						{stepConfigs.map((stepConfig, index) => {
							const isEditing = step === index;

							return (
								<section
									key={`${stepConfig.heading}-editor`}
									inert={isEditing ? undefined : true}
									className={cn(
										"space-y-4 transition-all",
										isEditing
											? "static translate-x-0 opacity-100"
											: "absolute inset-0 translate-x-12 opacity-0 pointer-events-none",
									)}
								>
									<header className="px-2 space-y-1">
										<h3 className="text-lg font-bold">{stepConfig.heading}</h3>
										<p className="text-sm text-muted-foreground">{stepConfig.description}</p>
									</header>
									<ErrorAlert
										message={editorErrorMessages[index] || overviewErrorMessages[index]}
									/>
									{stepConfig.renderChildren(stepContext)}
								</section>
							);
						})}
					</div>
				</form.Provider>
			</main>
			<Footer className="flex justify-center-safe gap-4 mx-auto max-w-md w-full">
				<Button
					size="lg"
					variant="secondary"
					type="button"
					className="flex-1 rounded-full font-bold"
					children={step < 0 ? "초기화" : "취소"}
					onClick={step < 0 ? handleResetClick : handleCancelClick}
				/>
				<Button
					size="lg"
					variant="default"
					type={step < 0 ? "submit" : "button"}
					form={step < 0 ? "onboarding-form" : undefined}
					className="flex-1 rounded-full font-bold"
					children={step < 0 ? "다음" : "저장"}
					onClick={step < 0 ? undefined : handleSaveClick}
				/>
			</Footer>
		</div>
	);
}
