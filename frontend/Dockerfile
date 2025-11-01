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

# Set environment for development
ENV NODE_ENV="development"

# Make the startup script executable
RUN chmod +x /app/start.sh

# Set memory limits for Node.js
ENV NODE_OPTIONS="--max-old-space-size=1536 --no-warnings"

# Expose port 3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Use the start script as entrypoint
CMD ["bash", "/app/start.sh"]
