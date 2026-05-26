# ---- build stage ----
FROM node:22-alpine AS builder

# better-sqlite3 requires native compilation
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- runtime stage ----
FROM node:22-alpine

WORKDIR /app

# Copy compiled output and all node_modules (includes native better-sqlite3 bindings)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy SQLite database files
COPY db ./db

EXPOSE 3000

ENV NODE_ENV=production \
    PORT=3000 \
    MOVIES_DB_PATH=./db/movies.db \
    RATINGS_DB_PATH=./db/ratings.db

CMD ["node", "dist/main.js"]
