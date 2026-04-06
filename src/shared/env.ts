export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.trim();
if (!BACKEND_URL) {
	throw new Error("백엔드 URL이 설정되지 않았습니다. .env 파일에서 VITE_BACKEND_URL 변수를 설정해 주세요.");
}
