# Build Stage (Vite + TS)
FROM node:20-bookworm-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production Stage (with Puppeteer dependencies)
FROM node:20-bookworm-slim AS production

# Instalar dependências gráficas necessárias para rodar o Puppeteer (Chrome Headless) no Debian/Ubuntu
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    libx11-xcb1 \
    libnss3 \
    libxss1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libgbm1 \
    fonts-liberation \
    libu2f-udev \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar package.json e instalar apenas dependências de produção
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar os artefatos de build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# Porta do Express (Frontend + Backend integrados pelo Vite Express build)
EXPOSE 3001

# Definir as variáveis essenciais de ambiente em runtime (Devem ser injetadas via .env no Compose/Hetzner)
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
ENV PUPPETEER_EXECUTABLE_PATH=""

# O container default inicia o servidor web.
# Os scrapers serão iniciados com comandos diferentes no docker-compose.
CMD ["npm", "run", "start"]
