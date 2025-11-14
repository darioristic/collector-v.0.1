FROM docker.io/oven/bun:1.1.38-debian AS builder
WORKDIR /workspace
ENV BUN_NO_TELEMETRY=1
COPY tsconfig.base.json ./
COPY services/notification-service/package.json services/notification-service/bun.lock ./services/notification-service/
RUN bun pm untrusted || true
RUN cd services/notification-service && bun install --frozen-lockfile --ignore-scripts || bun install --frozen-lockfile --no-verify
COPY services/notification-service/ ./services/notification-service/
WORKDIR /workspace/services/notification-service
RUN bun run build

FROM docker.io/library/node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /workspace/services/notification-service/dist ./dist
COPY --from=builder /workspace/services/notification-service/node_modules ./node_modules
COPY --from=builder /workspace/services/notification-service/package.json ./
EXPOSE 4002
CMD ["node", "dist/server.js"]
