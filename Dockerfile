# ---------------- BUILD STAGE ----------------
FROM node:20-slim AS builder

WORKDIR /usr/src

RUN apt-get update && apt-get install -y iputils-ping

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build
RUN npm run obfuscate
RUN rm -rf dist && mv dist-obfuscated dist

# ---------------- RUNTIME STAGE ----------------
FROM node:20-slim

WORKDIR /usr/src

COPY --from=builder /usr/src/package*.json ./
COPY --from=builder /usr/src/node_modules ./node_modules
COPY --from=builder /usr/src/dist ./dist
COPY --from=builder /usr/src/public ./public
COPY --from=builder /usr/src/logs ./logs

EXPOSE 3000 5051

CMD ["node", "dist/main.js"]
