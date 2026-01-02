# CareerForge Backend - Railway Deployment
FROM node:20-alpine

WORKDIR /app

# Copy backend package files directly to root
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Install Chromium for Puppeteer (Alpine)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Puppeteer to skip installing Chrome since we use the apk one
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy backend source to root (matches package.json aliases)
COPY backend/src ./src
COPY backend/config ./config
COPY backend/scripts ./scripts

# Create uploads and logs directories with proper permissions
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

# Start using the production launcher
CMD ["node", "scripts/start-prod.js"]
