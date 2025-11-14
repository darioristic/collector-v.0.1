FROM docker.io/oven/bun:1.1.38-debian AS builder
WORKDIR /workspace
ENV BUN_NO_TELEMETRY=1
COPY tsconfig.base.json ./
COPY services/chat-service/package.json services/chat-service/bun.lock ./services/chat-service/
RUN bun pm untrusted || true
RUN cd services/chat-service && bun install --frozen-lockfile --ignore-scripts || bun install --frozen-lockfile --no-verify
COPY services/chat-service/ ./services/chat-service/
WORKDIR /workspace/services/chat-service
RUN bun run build

FROM docker.io/library/node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /workspace/services/chat-service/dist ./dist
COPY --from=builder /workspace/services/chat-service/node_modules ./node_modules
COPY --from=builder /workspace/services/chat-service/package.json ./
COPY apps/api/esm-loader.mjs ./esm-loader.mjs
EXPOSE 4001
CMD ["node", "--loader", "./esm-loader.mjs", "dist/server.js"]
