# CareerForge Backend - Railway Deployment
FROM node:20-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy backend source
COPY backend/src ./src
COPY backend/config ./config

# Create uploads directory with proper permissions BEFORE switching user
RUN mkdir -p /app/uploads /app/src/core/uploads /app/logs \
    && chmod -R 755 /app/uploads /app/src/core/uploads /app/logs

# Create non-root user and give ownership
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 \
    && chown -R nodejs:nodejs /app

USER nodejs

# Railway uses PORT env var
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
    CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start
CMD ["node", "-r", "module-alias/register", "src/server.js"]
