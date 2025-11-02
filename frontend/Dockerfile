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

# Copiar o build para o diretório do Nginx
COPY --from=builder /app/dist/frontend-hub /usr/share/nginx/html

# Copiar configuração customizada do Nginx (se necessário)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta 80
EXPOSE 80

# Comando padrão do Nginx
CMD ["nginx", "-g", "daemon off;"]

