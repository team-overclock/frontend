import { useRef, useCallback, useEffect, useMemo, useState } from "react";

import * as schema from "@/shared/schema";
import { cn } from "@/lib/utils";
import { useRegionsStore, type ItemByNameMap } from "@/stores/items";
import { filterList } from "@/lib/filter-string-list";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/errors";
import * as form from "@/components/form";



/**
 * 기본 필드 키 타입
 */
type BaseFieldKey = typeof BASE_FIELD_KEYS[number];

/**
 * 기본 필드 목록
 */
const BASE_FIELD_KEYS = [
	"name",
	"email",
	"currentPassword",
	"newPassword",
	"newPasswordConfirm",
] as const;

/**
 * 전체 필드 키 타입
 */
type FieldKey = typeof FIELD_KEYS[number];

/**
 * 전체 필드 목록
 */
const FIELD_KEYS = [
	...BASE_FIELD_KEYS,
	"region",
] as const;

const regionDefaultValue: schema.Item = { id: 0, name: "" };

/**
 * 기본 필드 렌더링 구성 객체
 */
const BASE_FIELD_CONFIGS: Record<BaseFieldKey, {
	/**
	 * 기본 필드 렌더링 컴포넌트
	 */
	Component: (props: form.FieldProps) => React.JSX.Element;

	/**
	 * 기본 필드 추가 props
	 */
	defaultProps?: Partial<NormalizedFieldOptions>;
}> = {
	name: {
		Component: form.NameField,
	},
	email: {
		Component: form.EmailField,
	},
	currentPassword: {
		Component: form.PasswordField,
		defaultProps: {
			type: "password",
			autoComplete: "current-password",
		},
	},
	newPassword: {
		Component: form.PasswordField,
		defaultProps: {
			type: "password",
			autoComplete: "new-password",
			label: "새 비밀번호",
			nextFields: ["newPasswordConfirm"],
		},
	},
	newPasswordConfirm: {
		Component: form.PasswordField,
		defaultProps: {
			type: "password",
			autoComplete: "new-password",
			label: "새 비밀번호 확인",
			validator: ({ newPassword }, value) => {
				if (value !== newPassword) {
					return "새 비밀번호와 일치하지 않아요";
				}
			},
		},
	},
};



/**
 * 필드 키 기반 맵 타입
 */
type FieldMap<K extends FieldKey, T> = Record<K, T>;

/**
 * 계정 폼 입력값 타입
 */
type AccountFormValues =
	& FieldMap<BaseFieldKey, string>
	& FieldMap<"region", schema.Item>;

/**
 * 계정 폼 에러 타입
 */
type AccountFormErrors = Partial<FieldMap<FieldKey, string>>;

/**
 * 필드별 옵션 입력 타입
 */
type AccountFormFieldOptionValue<K extends FieldKey> =
	K extends "region"
		? boolean | NormalizedRegionFieldOptions
		: boolean | NormalizedFieldOptions;

/**
 * 계정 폼 필드 옵션 타입
 */
export type AccountFormFieldOptions = {
	[K in FieldKey]?: AccountFormFieldOptionValue<K>;
};

/**
 * 계정 폼 검증 콜백 함수 이벤트 타입
 */
export type AccountFormValidateEvent =
	| {
		scope: "field";
		field: BaseFieldKey;
		value: string;
		error?: string;
		isValid: boolean;
		values: AccountFormValues;
	}
	| {
		scope: "field";
		field: "region";
		value: schema.Item;
		error?: string;
		isValid: boolean;
		values: AccountFormValues;
	}
	| {
		scope: "form";
		errors: AccountFormErrors;
		isValid: boolean;
		values: AccountFormValues;
	};

interface BaseOptions {
	enabled?: boolean;

	/**
	 * 필드 필수 여부, 값이 있을 경우에만 검증을 진행함
	 */
	required?: boolean;

	/**
	 * 해당 필드 검증 후 추가로 검증을 수행할 필드 키 목록.
	 * 해당 필드가 비활성화인 경우 무시됨
	 */
	nextFields?: FieldKey[];

	/**
	 * 해당 필드의 기본 유효성 검사 대신 사용할 커스텀 검증 함수
	 *
	 * @param values 폼 내 모든 입력값
	 * @param value 입력값
	 * @returns 에러 메시지, 값이 있으면 검증 실패로 간주
	 */
	validator?: (values: AccountFormValues, value: string) => string | undefined,
}

