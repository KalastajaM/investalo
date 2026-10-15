FROM node:20-slim

WORKDIR /app

COPY package*.json ./

# Install all deps including devDependencies needed for the build
RUN npm ci

COPY . .

RUN npm run build

# Prune devDependencies from node_modules after build is complete
RUN npm prune --omit=dev

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "dist/index.cjs"]
