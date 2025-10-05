# QAQ Backend Dockerfile# QAQ Backend Dockerfile

# Multi-stage build for optimized production image# Multi-stage build for opt# Use dumb-init to handle signals properly

ENTRYPOINT ["dumb-init", "--"]

# Build stage

FROM node:20-alpine AS builder# Start the application

CMD ["node", "dist/server.js"]d production image

WORKDIR /app

# Build stage

# Copy package filesFROM node:20-alpine AS builder

COPY package*.json ./

COPY tsconfig.json ./WORKDIR /app



# Install ALL dependencies (including devDependencies for TypeScript)# Copy package files

RUN npm ciCOPY package*.json ./

COPY tsconfig.json ./

# Copy source code

COPY src ./src# Install ALL dependencies (including devDependencies for TypeScript)

RUN npm ci

# Build TypeScript

RUN npm run build# Copy source code

COPY src ./src

# Production stage

FROM node:20-alpine# Build TypeScript

RUN npm run build

WORKDIR /app

# Production stage

# Install dumb-init for proper signal handlingFROM node:20-alpine

RUN apk add --no-cache dumb-init

WORKDIR /app

# Create non-root user

RUN addgroup -g 1001 -S nodejs && \# Install dumb-init for proper signal handling

    adduser -S nodejs -u 1001RUN apk add --no-cache dumb-init



# Install production dependencies only# Create non-root user

COPY package*.json ./RUN addgroup -g 1001 -S nodejs && \

RUN npm ci --only=production    adduser -S nodejs -u 1001



# Copy compiled JavaScript from builder# Install production dependencies only

COPY --from=builder --chown=nodejs:nodejs /app/dist ./distCOPY package*.json ./

RUN npm ci --only=production

# Copy data directory

COPY --chown=nodejs:nodejs data ./data# Copy compiled JavaScript from builder

COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Switch to non-root user

USER nodejs# Copy data directory

COPY --chown=nodejs:nodejs data ./data

# Expose port

EXPOSE 3001# Switch to non-root user

USER nodejs

# Health check

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \# Expose port

  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"EXPOSE 3001



# Use dumb-init to handle signals properly# Health check

ENTRYPOINT ["dumb-init", "--"]HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \

  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application

CMD ["node", "dist/server.js"]# Use dumb-init to handle signals properly

ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "src/server.js"]
