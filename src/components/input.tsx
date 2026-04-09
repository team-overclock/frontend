import { forwardRef, useId, useRef, useState } from "react";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useMergedRef } from "@/hooks/use-merged-ref";

import { ErrorLine } from "@/components/errors";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";



export interface FloatingLabelInputProps extends Omit<React.ComponentProps<"input">, "children"> {
	/**
	 * 필드 레이블.
	 * 입력값이 없을 때는 기본 input + placeholder로, 입력값이 있을 때는 floating label로 동작.
	 */
	label?: string;

	/**
	 * 필드 왼쪽에 표시할 아이콘.
	 */
	leftIcon?: React.ReactNode;

	/**
	 * 필드 오른쪽에 표시할 아이콘.
	 */
	rightIcon?: React.ReactNode;

	/**
	 * 필드 아래에 표시할 에러 메시지.
	 * 기본적으로 필드도 에러 스타일으로 변경.
	 */
	errorMessage?: string;

	/**
	 * 입력값이 에러 상태임을 나타내는 옵션.
	 * 값이 설정되지 않으면 {@link errorMessage}의 존재 여부에 따라 에러 상태가 결정됨.
	 */
	isError?: boolean;

	/**
	 * 입력값을 지우는 clear 버튼 표시 여부.
	 * 표시할 경우 오른쪽 아이콘보다 뒤에 위치함.
	 */
	clearable?: boolean;

	/**
	 * clear 버튼 클릭 후 추가로 실행할 콜백.
	 * 기본 clear 동작(입력값 비우기) 이후 호출됨.
	 */
	onClear?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, inputElement: HTMLInputElement | null) => void;
}



/**
 * 플로팅 레이블이 있는 텍스트 입력 컴포넌트
 */
export const FloatingLabelInput = forwardRef<HTMLInputElement, FloatingLabelInputProps>(function FloatingLabel({
	id,
	name,
	label,
	value,
	leftIcon,
	rightIcon,
	clearable,
	isError,
	errorMessage = "",
	placeholder = " ",
	autoComplete,
	disabled,
	readOnly,
	className,
	onClear,
	...props
}, ref) {
	const fallbackId = useId();
	const inputRef = useRef<HTMLInputElement>(null);
	const mergedRef = useMergedRef(inputRef, ref);
	const [uncontrolledValue, setUncontrolledValue] = useState(() => props.defaultValue?.toString() ?? "");

	const inputId = id ?? name ?? fallbackId;
	const errorId = `${inputId}-error`;
	const labelId = `${inputId}-label`;
	const hasLabel = !!label;
	const editable = !readOnly && !disabled;
	const enableClear = clearable ?? editable;
	const isControlled = value !== undefined;
	const displayValue = isControlled ? value?.toString() ?? "" : uncontrolledValue;

	return (
		<div className={cn("space-y-1", className)}>
			<InputGroup className="shadow-md h-auto bg-secondary overflow-hidden rounded-3xl">
				<div className="relative w-full">
					<InputGroupInput
						ref={mergedRef}
						id={inputId}
						type="text"
						name={name}
						value={value}
						disabled={disabled}
						readOnly={readOnly}
						placeholder={placeholder}
						autoComplete={autoComplete ?? name}
						aria-invalid={isError !== undefined ? isError : !!errorMessage}
						aria-describedby={errorMessage ? errorId : undefined}
						aria-labelledby={hasLabel ? labelId : undefined}
						onInput={event => {
							if (!isControlled) {
								setUncontrolledValue(event.currentTarget.value);
							}
							props.onInput?.(event);
						}}
						className={cn(
							"peer h-auto w-full pb-2.5",
							hasLabel ? "pt-6 placeholder:text-transparent" : "pt-2 placeholder:text-muted-foreground",
						)}
						{...props}
					/>
					{hasLabel && (
						<label
							id={labelId}
							htmlFor={inputId}
							className={cn(
								"pointer-events-none transition-all absolute top-2 left-3",
								"text-xs font-semibold text-muted-foreground",
								"peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2",
								"peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium",
								editable && "peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:font-semibold",
							)}
							children={label}
						/>
					)}
				</div>
				{leftIcon && (
					<InputGroupAddon
						align="inline-start"
						children={leftIcon}
					/>
				)}
				{(enableClear || rightIcon) && (
					<InputGroupAddon align="inline-end">
						{rightIcon}
						{enableClear && (
							<InputGroupButton
								type="button"
								size="icon-xs"
								variant="ghost"
								aria-label="입력값 지우기"
								className={cn(
									"transition-all",
									displayValue.length ? "opacity-100" : "pointer-events-none w-0 opacity-0",
								)}
								onClick={e => {
									if (!isControlled) {
										setUncontrolledValue("");
									}

									if (inputRef.current) {
										inputRef.current.value = "";
										inputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
									}

									onClear?.(e, inputRef.current);
									inputRef.current?.focus();
								}}
								children={<XIcon size={16} strokeWidth={3}/>}
								tabIndex={-1}
							/>
						)}
					</InputGroupAddon>
				)}
			</InputGroup>
			<ErrorLine
				id={errorId}
				message={errorMessage}
			/>
		</div>
	);
});
