export const MODE = import.meta.env.MODE?.trim() || "development";
export const KAKAO_MAP_API_KEY = import.meta.env.VITE_KAKAO_MAP_API_KEY?.trim();
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.trim();
if (!BACKEND_URL || !KAKAO_MAP_API_KEY) {
	document.body.innerHTML = `
		<p>.env.example 파일을 .env로 복사해 주세요.</p>
		${MODE !== "production" ? "" : "<p>도커 환경인 경우 복사 후 이미지를 다시 빌드해 주세요.</p>"}
	`;
	throw new Error("Environment Variables Error");
}
