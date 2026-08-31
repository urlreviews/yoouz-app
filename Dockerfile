FROM node:20-alpine AS builder

WORKDIR /app

# Configure npm with robust retry settings for CI / Docker builds
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "dist/server.cjs"]

