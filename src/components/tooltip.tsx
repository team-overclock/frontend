"use client";

// ref: https://github.com/shadcn-ui/ui/issues/86#issuecomment-2241817826

import { useState } from "react";

import { Tooltip as Base, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";



export interface TooltipProps extends React.ComponentProps<typeof TooltipTrigger> {
	trigger: React.ReactNode;
}

export function Tooltip({
	trigger,
	className,
	children,
	...props
}: TooltipProps) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Base open={isOpen}>
			<TooltipTrigger
				onClick={() => setIsOpen(true)}
				onMouseEnter={() => setIsOpen(true)}
				onMouseLeave={() => setIsOpen(false)}
				onTouchStart={() => setIsOpen(true)}
				className={cn("size-fit", className)}
				children={trigger}
				{...props}
			/>
			<TooltipContent
				className="break-all"
				children={children}
			/>
		</Base>
	);
}
