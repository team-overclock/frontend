import { cn } from "@/lib/utils";



export interface TrophyProps extends Omit<React.ComponentProps<"span">, "children"> {
	rank: number;
}

export function Trophy({
	rank,
	className,
	...props
}: TrophyProps) {
	const emoji = ["🥇", "🥈", "🥉"][rank - 1] || "";
	return (
		<span
			className={cn(
				"font-bold text-foreground",
				rank === 1 && "text-yellow-500",
				rank === 2 && "text-gray-400",
				rank === 3 && "text-yellow-800",
				className,
			)}
			children={`${emoji} ${rank}위`.trim()}
			{...props}
		/>
	);
}
