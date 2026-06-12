import { useCallback } from "react";
import { useNavigate } from "react-router";

import { DEFAULT_PAGE } from "@/shared/routes";
import { useGuestLoginMutation, useUserQuery } from "@/hooks/auth";
import { Button } from "@/components/ui/button";



export interface GuestLoginButtonProps extends React.ComponentProps<typeof Button> {
	label?: string;
	to?: string;
}

export function GuestLoginButton({
	to = DEFAULT_PAGE.LOGGED_IN,
	onClick,
	...props
}: GuestLoginButtonProps) {
	const navigate = useNavigate();
	const loginMutation = useGuestLoginMutation();
	const {
		 data: {
			isLoggedIn = false,
		 } = {},
	} = useUserQuery();

	const btnClick = useCallback<React.MouseEventHandler<HTMLButtonElement>>(async (event) => {
		onClick?.(event);
		await loginMutation.mutateAsync();
		navigate(to, { replace: true });
	}, [onClick, navigate, to, loginMutation]);

	if (isLoggedIn) return;

	return (
		<Button
			{...props}
			onClick={btnClick}
		/>
	);
}