interface RegionOptions extends BaseOptions {
	/**
	 * 동네 선택 UI 모드
	 *
	 * - `dialog`: 다이얼로그로 표시
	 * - `inline`: 입력 폼 아래 div로 표시
	 *
	 * @default "dialog"
	 */
	selectMode?: "dialog" | "inline";
}

/**
 * 기본 필드 정규화 옵션 타입
 */
interface NormalizedFieldOptions extends form.FieldProps, BaseOptions {
	defaultValue?: string;
}

/**
 * 동네 필드 정규화 옵션 타입
 */
interface NormalizedRegionFieldOptions extends NormalizedFieldOptions, RegionOptions {
}

/**
 * 전체 필드 정규화 옵션 타입
 */
type NormalizedAccountFormFieldOptions = {
	[K in FieldKey]: K extends "region" ? NormalizedRegionFieldOptions : NormalizedFieldOptions;
};

/**
 * 필드 옵션을 정규화하는 함수
 *
 * @param options 외부에서 전달받은 필드 옵션
 * @returns 정규화된 필드 옵션
 */
function normalizeFieldOptions(options: AccountFormFieldOptions) {
	/**
	 * 정규화 값을 저장할 객체
	 */
	const normalizedOptions: Partial<NormalizedAccountFormFieldOptions> = {};

	for (const field of FIELD_KEYS) {
		const option = options[field];

		const defaultProps = field in BASE_FIELD_CONFIGS ? BASE_FIELD_CONFIGS[field as BaseFieldKey].defaultProps : undefined;

		if (option === true) {
			normalizedOptions[field] = {
				enabled: true,
				...defaultProps,
				defaultValue: "",
			};
		} else if (option) {
			normalizedOptions[field] = {
				...defaultProps,
				...option,
				defaultValue: option.defaultValue ?? "",
				enabled: option.enabled ?? true,
			} as NormalizedAccountFormFieldOptions[typeof field];
		}
	}

	return normalizedOptions;
}

/**
 * {@link RegionOptions} key를 제거한 필드 props 반환 함수
 *
 * @param option 정규화된 필드 props
 */
function omitEnabledFlag<T extends Partial<RegionOptions>>(option: T) {
	const {
		enabled: _enabled,
		validator: _validator,
		nextFields: _nextFields,
		selectMode: _selectMode,
		...rest
	} = option;
	return rest;
}

/**
 * 필드 옵션 기반 초기 입력값 생성 함수
 *
 * @param fields 정규화된 필드 옵션
 * @returns 폼 초기값
 */
const createInitialValues = (fields: Partial<NormalizedAccountFormFieldOptions>, regionMap: ItemByNameMap): AccountFormValues => {
	return {
		name: fields.name?.defaultValue ?? "",
		email: fields.email?.defaultValue ?? "",
		currentPassword: fields.currentPassword?.defaultValue ?? "",
		newPassword: fields.newPassword?.defaultValue ?? "",
		newPasswordConfirm: fields.newPasswordConfirm?.defaultValue ?? "",
		region: regionMap.get(fields.region?.defaultValue ?? "") ?? { ...regionDefaultValue },
	};
};

/**
 * 각 필드별 유효성 검사
 */
function validateForm(
	values: AccountFormValues,
	options: Partial<NormalizedAccountFormFieldOptions>,
	regionMap: ItemByNameMap,
): AccountFormErrors {
	/**
	 * 필드별 에러 메시지 누적 객체
	 */
	const nextErrors: AccountFormErrors = {};

	const visitedFields = new Set<FieldKey>();
	for (const field of FIELD_KEYS) {
		const value = field === "region" ? values[field].name : values[field];
		validateField(values, options, regionMap, field, value, options[field], nextErrors, visitedFields);
	}

	return nextErrors;
}

/**
 * 필드 유효성 검사
 */
