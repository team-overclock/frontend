import { useRef, useCallback, useMemo, useReducer, useState } from "react";

import * as validate from "@/lib/validate";
import { AREAS } from "@/shared/enum";
import { cn } from "@/lib/utils";
import { filterStringList } from "@/lib/filter-string-list";

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
	extraProps?: Partial<form.FieldProps>;
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
			autoComplete: "current-password",
		},
	},
	newPassword: {
		Component: form.PasswordField,
		extraProps: {
			type: "password",
			autoComplete: "new-password",
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
 * 기본 필드 정규화 옵션 타입
 */
interface NormalizedFieldOptions extends form.FieldProps {
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

		if (option === true) {
			normalizedOptions[field] = { defaultValue: "" } as NormalizedAccountFormFieldOptions[typeof field];
		} else if (option) {
			normalizedOptions[field] = {
				...option,
				defaultValue: option.defaultValue ?? "",
			} as NormalizedAccountFormFieldOptions[typeof field];
		}
	}

	return normalizedOptions;
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
	newPassword: fields.newPassword?.defaultValue ?? "",
	currentPassword: fields.currentPassword?.defaultValue ?? "",
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
				...state,
				errors: action.errors,
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

	for (const field of FIELD_KEYS) {
		if (options[field] && !options[field].formNoValidate) {
			const key = (
				field === "currentPassword" || field === "newPassword"
					? "password"
					: field === "preferredArea"
						? "area"
						: field
			);
			const msg = validate[key](values[field]);
			if (msg) nextErrors[field] = msg;
		}
	}

	return nextErrors;
}



/**
 * 계정 폼 컴포넌트 props
 */
export interface AccountFormProps extends Omit<form.ProviderProps, "onSubmit"> {
	fields: AccountFormFieldOptions;
	onSubmit: (event: React.SubmitEvent<HTMLFormElement>, values: AccountFormValues) => void;
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
		() => filterStringList(AREAS, isAreaDialogMode ? areaDraftValue : values.preferredArea),
		[areaDraftValue, isAreaDialogMode, values.preferredArea],
	);

	const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
		const { name, value } = event.target;
		setFieldValue(name as FieldKey, value);
	}, [setFieldValue]);

	const handleInputClear = useCallback<Exclude<form.FieldProps["onClear"], undefined>>((_, node) => {
		if (!node) return;
		setFieldValue(node.name as FieldKey, "");
	}, [setFieldValue]);

	const openAreaDialog = useCallback(() => {
		if (!preferredAreaField || preferredAreaField.readOnly || preferredAreaField.disabled) return;
		setAreaDraftValue(values.preferredArea);
		setIsAreaDialogOpen(true);
	}, [preferredAreaField, values.preferredArea]);

	const handleDialogOpenChange = useCallback((open: boolean) => {
		if (!open) {
			setFieldValue("preferredArea", areaDraftValue);
			setAreaDraftValue("");
		} else {
			setAreaDraftValue(values.preferredArea);
		}
		setIsAreaDialogOpen(open);
	}, [areaDraftValue, setFieldValue, values.preferredArea]);

	const handleDialogAreaChange: React.ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
		setAreaDraftValue(event.target.value);
	}, []);

	const handleDialogAreaClear = useCallback<Exclude<form.FieldProps["onClear"], undefined>>(() => {
		setAreaDraftValue("");
	}, []);

	const handleInlineAreaSelect: form.AreaListPanelProps["onSelect"] = useCallback((event, area) => {
		event.currentTarget.blur();
		setFieldValue("preferredArea", area);
	}, [setFieldValue]);

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
			dispatchFormState({
				type: "set-errors",
				errors: nextErrors,
			});
			if (Object.keys(nextErrors).length > 0) return;
		}

		onSubmit(event, values);
	}, [fields, noValidate, onSubmit, values]);

	const renderBaseField = useCallback((fieldKey: BaseFieldKey) => {
		const fieldOption = fields[fieldKey];
		if (!fieldOption) return null;

		const { Component, extraProps } = BASE_FIELD_CONFIGS[fieldKey];

		return (
			<Component
				key={fieldKey}
				name={fieldKey}
				value={values[fieldKey]}
				errorMessage={errors[fieldKey]}
				onChange={handleInputChange}
				onClear={fieldOption.readOnly || fieldOption.disabled ? undefined : handleInputClear}
				{...extraProps}
				{...fieldOption}
				defaultValue={undefined}
			/>
		);
	}, [errors, fields, handleInputChange, handleInputClear, values]);

	const showInlineAreaList = !!preferredAreaField && !preferredAreaField.readOnly && !preferredAreaField.disabled && !isAreaDialogMode;
	const showAreaDialog = !!preferredAreaField && !preferredAreaField.readOnly && !preferredAreaField.disabled && isAreaDialogMode;

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
						<form.AreaField
							name="preferredArea"
							value={values.preferredArea}
							errorMessage={errors.preferredArea}
							onChange={handleInputChange}
							onClear={preferredAreaField.readOnly || preferredAreaField.disabled ? undefined : handleInputClear}
							{...preferredAreaField}
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
										{...preferredAreaField}
										defaultValue={undefined}
									/>
								</div></DialogDescription>
							</DialogHeader>

							<div className="min-h-0 overflow-hidden">
								<form.AreaListPanel
									className="shadow-none rounded-none max-h-none h-full"
									items={filteredAreaList}
									onSelect={handleDialogAreaSelect}
								/>
							</div>
						</form.Provider>
					</DialogContent>
				</Dialog>
			)}
		</>
	);
}
