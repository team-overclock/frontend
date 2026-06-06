import { cn } from "@/lib/utils";
import type * as schema from "@/shared/schema";
import { getInfraColor } from "@/shared/common";



export interface InfraTypeBadgeProps extends Omit<Partial<schema.InfraTypeItem>, "type" | "description"> {
	type: string,
	className?: string;
	order?: number;
	color?: string | boolean;
}

export function InfraTypeBadge({
	type,
	color = true,
	order,
	label,
	emoji,
	className,
}: InfraTypeBadgeProps) {
	if (color === true) {
		color = getInfraColor(type);
	} else if (color === false) {
		color = "currentColor";
	}

	return (
		<div
			className={cn(
				"flex justify-center-safe rounded-xl border border-(--c) bg-(--c)/5 px-[.75em] py-[.5em] text-sm font-medium",
				className
			)}
			style={{
				"--c": color,
			} as React.CSSProperties}
		>
			{order && (
				<span
					className="inline-flex justify-center items-center size-[1.5em] rounded-full bg-(--c) mr-1 text-white leading-4"
					children={order}
				/>
			)}
			<span>{emoji} {label}</span>
		</div>
	);
}
