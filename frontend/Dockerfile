# Multi-stage build para otimizar o tamanho da imagem

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json package-lock.json ./

# Instalar dependências
RUN npm ci --legacy-peer-deps

# Copiar código fonte
COPY . .

# Build da aplicação Angular em modo produção
RUN npm run build -- --configuration production

# Stage 2: Servir com Nginx
FROM nginx:alpine

# Instalar curl para healthcheck (opcional, mas útil)
RUN apk add --no-cache curl

# Copiar o build para o diretório do Nginx
COPY --from=builder /app/dist/frontend-hub /usr/share/nginx/html

# Copiar configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Criar diretório de logs se não existir
RUN mkdir -p /var/log/nginx

# Expor porta 80
EXPOSE 80

# Healthcheck script (verificação de configuração será feita em runtime)
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=30s \
  CMD curl -f http://localhost:80 || exit 1

# Comando padrão do Nginx (validação de config acontece automaticamente ao iniciar)
CMD ["nginx", "-g", "daemon off;"]

