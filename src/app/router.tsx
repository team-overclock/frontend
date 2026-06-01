import { createBrowserRouter, Navigate } from "react-router";

import { ROUTES, DEFAULT_PAGE } from "@/shared/routes";

import { RootLayout } from "@/layouts/RootLayout";
import { LocalAuthLayout } from "@/layouts/LocalAuthLayout";
import { ServerAuthLayout } from "@/layouts/ServerAuthLayout";

import { HomePage } from "@/pages/home";
import { RecommendationPage } from "@/pages/recommendation";
import { OnboardingPage } from "@/pages/onboarding";
import { SettingsPage } from "@/pages/settings";
import { SignPage } from "@/pages/sign";



/**
 * 애플리케이션의 브라우저 라우터 인스턴스
 *
 * - {@link RootLayout} 하위에 페이지 라우트 구성
 * - 매칭되지 않는 경로(`*`)는 {@link DEFAULT_PAGE.NOT_LOGGED_IN | 기본 페이지로} 리다이렉트
 */
export const router = createBrowserRouter([
	{
		path: "",
		element: <RootLayout/>,
		children: [
			{
				path: ROUTES.HOME,
				element: <HomePage/>
			},
			{
				path: ROUTES.SIGN_IN,
				element: <SignPage mode="sign-in"/>
			},
			{
				path: ROUTES.SIGN_UP,
				element: <SignPage mode="sign-up"/>
			},
			{
				element: <LocalAuthLayout/>,
				children: [
				],
			},
			{
				element: <ServerAuthLayout/>,
				children: [
					{
						path: ROUTES.ONBOARDING,
						element: <OnboardingPage/>
					},
					{
						path: ROUTES.RECOMMENDATION,
						element: <RecommendationPage/>
					},
					{
						path: ROUTES.SETTINGS,
						element: <SettingsPage/>
					},
				],
			},
			{
				path: "*",
				element: <Navigate to={DEFAULT_PAGE.NOT_LOGGED_IN} replace/>
			},
		],
	},
]);