function validateField<F extends FieldKey>(
	values: AccountFormValues,
	options: Partial<NormalizedAccountFormFieldOptions>,
	regionMap: ItemByNameMap,
	field: F,
	value: string,
	option: NormalizedAccountFormFieldOptions[F] = {},
	nextErrors: AccountFormErrors = {},
	visitedFields = new Set<FieldKey>(),
): AccountFormErrors {
	if (visitedFields.has(field)) {
		return nextErrors;
	}
	value = value.trim();
	visitedFields.add(field);
	if (option.required === false && value === "") {
		nextErrors[field] = undefined;
		return nextErrors
	} else if (
		option.enabled !== true
		|| option.formNoValidate
	) return nextErrors;

	let msg: string | undefined;
	if (option.validator) {
		msg = option.validator(values, value);
	} else if (field === "region") {
		msg = regionMap.has(value) ? undefined : "지원하지 않는 동네예요";
	} else {
		const key = (
			field.includes("Password")
				? "password"
				: field
		) as keyof typeof schema;
		msg = schema[key].safeParse(value).error?.issues[0]?.message;
	}
	if (msg) nextErrors[field] = msg;
	else nextErrors[field] = undefined;

	for (const nextField of option.nextFields ?? []) {
		const nextValue = nextField === "region" ? values[nextField].name : values[nextField];
		if (!nextValue) continue;
		validateField(values, options, regionMap, nextField, nextValue, options[nextField], nextErrors, visitedFields);
	}

	return nextErrors;
}



/**
 * 계정 폼 컴포넌트 props
 */
export interface AccountFormProps extends Omit<form.ProviderProps, "onSubmit"> {
	fields: AccountFormFieldOptions;
	onSubmit: (event: React.SubmitEvent<HTMLFormElement>, values: AccountFormValues) => void;
	onValidate?: (event: AccountFormValidateEvent) => void;
	gap?: number | string;
	errorMessage?: string;
}

/**
 * 모든 필드를 props로 제어할 수 있는 계정 폼
 */
