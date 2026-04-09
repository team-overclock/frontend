import { useNavigate } from "react-router";
import { ArrowLeftIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";



export interface HeaderProps extends React.ComponentProps<"header"> {
	heading?: string;
}

export function Header({
	heading,
	className,
	children,
	...props
}: HeaderProps) {
	const navigate = useNavigate();

	const handleBack: React.MouseEventHandler<HTMLButtonElement> = () => {
		const historyIndex = window.history.state?.idx;

		if (typeof historyIndex === "number" && historyIndex > 0) {
			navigate(-1);
			return;
		}

		navigate("/");
	};

	return (
		<header
			className="bg-secondary sticky top-0 w-full z-10"
			{...props}
		>
			<div className={cn("flex items-center overflow-hidden px-1 h-16", className)}>
				<Button
					type="button"
					variant="ghost"
					aria-label="뒤로 가기"
					onClick={handleBack}
					children={<ArrowLeftIcon strokeWidth={3}/>}
				/>
				<h1
					className="flex-1 font-bold text-lg"
					children={heading}
				/>
				{children}
			</div>
		</header>
	);
}
