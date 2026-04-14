export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.trim();
if (!BACKEND_URL) {
	document.body.innerHTML = "<h1>백엔드 URL이 설정되지 않았습니다.</h1><p>.env.example 파일을 .env 파일로 복사해 주세요.</p>";
	throw new Error("BACKEND_URL is not defined");
}
