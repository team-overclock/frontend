export type SignPageProps = {
	/**
	 * 로그인, 회원가입 중 어떤 화면을 띄울지 결정하는 모드 값
	 */
	mode: "sign-in" | "sign-up";
};

/**
 * 인증(로그인/회원가입) 페이지 컴포넌트
 */
export function SignPage({ mode }: SignPageProps) {
	return (
		<>
			{`${mode} page`}
		</>
	);
}
