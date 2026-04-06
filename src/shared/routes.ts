/**
 * 하드코딩 대신 사용할 라우트 경로 상수
 */
export const ROUTES = {
	HOME: "/",
	ONBOARDING: "/onboarding",
	MAP: "/map",
	SETTINGS: "/settings",
	SIGN_IN: "/sign-in",
	SIGN_UP: "/sign-up",
} as const;

/**
 * 인증 상태에 따라 사용할 기본 진입 페이지 상수
 *
 * - `LOGGED_IN`: 로그인 상태일 때 기본 페이지
 * - `GUEST`: 비로그인 상태일 때 기본 페이지
 */
export const DEFAULT_PAGE = {
	LOGGED_IN: ROUTES.HOME,
	GUEST: ROUTES.SIGN_IN,
};
