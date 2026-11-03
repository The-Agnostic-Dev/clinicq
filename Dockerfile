FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
# better-sqlite3 ships prebuilt binaries for linux x64/arm64, so no compiler is needed.
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    PORT=5114 \
    CLINICQ_DB_PATH=/app/data/clinicq.db
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build
RUN mkdir -p /app/data && chown -R node:node /app/data
USER node
EXPOSE 5114
CMD ["node", "build"]
