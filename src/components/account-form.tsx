import { useRef, useCallback, useMemo, useReducer, useState } from "react";

import { AREAS } from "@/shared/enum";
import * as schema from "@/shared/schema";
import { cn } from "@/lib/utils";
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
	"preferredArea",
] as const;

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
	extraProps?: Partial<NormalizedFieldOptions>;
}> = {
	name: {
		Component: form.NameField,
	},
	email: {
		Component: form.EmailField,
	},
	currentPassword: {
		Component: form.PasswordField,
		extraProps: {
			type: "password",
			autoComplete: "current-password",
		},
	},
	newPassword: {
		Component: form.PasswordField,
		extraProps: {
			type: "password",
			autoComplete: "new-password",
			label: "새 비밀번호",
			nextFields: ["newPasswordConfirm"],
		},
	},
	newPasswordConfirm: {
		Component: form.PasswordField,
		extraProps: {
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
type FieldMap<T> = Record<FieldKey, T>;

/**
 * 계정 폼 입력값 타입
 */
type AccountFormValues = FieldMap<string>;

/**
 * 계정 폼 에러 타입
 */
type AccountFormErrors = Partial<AccountFormValues>;

/**
 * 필드별 옵션 입력 타입
 */
type AccountFormFieldOptionValue<K extends FieldKey> =
	K extends "preferredArea"
		? boolean | NormalizedAreaFieldOptions
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
		field: FieldKey;
		value: string;
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

/**
 * 기본 필드 정규화 옵션 타입
 */
interface NormalizedFieldOptions extends form.FieldProps, BaseOptions {
	defaultValue?: string;
}

/**
 * 동네 필드 정규화 옵션 타입
 */
interface NormalizedAreaFieldOptions extends NormalizedFieldOptions {
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
 * 전체 필드 정규화 옵션 타입
 */
type NormalizedAccountFormFieldOptions = {
	[K in FieldKey]: K extends "preferredArea" ? NormalizedAreaFieldOptions : NormalizedFieldOptions;
};

/**
 * 계정 폼 내 필드별 값 및 에러 타입
 */
interface AccountFormState {
	values: AccountFormValues;
	errors: AccountFormErrors;
}

/**
 * 계정 폼 reducer 액션 타입
 */
type AccountFormAction =
	| { type: "set-field"; field: FieldKey; value: string }
	| { type: "set-errors"; errors: AccountFormErrors };

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

		const extraProps = field in BASE_FIELD_CONFIGS ? BASE_FIELD_CONFIGS[field as BaseFieldKey].extraProps : undefined;

		if (option === true) {
			normalizedOptions[field] = {
				enabled: true,
				...extraProps,
				defaultValue: "",
			};
		} else if (option) {
			normalizedOptions[field] = {
				...option,
				...extraProps,
				defaultValue: option.defaultValue ?? "",
				enabled: option.enabled ?? true,
			} as NormalizedAccountFormFieldOptions[typeof field];
		}
	}

	return normalizedOptions;
}

/**
 * {@link BaseOptions} key를 제거한 필드 props 반환 함수
 *
 * @param option 정규화된 필드 props
 */
function omitEnabledFlag<T extends Partial<BaseOptions>>(option: T) {
	const {
		enabled: _enabled,
		required: _required,
		validator: _validator,
		nextFields: _nextFields,
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
const createInitialValues = (fields: Partial<NormalizedAccountFormFieldOptions>): AccountFormValues => ({
	name: fields.name?.defaultValue ?? "",
	email: fields.email?.defaultValue ?? "",
	currentPassword: fields.currentPassword?.defaultValue ?? "",
	newPassword: fields.newPassword?.defaultValue ?? "",
	newPasswordConfirm: fields.newPasswordConfirm?.defaultValue ?? "",
	preferredArea: fields.preferredArea?.defaultValue ?? "",
});

/**
 * 계정 폼 reducer
 *
 * @param state 현재 폼 상태
 * @param action 상태 변경 액션
 * @returns 다음 폼 상태
 */
function accountFormReducer(state: AccountFormState, action: AccountFormAction): AccountFormState {
	switch (action.type) {
		case "set-field":
			return {
				values: {
					...state.values,
					[action.field]: action.value,
				},
				errors: {
					...state.errors,
					[action.field]: undefined,
				},
			};

		case "set-errors":
			return {
				values: state.values,
				errors: {
					...state.errors,
					...action.errors,
				},
			};

		default:
			return state;
	}
}

/**
 * 각 필드별 유효성 검사
 */
function validateForm(
	values: AccountFormValues,
	options: Partial<NormalizedAccountFormFieldOptions>,
): AccountFormErrors {
	/**
	 * 필드별 에러 메시지 누적 객체
	 */
	const nextErrors: AccountFormErrors = {};

	const visitedFields = new Set<FieldKey>();
	for (const field of FIELD_KEYS) {
		const value = values[field].trim();
		validateField(values, options, field, value, options[field], nextErrors, visitedFields);
	}

	return nextErrors;
}

/**
 * 필드 유효성 검사
 */
function validateField<F extends FieldKey>(
	values: AccountFormValues,
	options: Partial<NormalizedAccountFormFieldOptions>,
	field: F,
	value: string,
	option: NormalizedAccountFormFieldOptions[F] = {},
	nextErrors: AccountFormErrors = {},
	visitedFields = new Set<FieldKey>(),
): AccountFormErrors {
	if (visitedFields.has(field)) {
		return nextErrors;
	}
	visitedFields.add(field);
	if (
		option.enabled !== true
		|| (option.required === false && value === "")
		|| option.formNoValidate
	) return nextErrors;

	let msg: string | undefined;
	if (option.validator) {
		msg = option.validator(values, value);
	} else {
		const key = (
			field.includes("Password")
				? "password"
				: field === "preferredArea"
					? "area"
					: field
		) as keyof typeof schema;
		msg = schema[key].safeParse(value).error?.issues[0]?.message;
	}
	if (msg) nextErrors[field] = msg;
	else delete nextErrors[field];

	for (const nextField of option.nextFields ?? []) {
		const nextValue =  values[nextField].trim();
		if (!nextValue) continue;
		validateField(values, options, nextField, nextValue, options[nextField], nextErrors, visitedFields);
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
	const preferredAreaField = fields.preferredArea;
	const isAreaDialogMode = preferredAreaField?.selectMode !== "inline";

	/**
	 * 다이얼로그 닫힘 시 포커스 복원용 ref
	 */
	const openDialogButtonRef = useRef<HTMLButtonElement>(null);
	const [isAreaDialogOpen, setIsAreaDialogOpen] = useState(false);
	const [areaDraftValue, setAreaDraftValue] = useState("");
	const [formState, dispatchFormState] = useReducer(accountFormReducer, {
		values: createInitialValues(fields),
		errors: {},
	});

	const { values, errors } = formState;

	const setFieldValue = useCallback((field: FieldKey, value: string) => {
		dispatchFormState({ type: "set-field", field, value });
	}, []);

	const filteredAreaList = useMemo(
		() => filterList(AREAS, isAreaDialogMode ? areaDraftValue : values.preferredArea),
		[areaDraftValue, isAreaDialogMode, values.preferredArea],
	);

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
		const errors = validateField(nextValues, fields, field, value, fields[field]);
		dispatchFormState({
			type: "set-errors",
			errors,
		});

		onValidate?.({
			scope: "field",
			field,
			value,
			error: errors[field],
			isValid: !errors[field],
			values: nextValues,
		});

		if (!errors[field]) {
			cb?.(event);
		}
	}, [fields, noValidate, setFieldValue, onValidate, values]);

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
		const errors = validateField(nextValues, fields, field, "", fields[field]);
		dispatchFormState({
			type: "set-errors",
			errors,
		});
		onValidate?.({
			scope: "field",
			field,
			value: "",
			error: errors[field],
			isValid: !errors[field],
			values: nextValues,
		});

		cb?.(event, node);
	}, [fields, noValidate, setFieldValue, onValidate, values]);

	const openAreaDialog = useCallback(() => {
		if (!preferredAreaField || preferredAreaField.readOnly || preferredAreaField.disabled) return;
		setAreaDraftValue(values.preferredArea);
		setIsAreaDialogOpen(true);
	}, [preferredAreaField, values.preferredArea]);

	const handleDialogOpenChange = useCallback((open: boolean) => {
		if (!open) {
			setFieldValue("preferredArea", areaDraftValue);
			if (!noValidate) {
				const nextValues = {
					...values,
					preferredArea: areaDraftValue,
				};
				const errors = validateField(values, fields, "preferredArea", areaDraftValue, preferredAreaField);
				dispatchFormState({
					type: "set-errors",
					errors,
				});
				onValidate?.({
					scope: "field",
					field: "preferredArea",
					value: areaDraftValue,
					error: errors.preferredArea,
					isValid: !errors.preferredArea,
					values: nextValues,
				});
			}
			setAreaDraftValue("");
		} else {
			setAreaDraftValue(values.preferredArea);
		}
		setIsAreaDialogOpen(open);
	}, [noValidate, areaDraftValue, preferredAreaField, setFieldValue, onValidate, fields, values]);

	const handleDialogAreaChange: React.ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
		setAreaDraftValue(event.target.value);
	}, []);

	const handleDialogAreaClear = useCallback<Exclude<form.FieldProps["onClear"], undefined>>(() => {
		setAreaDraftValue("");
	}, []);

	const handleInlineAreaSelect: form.AreaListPanelProps["onSelect"] = useCallback((event, area) => {
		event.currentTarget.blur();
		setFieldValue("preferredArea", area);

		if (noValidate) return;
		const nextValues = {
			...values,
			preferredArea: area,
		};
		const errors = validateField(values, fields, "preferredArea", area, preferredAreaField);
		dispatchFormState({
			type: "set-errors",
			errors,
		});
		onValidate?.({
			scope: "field",
			field: "preferredArea",
			value: area,
			error: errors.preferredArea,
			isValid: !errors.preferredArea,
			values: nextValues,
		});
	}, [noValidate, preferredAreaField, setFieldValue, onValidate, fields, values]);

	const handleDialogAreaSelect: form.AreaListPanelProps["onSelect"] = useCallback((event, area) => {
		event.currentTarget.blur();
		setFieldValue("preferredArea", area);
		setAreaDraftValue(area);
		setIsAreaDialogOpen(false);
	}, [setFieldValue]);

	const handleFormSubmit: React.SubmitEventHandler<HTMLFormElement> = useCallback((event) => {
		event.preventDefault();

		if (!noValidate) {
			const nextErrors = validateForm(values, fields);
			const isValid = Object.keys(nextErrors).length === 0;
			onValidate?.({
				scope: "form",
				errors: nextErrors,
				isValid,
				values,
			});
			dispatchFormState({
				type: "set-errors",
				errors: nextErrors,
			});
			if (!isValid) return;
		}

		onSubmit(event, values);
	}, [fields, noValidate, onSubmit, onValidate, values]);

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

	const showInlineAreaList = !!preferredAreaField && preferredAreaField.enabled === true && !preferredAreaField.readOnly && !preferredAreaField.disabled && !isAreaDialogMode;
	const showAreaDialog = !!preferredAreaField && preferredAreaField.enabled === true && !preferredAreaField.readOnly && !preferredAreaField.disabled && isAreaDialogMode;
	const renderablePreferredAreaField = preferredAreaField ? omitEnabledFlag(preferredAreaField) : undefined;

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

				{preferredAreaField && (
					<div>
						{preferredAreaField.enabled === true && renderablePreferredAreaField && (
							<form.AreaField
								name="preferredArea"
								value={values.preferredArea}
								errorMessage={errors.preferredArea}
								{...renderablePreferredAreaField}
								onBlur={e => handleInputChangeAndBlur(e, renderablePreferredAreaField.onBlur)}
								onChange={e => handleInputChangeAndBlur(e, renderablePreferredAreaField.onChange)}
								onClear={preferredAreaField.readOnly || preferredAreaField.disabled ? undefined : (...args) => handleInputClear(...args, renderablePreferredAreaField.onClear)}
								readOnly={isAreaDialogMode || preferredAreaField.readOnly}
								tabIndex={isAreaDialogMode ? -1 : undefined}
								defaultValue={undefined}
								rightIcon={isAreaDialogMode ? (
									<Button
										ref={openDialogButtonRef}
										type="button"
										onClick={openAreaDialog}
										className="mr-3"
										children="📍 동네 찾기"
									/>
								) : undefined}
							/>
						)}

						{showInlineAreaList && (
							<form.AreaListPanel
								className="mt-2"
								items={filteredAreaList}
								onSelect={handleInlineAreaSelect}
							/>
						)}
					</div>
				)}

				{children}
			</form.Provider>

			{showAreaDialog && (
				<Dialog open={isAreaDialogOpen} onOpenChange={handleDialogOpenChange}>
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
									<form.AreaField
										name="preferredArea"
										value={areaDraftValue}
										onChange={handleDialogAreaChange}
										onClear={handleDialogAreaClear}
										{...renderablePreferredAreaField}
										defaultValue={undefined}
									/>
								</div></DialogDescription>
							</DialogHeader>

							<div className="min-h-0 overflow-hidden">
								<form.AreaListPanel
									className="shadow-none rounded-none"
									items={filteredAreaList}
									onSelect={handleDialogAreaSelect}
									style={{
										"--area-listbox-height": "50svh",
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
