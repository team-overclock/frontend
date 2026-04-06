import { cn } from "@/lib/utils";

import { Alert, AlertDescription } from "@/components/ui/alert";



export interface ErrorAlertProps extends Omit<React.ComponentProps<typeof Alert>, "children"> {
	message?: string;
}

/**
 * 에러 메시지를 표시하는 Alert 컴포넌트.
 * 메시지가 없으면 렌더링되지 않음.
 */
export function ErrorAlert({
	message,
	className,
	...props
}: ErrorAlertProps) {
	if (!message) {
		return null;
	}

	return (
		<Alert
			aria-live="polite"
			variant="destructive"
			className={cn("border-destructive bg-destructive/15 shadow-md text-center", className)}
			{...props}
		>
			<AlertDescription className="text-destructive">
				{message}
			</AlertDescription>
		</Alert>
	);
}



export interface ErrorLineProps extends Omit<React.ComponentProps<"div">, "children"> {
	message?: string;
}

/**
 * 에러 메시지를 표시하는 라인 컴포넌트.
 * 메시지가 없으면 높이가 0이 되어 보이지 않음.
 */
export function ErrorLine({
	message,
	...props
}: ErrorLineProps) {
	return (
		<div
			aria-live="polite"
			className={cn(
				"px-1 text-sm text-destructive overflow-hidden transition-[height]",
				message?.length ? "h-5" : "h-0",
			)}
			children={message}
			{...props}
		/>
	);
}
