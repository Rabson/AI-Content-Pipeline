FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
RUN npm ci
COPY . .
RUN npx prisma generate --schema apps/api/src/prisma/schema.prisma
RUN npm run build:api
EXPOSE 3001
CMD ["npm", "--workspace", "@aicp/api", "run", "start"]
