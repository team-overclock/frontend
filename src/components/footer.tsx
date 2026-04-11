import { cn } from "@/lib/utils";



export interface FooterProps extends React.ComponentProps<"footer"> {
}

/**
 * 푸터 컴포넌트
 */
export function Footer({
	className,
	...props
}: FooterProps) {
	return (
		<footer
			className={cn(
				"bg-background mt-auto py-4 w-full",
				className,
			)}
			{...props}
		/>
	);
}
