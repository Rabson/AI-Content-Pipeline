FROM node:20-alpine AS deps
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY apps/dashboard/package.json apps/dashboard/package.json
COPY packages/shared-config/package.json packages/shared-config/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN npm ci

FROM deps AS source
WORKDIR /workspace
COPY . .
RUN npx prisma generate --schema apps/api/src/prisma/schema.prisma

FROM source AS dev
EXPOSE 3001
CMD ["npm", "run", "dev:api"]

FROM source AS build
RUN npm run build:api

FROM source AS migrate
ENV NODE_ENV=production
CMD ["npx", "prisma", "migrate", "deploy", "--schema", "apps/api/src/prisma/schema.prisma"]

FROM build AS prod
WORKDIR /workspace
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
