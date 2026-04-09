import { useCallback, useState } from "react";
import { NavLink, Navigate, useNavigate } from "react-router";

import { ROUTES } from "@/shared/routes";
import { useSessionQuery, useSignInMutation, useSignUpMutation } from "@/hooks/auth";
import { useAuthStore } from "@/stores/auth";
import { getRequestErrorMessage } from "@/lib/request-error";

import { AccountForm, type AccountFormProps } from "@/components/account-form";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";



const badges = [
	"🚇 역세권",
	"🎒 초품아",
	"🏥 의세권",
	"🌳 숲세권",
];



interface HeaderProps {
	icon: string;
	title: string;
	subtitle: string;
	badges: string[];
}

function Header({ icon, title, subtitle, badges }: HeaderProps) {
	return (
		<header className="space-y-3 border-b p-6 pt-12 text-center">
			<div className="inline-block text-6xl leading-none transition-[scale] hover:scale-110">{icon}</div>
			<h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
			<p className="text-sm text-muted-foreground">{subtitle}</p>

			<div className="mt-4 flex flex-wrap justify-center gap-2">
				{badges.map((badge) => (
					<Badge
						key={badge}
						variant="secondary"
						className="px-2.25 py-3 text-muted-foreground transition-[scale] hover:scale-110"
						children={badge}
					/>
				))}
			</div>
		</header>
	);
}



export interface SignPageProps {
	/**
	 * 로그인, 회원가입 중 어떤 화면을 띄울지 결정하는 모드 값
	 */
	mode: "sign-in" | "sign-up";
}

/**
 * 인증(로그인/회원가입) 페이지 컴포넌트
 */
export function SignPage({ mode }: SignPageProps) {
	const isLogin = mode === "sign-in";
	const sessionQuery = useSessionQuery();
	const signInMutation = useSignInMutation();
	const signUpMutation = useSignUpMutation();
	const setProfile = useAuthStore(state => state.set);
	const navigate = useNavigate();

	const [signInRequestErrorMessage, setSignInRequestErrorMessage] = useState("");
	const [signUpRequestErrorMessage, setSignUpRequestErrorMessage] = useState("");
	const setRequestErrorMessage = isLogin ? setSignInRequestErrorMessage : setSignUpRequestErrorMessage;
	const requestErrorMessage = isLogin ? signInRequestErrorMessage : signUpRequestErrorMessage;
	const isSubmitting = signInMutation.isPending || signUpMutation.isPending;

	const handleSubmit = useCallback<AccountFormProps["onSubmit"]>(async (_, formValues) => {
		setRequestErrorMessage("");

		try {
			const password = isLogin ? formValues.currentPassword : formValues.newPassword;

			if (!isLogin) {
				await signUpMutation.mutateAsync({
					name: formValues.name,
					email: formValues.email,
					password,
					preferredArea: formValues.preferredArea,
				});
			}

			const signedInUser = await signInMutation.mutateAsync({
				email: formValues.email,
				password,
			});

			setProfile({
				name: signedInUser.name,
				email: signedInUser.email,
				preferredArea: signedInUser.preferredArea,
			});

			navigate(ROUTES.HOME, { replace: true });
		} catch (error) {
			setRequestErrorMessage(getRequestErrorMessage(error));
		}
	}, [setProfile, setRequestErrorMessage, isLogin, navigate, signInMutation, signUpMutation]);

	const isLoggedIn = sessionQuery.data?.isLoggedIn ?? false;

	if (isLoggedIn) {
		return <Navigate to={ROUTES.HOME} replace/>;
	}

	return (
		<main className="mx-auto flex h-full w-full max-w-3xl flex-col *:px-6">
			<div className="flex-1 space-y-7 py-7">
				<Header
					icon="🏠"
					title="라이프맵"
					subtitle="내 생활 스타일에 맞는 동네를 찾아드려요!"
					badges={badges}
				/>

				<AccountForm
					id="sign-form"
					gap={18}
					noValidate={isLogin}
					onSubmit={handleSubmit}
					errorMessage={requestErrorMessage}
					fields={{
						name: !isLogin,
						email: true,
						currentPassword: isLogin,
						newPassword: !isLogin,
						preferredArea: !isLogin,
					}}
				/>
			</div>

			<Footer className="flex flex-col items-center space-y-4">
				<Button
					type="submit"
					form="sign-form"
					variant="default"
					size="lg"
					className="max-w-md w-full rounded-full font-bold shadow-md"
					disabled={isSubmitting}
					children={isLogin ? "로그인" : "회원가입"}
				/>
				<p className="text-center text-sm text-muted-foreground">
					{isLogin ? (
						<>
							계정이 없으신가요? <NavLink className="font-medium" to={ROUTES.SIGN_UP} replace>회원가입</NavLink>
						</>
					) : (
						<>
							이미 계정이 있으신가요? <NavLink className="font-medium" to={ROUTES.SIGN_IN} replace>로그인</NavLink>
						</>
					)}
				</p>
			</Footer>
		</main>
	);
}
