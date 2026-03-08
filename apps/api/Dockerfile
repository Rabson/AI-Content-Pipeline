FROM node:20-alpine AS deps
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY apps/dashboard/package.json apps/dashboard/package.json
COPY packages/shared-config/package.json packages/shared-config/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/auth-core/package.json packages/auth-core/package.json
COPY packages/observability-core/package.json packages/observability-core/package.json
COPY packages/workflow-core/package.json packages/workflow-core/package.json
COPY packages/queue-contracts/package.json packages/queue-contracts/package.json
COPY packages/backend-core/package.json packages/backend-core/package.json
RUN npm ci --ignore-scripts

FROM deps AS source
WORKDIR /workspace
COPY . .
RUN npx prisma generate

FROM source AS dev
EXPOSE 3001
CMD ["npm", "run", "dev:api"]

FROM source AS build
RUN npm run build:api

FROM source AS migrate
ENV NODE_ENV=production
CMD ["./node_modules/.bin/prisma", "migrate", "deploy"]

FROM build AS prod
WORKDIR /workspace
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
