## Multi-stage Dockerfile for Next.js (pnpm) suitable for Dokploy
# Base image with Node.js and corepack for pnpm
FROM node:22-bookworm-slim AS base

# 1) Dependencies layer
FROM base AS deps
WORKDIR /app

# Enable pnpm via corepack (preinstalled with Node 16+)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install deps only using lockfile for reproducible builds
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 2) Build layer
FROM base AS builder
ENV NODE_ENV=production
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Bring installed deps
COPY --from=deps /app/node_modules ./node_modules

# Copy source
COPY . .

# Build the Next.js app
RUN pnpm build

# 3) Runtime layer
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app

# Create a non-root user for security
RUN useradd -ms /bin/bash nextjs

# Copy only the necessary build artifacts
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs

# Expose the port Dokploy will map
EXPOSE 3000

# Switch to non-root user
USER nextjs

# Start Next.js in production
# Using node directly avoids needing pnpm in the runtime image
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3000"]
