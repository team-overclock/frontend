import { useCallback, useMemo, useRef, useState } from "react";

import * as validate from "@/lib/validate";
import { AREAS } from "@/shared/areas";
import { cn } from "@/lib/utils";

import * as form from "@/components/form";
import { ErrorAlert } from "@/components/errors";



const FIELDS = [
	"name",
	"email",
	"currentPassword",
	"newPassword",
	"preferredArea",
] as const;



export type AccountFormField = typeof FIELDS[number];
export type AccountFormFieldMap<T> = Record<AccountFormField, T>;

export type AccountFormValues = AccountFormFieldMap<string>;
export type AccountFormErrors = Partial<AccountFormValues>;

interface NormalizedFieldOptions extends form.FieldProps {
	defaultValue: string;
}

type AccountFormFieldOptions = Partial<AccountFormFieldMap<boolean | NormalizedFieldOptions>>;

type ValidateOptions = Partial<AccountFormFieldMap<NormalizedFieldOptions>>;

/**
 * 필드 옵션을 정규화하는 함수
 *
 * @param options 각 필드별로 on/off 또는 세부 옵션을 설정할 수 있는 객체
 * @returns 각 필드별로 세부 옵션이 포함된 객체
 */
function normalizeFieldOptions(options: AccountFormFieldOptions) {
	const normalizedOptions: Partial<AccountFormFieldMap<NormalizedFieldOptions>> = {};

	for (const field of FIELDS) {
		const option = options[field];

		if (option === true) {
			normalizedOptions[field] = { defaultValue: "" };
		} else if (option) {
			normalizedOptions[field] = {
				...option,
				defaultValue: option.defaultValue ?? "",
			};
		}
	}

	return normalizedOptions;
}

/**
 * 각 필드별로 유효성 검사를 수행하는 함수
 *
 * @param values 폼의 현재 입력값 객체
 * @param options 각 필드별로 어떤 유효성 검사를 수행할지 결정하는 옵션 객체
 * @returns 각 필드별 에러 메시지 객체
 */
function validateForm(
	values: AccountFormValues,
	{ name, email, currentPassword, newPassword, preferredArea }: ValidateOptions,
): AccountFormErrors {
	const nextErrors: AccountFormErrors = {};

	if (name) nextErrors.name = validate.name(values.name);
	if (email) nextErrors.email = validate.email(values.email);
	if (currentPassword) nextErrors.currentPassword = validate.password(values.currentPassword);
	if (newPassword) nextErrors.newPassword = validate.password(values.newPassword);
	if (preferredArea) nextErrors.preferredArea = validate.area(values.preferredArea);

	for (const curr in nextErrors) {
		const key = curr as AccountFormField;
		if (nextErrors[key] === undefined) {
			delete nextErrors[key];
		}
	}

	return nextErrors;
}



export interface AccountFormProps extends Omit<form.ProviderProps, "onSubmit"> {
	fields: AccountFormFieldOptions;
	onSubmit: (event: React.SubmitEvent<HTMLFormElement>, values: AccountFormValues) => void;
	gap?: number | string;
	errorMessage?: string;
}

