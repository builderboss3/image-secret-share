FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.json tsconfig.base.json ./

# Copy all packages
COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/
COPY artifacts/phantom/ ./artifacts/phantom/
COPY scripts/ ./scripts/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build api-server
RUN pnpm --filter @workspace/api-server run build

# Build frontend (phantom)
RUN pnpm --filter @workspace/phantom run build

# Copy start script
COPY start.sh ./start.sh
RUN chmod +x start.sh

EXPOSE 8080

ENV NODE_ENV=production

CMD ["sh", "start.sh"]
