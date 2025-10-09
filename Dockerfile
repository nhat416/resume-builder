# Dockerfile for Next.js Resume Builder app

# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build application
FROM deps AS builder
WORKDIR /app
COPY . .
ARG APP_VERSION=""
# If APP_VERSION was provided during build, update package.json version before building.
RUN if [ -n "$APP_VERSION" ]; then \
      APP_VERSION="$APP_VERSION" node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));p.version=process.env.APP_VERSION;fs.writeFileSync('package.json',JSON.stringify(p,null,2));"; \
    fi
# Generate Prisma client
RUN npx prisma generate
# Build Next.js app
RUN npm run build

# Stage 3: Production image
FROM node:18-alpine AS runner
WORKDIR /app

# Copy dependencies and build output
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["npm", "start"]
