import { cn } from "@/lib/utils";



export interface FooterProps extends React.ComponentProps<"footer"> {
}

export function Footer({
	className,
	...props
}: FooterProps) {
	return (
		<footer
			className={cn(
				"bg-background sticky bottom-0 py-4 w-full",
				className,
			)}
			{...props}
		/>
	);
}
