# ---- Build stage ----
FROM node:20-bookworm AS build

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npx prisma generate
RUN npm run build

# ---- Runtime stage ----
FROM node:20-bookworm

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci --omit=dev
RUN npx prisma generate

COPY --from=build /app/dist ./dist

RUN mkdir -p uploads

EXPOSE 10000

CMD ["node", "dist/server.js"]