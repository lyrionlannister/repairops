FROM docker.io/library/node:26-bookworm-slim AS deps

WORKDIR /app

RUN npm install -g corepack && corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS build

COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

FROM docker.io/library/node:26-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

RUN npm install -g corepack && corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["sh", "-c", "pnpm migration:run:prod && pnpm start"]
