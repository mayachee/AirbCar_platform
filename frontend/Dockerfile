# Use Node.js 20 for better memory management
FROM node:20-alpine

# Install curl for health checks and bash for better scripting
RUN apk add --no-cache curl bash

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@latest

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml* ./

# Install dependencies (allow lockfile refresh if package.json updated)
RUN pnpm install --no-frozen-lockfile --shamefully-hoist

# Copy only the necessary files for the application
COPY .env.example ./
COPY next.config.js ./
COPY postcss.config.mjs ./
COPY eslint.config.mjs ./
COPY jsconfig.json ./
COPY start.sh ./

# Copy source directories
COPY src ./src/
COPY public ./public/

# Set environment for development and configure watcher through env vars
ENV NODE_ENV="development"
ENV WATCHPACK_POLLING=true
ENV WATCHPACK_POLLING_INTERVAL=3000
ENV NODE_OPTIONS="--max-old-space-size=4096 --no-warnings"

# Make the startup script executable
RUN chmod +x /app/start.sh

# Set memory limits for Node.js
ENV NODE_OPTIONS="--max-old-space-size=3072 --no-warnings"

# Expose port 3001
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3001}/ || exit 1

# Use the start script as entrypoint while ensuring Unix line endings
CMD ["bash", "-lc", "sed -i 's/\\r$//' /app/start.sh && exec bash /app/start.sh"]