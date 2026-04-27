# frontend

> [!TIP]
> 단순 실행은 모든 명령어에서 `pnpm` 대신 `npm`을 사용해도 무관합니다.

## 패키지 설치

`package.json`에 등록된 패키지 한 번에 설치

```shell
pnpm install
```

## 구성

```shell
cp .env.example .env # 환경변수 구성
```

## 실행

빌드 후 실행

```shell
pnpm run build
pnpm run start
```

### 개발모드로 실행

실행 중 코드 변경 시 즉시 반영됨

```shell
pnpm run dev
```

### Docker

도커 관련 사용법은
[team-overclock/monorepo#docker](https://github.com/team-overclock/monorepo#docker)
참고