export function AccountForm({
	noValidate = false,
	gap = "1rem",
	fields: fieldOptions,
	errorMessage,
	onSubmit,
	onValidate,
	className,
	children,
	...props
}: AccountFormProps) {
	const fields = useMemo(() => normalizeFieldOptions(fieldOptions), [fieldOptions]);
	const regionField = fields.region;
	const isRegionDialogMode = regionField?.selectMode !== "inline";
	const regionsStore = useRegionsStore();

	const regionItems = regionsStore.items;
	const regionMap = regionsStore.getMap();

	/**
	 * 다이얼로그 닫힘 시 포커스 복원용 ref
	 */
	const openDialogButtonRef = useRef<HTMLButtonElement>(null);
	const [isRegionDialogOpen, setIsRegionDialogOpen] = useState(false);
	const [regionDraftValue, setRegionDraftValue] = useState("");
	const [values, setValues] = useState(() => createInitialValues(fields, regionMap));
	const [errors, setErrors] = useState<AccountFormErrors>({});

	useEffect(() => {
		regionsStore.fetch();
	}, [regionsStore]);

	useEffect(() => {
		const frameId = requestAnimationFrame(() => {
			setValues(createInitialValues(fields, regionMap));
			setErrors({});
		});

		return () => cancelAnimationFrame(frameId);
	}, [fields, regionMap]);

	const getRegionItem = useCallback(
		(name: string) => regionMap.get(name) ?? { id: 0, name },
		[regionMap],
	);

	const setFieldValue = useCallback((field: FieldKey, value: string) => {
		if (field !== "region") {
			setValues(p => ({
				...p,
				[field]: value,
			}));
		} else {
			setValues(p => ({
				...p,
				region: getRegionItem(value),
			}));
		}
	}, [getRegionItem]);

	const setErrorValue = useCallback((value: AccountFormErrors) => {
		setErrors(p => ({
			...p,
			...value,
		}));
	}, []);

	const filteredRegionList = useMemo(
		() => filterList(
			regionItems,
			isRegionDialogMode ? regionDraftValue : values.region.name,
			{ getString: region => region.name },
		),
		[regionDraftValue, isRegionDialogMode, values.region, regionItems],
	);

	const callOnValidate = useCallback((
		field: FieldKey,
		value: string,
		nextValues: AccountFormValues,
	) => {
		if (field === "region") {
			onValidate?.({
				scope: "field",
				field,
				value: getRegionItem(value),
				error: errors[field],
				isValid: !errors[field],
				values: nextValues,
			});
		} else {
			onValidate?.({
				scope: "field",
				field,
				value,
				error: errors[field],
				isValid: !errors[field],
				values: nextValues,
			});
		}
	}, [onValidate, errors, getRegionItem]);

	const handleInputChangeAndBlur = useCallback((
		event: React.ChangeEvent<HTMLInputElement, Element>,
		cb?: React.ChangeEventHandler<HTMLInputElement, HTMLInputElement>,
	) => {
		const { name, value } = event.target;
		const field = name as FieldKey;
		setFieldValue(field, value);

		if (noValidate) return;

		const nextValues = {
			...values,
			[field]: value,
		};
		const errors = validateField(nextValues, fields, regionMap, field, value, fields[field]);
		setErrorValue(errors);

		callOnValidate(field, value, nextValues);

		if (!errors[field]) {
			cb?.(event);
		}
	}, [fields, noValidate, regionMap, setFieldValue, setErrorValue, callOnValidate, values]);

	const handleInputClear = useCallback((
		event: Parameters<Exclude<form.FieldProps["onClear"], undefined>>[0],
		node: Parameters<Exclude<form.FieldProps["onClear"], undefined>>[1],
		cb?: form.FieldProps["onClear"],
	) => {
		if (!node) return;
		const field = node.name as FieldKey;
		setFieldValue(field, "");

		if (noValidate) return;

		const nextValues = {
			...values,
			[field]: "",
		};
		const errors = validateField(nextValues, fields, regionMap, field, "", fields[field]);
		setErrorValue(errors);
		callOnValidate(field, "", nextValues);

		cb?.(event, node);
	}, [fields, noValidate, regionMap, setFieldValue, setErrorValue, callOnValidate, values]);

	const openRegionDialog = useCallback(() => {
		if (!regionField || regionField.readOnly || regionField.disabled) return;
		setRegionDraftValue(values.region.name);
		setIsRegionDialogOpen(true);
	}, [regionField, values]);

	const handleDialogOpenChange = useCallback((open: boolean) => {
		if (!open) {
			setFieldValue("region", regionDraftValue);
			if (!noValidate) {
				const nextValues = {
					...values,
					region: getRegionItem(regionDraftValue),
				};
				const errors = validateField(values, fields, regionMap, "region", regionDraftValue, regionField);
				setErrorValue(errors);
				callOnValidate("region", regionDraftValue, nextValues);
			}
			setRegionDraftValue(regionDefaultValue.name);
		} else {
			setRegionDraftValue(values.region.name);
		}
		setIsRegionDialogOpen(open);
	}, [noValidate, regionDraftValue, regionField, callOnValidate, fields, values, regionMap, setFieldValue, setErrorValue, getRegionItem]);

	const handleDialogRegionChange: React.ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
		setRegionDraftValue(event.target.value);
	}, []);

	const handleDialogRegionClear = useCallback<Exclude<form.FieldProps["onClear"], undefined>>(() => {
		setRegionDraftValue(regionDefaultValue.name);
	}, []);

	const handleInlineRegionSelect: form.RegionListPanelProps["onSelect"] = useCallback((event, region) => {
		event.currentTarget.blur();
		setFieldValue("region", region.name);

		if (noValidate) return;
		const nextValues = {
			...values,
			region,
		};
		const errors = validateField(values, fields, regionMap, "region", region.name, regionField);
		setErrorValue(errors);
		callOnValidate("region", region.name, nextValues);
	}, [noValidate, regionField, callOnValidate, fields, values, regionMap, setFieldValue, setErrorValue]);

	const handleDialogRegionSelect: form.RegionListPanelProps["onSelect"] = useCallback((event, region) => {
		event.currentTarget.blur();
		const errors = validateField(values, fields, regionMap, "region", region.name, regionField);
		setErrorValue(errors);
		setFieldValue("region", region.name);
		setRegionDraftValue(region.name);
		setIsRegionDialogOpen(false);
	}, [setFieldValue, regionField, fields, values, regionMap, setErrorValue]);

	const handleFormSubmit: React.SubmitEventHandler<HTMLFormElement> = useCallback((event) => {
		event.preventDefault();

		if (!noValidate) {
			const nextErrors = validateForm(values, fields, regionMap);
			const isValid = Object.values(nextErrors).filter(Boolean).length === 0;
			onValidate?.({
				scope: "form",
				errors: nextErrors,
				isValid,
				values,
			});
			setErrorValue(nextErrors);
			if (!isValid) return;
		}

		onSubmit(event, values);
	}, [fields, noValidate, onSubmit, onValidate, values, regionMap, setErrorValue]);

	const renderBaseField = useCallback((fieldKey: BaseFieldKey) => {
		const fieldOption = fields[fieldKey];
		if (!fieldOption || fieldOption.enabled !== true) return null;

		const { Component } = BASE_FIELD_CONFIGS[fieldKey];
		const {
			onBlur,
			onClear,
			onChange,
			...renderableFieldOption
		} = omitEnabledFlag(fieldOption);

		return (
			<Component
				key={fieldKey}
				name={fieldKey}
				value={values[fieldKey]}
				errorMessage={errors[fieldKey]}
				onBlur={e => handleInputChangeAndBlur(e, onBlur)}
				onChange={e => handleInputChangeAndBlur(e, onChange)}
				onClear={fieldOption.readOnly || fieldOption.disabled ? undefined : (...args) => handleInputClear(...args, onClear)}
				{...renderableFieldOption}
				defaultValue={undefined}
			/>
		);
	}, [errors, fields, handleInputChangeAndBlur, handleInputClear, values]);

	const showInlineRegionList = !!regionField && regionField.enabled === true && !regionField.readOnly && !regionField.disabled && !isRegionDialogMode;
	const showRegionDialog = !!regionField && regionField.enabled === true && !regionField.readOnly && !regionField.disabled && isRegionDialogMode;
	const renderableRegionField = regionField ? omitEnabledFlag(regionField) : undefined;

	return (
		<>
			<form.Provider
				noValidate
				className={cn("empty:hidden space-y-(--gap)", className)}
				onSubmit={handleFormSubmit}
				style={{
					"--gap": typeof gap === "number" ? `${gap}px` : gap,
				} as React.CSSProperties}
				{...props}
			>
				<ErrorAlert
					className="rounded-2xl"
					message={errorMessage}
				/>

				{BASE_FIELD_KEYS.map(renderBaseField)}

				{regionField && (
					<div>
						{regionField.enabled === true && renderableRegionField && (
							<form.RegionField
								name="region"
								value={values.region.name}
								errorMessage={errors.region}
								{...renderableRegionField}
								onBlur={e => handleInputChangeAndBlur(e, renderableRegionField.onBlur)}
								onChange={e => handleInputChangeAndBlur(e, renderableRegionField.onChange)}
								onClear={regionField.readOnly || regionField.disabled ? undefined : (...args) => handleInputClear(...args, renderableRegionField.onClear)}
								readOnly={isRegionDialogMode || regionField.readOnly}
								tabIndex={isRegionDialogMode ? -1 : undefined}
								defaultValue={undefined}
								rightIcon={isRegionDialogMode ? (
									<Button
										ref={openDialogButtonRef}
										type="button"
										onClick={openRegionDialog}
										className="mr-3"
										children="📍 동네 찾기"
									/>
								) : undefined}
							/>
						)}

						{showInlineRegionList && (
							<form.RegionListPanel
								className="mt-2"
								items={filteredRegionList}
								onSelect={handleInlineRegionSelect}
							/>
						)}
					</div>
				)}

				{children}
			</form.Provider>

			{showRegionDialog && (
				<Dialog open={isRegionDialogOpen} onOpenChange={handleDialogOpenChange}>
					<DialogContent
						onCloseAutoFocus={event => {
							event.preventDefault();
							openDialogButtonRef.current?.focus();
						}}
						className="top-[8svh] translate-y-0 gap-0 max-h-[calc(100vh-16svh)] overflow-hidden grid-rows-[auto_minmax(0,1fr)]"
					>
						<form.Provider
							onSubmit={event => {
								event.preventDefault();
								handleDialogOpenChange(false);
							}}
						>
							<DialogHeader>
								<DialogTitle>동네 선택</DialogTitle>
								<DialogDescription className="space-y-4" asChild><div>
									<p>원하는 동네를 선택해 주세요.</p>
									<form.RegionField
										name="region"
										value={regionDraftValue}
										onChange={handleDialogRegionChange}
										onClear={handleDialogRegionClear}
										{...renderableRegionField}
										defaultValue={undefined}
									/>
								</div></DialogDescription>
							</DialogHeader>

							<div className="min-h-0 overflow-hidden">
								<form.RegionListPanel
									className="shadow-none rounded-none"
									items={filteredRegionList}
									onSelect={handleDialogRegionSelect}
									style={{
										"--region-listbox-height": "50svh",
									} as React.CSSProperties}
								/>
							</div>
						</form.Provider>
					</DialogContent>
				</Dialog>
			)}
		</>
	);
}
