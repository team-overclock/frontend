import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";



/**
 * shadcn/ui이 생성한 클래스명 유틸 함수
 *
 * @example
 *
 * ```ts
 * import { cn } from "@/lib/utils";
 *
 * const buttonClass = cn("btn btn-primary", "text-muted-foreground", isActive && "active");
 * ```
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
