import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, Navigate, useNavigate, useLocation } from "react-router";

import { cn } from "@/lib/utils";
import { DEFAULT_PAGE, ROUTES } from "@/shared/routes";
import { useSignUpMutation, useLoginMutation, useUserQuery } from "@/hooks/auth";
import { useAuthStore } from "@/stores/auth";
import { getRequestErrorMessage } from "@/lib/request-error";

import { AccountForm, type AccountFormProps, type AccountFormFieldOptions } from "@/components/account-form";
import { GuestLoginButton } from "@/components/guest-login-button";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";



/**
 * 로그인/회원가입 페이지에서 표시할 뱃지 목록
 */
const badges = [
	"🚇 역세권",
	"🎒 초품아",
	"🏥 의세권",
	"🌳 숲세권",
];



/**
 * 페이지 헤더 컴포넌트의 props
 */
interface HeaderProps extends React.ComponentProps<"header"> {
	/**
	 * 헤더 상단에 표시할 이모지
	 */
	icon: string;

	/**
	 * 메인 타이틀
	 */
	title: string;

	/**
	 * 서브 타이틀
	 */
	subtitle: string;

	/**
	 * 헤더 하단에 표시할 뱃지 목록
	 */
	badges: string[];
}

/**
 * 페이지 헤더
 */
function Header({ icon, title, subtitle, badges, className, ...props }: HeaderProps) {
	return (
		<header className={cn("border-b text-center", className)} {...props}>
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



/**
 * 이 페이지에 들어온 경로를 설정할 수 있음
 * 설정 시 회원가입/로그인 성공 시 설정된 경로로 이동함
 */
export interface SignPageLocationState {
	from?: string;
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
	return <SignPageContent key={mode} mode={mode}/>;
}

function SignPageContent({ mode }: SignPageProps) {
	const locationState = useLocation().state as SignPageLocationState | null;

	const isLoginPage = mode === "sign-in";
	const formId = "sign-form";
	const setAuth = useAuthStore((s) => s.set);

	const accountFields = useMemo<AccountFormFieldOptions>(() => ({
		name: {
			enabled: !isLoginPage,
			required: false,
		},
		email: true,
		currentPassword: isLoginPage,
		newPassword: {
			enabled: !isLoginPage,
			label: "비밀번호",
		},
		newPasswordConfirm: {
			enabled: !isLoginPage,
			label: "비밀번호 확인",
		},
		region: {
			enabled: false,
			required: false,
		},
	}), [isLoginPage]);

	const loginMutation = useLoginMutation();
	const signUpMutation = useSignUpMutation();
	const {
		 data: {
			isLoggedIn = false,
		 } = {},
	} = useUserQuery();
	const navigate = useNavigate();

	const [requestErrorMessage, setRequestErrorMessage] = useState("");
	const isSubmitting = isLoginPage
		? loginMutation.isPending
		: (loginMutation.isPending || signUpMutation.isPending);

	const handleSubmit = useCallback<AccountFormProps["onSubmit"]>(async (_, formValues) => {
		setRequestErrorMessage("");

		try {
			const password = isLoginPage ? formValues.currentPassword : formValues.newPassword;

			if (!isLoginPage) {
				await signUpMutation.mutateAsync({
					name: formValues.name,
					email: formValues.email,
					password,
				});
			}

			let nextPage: string = DEFAULT_PAGE.LOGGED_IN;
			try {
				await loginMutation.mutateAsync({
					email: formValues.email,
					password,
				});
			} catch {
				if (isLoginPage) {
					throw new Error("이메일과 비밀번호를 다시 확인해 주세요");
				}
				nextPage = ROUTES.SIGN_IN;
			}

			navigate(locationState?.from || nextPage, { replace: true });
		} catch (error) {
			setRequestErrorMessage(getRequestErrorMessage(error));
		}
	}, [setRequestErrorMessage, isLoginPage, locationState?.from, navigate, loginMutation, signUpMutation]);

	useEffect(() => {
		setAuth({ isLoggedIn: isLoggedIn });
	}, [isLoggedIn, setAuth]);

	if (isLoggedIn) {
		return <Navigate
			to={locationState?.from || DEFAULT_PAGE.LOGGED_IN}
			replace
		/>;
	}

	return (
		<main className="flex-1 flex flex-col gap-6 w-full *:app-container">
			<Header
				icon="🏠"
				title="라이프맵"
				subtitle="내 생활 스타일에 맞는 동네를 찾아드려요!"
				badges={badges}
				className="space-y-3 pt-12 pb-6"
			/>
			<div className="flex justify-center-safe items-center-safe">
				<GuestLoginButton
					variant="default"
					className="px-5 py-4 rounded-full font-bold text-base shadow-md"
					children="게스트 로그인"
					to={locationState?.from || DEFAULT_PAGE.LOGGED_IN}
				/>
			</div>
			<AccountForm
				id={formId}
				gap={18}
				noValidate={isLoginPage}
				onSubmit={handleSubmit}
				errorMessage={requestErrorMessage}
				className={cn("flex flex-col", !isLoginPage && "*:last:flex-1")}
				fields={accountFields}
			/>
			<Footer className="flex flex-col items-center space-y-4">
				<Button
					type="submit"
					form={formId}
					variant="default"
					size="lg"
					className="max-w-md w-full rounded-full font-bold shadow-md"
					disabled={isSubmitting}
					children={isLoginPage ? "로그인" : "회원가입"}
				/>
				<p className="text-center text-sm text-muted-foreground">
					{isLoginPage ? (
						<>
							계정이 없으신가요? <NavLink className="font-medium" to={ROUTES.SIGN_UP}>회원가입</NavLink>
						</>
					) : (
						<>
							이미 계정이 있으신가요? <NavLink className="font-medium" to={ROUTES.SIGN_IN}>로그인</NavLink>
						</>
					)}
				</p>
			</Footer>
		</main>
	);
}
