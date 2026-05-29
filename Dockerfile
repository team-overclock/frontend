# https://pnpm.io/ko/docker#예시-1-도커-컨테이너에서-번들-빌드

# 공통: node
FROM ghcr.io/linuxserver/baseimage-alpine:3.23 AS base-node

LABEL org.opencontainers.image.base.name="ghcr.io/linuxserver/baseimage-alpine:3.23"

ENV HOME="/config"
ENV PUID=1000
ENV PGID=1000
VOLUME /app/node_modules

RUN apk add --no-cache nodejs npm

WORKDIR /defaults

# 공통: pnpm 구성
FROM base-node AS base-pnpm
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV COREPACK_HOME="/config/.corepack"
ENV PNPM_HOME="/config/.pnpm-home"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g corepack && corepack enable



# 배포용 파일 사전 복사

FROM scratch AS common-files
WORKDIR /defaults
COPY root/ /
COPY scripts/ ./scripts

FROM scratch AS source-files
WORKDIR /defaults
COPY package.json pnpm-*.yaml ./
COPY tsconfig*.json vite.config.ts index.html ./
COPY src ./src



# 운영용: 종속성 설치 및 빌드
FROM base-pnpm AS deploy-env
ARG VITE_BACKEND_URL
ARG VITE_KAKAO_MAP_API_KEY
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_KAKAO_MAP_API_KEY=$VITE_KAKAO_MAP_API_KEY

# 운영용: 종속성 설치 및 빌드
FROM deploy-env AS prod-build
COPY package.json pnpm-*.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY --from=source-files / /
RUN pnpm run build



# 운영용
FROM base-node AS prod
ENV MODE=production
COPY --from=prod-build /defaults/dist ./dist
COPY --from=common-files / /
COPY package.json ./
RUN npm install -g serve
WORKDIR /app

# 개발용: main 브랜치 push 시 자동 배포되는 이미지
FROM deploy-env AS dev
ENV MODE=development
COPY --from=common-files / /
COPY --from=source-files / /
WORKDIR /app

# 로컬 개발용 이미지
FROM base-pnpm AS local
ENV MODE=local
COPY root/ /
WORKDIR /app
