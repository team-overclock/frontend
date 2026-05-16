import { createContext, useContext } from "react";
import { User2Icon, AtSignIcon, KeyRoundIcon, MapPinHouseIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Item, ItemContent } from "@/components/ui/item";
import { FloatingLabelInput, type FloatingLabelInputProps } from "@/components/input";
import type * as schema from "@/shared/schema";



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



export interface FieldProps extends FloatingLabelInputProps {
}

/**
 * 각 필드 컴포넌트에서 공통적으로 사용하는 텍스트 입력 렌더링 함수
 */
function renderTextField(
	leftIcon: React.ReactNode,
	{ name, label, placeholder, required = true, ...props }: FieldProps,
) {
	return (
		<FloatingLabelInput
			leftIcon={leftIcon}
			name={name}
			label={`${label ?? ""} ${required ? "*" : ""}`.trim()}
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
export function RegionField(props: FieldProps) {
	useFormProviderContext("RegionField");

	return renderTextField(<MapPinHouseIcon/>, {
		name: "region",
		label: "동네",
		placeholder: "예: 서울특별시 강남구 역삼동",
		...props,
	});
}



export interface RegionListPanelProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
	items?: schema.Item[];
	onSelect: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, region: schema.Item) => void;
}

/**
 * 동네 선택 패널 컴포넌트
 */
export function RegionListPanel({
	items = [],
	onSelect,
	className,
	...props
}: RegionListPanelProps) {
	return (
		<div
			role="listbox"
			aria-label="동네 목록"
			className={cn(
				"empty:hidden pr-1 bg-secondary rounded-2xl shadow-md",
				"h-(--region-listbox-height,auto) transition-[height]",
				className,
			)}
			{...props}
		>
			<ScrollArea className="h-full **:data-[slot=scroll-region-viewport]:p-1 **:data-[slot=scroll-region-viewport]:pr-3">
				{
					items.length ? items.map(region => (
						<Item key={region.name} className="rounded-2xl" asChild><button
							role="option"
							type="button"
							className="hover:bg-background/50 transition-colors"
							onClick={e => onSelect(e, region)}
							children={`📍 ${region.name}`}
						/></Item>
					)) : (
						<Item asChild><ItemContent className="text-muted-foreground">
							동네를 찾을 수 없어요 😢
						</ItemContent></Item>
					)
				}
			</ScrollArea>
		</div>
	);
}
