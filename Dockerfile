# https://pnpm.io/ko/docker#예시-1-도커-컨테이너에서-번들-빌드

# 1. pnpm 구성
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app

# 2. 종속성 설치
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# 3. 빌드
FROM base AS build
COPY --from=deps /app/node_modules /app/node_modules
COPY ./.env package.json pnpm-lock.yaml ./
COPY tsconfig*.json vite.config.ts index.html ./
COPY src ./src
RUN pnpm run build

# 4. 메인
FROM node:20-slim
WORKDIR /app
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node package.json ./
RUN npm install -g serve

USER node
EXPOSE 3000
CMD [ "npm", "run", "start", "--", "-p", "3000" ]