/**
 * 모든 필드에 대해 on/off가 가능한 범용 계정 폼 컴포넌트
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

	const areaFieldRef = useRef<HTMLDivElement>(null);
	const [isAreaListOpen, setIsAreaListOpen] = useState(false);
	const [formErrors, setFormErrors] = useState<AccountFormErrors>({});
	const [formValues, setFormValues] = useState<AccountFormValues>({
		name: fields.name?.defaultValue ?? "",
		email: fields.email?.defaultValue ?? "",
		newPassword: fields.newPassword?.defaultValue ?? "",
		currentPassword: fields.currentPassword?.defaultValue ?? "",
		preferredArea: fields.preferredArea?.defaultValue ?? "",
	});

	const resetField = useCallback((field: AccountFormField, value = "") => {
		setFormValues((prev) => ({
			...prev,
			[field]: value,
		}));
		setFormErrors((prev) => ({
			...prev,
			[field]: undefined,
		}));
	}, []);

	const closeAreaList = useCallback(() => {
		const activeElement = document.activeElement;

		if (activeElement instanceof HTMLElement) {
			activeElement.blur();
		}

		setIsAreaListOpen(false);
	}, []);

	const filteredAreaList = useMemo(() => {
		const terms = formValues.preferredArea.trim().split(/\s+/).filter(Boolean);

		if (terms.length === 0) {
			return AREAS;
		}

		return AREAS.filter((area) => terms.every((term) => area.includes(term)));
	}, [formValues.preferredArea]);

	const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
		const { name, value } = event.target;
		resetField(name as AccountFormField, value);
	}, [resetField]);

	const handleInputClear = useCallback<Exclude<form.FieldProps["onClear"], undefined>>((_, node) => {
		if (!node) return;
		resetField(node.name as AccountFormField);
	}, [resetField]);

	const areaInputFocus: React.FocusEventHandler<HTMLInputElement> = useCallback(() => {
		setIsAreaListOpen(true);
	}, []);

	const areaFieldOnBlur: React.FocusEventHandler<HTMLInputElement | HTMLDivElement> = useCallback((event) => {
		const relatedTarget = event.relatedTarget;
		if (!areaFieldRef.current?.contains(relatedTarget)) {
			closeAreaList();
		}
	}, [closeAreaList]);

	const areaInputChange: React.ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
		resetField("preferredArea", event.target.value);
	}, [resetField]);

	const areaItemClick: form.AreaListPanelProps["onSelect"] = useCallback((event, area) => {
		event.currentTarget.blur();
		closeAreaList();
		resetField("preferredArea", area);
	}, [closeAreaList, resetField]);

	const handleFormSubmit: React.SubmitEventHandler<HTMLFormElement> = useCallback((event) => {
		event.preventDefault();

		if (!noValidate) {
			const nextErrors = validateForm(formValues, fields);
			setFormErrors(nextErrors);
			if (Object.keys(nextErrors).length > 0) {
				return;
			}
		}

		onSubmit(event, formValues);
	}, [fields, formValues, noValidate, onSubmit]);

	return (
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

			{fields.name && (
				<form.NameField
					name="name"
					value={formValues.name}
					errorMessage={formErrors.name}
					onChange={handleInputChange}
					onClear={fields.name.readOnly || fields.name.disabled ? undefined : handleInputClear}
					{...fields.name}
					defaultValue={undefined}
				/>
			)}

			{fields.email && (
				<form.EmailField
					name="email"
					value={formValues.email}
					errorMessage={formErrors.email}
					onChange={handleInputChange}
					onClear={fields.email.readOnly || fields.email.disabled ? undefined : handleInputClear}
					{...fields.email}
					defaultValue={undefined}
				/>
			)}

			{fields.currentPassword && (
				<form.PasswordField
					name="currentPassword"
					autoComplete="current-password"
					value={formValues.currentPassword}
					errorMessage={formErrors.currentPassword}
					onChange={handleInputChange}
					onClear={fields.currentPassword.readOnly || fields.currentPassword.disabled ? undefined : handleInputClear}
					{...fields.currentPassword}
					defaultValue={undefined}
				/>
			)}

			{fields.newPassword && (
				<form.PasswordField
					name="newPassword"
					type="password"
					autoComplete="new-password"
					value={formValues.newPassword}
					errorMessage={formErrors.newPassword}
					onChange={handleInputChange}
					onClear={fields.newPassword.readOnly || fields.newPassword.disabled ? undefined : handleInputClear}
					{...fields.newPassword}
					defaultValue={undefined}
				/>
			)}

			{fields.preferredArea && (
				<div ref={areaFieldRef}>
					<form.AreaField
						name="preferredArea"
						value={formValues.preferredArea}
						errorMessage={formErrors.preferredArea}
						onChange={areaInputChange}
						onFocus={areaInputFocus}
						onBlur={areaFieldOnBlur}
						onClear={fields.preferredArea.readOnly || fields.preferredArea.disabled ? undefined : handleInputClear}
						{...fields.preferredArea}
						defaultValue={undefined}
					/>
					{!fields.preferredArea.readOnly && !fields.preferredArea.disabled && (
						<form.AreaListPanel
							className={cn(
								"transition-all",
								isAreaListOpen ? "mt-2" : "mt-0",
							)}
							isOpen={isAreaListOpen}
							items={filteredAreaList}
							onSelect={areaItemClick}
							onBlur={areaFieldOnBlur}
						/>
					)}
				</div>
			)}

			{children}
		</form.Provider>
	);
}
