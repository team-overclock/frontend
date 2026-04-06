import { createContext, useContext } from "react";
import { User2Icon, AtSignIcon, KeyRoundIcon, MapPinHouseIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { AREAS } from "@/shared/areas";

import { Item, ItemContent } from "@/components/ui/item";
import { FloatingLabelInput, type FloatingLabelInputProps } from "@/components/input";



/**
 * 하위 컴포넌트들은 form.Provider 내부에서만 사용 가능하도록 하는 컨텍스트와 커스텀 훅
 */
const FormProviderContext = createContext(false);

/**
 * form.Provider 내부에서만 사용 가능한 컴포넌트에서 컨텍스트 유효성 검사 및 에러 처리
 *
 * @param componentName 에러 메시지에 표시할 컴포넌트 이름
 */
function useFormProviderContext(componentName: string) {
	const isInsideProvider = useContext(FormProviderContext);

	if (!isInsideProvider) {
		throw new Error(`form.${componentName} must be used within form.Provider.`);
	}
}



export interface ProviderProps extends React.ComponentProps<"form"> {
}

export interface FieldProps extends FloatingLabelInputProps {
}



/**
 * 하위 컴포넌트들이 form.Provider 내부에서만 사용 가능하도록 하는 폼 컨테이너 컴포넌트
 */
export function Provider(props: ProviderProps) {
	return (
		<FormProviderContext.Provider value={true}>
			<form {...props}/>
		</FormProviderContext.Provider>
	);
}

/**
 * 각 필드 컴포넌트에서 공통적으로 사용하는 텍스트 입력 렌더링 함수
 */
function renderTextField(
	leftIcon: React.ReactNode,
	{ name, label, placeholder, ...props }: FieldProps,
) {
	return (
		<FloatingLabelInput
			leftIcon={leftIcon}
			name={name}
			label={label ?? ""}
			placeholder={placeholder}
			{...props}
		/>
	);
}



/**
 * 이름 입력 필드 컴포넌트
 */
export function NameField(props: FieldProps) {
	useFormProviderContext("NameField");

	return renderTextField(<User2Icon/>, {
		name: "name",
		label: "이름",
		placeholder: "홍길동",
		...props,
	});
}

/**
 * 이메일 입력 필드 컴포넌트
 */
export function EmailField(props: FieldProps) {
	useFormProviderContext("EmailField");

	return renderTextField(<AtSignIcon/>, {
		name: "email",
		type: "email",
		label: "이메일",
		placeholder: "example@email.com",
		...props,
	});
}

/**
 * 비밀번호 입력 필드 컴포넌트
 */
export function PasswordField(props: FieldProps) {
	useFormProviderContext("PasswordField");

	return renderTextField(<KeyRoundIcon/>, {
		name: "password",
		type: "password",
		label: "비밀번호",
		placeholder: "********",
		...props,
	});
}

/**
 * 동네 입력 필드 컴포넌트
 */
export function AreaField(props: FieldProps) {
	useFormProviderContext("AreaField");

	return renderTextField(<MapPinHouseIcon/>, {
		name: "area",
		label: "동네",
		placeholder: `예: ${AREAS[0]}`,
		...props,
	});
}



export interface AreaListPanelProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
	isOpen?: boolean;
	items?: string[];
	onSelect: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, area: string) => void;
}

export function AreaListPanel({
	isOpen = false,
	items = [],
	onSelect,
	className,
	...props
}: AreaListPanelProps) {
	return (
		<div
			inert={!isOpen}
			role="listbox"
			aria-label="주소 목록"
			className={cn(
				"empty:hidden bg-secondary rounded-2xl shadow-md overflow-x-hidden transition-[max-height] h-full",
				isOpen ? "max-h-64" : "max-h-0",
				className,
			)}
			{...props}
		>
			{
				items.length ? items.map(item => (
					<Item key={item} asChild><button
						role="option"
						type="button"
						className="rounded-none text-sm not-last:border-b hover:bg-background/50 transition-colors"
						onClick={e => onSelect(e, item)}
						children={`📍 ${item}`}
					/></Item>
				)) : (
					<Item asChild><ItemContent className="text-muted-foreground">
						주소를 찾을 수 없어요 😢
					</ItemContent></Item>
				)
			}
		</div>
	);
}
