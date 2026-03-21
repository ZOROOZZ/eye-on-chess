FROM node:22-alpine

RUN npm install -g pnpm@10.32.1

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/chess/package.json ./packages/chess/

RUN pnpm install --frozen-lockfile

COPY packages/chess ./packages/chess
COPY apps/web ./apps/web

EXPOSE 3000

CMD ["pnpm", "--filter", "@eyeonchess/web", "dev"]
