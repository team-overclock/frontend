import { cn } from "@/lib/utils";
import type * as schema from "@/shared/schema";



export interface InfraTypeBadgeProps extends Omit<Partial<schema.InfraTypeItem>, "type" | "description"> {
	className?: string;
	order?: number;
	color?: string;
}

export function InfraTypeBadge({
	order,
	color,
	label,
	emoji,
	className,
}: InfraTypeBadgeProps) {
	return (
		<div
			className={cn(
				"flex justify-center-safe rounded-xl border border-(--c) bg-(--c)/5 px-3 py-2 text-sm font-medium",
				className
			)}
			style={{
				"--c": color,
			} as React.CSSProperties}
		>
			{order && (
				<span
					className="inline-flex justify-center items-center size-6 rounded-full bg-(--c) mr-1 text-white"
					children={order}
				/>
			)}
			<span>{emoji} {label}</span>
		</div>
	);
}
