import { cn } from "@/lib/utils";
import type * as schema from "@/shared/schema";



export interface SchoolDistrictBoxProps extends React.ComponentProps<"button"> {
	item: schema.SchoolDistrictTypeItem;
	isSelected?: boolean;
}


export function SchoolDistrictBox({
	item,
	className,
	isSelected,
	...props
}: SchoolDistrictBoxProps) {
	return (
		<button
			type="button"
			className={cn(
				"flex flex-col items-center-safe justify-center-safe p-3 rounded-xl border text-center transition-all shadow-sm",
				isSelected
					? "bg-primary text-primary-foreground border-primary font-semibold"
					: "bg-transparent hover:bg-accent border-input text-foreground",
				className,
			)}
			{...props}
		>
			<span className="text-sm">{item.label}</span>
			<span className={cn("text-[10px] mt-1 opacity-80", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
				{item.description}
			</span>
		</button>
	);
}
