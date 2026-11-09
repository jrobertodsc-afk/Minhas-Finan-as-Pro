FROM node:20-alpine

WORKDIR /app

# Copia manifests e instala dependências de produção
COPY package*.json ./
RUN npm install --omit=dev

# Copia todo o código da aplicação
COPY . .

# Porta padrão de execução
EXPOSE 8085
ENV PORT=8085

# Inicia o servidor Node.js com proxy e PWA
CMD ["node", "server.cjs"]
