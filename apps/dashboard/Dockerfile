FROM node:20-alpine AS deps
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY apps/dashboard/package.json apps/dashboard/package.json
COPY packages/shared-config/package.json packages/shared-config/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN npm ci

FROM deps AS dev
WORKDIR /workspace
COPY . .
EXPOSE 3003
CMD ["npm", "run", "dev:dashboard"]

FROM deps AS build
WORKDIR /workspace
COPY . .
ENV NODE_ENV=production
RUN npm run build:dashboard

FROM build AS prod
WORKDIR /workspace
ENV NODE_ENV=production
EXPOSE 3003
CMD ["npm", "run", "start:dashboard"]
