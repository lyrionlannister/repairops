FROM docker.io/library/node:26-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@latest
COPY package.json pnpm-workspace.yaml ./
RUN pnpm install --cpu=x64 --os=linux
COPY . .
RUN pnpm run build

FROM docker.io/library/nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
