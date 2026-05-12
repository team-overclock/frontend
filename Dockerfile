# https://pnpm.io/ko/docker#예시-1-도커-컨테이너에서-번들-빌드

# 공통: node
FROM ghcr.io/linuxserver/baseimage-alpine:3.23 AS base-node

RUN apk add --no-cache nodejs npm

ENV PUID=1000
ENV PGID=1000
COPY root/ /
WORKDIR /app

# 공통: pnpm
FROM base-node AS base-pnpm

# pnpm 구성
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV HOME="/config"
ENV COREPACK_HOME="/config/.corepack"
ENV PNPM_HOME="/config/.pnpm-home"
ENV PATH="$PNPM_HOME:$PATH"

RUN npm install -g corepack && corepack enable



# 운영용 이미지
FROM base-pnpm AS prod-deps

# 운영용: 종속성 설치
COPY package.json pnpm-*.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# 운영용: 빌드
FROM base-pnpm AS prod-build
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY package.json pnpm-lock.yaml ./
COPY tsconfig*.json vite.config.ts index.html ./
COPY src ./src
RUN pnpm run build

# 운영용: 메인
FROM base-node AS prod
ENV NODE_ENV=production
COPY --from=prod-build /app/dist ./dist
COPY package.json ./
RUN npm install -g serve



# 개발용 이미지
FROM base-pnpm AS dev
ENV NODE_ENV=development
