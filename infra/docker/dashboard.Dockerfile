FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/dashboard/package.json apps/dashboard/package.json
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "--workspace", "@aicp/dashboard", "run", "dev"]
