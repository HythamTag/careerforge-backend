# ==========================================
# BUILD STAGE
# ==========================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (needed for module-alias)
RUN npm ci

# Copy source code
COPY . .

# ==========================================
# PRODUCTION STAGE
# ==========================================
FROM node:18-alpine AS production

# Create non-root user (SECURITY BEST PRACTICE)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code from builder
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/config ./config

# Switch to non-root user (SECURITY)
USER nodejs

# Expose port (Fly.io uses PORT env var)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "-r", "module-alias/register", "src/server.js"]
