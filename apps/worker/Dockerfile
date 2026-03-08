FROM node:20-alpine AS deps
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY apps/dashboard/package.json apps/dashboard/package.json
COPY packages/shared-config/package.json packages/shared-config/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN npm ci --ignore-scripts

FROM deps AS dev
WORKDIR /workspace
COPY . .
RUN npx prisma generate --schema apps/api/src/prisma/schema.prisma
EXPOSE 3002
CMD ["npm", "run", "dev:worker"]

FROM deps AS build
WORKDIR /workspace
COPY . .
RUN npx prisma generate --schema apps/api/src/prisma/schema.prisma
RUN npm run build:worker

FROM build AS prod
WORKDIR /workspace
ENV NODE_ENV=production
EXPOSE 3002
CMD ["node", "apps/worker/dist/worker/src/main.js"]
