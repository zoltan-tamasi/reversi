# syntax=docker/dockerfile:1

# ---- Build stage: install all deps and build server + client ----
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY src/shared/package.json src/shared/
COPY src/server/package.json src/server/
COPY src/client/package.json src/client/
RUN npm ci

COPY src ./src
# The server serves the client, so the client talks to the API on its own origin.
ENV VITE_GRAPHQL_URI=/graphql
RUN npm run build

# ---- Runtime stage: production deps and build output only ----
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production \
  PORT=4000 \
  CLIENT_DIST_DIR=/app/src/client/dist

COPY package.json package-lock.json ./
COPY src/shared/package.json src/shared/
COPY src/server/package.json src/server/
COPY src/client/package.json src/client/
RUN npm ci --omit=dev --workspace=src/server && npm cache clean --force

COPY --from=build /app/src/shared/dist src/shared/dist
COPY --from=build /app/src/server/dist src/server/dist
COPY --from=build /app/src/client/dist src/client/dist

USER node
EXPOSE 4000
CMD ["node", "src/server/dist/index.js"]
